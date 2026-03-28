import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import DailyActivity from "../models/DailyActivity.js";
import User from "../models/User.js";
import { calculatePoints } from "../utils/gamification.js";

const router = express.Router();

// -------- Helper: get today's date string --------
function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}

// =================================================
// 1. GET /api/activity/history — Get last 30 days (MUST be before :date)
// =================================================
router.get("/activity/history", protect, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString().split("T")[0];

        const activities = await DailyActivity.find({
            user: req.user._id,
            date: { $gte: cutoffDate }
        }).sort({ date: -1 });

        res.json({ activities });

    } catch (err) {
        console.error("Activity history error:", err);
        res.status(500).json({ message: "Failed to load activity history" });
    }
});

// =================================================
// 2. GET /api/activity/:date — Get activity for a date
// =================================================
router.get("/activity/:date", protect, async (req, res) => {
    try {
        const { date } = req.params;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
        }

        const activity = await DailyActivity.findOne({
            user: req.user._id,
            date
        });

        if (!activity) {
            return res.json({
                exercise: { completed: false, details: "", duration: 0 },
                diet: { completed: false, details: "" },
                skinCare: { completed: false, details: "" },
                water: { amount: 0, completed: false },
                pointsEarned: 0
            });
        }

        res.json(activity);

    } catch (err) {
        console.error("Activity fetch error:", err);
        res.status(500).json({ message: "Failed to load activity" });
    }
});

// =================================================
// 3. POST /api/activity/log — Log/update daily activity
// =================================================
router.post("/activity/log", protect, async (req, res) => {
    try {
        const { date, type, completed, details, duration } = req.body;
        const userId = req.user._id;
        const targetDate = date || getTodayDate();

        if (!["exercise", "diet", "skinCare", "water"].includes(type)) {
            return res.status(400).json({ message: "Invalid activity type. Use exercise, diet, skinCare, or water." });
        }

        // Find or create activity for this date
        let activity = await DailyActivity.findOne({ user: userId, date: targetDate });
        if (!activity) {
            activity = new DailyActivity({ user: userId, date: targetDate });
        }

        // Update the specific activity
        if (type === "water") {
            // details here is treated as the amount
            activity.water.amount = Number(details);
            activity.water.completed = activity.water.amount >= 3; // Hardcoded goal for now, or fetch from user profile
        } else {
            activity[type].completed = completed;
            if (details !== undefined) activity[type].details = details;
            if (type === "exercise" && duration !== undefined) activity[type].duration = duration;
        }

        await activity.save();

        // Calculate and award points
        const pointsData = await calculatePoints(userId, activity);

        res.json({
            success: true,
            activity,
            points: pointsData
        });

    } catch (err) {
        console.error("Activity log error:", err);
        res.status(500).json({ message: "Failed to log activity" });
    }
});

export default router;
