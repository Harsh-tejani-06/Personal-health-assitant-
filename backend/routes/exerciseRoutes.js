import express from "express";
import Groq from "groq-sdk";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import ExercisePlan from "../models/ExercisePlan.js";
import DailyActivity from "../models/DailyActivity.js";
import Diet from "../models/Diet.js";

const router = express.Router();

// -------- Helper: get today's date string --------
function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}

// -------- Helper: get yesterday's date string --------
function getYesterdayDate() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
}

// -------- Helper: Parse JSON from AI response --------
function extractJSON(text) {
    let cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
        return JSON.parse(match[0]);
    }
    return JSON.parse(cleaned);
}

// -------- Helper: Build AI prompt for exercise plan --------
function buildExercisePlanPrompt(user, dietData, recentActivity) {
    const hp = user.healthProfile || {};

    // Summarize recent diet
    let dietSummary = "No diet data available.";
    if (dietData) {
        const allMeals = [...(dietData.morning || []), ...(dietData.afternoon || []), ...(dietData.night || [])];
        if (allMeals.length > 0) {
            const totalCal = allMeals.reduce((s, r) => s + (parseInt(r.calories) || 0), 0);
            const mealNames = allMeals.map(r => r.recipeName).join(", ");
            dietSummary = `Today's meals: ${mealNames}. Approximate total calories: ${totalCal} kcal.`;
        }
    }

    // Summarize recent exercise activity
    let activitySummary = "No recent exercise data.";
    if (recentActivity && recentActivity.length > 0) {
        const summaries = recentActivity
            .filter(a => a.exercise?.completed)
            .map(a => `${a.date}: ${a.exercise.details || "completed"} (${a.exercise.duration || 0} min)`);
        if (summaries.length > 0) {
            activitySummary = `Recent exercise history (last 7 days):\n${summaries.join("\n")}`;
        }
    }

    return `You are a certified fitness trainer and exercise expert.

Create a personalized daily exercise routine plan based on the user's profile, their diet, and recent activity.

=== USER PROFILE ===
Name: ${user.fullname}
Age Group: ${hp.ageGroup || "Not specified"}
Gender: ${hp.gender || "Not specified"}
Height: ${hp.height ? hp.height + " cm" : "Not specified"}
Weight: ${hp.weight ? hp.weight + " kg" : "Not specified"}
Primary Goal: ${hp.primaryGoal || "general_wellness"}
Activity Level: ${hp.activityLevel || "moderate"}
Sleep Hours: ${hp.sleepHours || "Not specified"}

=== DIET INFORMATION ===
${dietSummary}

=== RECENT EXERCISE ACTIVITY ===
${activitySummary}

=== INSTRUCTIONS ===
1. Create a MORNING exercise routine (6-8 exercises) and a NIGHT exercise routine (4-6 exercises)
2. For weight_loss goal: focus on cardio, HIIT, fat-burning exercises
3. For weight_gain goal: focus on strength training, muscle building, compound movements
4. For other goals: provide a balanced mix of cardio and strength
5. Morning routine should be more intense, night routine should be lighter/stretching focused
6. Each exercise must include a YouTube-search-friendly name (e.g., "beginner push ups tutorial", "10 minute HIIT workout")
7. Factor in the user's diet - if high calorie intake, suggest more cardio; if high protein, more strength exercises
8. Factor in recent activity - avoid repeating the same exercises, progressively increase difficulty
9. Recommend how long to follow this plan (e.g., "2 weeks", "30 days")
10. Provide 3-5 personalized fitness tips

Return ONLY valid JSON in this exact format:
{
  "morning": [
    { "step": 1, "name": "Exercise Name", "instruction": "How to perform it", "duration": "time or reps", "sets": "3 sets", "reps": "12 reps", "youtubeQuery": "exercise name tutorial for beginners", "caloriesBurned": "50 kcal" }
  ],
  "night": [
    { "step": 1, "name": "Exercise Name", "instruction": "How to perform it", "duration": "time", "sets": "2 sets", "reps": "10 reps", "youtubeQuery": "exercise name tutorial", "caloriesBurned": "30 kcal" }
  ],
  "followFor": "duration string like 2 weeks or 30 days",
  "tips": ["tip1", "tip2", "tip3"]
}`;
}

