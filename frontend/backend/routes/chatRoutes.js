import express from "express";
import { chatController } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only logged-in users can access chat
router.post("/chat", protect, chatController);

export default router;
