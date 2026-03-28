import User from "../models/User.js";
import DailyActivity from "../models/DailyActivity.js";

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
export async function calculatePoints(userId, activity) {
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
            // Not continuing from yesterday, and today wasn't already set
            user.currentStreak = 1;
        }

        user.lastActivityDate = today;

        // Update longest streak
        if (user.currentStreak > user.longestStreak) {
            user.longestStreak = user.currentStreak;
        }
    } else {
        // Check if they unchecked a completed activity today
        if (activity.date === today && user.lastActivityDate === today) {
            user.currentStreak = Math.max(0, user.currentStreak - 1);
            user.lastActivityDate = yesterdayStr;
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
