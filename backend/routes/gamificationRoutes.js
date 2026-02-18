import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// =================================================
// 1. GET /api/points/me — Get current user's points & streak
// =================================================
router.get("/points/me", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("fullname totalPoints currentStreak longestStreak lastActivityDate");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get user's rank
        const rank = await User.countDocuments({
            totalPoints: { $gt: user.totalPoints }
        }) + 1;

        res.json({
            fullname: user.fullname,
            totalPoints: user.totalPoints,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            lastActivityDate: user.lastActivityDate,
            rank
        });

    } catch (err) {
        console.error("Points fetch error:", err);
        res.status(500).json({ message: "Failed to load points" });
    }
});

// =================================================
// 2. GET /api/points/leaderboard — Top users ranked by points
// =================================================
router.get("/points/leaderboard", protect, async (req, res) => {
    try {
        const users = await User.find()
            .select("fullname totalPoints currentStreak longestStreak")
            .sort({ totalPoints: -1 })
            .limit(20);

        const leaderboard = users.map((u, index) => ({
            rank: index + 1,
            fullname: u.fullname,
            totalPoints: u.totalPoints,
            currentStreak: u.currentStreak,
            longestStreak: u.longestStreak,
            isCurrentUser: u._id.toString() === req.user._id.toString()
        }));

        res.json({ leaderboard });

    } catch (err) {
        console.error("Leaderboard error:", err);
        res.status(500).json({ message: "Failed to load leaderboard" });
    }
});

export default router;
