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

// -------- Multer config (max 3 images) --------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName =
      uuidv4() + path.extname(file.originalname);
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

      // -------- Upload limit (same as normal route) --------
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

      // -------- Form for FastAPI (NORMAL endpoint) --------
      const form = new FormData();
      form.append("user_id", userId.toString());
      form.append("health_profile", JSON.stringify(healthProfile));
      form.append("previous_recipes", JSON.stringify(previousRecipes));
      form.append("message", message);

      if (req.files?.length > 0) {
        const imagePaths = req.files.map(file => file.filename);
        form.append("image_paths", JSON.stringify(imagePaths));
      }

      // -------- Save user message (same as normal) --------
      let chat = await RecipeChat.findOne({ user: userId });
      if (!chat) {
        chat = new RecipeChat({ user: userId, messages: [] });
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

      // Step 1: status
      res.write(`data: ${JSON.stringify({ status: "Generating recipe..." })}\n\n`);

      // -------- Call NORMAL FastAPI --------
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

      // -------- Save recipe history (same as normal) --------
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

      // Keep last 15 messages
      chat.messages = chat.messages.slice(-15);

      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      chat.messages = chat.messages.filter(
        m => new Date(m.createdAt) > fifteenDaysAgo
      );

      chat.updatedAt = new Date();
      await chat.save();

      // -------- Send recipe in STREAM format --------
      const recipeText = JSON.stringify(data.recipe, null, 2);

      for (const line of recipeText.split("\n")) {
        res.write(`data: ${JSON.stringify({ chunk: line })}\n\n`);
        await new Promise(r => setTimeout(r, 20)); // typing effect
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();

    } catch (err) {
      console.error("Streaming Error:", err);
      res.status(500).json({ message: "Streaming failed" });
    }
  }
);


// =================================================
// 2. NORMAL ROUTE
// POST /api/recipes/generate-recipe
// =================================================

// -------- POST /api/generate-recipe --------
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

      // ---------------- Upload limit check (3 per 3 hours) ----------------
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

      // ---- User data ----
      const healthProfile = user.healthProfile || {};
      const previousRecipes = user.previousRecipes || [];
      const message = req.body.message || "";

      // ---- Create form for Python ----
      const form = new FormData();

      form.append("user_id", userId.toString());
      form.append("health_profile", JSON.stringify(healthProfile));
      form.append("previous_recipes", JSON.stringify(previousRecipes));
      form.append("message", message);

      // ---- Attach images ----

      if (req.files.length > 0) {
        const imagePaths = req.files.map(file => file.path);
        form.append("image_paths", JSON.stringify(imagePaths));
      }

      let chat = await RecipeChat.findOne({ user: userId });
      if (!chat) {
        chat = new RecipeChat({ user: userId, messages: [] });
      }

      // Save user message
      chat.messages.push({
        role: "user",
        text: message || "Image upload",
        images: req.files?.length ? req.files.map(f => f.filename) : [],
        createdAt: new Date()
      });


      // ---- Call Python server ----
      const response = await fetch("http://127.0.0.1:8000/recipe/generate", {
        method: "POST",
        body: form,
        headers: form.getHeaders()
      });

      const data = await response.json();

      // ---- Delete temp files ----

      if (!data.success) {
        return res.status(400).json({ message: data.message });
      }

      // ---- Save recipe in DB (track last 14 days) ----
      if (!user.previousRecipes) user.previousRecipes = [];

      user.previousRecipes.push({
        recipe: data.recipe,
        ingredients: data.ingredients,
        createdAt: new Date()
      });

      // Keep only last 14 days
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      user.previousRecipes = user.previousRecipes.filter(
        r => new Date(r.createdAt) > twoWeeksAgo
      );

      await user.save();
      chat.messages.push({
        role: "ai",
        text: JSON.stringify(data.recipe)
      });

      // Keep only last 15 messages
      if (chat.messages.length > 15) {
        chat.messages = chat.messages.slice(-15);
      }

      // OR keep last 15 days
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      chat.messages = chat.messages.filter(
        m => new Date(m.createdAt) > fifteenDaysAgo
      );

      chat.updatedAt = new Date();
      await chat.save();


      // console.log(data.recipe);
      // ---- Send response ----
      res.json({
        success: true,
        recipe: data.recipe,
        ingredients: data.ingredients
      });

    } catch (error) {
      console.error("Recipe API Error:", error);
      res.status(500).json({ message: "Recipe generation failed" });
    }
  }
);



router.get("/recipes/history", protect, async (req, res) => {
  try {
    const chat = await RecipeChat.findOne({ user: req.user._id });

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
