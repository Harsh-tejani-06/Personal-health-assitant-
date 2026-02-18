import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import DailyActivity from "../models/DailyActivity.js";
import User from "../models/User.js";

const router = express.Router();

// -------- Point values --------
const POINTS = {
    ACTIVITY_COMPLETE: 10,    // per activity (exercise, diet, skincare)
    DAILY_STREAK_BONUS: 15,   // all 3 completed in a day
    STREAK_7_BONUS: 50,       // 7-day streak
    STREAK_30_BONUS: 200,     // 30-day streak
    MONTHLY_PER_ACTIVITY: 5   // per completed activity for monthly bonus
};

// -------- Helper: get today's date string --------
function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}

// -------- Helper: calculate and award points --------
async function calculatePoints(userId, activity) {
    let pointsEarned = 0;

    // Count completed activities
    const completedCount = [
        activity.exercise?.completed,
        activity.diet?.completed,
        activity.skinCare?.completed
    ].filter(Boolean).length;

    pointsEarned = completedCount * POINTS.ACTIVITY_COMPLETE;

    // Daily streak bonus: all 3 completed
    if (completedCount === 3) {
        pointsEarned += POINTS.DAILY_STREAK_BONUS;
    }

    // Update activity's pointsEarned
    activity.pointsEarned = pointsEarned;
    await activity.save();

    // Update user streak
    const user = await User.findById(userId);
    if (!user) return;

    const today = getTodayDate();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (completedCount === 3) {
        // Check if continuing streak from yesterday
        if (user.lastActivityDate === yesterdayStr) {
            user.currentStreak += 1;
        } else if (user.lastActivityDate !== today) {
            user.currentStreak = 1;
        }

        user.lastActivityDate = today;

        // Update longest streak
        if (user.currentStreak > user.longestStreak) {
            user.longestStreak = user.currentStreak;
        }

        // Streak milestone bonuses
        if (user.currentStreak === 7) {
            pointsEarned += POINTS.STREAK_7_BONUS;
        }
        if (user.currentStreak === 30) {
            pointsEarned += POINTS.STREAK_30_BONUS;
        }
    }

    // Recalculate total points from all activities
    const allActivities = await DailyActivity.find({ user: userId });
    const totalFromActivities = allActivities.reduce((sum, a) => sum + a.pointsEarned, 0);

    // Add streak bonuses
    let streakBonus = 0;
    if (user.currentStreak >= 7) streakBonus += POINTS.STREAK_7_BONUS;
    if (user.currentStreak >= 30) streakBonus += POINTS.STREAK_30_BONUS;

    // Monthly bonus: count activities completed this month
    const monthStart = today.substring(0, 7); // "YYYY-MM"
    const monthlyActivities = allActivities.filter(a => a.date.startsWith(monthStart));
    let monthlyCompleted = 0;
    for (const ma of monthlyActivities) {
        if (ma.exercise?.completed) monthlyCompleted++;
        if (ma.diet?.completed) monthlyCompleted++;
        if (ma.skinCare?.completed) monthlyCompleted++;
    }
    const monthlyBonus = monthlyCompleted * POINTS.MONTHLY_PER_ACTIVITY;

    user.totalPoints = totalFromActivities + streakBonus + monthlyBonus;
    await user.save();

    return { pointsEarned: activity.pointsEarned, totalPoints: user.totalPoints, currentStreak: user.currentStreak };
}

// =================================================
// 1. POST /api/activity/log — Log/update daily activity
// =================================================
router.post("/activity/log", protect, async (req, res) => {
    try {
        const { date, type, completed, details, duration } = req.body;
        const userId = req.user._id;
        const targetDate = date || getTodayDate();

        if (!["exercise", "diet", "skinCare"].includes(type)) {
            return res.status(400).json({ message: "Invalid activity type. Use exercise, diet, or skinCare." });
        }

        // Find or create activity for this date
        let activity = await DailyActivity.findOne({ user: userId, date: targetDate });
        if (!activity) {
            activity = new DailyActivity({ user: userId, date: targetDate });
        }

        // Update the specific activity
        activity[type].completed = completed;
        if (details !== undefined) activity[type].details = details;
        if (type === "exercise" && duration !== undefined) activity[type].duration = duration;

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
// 3. GET /api/activity/history — Get last 30 days activity
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

export default router;
