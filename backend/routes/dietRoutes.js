import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Diet from "../models/Diet.js";

const router = express.Router();

// -------- Helper: get today's date string --------
function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}

// =================================================
// 1. POST /api/diet/add — Add recipe to a meal slot
// =================================================
router.post("/diet/add", protect, async (req, res) => {
    try {
        const { date, slot, recipe } = req.body;
        const userId = req.user._id;

        // Validate slot
        if (!["morning", "afternoon", "night"].includes(slot)) {
            return res.status(400).json({ message: "Invalid slot. Use morning, afternoon, or night." });
        }

        if (!recipe || !recipe.recipeName) {
            return res.status(400).json({ message: "Recipe data is required." });
        }

        const targetDate = date || getTodayDate();

        // Find or create diet for this date
        let diet = await Diet.findOne({ user: userId, date: targetDate });
        if (!diet) {
            diet = new Diet({ user: userId, date: targetDate, morning: [], afternoon: [], night: [] });
        }

        // Add recipe to the slot
        diet[slot].push({
            recipeName: recipe.recipeName || recipe.recipe_name,
            ingredients: recipe.ingredients || [],
            calories: recipe.calories || "",
            protein: recipe.protein || "",
            bestTime: recipe.bestTime || recipe.best_time || "",
            reason: recipe.reason || "",
            addedAt: new Date()
        });

        await diet.save();

        res.json({
            success: true,
            message: `Recipe added to ${slot}`,
            diet
        });

    } catch (err) {
        console.error("Diet add error:", err);
        res.status(500).json({ message: "Failed to add to diet" });
    }
});

// =================================================
// 2. GET /api/diet/dates — Get all dates with diet entries
// =================================================
router.get("/diet/dates", protect, async (req, res) => {
    try {
        const diets = await Diet.find({ user: req.user._id })
            .select("date")
            .sort({ date: -1 });

        const dates = diets.map(d => d.date);
        res.json({ dates });

    } catch (err) {
        console.error("Diet dates error:", err);
        res.status(500).json({ message: "Failed to load diet dates" });
    }
});

// =================================================
// 3. GET /api/diet/:date — Get diet for a specific date
// =================================================
router.get("/diet/:date", protect, async (req, res) => {
    try {
        const { date } = req.params;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
        }

        const diet = await Diet.findOne({ user: req.user._id, date });

        if (!diet) {
            return res.json({ morning: [], afternoon: [], night: [] });
        }

        res.json({
            morning: diet.morning,
            afternoon: diet.afternoon,
            night: diet.night
        });

    } catch (err) {
        console.error("Diet fetch error:", err);
        res.status(500).json({ message: "Failed to load diet" });
    }
});

// =================================================
// 4. DELETE /api/diet/remove — Remove a recipe from a meal slot
// =================================================
router.delete("/diet/remove", protect, async (req, res) => {
    try {
        const { date, slot, recipeId } = req.body;
        const userId = req.user._id;

        if (!["morning", "afternoon", "night"].includes(slot)) {
            return res.status(400).json({ message: "Invalid slot" });
        }

        const targetDate = date || getTodayDate();

        const diet = await Diet.findOne({ user: userId, date: targetDate });
        if (!diet) {
            return res.status(404).json({ message: "No diet found for this date" });
        }

        // Remove the recipe by its _id
        diet[slot] = diet[slot].filter(r => r._id.toString() !== recipeId);
        await diet.save();

        res.json({
            success: true,
            message: `Recipe removed from ${slot}`,
            diet
        });

    } catch (err) {
        console.error("Diet remove error:", err);
        res.status(500).json({ message: "Failed to remove from diet" });
    }
});

export default router;