// -------- Helper: Build prompt for next-day suggestions (dedication-aware) --------
function buildNextDayPrompt(user, exercisePlan, recentLogs, dietData) {
    const hp = user.healthProfile || {};
    const plan = exercisePlan.plan;
    const totalMorning = plan.morning?.length || 0;
    const totalNight = plan.night?.length || 0;
    const totalPerDay = totalMorning + totalNight;

    // Analyze the last 7 days of logs
    let dayBreakdowns = [];
    let totalCompleted = 0;
    let totalPossible = 0;
    let daysWithData = 0;
    let consecutiveSkips = 0;  // days in a row where < 50% done
    let lastDayWasLow = false;

    if (recentLogs && recentLogs.length > 0) {
        recentLogs.forEach((log, idx) => {
            const mDone = (log.morningCompleted || []).filter(Boolean).length;
            const nDone = (log.nightCompleted || []).filter(Boolean).length;
            const done = mDone + nDone;
            const pct = totalPerDay > 0 ? Math.round((done / totalPerDay) * 100) : 0;

            totalCompleted += done;
            totalPossible += totalPerDay;
            daysWithData++;

            // Track which exercises were skipped
            const morningSkipped = [];
            const nightSkipped = [];
            if (log.morningCompleted) {
                plan.morning.forEach((ex, i) => {
                    if (!log.morningCompleted[i]) morningSkipped.push(ex.name);
                });
            }
            if (log.nightCompleted) {
                plan.night.forEach((ex, i) => {
                    if (!log.nightCompleted[i]) nightSkipped.push(ex.name);
                });
            }

            dayBreakdowns.push(
                `${log.date}: ${done}/${totalPerDay} completed (${pct}%)` +
                (morningSkipped.length > 0 ? ` | Morning skipped: ${morningSkipped.join(", ")}` : "") +
                (nightSkipped.length > 0 ? ` | Night skipped: ${nightSkipped.join(", ")}` : "")
            );

            // Streak tracking
            if (idx === 0) {
                lastDayWasLow = pct < 50;
            }
            if (pct < 50) {
                if (idx === 0 || lastDayWasLow) consecutiveSkips++;
                lastDayWasLow = true;
            } else {
                lastDayWasLow = false;
            }
        });
    }

    const dedicationPct = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    // Dedication level
    let dedicationLevel, dedicationAdvice;
    if (dedicationPct >= 85) {
        dedicationLevel = "HIGH";
        dedicationAdvice = "User is highly dedicated! Challenge them with slightly harder exercises, more reps/sets, or advanced variations.";
    } else if (dedicationPct >= 60) {
        dedicationLevel = "MODERATE";
        dedicationAdvice = "User is doing okay but inconsistent. Keep the difficulty similar, focus on the exercises they tend to skip, and provide extra motivation.";
    } else if (dedicationPct >= 30) {
        dedicationLevel = "LOW";
        dedicationAdvice = "User is struggling with consistency. REDUCE the intensity — suggest easier exercises, fewer reps, shorter durations. Focus on building habit rather than intensity.";
    } else {
        dedicationLevel = "VERY LOW";
        dedicationAdvice = "User has barely exercised. Suggest VERY gentle, beginner-friendly exercises (walking, light stretching, simple bodyweight). The goal is just to get them moving, not to overwhelm them.";
    }

    let historySection;
    if (dayBreakdowns.length > 0) {
        historySection = `=== EXERCISE LOG (Last ${dayBreakdowns.length} days) ===
${dayBreakdowns.join("\n")}

=== DEDICATION ANALYSIS ===
Overall Dedication Score: ${dedicationPct}% (${dedicationLevel})
Days tracked: ${daysWithData}
Total exercises completed: ${totalCompleted} out of ${totalPossible}
Consecutive low-effort days: ${consecutiveSkips}
${dedicationAdvice}`;
    } else {
        historySection = `=== EXERCISE LOG ===
No exercise logs found in the past 7 days. User may be new or hasn't started yet.
Suggest beginner-friendly exercises to ease them in.`;
    }

    let dietSummary = "No diet data available.";
    if (dietData) {
        const allMeals = [...(dietData.morning || []), ...(dietData.afternoon || []), ...(dietData.night || [])];
        if (allMeals.length > 0) {
            const totalCal = allMeals.reduce((s, r) => s + (parseInt(r.calories) || 0), 0);
            dietSummary = `Yesterday's approximate calorie intake: ${totalCal} kcal.`;
        }
    }

    return `You are a fitness trainer analyzing a user's recent exercise dedication to suggest adaptive next-day exercises.

=== USER PROFILE ===
Goal: ${hp.primaryGoal || "general_wellness"}
Activity Level: ${hp.activityLevel || "moderate"}
Weight: ${hp.weight ? hp.weight + " kg" : "Not specified"}

${historySection}

=== YESTERDAY'S DIET ===
${dietSummary}

=== CRITICAL INSTRUCTIONS ===
You MUST adapt the exercise difficulty based on the user's dedication level:

- **${dedicationLevel} dedication (${dedicationPct}%)**:
${dedicationPct >= 85
    ? `The user is very consistent. Push them further — suggest harder variations, increase reps/sets slightly, or introduce new challenging exercises.`
    : dedicationPct >= 60
    ? `Keep difficulty similar. Focus suggestions on exercises they frequently skip to help them complete the full routine. Be encouraging.`
    : dedicationPct >= 30
    ? `The user is struggling. LOWER the intensity significantly. Suggest easier versions of exercises, reduce duration, and focus on building the habit. Short 5-10 min sessions are fine.`
    : `The user barely exercises. Suggest VERY simple activities — 5-10 minute walks, gentle stretching, basic moves. Make it feel achievable, not overwhelming.`
}

- If they consistently skip night exercises, suggest moving some to morning or making night routine very short
- If they skip specific exercises, suggest easier alternatives for those
- Specifically mention exercises they keep skipping and suggest easier replacements

Give 4-6 specific suggestions with explanations tied to their actual performance data.

Return ONLY valid JSON in this exact format:
{
  "suggestions": [
    {
      "exercise": "Exercise Name",
      "reason": "Why this exercise is suggested based on their dedication and history",
      "youtubeQuery": "exercise name tutorial for beginners",
      "period": "morning or night",
      "priority": "high, medium, or low",
      "difficulty": "easy, moderate, or hard"
    }
  ],
  "motivation": "A personalized motivational message that references their ${dedicationPct}% dedication score and encourages them appropriately",
  "dedicationScore": ${dedicationPct},
  "adjustmentSummary": "A 1-2 sentence summary of how the exercises were adjusted based on dedication"
}`;
}


