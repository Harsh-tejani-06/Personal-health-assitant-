import express from "express";
import Groq from "groq-sdk";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import HealthChat from "../models/HealthChat.js";

const router = express.Router();

// -------- Helper: get today's date string --------
function getTodayDate() {
    const now = new Date();
    return now.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

// -------- Helper: build system prompt with user data --------
function buildSystemPrompt(user) {
    const hp = user.healthProfile || {};
    const aiAnswers = (user.aiQuestions || [])
        .map((q) => `Q: ${q.question}\nA: ${q.answer}`)
        .join("\n");

    return `You are a personalized health assistant for ${user.fullname}. 
You provide helpful, empathetic, and actionable health advice based on the user's profile data below.
Respond naturally like a caring health coach — NOT like a generic AI. Use the user's data to personalize every response.
Keep answers concise but thorough. Use bullet points when listing tips.
Always remind the user to consult a doctor for serious medical concerns.

=== USER HEALTH PROFILE ===
Name: ${user.fullname}
Age Group: ${hp.ageGroup || "Not specified"}
Gender: ${hp.gender || "Not specified"}
Height: ${hp.height ? hp.height + " cm" : "Not specified"}
Weight: ${hp.weight ? hp.weight + " kg" : "Not specified"}
Primary Goal: ${hp.primaryGoal || "Not specified"}
Activity Level: ${hp.activityLevel || "Not specified"}
Diet Type: ${hp.dietType || "Not specified"}
Food Restrictions: ${hp.foodRestrictions || "None"}
Monthly Food Budget: ${hp.monthlyFoodBudget || "Not specified"}
Sleep Hours: ${hp.sleepHours || "Not specified"}
Skin Type: ${hp.skinType || "Not specified"}
Water Intake: ${hp.waterIntakeLiters ? hp.waterIntakeLiters + " liters/day" : "Not specified"}

=== AI QUESTIONNAIRE ANSWERS ===
${aiAnswers || "No additional answers provided"}
===

Use this data to give personalized suggestions. For example, if the user wants weight loss and has a vegetarian diet, suggest vegetarian weight-loss meals, exercises suited to their activity level, etc.`;
}

// =================================================
// 1. POST /api/chat/send — Stream chat with Groq
// =================================================
router.post("/chat/send", protect, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Message is required" });
        }

        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const today = getTodayDate();

        // -------- Find or create today's chat --------
        let todayChat = await HealthChat.findOne({ user: userId, date: today });
        if (!todayChat) {
            todayChat = new HealthChat({ user: userId, date: today, messages: [] });
        }

        // -------- Save user message immediately --------
        todayChat.messages.push({
            role: "user",
            content: message.trim(),
            createdAt: new Date()
        });
        await todayChat.save();

        // -------- Gather last 50 messages for context --------
        const recentChats = await HealthChat.find({ user: userId })
            .sort({ date: -1 })
            .limit(10); // last 10 days max

        // Flatten and take last 50 messages
        const allMessages = [];
        for (const chat of recentChats.reverse()) {
            for (const msg of chat.messages) {
                allMessages.push({
                    role: msg.role,
                    content: msg.content
                });
            }
        }
        const contextMessages = allMessages.slice(-50);

        // -------- Build Groq messages array --------
        const systemPrompt = buildSystemPrompt(user);
        const groqMessages = [
            { role: "system", content: systemPrompt },
            ...contextMessages
        ];

        // -------- SSE headers --------
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        // -------- Call Groq with streaming --------
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const stream = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: groqMessages,
            stream: true,
            temperature: 0.7,
            max_tokens: 1024
        });

        let fullResponse = "";

        for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
                fullResponse += content;
                res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
            }
        }

        // -------- Save assistant response --------
        todayChat.messages.push({
            role: "assistant",
            content: fullResponse,
            createdAt: new Date()
        });
        await todayChat.save();

        // -------- End stream --------
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();

    } catch (err) {
        console.error("Chatbot Streaming Error:", err);

        // If headers haven't been sent yet, send JSON error
        if (!res.headersSent) {
            return res.status(500).json({ message: "Chat failed" });
        }

        // If already streaming, send error event
        res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
        res.end();
    }
});


// =================================================
// 2. GET /api/chat/dates — Get all chat dates for user
// =================================================
router.get("/chat/dates", protect, async (req, res) => {
    try {
        const chats = await HealthChat.find({ user: req.user._id })
            .select("date")
            .sort({ date: -1 });

        const dates = chats.map((c) => c.date);
        res.json({ dates });

    } catch (err) {
        console.error("Chat dates error:", err);
        res.status(500).json({ message: "Failed to load chat dates" });
    }
});


// =================================================
// 3. GET /api/chat/history/:date — Get messages for a specific date
// =================================================
router.get("/chat/history/:date", protect, async (req, res) => {
    try {
        const { date } = req.params;

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
        }

        const chat = await HealthChat.findOne({
            user: req.user._id,
            date: date
        });

        if (!chat) {
            return res.json({ messages: [] });
        }

        res.json({ messages: chat.messages });

    } catch (err) {
        console.error("Chat history error:", err);
        res.status(500).json({ message: "Failed to load chat history" });
    }
});

export default router;
