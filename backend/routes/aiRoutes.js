import express from "express";
import fetch from "node-fetch";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Generate and SAVE AI questions
router.post("/ai-generate", protect, async (req, res) => {
  try {
    console.log("User:", req.user._id);
    console.log("Body:", req.body);

    const response = await fetch("http://127.0.0.1:8000/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        healthProfile: req.body.healthProfile
      })
    });

    const data = await response.json();

    console.log("Python response:", data);

    // Expected format:
    // { questions: [{ question: "", options: [] }] }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { aiQuestions: data.questions },   // save to schema
      { new: true }
    );

    res.json(user.aiQuestions);

  } catch (error) {
    console.error("AI ERROR:", error.message);
    res.status(500).json({ message: "AI generation failed" });
  }
});

// Get saved AI questions
router.get("/ai-questions", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.aiQuestions || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save user AI answers
router.post("/ai-answers", protect, async (req, res) => {
  try {
    const answers = req.body.answers;
    // answers format:
    // [{ question: "...", answer: "..." }]

    const user = await User.findById(req.user._id);

    // map answers into existing aiQuestions
    user.aiQuestions = user.aiQuestions.map(q => {
      const found = answers.find(a => a.question === q.question);
      return {
        ...q._doc,
        answer: found ? found.answer : q.answer
      };
    });

    // Mark onboarding completed
    user.onboardingCompleted = true;

    await user.save();

    res.json({ message: "Answers saved", onboardingCompleted: true });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