// =================================================
// 1. GET /api/exercise/plan — Get user's current exercise plan
// =================================================
router.get("/exercise/plan", protect, async (req, res) => {
    try {
        const plan = await ExercisePlan.findOne({ user: req.user._id });

        if (!plan) {
            return res.json({ exists: false });
        }

        res.json({
            exists: true,
            plan: plan.plan
        });
    } catch (err) {
        console.error("Get exercise plan error:", err);
        res.status(500).json({ message: "Failed to load exercise plan" });
    }
});

// =================================================
// 2. POST /api/exercise/plan — Generate AI exercise plan
// =================================================
router.post("/exercise/plan", protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Fetch today's diet data
        const today = getTodayDate();
        let dietData = null;
        try {
            dietData = await Diet.findOne({ user: userId, date: today });
        } catch { /* no diet data is fine */ }

        // Fetch recent exercise activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoff = sevenDaysAgo.toISOString().split("T")[0];

        let recentActivity = [];
        try {
            recentActivity = await DailyActivity.find({
                user: userId,
                date: { $gte: cutoff }
            }).sort({ date: -1 });
        } catch { /* no activity data is fine */ }

        // -------- Generate AI plan with Groq --------
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const prompt = buildExercisePlanPrompt(user, dietData, recentActivity);

        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "You are a certified fitness trainer. Always respond with valid JSON only, no extra text." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 3000
        });

        const responseText = chatCompletion.choices?.[0]?.message?.content || "";

        let planData;
        try {
            planData = extractJSON(responseText);
        } catch (parseErr) {
            console.error("AI exercise plan JSON parse error:", parseErr);
            console.error("Raw response:", responseText);
            return res.status(500).json({ message: "Failed to parse AI-generated plan. Please try again." });
        }

        // -------- Upsert the plan --------
        const exercisePlan = await ExercisePlan.findOneAndUpdate(
            { user: userId },
            {
                user: userId,
                plan: {
                    morning: planData.morning || [],
                    night: planData.night || [],
                    followFor: planData.followFor || "30 days",
                    tips: planData.tips || [],
                    basedOnGoal: user.healthProfile?.primaryGoal || "general_wellness",
                    generatedAt: new Date()
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({
            success: true,
            plan: exercisePlan.plan
        });

    } catch (err) {
        console.error("Generate exercise plan error:", err.message || err);
        const msg = err.message?.substring(0, 150) || "Failed to generate exercise plan";
        res.status(500).json({ message: msg });
    }
});

