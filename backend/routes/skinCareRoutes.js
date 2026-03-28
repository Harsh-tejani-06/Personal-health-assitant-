import express from "express";
import Groq from "groq-sdk";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import SkinCarePlan from "../models/SkinCarePlan.js";
import DailyActivity from "../models/DailyActivity.js";
import { calculatePoints } from "../utils/gamification.js";

const router = express.Router();

// -------- Helper: get today's date string --------
function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}

// -------- Helper: Build AI prompt for skincare plan --------
function buildSkinCarePlanPrompt(user, products) {
    const hp = user.healthProfile || {};
    const productList = products.map(p => `${p.name} (${p.type}, ${p.category})`).join(", ");

    return `You are a professional skincare expert and dermatology advisor.

Create a personalized daily skincare routine plan based on the user's profile and their current products.

=== USER PROFILE ===
Name: ${user.fullname}
Age Group: ${hp.ageGroup || "Not specified"}
Gender: ${hp.gender || "Not specified"}
Skin Type: ${hp.skinType || "Not specified"}
Primary Goal: ${hp.primaryGoal || "Not specified"}
Water Intake: ${hp.waterIntakeLiters ? hp.waterIntakeLiters + " liters/day" : "Not specified"}
Sleep Hours: ${hp.sleepHours || "Not specified"}

=== USER'S CURRENT PRODUCTS ===
${productList}

=== INSTRUCTIONS ===
1. Create a MORNING routine and a NIGHT routine using ONLY the products the user already has
2. Each routine should have numbered steps with clear instructions
3. Specify how long each step should take (e.g., "30 seconds", "2 minutes")
4. Recommend how long to follow this plan (e.g., "30 days", "2 months", "6 months")
5. Provide 3-5 personalized skincare tips based on their skin type and products
6. If products are insufficient, mention what they should consider adding in the tips

Return ONLY valid JSON in this exact format:
{
  "morning": [
    { "step": 1, "product": "Product Name", "instruction": "How to use it", "duration": "time" }
  ],
  "night": [
    { "step": 1, "product": "Product Name", "instruction": "How to use it", "duration": "time" }
  ],
  "followFor": "duration string like 30 days or 3 months",
  "tips": ["tip1", "tip2", "tip3"]
}`;
}

// -------- Helper: Parse JSON from AI response --------
function extractJSON(text) {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
        return JSON.parse(match[0]);
    }
    return JSON.parse(cleaned);
}

// =================================================
// 1. GET /api/skincare/plan — Get user's current plan
// =================================================
router.get("/skincare/plan", protect, async (req, res) => {
    try {
        const plan = await SkinCarePlan.findOne({ user: req.user._id });

        if (!plan) {
            return res.json({ exists: false });
        }

        res.json({
            exists: true,
            products: plan.products,
            plan: plan.plan
        });
    } catch (err) {
        console.error("Get skincare plan error:", err);
        res.status(500).json({ message: "Failed to load skincare plan" });
    }
});

// =================================================
// 2. POST /api/skincare/plan — Save products + generate AI plan
// =================================================
router.post("/skincare/plan", protect, async (req, res) => {
    try {
        const { products } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "At least one product is required." });
        }

        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // -------- Generate AI plan with Groq --------
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const prompt = buildSkinCarePlanPrompt(user, products);

        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "You are a professional skincare expert. Always respond with valid JSON only, no extra text." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2048
        });

        const responseText = chatCompletion.choices?.[0]?.message?.content || "";

        let planData;
        try {
            planData = extractJSON(responseText);
        } catch (parseErr) {
            console.error("AI plan JSON parse error:", parseErr);
            console.error("Raw response:", responseText);
            return res.status(500).json({ message: "Failed to parse AI-generated plan. Please try again." });
        }

        // -------- Upsert the plan --------
        const skinCarePlan = await SkinCarePlan.findOneAndUpdate(
            { user: userId },
            {
                user: userId,
                products,
                plan: {
                    morning: planData.morning || [],
                    night: planData.night || [],
                    followFor: planData.followFor || "30 days",
                    tips: planData.tips || [],
                    generatedAt: new Date()
                },
                // Keep existing daily logs when re-generating plan
                // (only clear if explicitly requested)
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({
            success: true,
            products: skinCarePlan.products,
            plan: skinCarePlan.plan
        });

    } catch (err) {
        console.error("Generate skincare plan error:", err.message || err);
        const msg = err.message?.substring(0, 150) || "Failed to generate skincare plan";
        res.status(500).json({ message: msg });
    }
});

