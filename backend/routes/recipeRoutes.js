import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import path from "path";
import RecipeChat from "../models/RecipeChat.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// -------- Helper: get today's date string --------
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

// -------- Multer config (max 3 images) --------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { files: 3 }
});

// =================================================
// 1. STREAMING ROUTE
// POST /api/recipes/generate-stream
// =================================================
router.post(
  "/recipes/generate-stream",
  protect,
  upload.array("images", 3),
  async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // -------- Upload limit (3 per 3 hours) --------
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

      const recentUploads = (user.previousRecipes || []).filter(
        r => new Date(r.createdAt) > threeHoursAgo
      );

      if (recentUploads.length >= 3) {
        return res.status(429).json({
          message: "Upload limit reached. Try again after 3 hours."
        });
      }

      // -------- User data --------
      const healthProfile = user.healthProfile || {};
      const previousRecipes = user.previousRecipes || [];
      const message = req.body.message || "";
      const today = getTodayDate();

      // -------- Form for FastAPI --------
      const form = new FormData();
      form.append("user_id", userId.toString());
      form.append("health_profile", JSON.stringify(healthProfile));
      form.append("previous_recipes", JSON.stringify(previousRecipes));
      form.append("message", message);

      if (req.files?.length > 0) {
        const imagePaths = req.files.map(file => file.filename);
        form.append("image_paths", JSON.stringify(imagePaths));
      }

      // -------- Find or create today's chat --------
      let chat = await RecipeChat.findOne({ user: userId, date: today });
      if (!chat) {
        chat = new RecipeChat({ user: userId, date: today, messages: [] });
      }

      chat.messages.push({
        role: "user",
        text: message || "Image upload",
        images: req.files?.length ? req.files.map(f => f.filename) : [],
        createdAt: new Date()
      });

      // -------- SSE headers --------
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ status: "Generating recipe..." })}\n\n`);

      // -------- Call FastAPI --------
      const response = await fetch(
        "http://127.0.0.1:8000/recipe/generate",
        {
          method: "POST",
          body: form,
          headers: form.getHeaders()
        }
      );

      const data = await response.json();

      if (!data.success) {
        res.write(`data: ${JSON.stringify({ error: data.message })}\n\n`);
        res.end();
        return;
      }

      // -------- Save recipe history --------
      if (!user.previousRecipes) user.previousRecipes = [];

      user.previousRecipes.push({
        recipe: data.recipe,
        ingredients: data.ingredients,
        createdAt: new Date()
      });

      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      user.previousRecipes = user.previousRecipes.filter(
        r => new Date(r.createdAt) > twoWeeksAgo
      );

      await user.save();

      // -------- Save AI message --------
      chat.messages.push({
        role: "ai",
        text: JSON.stringify(data.recipe),
        createdAt: new Date()
      });

      chat.updatedAt = new Date();
      await chat.save();

      // -------- Send recipe in STREAM format --------
      const recipeText = JSON.stringify(data.recipe, null, 2);

      for (const line of recipeText.split("\n")) {
        res.write(`data: ${JSON.stringify({ chunk: line })}\n\n`);
        await new Promise(r => setTimeout(r, 20));
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();

    } catch (err) {
      console.error("Streaming Error:", err);
      if (!res.headersSent) {
        return res.status(500).json({ message: "Streaming failed" });
      }
      res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
      res.end();
    }
  }
);


// =================================================
// 2. GET /api/recipes/dates — Get all recipe chat dates
// =================================================
router.get("/recipes/dates", protect, async (req, res) => {
  try {
    const chats = await RecipeChat.find({ user: req.user._id })
      .select("date")
      .sort({ date: -1 });

    const dates = chats.map(c => c.date);
    res.json({ dates });

  } catch (err) {
    console.error("Recipe dates error:", err);
    res.status(500).json({ message: "Failed to load recipe dates" });
  }
});


// =================================================
// 3. GET /api/recipes/history/:date — Get recipe messages for a date
// =================================================
router.get("/recipes/history/:date", protect, async (req, res) => {
  try {
    const { date } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    const chat = await RecipeChat.findOne({
      user: req.user._id,
      date: date
    });

    if (!chat) {
      return res.json({ messages: [] });
    }

    const messages = chat.messages.map(m => ({
      ...m.toObject(),
      images: m.images?.map(img =>
        `http://localhost:5000/uploads/${img}`
      )
    }));

    res.json({ messages });

  } catch (err) {
    console.error("Recipe history error:", err);
    res.status(500).json({ message: "Failed to load recipe history" });
  }
});


// =================================================
// 4. GET /api/recipes/history — Legacy: Get all messages (today)
// =================================================
router.get("/recipes/history", protect, async (req, res) => {
  try {
    const today = getTodayDate();
    const chat = await RecipeChat.findOne({ user: req.user._id, date: today });

    if (!chat) {
      return res.json({ messages: [] });
    }

    const messages = chat.messages.map(m => ({
      ...m.toObject(),
      images: m.images?.map(img =>
        `http://localhost:5000/uploads/${img}`
      )
    }));

    res.json({ messages });

  } catch (err) {
    res.status(500).json({ message: "Failed to load history" });
  }
});


export default router;
