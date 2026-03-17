import express from "express";
import {
  saveHealthProfile,
  getProfile,
  updateProfile,
  saveLLMAnswers,
  uploadAvatar
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

const router = express.Router();

// Upload Avatar
router.post("/upload-avatar", protect, upload.single("avatar"), uploadAvatar);

// Save static questionnaire
router.post("/profile", protect, saveHealthProfile);

// Get profile
router.get("/profile", protect, getProfile);

// Update profile (basic info)
router.put("/profile", protect, updateProfile);

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
