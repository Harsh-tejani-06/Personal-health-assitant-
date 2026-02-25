import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import path from "path";
import RecipeChat from "../models/RecipeChat.js";
import StarredRecipe from "../models/StarredRecipe.js";
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



      // -------- Prepare user message (saved to DB only after successful validation) --------
      const userMessage = {
        role: "user",
        text: message || "Image upload",
        images: req.files?.length ? req.files.map(f => f.filename) : [],
        createdAt: new Date()
      };

      // -------- SSE headers --------
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ status: "Connecting to AI..." })}\n\n`);

      // -------- Build FormData for FastAPI streaming endpoint --------
      // FastAPI expects: health_profile, previous_recipes, message, image_paths (JSON string of file paths)
      const streamForm = new FormData();
      streamForm.append("health_profile", JSON.stringify(healthProfile));
      streamForm.append("previous_recipes", JSON.stringify(previousRecipes));
      streamForm.append("message", message);

      // Send image file paths as JSON string — FastAPI expects image_paths as Form string
      if (req.files?.length > 0) {
        const imagePaths = req.files.map(f => f.path.replace(/\\/g, "/"));
        streamForm.append("image_paths", JSON.stringify(imagePaths));
      }

      // -------- Call FastAPI SSE streaming endpoint --------
      const response = await fetch(
        "http://127.0.0.1:8000/recipe/generate-stream",
        {
          method: "POST",
          body: streamForm,
          headers: streamForm.getHeaders(),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("FastAPI error:", response.status, errText);
        res.write(`data: ${JSON.stringify({ error: "AI service error" })}\n\n`);
        res.end();
        return;
      }

      // -------- Parse SSE events from FastAPI and forward to client --------
      let recipeData = null;
      let streamError = null;
      let imageInvalid = false;
      let detectedIngredients = [];
      let accumulatedChunks = [];  // Accumulate chunk lines to reconstruct recipe JSON

      const stream = response.body;
      let buffer = "";

      stream.on("data", (chunk) => {
        buffer += chunk.toString();

        // SSE events are separated by double newlines
        const parts = buffer.split("\n\n");
        buffer = parts.pop(); // keep incomplete part in buffer

        for (const part of parts) {
          if (!part.trim()) continue;

          const lines = part.split("\n");
          let eventName = null;
          let eventData = null;

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventName = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              try {
                eventData = JSON.parse(line.slice(6));
              } catch (e) {
                eventData = line.slice(6);
              }
            }
          }

          if (!eventData) continue;

          // Forward events to frontend
          switch (eventName) {
            case "status":
              res.write(`data: ${JSON.stringify({ status: eventData.message || "Processing..." })}\n\n`);
              break;

            case "validation":
              if (eventData.valid) {
                detectedIngredients = eventData.detected_ingredients || [];
                res.write(`data: ${JSON.stringify({ status: "Images validated ✅ Generating recipe..." })}\n\n`);
              } else {
                imageInvalid = true;
                res.write(`data: ${JSON.stringify({ status: eventData.warning || "Validation issue..." })}\n\n`);
              }
              break;

            case "recipe":
              recipeData = eventData;
              // Stream recipe as chunk for the frontend to display progressively
              const recipeText = JSON.stringify(recipeData, null, 2);
              for (const line of recipeText.split("\n")) {
                res.write(`data: ${JSON.stringify({ chunk: line })}\n\n`);
              }
              break;

            case "error":
              streamError = eventData.message || "Unknown error";
              res.write(`data: ${JSON.stringify({ error: streamError })}\n\n`);
              break;

            case "done":
              // Will be handled in the 'end' event
              break;

            default:
              // FastAPI sends plain data: lines without event: prefix
              // Handle all data types here for compatibility
              if (eventData.chunk) {
                accumulatedChunks.push(eventData.chunk);
                res.write(`data: ${JSON.stringify({ chunk: eventData.chunk })}\n\n`);
              } else if (eventData.error) {
                streamError = eventData.error;
                imageInvalid = true;
                res.write(`data: ${JSON.stringify({ error: streamError })}\n\n`);
              } else if (eventData.status) {
                res.write(`data: ${JSON.stringify({ status: eventData.status })}\n\n`);
              } else if (eventData.done) {
                // done signal — recipe data will be reconstructed from chunks
              }
              break;
          }
        }
      });

      stream.on("end", async () => {
        try {
          // -------- Reconstruct recipe from accumulated chunks if recipeData wasn't set via named event --------
          if (!recipeData && accumulatedChunks.length > 0) {
            try {
              const fullText = accumulatedChunks.join("\n");
              const parsed = JSON.parse(fullText);
              if (parsed.recipe_name || parsed.ingredients || parsed.steps) {
                recipeData = parsed;
              }
            } catch (parseErr) {
              console.error("Failed to parse accumulated recipe chunks:", parseErr.message);
            }
          }

          // -------- Only save to DB if image was valid / recipe succeeded --------
          if (!imageInvalid && recipeData) {
            // Find or create today's chat
            let chat = await RecipeChat.findOne({ user: userId, date: today });
            if (!chat) {
              chat = new RecipeChat({ user: userId, date: today, messages: [] });
            }

            // Save user message
            chat.messages.push(userMessage);

            // Save AI recipe response
            chat.messages.push({
              role: "ai",
              text: JSON.stringify(recipeData),
              createdAt: new Date(),
            });

            chat.updatedAt = new Date();
            await chat.save();

            // Save recipe to user history
            if (!user.previousRecipes) user.previousRecipes = [];

            user.previousRecipes.push({
              recipe: recipeData,
              ingredients: recipeData.ingredients || detectedIngredients,
              createdAt: new Date(),
            });

            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            user.previousRecipes = user.previousRecipes.filter(
              (r) => new Date(r.createdAt) > twoWeeksAgo
            );

            await user.save();
          }
          // If image was invalid or error occurred — skip DB save entirely
        } catch (saveErr) {
          console.error("Error saving after stream:", saveErr);
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      });

      stream.on("error", (err) => {
        console.error("FastAPI stream error:", err);
        res.write(`data: ${JSON.stringify({ error: "Stream connection failed" })}\n\n`);
        res.end();
      });

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


// =================================================
// 5. GET /api/recipes/starred — Get all starred recipes
// =================================================
router.get("/recipes/starred", protect, async (req, res) => {
  try {
    const starred = await StarredRecipe.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ recipes: starred });
  } catch (err) {
    console.error("Starred recipes error:", err);
    res.status(500).json({ message: "Failed to load starred recipes" });
  }
});


// =================================================
// 6. POST /api/recipes/starred — Add recipe to favourites
// =================================================
router.post("/recipes/starred", protect, async (req, res) => {
  try {
    const { recipe } = req.body;

    if (!recipe || !recipe.recipe_name) {
      return res.status(400).json({ message: "Recipe data with recipe_name is required" });
    }

    // Check if already starred
    const existing = await StarredRecipe.findOne({
      user: req.user._id,
      "recipe.recipe_name": recipe.recipe_name
    });

    if (existing) {
      return res.status(409).json({ message: "Recipe already starred", id: existing._id });
    }

    const starred = new StarredRecipe({
      user: req.user._id,
      recipe: {
        recipe_name: recipe.recipe_name,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        calories: recipe.calories || "",
        protein: recipe.protein || "",
        best_time: recipe.best_time || recipe.bestTime || "",
        reason: recipe.reason || ""
      }
    });

    await starred.save();
    res.status(201).json({ message: "Recipe starred!", starred });

  } catch (err) {
    console.error("Star recipe error:", err);
    res.status(500).json({ message: "Failed to star recipe" });
  }
});


// =================================================
// 7. DELETE /api/recipes/starred/:id — Remove recipe from favourites
// =================================================
router.delete("/recipes/starred/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await StarredRecipe.findOneAndDelete({
      _id: id,
      user: req.user._id
    });

    if (!result) {
      return res.status(404).json({ message: "Starred recipe not found" });
    }

    res.json({ message: "Recipe removed from favourites" });

  } catch (err) {
    console.error("Unstar recipe error:", err);
    res.status(500).json({ message: "Failed to remove starred recipe" });
  }
});


export default router;
