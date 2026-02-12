import express from "express";
import { saveProfile, getProfile } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/profile", protect, saveProfile);
router.get("/profile", protect, getProfile);

export default router;