// =================================================
// 3. POST /api/exercise/log — Log daily exercise completion
// =================================================
router.post("/exercise/log", protect, async (req, res) => {
    try {
        const { date, morningCompleted, nightCompleted, notes } = req.body;
        const userId = req.user._id;
        const targetDate = date || getTodayDate();

        if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
        }

        let plan = await ExercisePlan.findOne({ user: userId });
        if (!plan) {
            return res.status(404).json({ message: "No exercise plan found. Please generate a plan first." });
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

        res.json({
            success: true,
            log: logEntry
        });

    } catch (err) {
        console.error("Exercise log error:", err);
        res.status(500).json({ message: "Failed to save exercise log" });
    }
});

// =================================================
// 4. GET /api/exercise/log/:date — Get log for a specific date
// =================================================
router.get("/exercise/log/:date", protect, async (req, res) => {
    try {
        const { date } = req.params;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
        }

        const plan = await ExercisePlan.findOne({ user: req.user._id });
        if (!plan) {
            return res.json({ morningCompleted: [], nightCompleted: [], notes: "" });
        }

        const log = plan.dailyLogs.find(l => l.date === date);
        if (!log) {
            return res.json({ morningCompleted: [], nightCompleted: [], notes: "" });
        }

        res.json(log);

    } catch (err) {
        console.error("Get exercise log error:", err);
        res.status(500).json({ message: "Failed to load exercise log" });
    }
});

// =================================================
// 5. GET /api/exercise/calendar — Get all logs (last 31 days)
// =================================================
router.get("/exercise/calendar", protect, async (req, res) => {
    try {
        const plan = await ExercisePlan.findOne({ user: req.user._id });
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
        console.error("Exercise calendar error:", err);
        res.status(500).json({ message: "Failed to load exercise calendar" });
    }
});

// =================================================
// 6. POST /api/exercise/next-day — Get next-day suggestions
// =================================================
router.post("/exercise/next-day", protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const exercisePlan = await ExercisePlan.findOne({ user: userId });
        if (!exercisePlan) {
            return res.status(404).json({ message: "No exercise plan found." });
        }

        // Get last 7 days of logs for dedication analysis
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffStr = sevenDaysAgo.toISOString().split("T")[0];

        const recentLogs = exercisePlan.dailyLogs
            .filter(l => l.date >= cutoffStr)
            .sort((a, b) => b.date.localeCompare(a.date)); // most recent first

        // Get yesterday's diet
        const yesterday = getYesterdayDate();
        let dietData = null;
        try {
            dietData = await Diet.findOne({ user: userId, date: yesterday });
        } catch { /* no diet data is fine */ }

        // -------- Generate suggestions with Groq --------
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const prompt = buildNextDayPrompt(user, exercisePlan, recentLogs, dietData);

        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "You are a fitness trainer. Always respond with valid JSON only, no extra text." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        const responseText = chatCompletion.choices?.[0]?.message?.content || "";

        let suggestionsData;
        try {
            suggestionsData = extractJSON(responseText);
        } catch (parseErr) {
            console.error("AI next-day parse error:", parseErr);
            return res.status(500).json({ message: "Failed to parse AI suggestions. Please try again." });
        }

        res.json({
            success: true,
            suggestions: suggestionsData.suggestions || [],
            motivation: suggestionsData.motivation || "Keep pushing! Every workout counts! 💪",
            dedicationScore: suggestionsData.dedicationScore ?? null,
            adjustmentSummary: suggestionsData.adjustmentSummary || ""
        });

    } catch (err) {
        console.error("Next-day suggestions error:", err.message || err);
        res.status(500).json({ message: "Failed to generate next-day suggestions" });
    }
});

export default router;