// =================================================
// 3. POST /api/skincare/log — Log/update daily tasks
// =================================================
router.post("/skincare/log", protect, async (req, res) => {
    try {
        const { date, morningCompleted, nightCompleted, notes } = req.body;
        const userId = req.user._id;
        const targetDate = date || getTodayDate();

        if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
        }

        let plan = await SkinCarePlan.findOne({ user: userId });
        if (!plan) {
            return res.status(404).json({ message: "No skincare plan found. Please set up your products first." });
        }

        // Find existing log for this date or create new one
        const logIndex = plan.dailyLogs.findIndex(l => l.date === targetDate);

        const logEntry = {
            date: targetDate,
            morningCompleted: morningCompleted || [],
            nightCompleted: nightCompleted || [],
            notes: notes || ""
        };

        if (logIndex >= 0) {
            plan.dailyLogs[logIndex] = logEntry;
        } else {
            plan.dailyLogs.push(logEntry);
        }

        await plan.save();

        // ---- Sync to DailyActivity ----
        const mornTotal = plan.plan.morning?.length || 0;
        const nightTotal = plan.plan.night?.length || 0;
        const totalSteps = mornTotal + nightTotal;
        const mornDone = morningCompleted ? morningCompleted.filter(Boolean).length : 0;
        const nightDone = nightCompleted ? nightCompleted.filter(Boolean).length : 0;
        const totalDone = mornDone + nightDone;
        const isComplete = totalSteps > 0 && totalDone === totalSteps;

        let activity = await DailyActivity.findOne({ user: userId, date: targetDate });
        if (!activity) {
            activity = new DailyActivity({ user: userId, date: targetDate });
        }
        
        activity.skinCare.completed = isComplete;
        activity.skinCare.details = "Synced from Skin Care Plan";
        
        await activity.save();
        const pointsData = await calculatePoints(userId, activity);
        // -------------------------------

        res.json({
            success: true,
            log: logEntry,
            points: pointsData
        });

    } catch (err) {
        console.error("Skincare log error:", err);
        res.status(500).json({ message: "Failed to save skincare log" });
    }
});

// =================================================
// 4. GET /api/skincare/log/:date — Get log for a date
// =================================================
router.get("/skincare/log/:date", protect, async (req, res) => {
    try {
        const { date } = req.params;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
        }

        const plan = await SkinCarePlan.findOne({ user: req.user._id });
        if (!plan) {
            return res.json({ morningCompleted: [], nightCompleted: [], notes: "" });
        }

        const log = plan.dailyLogs.find(l => l.date === date);
        if (!log) {
            return res.json({ morningCompleted: [], nightCompleted: [], notes: "" });
        }

        res.json(log);

    } catch (err) {
        console.error("Get skincare log error:", err);
        res.status(500).json({ message: "Failed to load skincare log" });
    }
});

// =================================================
// 5. GET /api/skincare/calendar — Get all logs (last 31 days)
// =================================================
router.get("/skincare/calendar", protect, async (req, res) => {
    try {
        const plan = await SkinCarePlan.findOne({ user: req.user._id });
        if (!plan) {
            return res.json({ logs: [], plan: null });
        }

        // Filter to last 31 days
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 31);
        const cutoffStr = cutoff.toISOString().split("T")[0];

        const recentLogs = plan.dailyLogs.filter(l => l.date >= cutoffStr);

        res.json({
            logs: recentLogs,
            plan: {
                morningSteps: plan.plan.morning.length,
                nightSteps: plan.plan.night.length
            }
        });

    } catch (err) {
        console.error("Skincare calendar error:", err);
        res.status(500).json({ message: "Failed to load skincare calendar" });
    }
});

export default router;
