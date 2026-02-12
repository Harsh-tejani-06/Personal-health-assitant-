import express from "express";
import {
  saveHealthProfile,
  getProfile,
  saveLLMAnswers
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Save static questionnaire
router.post("/profile", protect, saveHealthProfile);

// Get profile
router.get("/profile", protect, getProfile);

// Save AI answers
router.post("/llm-answer", protect, saveLLMAnswers);

router.get("/onboarding-status", protect, async (req, res) => {
  try {
    // ❗ fetch user first
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const completed =
      user.healthProfile &&
      user.aiQuestions &&
      user.aiQuestions.length > 0 &&
      user.aiQuestions.every(q => q.answer);

    res.json({ completed });

  } catch (error) {
    console.error("Onboarding error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
