import { useState, useEffect } from "react";
import { logActivity, getActivity, getActivityHistory } from "../../services/activityService";
import { getMyPoints } from "../../services/gamificationService";

function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}

const ACTIVITIES = [
    {
        key: "exercise",
        label: "Exercise",
        emoji: "💪",
        color: "from-green-400 to-emerald-500",
        bgLight: "bg-green-50",
        border: "border-green-200",
        desc: "Log your daily workout or physical activity"
    },
    {
        key: "diet",
        label: "Diet",
        emoji: "🥗",
        color: "from-orange-400 to-amber-500",
        bgLight: "bg-orange-50",
        border: "border-orange-200",
        desc: "Track your healthy eating habits"
    },
    {
        key: "skinCare",
        label: "Skin Care",
        emoji: "✨",
        color: "from-pink-400 to-rose-500",
        bgLight: "bg-pink-50",
        border: "border-pink-200",
        desc: "Follow your skincare routine"
    }
];

export default function Activity() {
    const [activity, setActivity] = useState({
        exercise: { completed: false, details: "", duration: 0 },
        diet: { completed: false, details: "" },
        skinCare: { completed: false, details: "" },
        pointsEarned: 0
    });
    const [points, setPoints] = useState({ totalPoints: 0, currentStreak: 0, longestStreak: 0, rank: 0 });
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);

    const today = getTodayDate();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [activityData, pointsData, historyData] = await Promise.all([
                getActivity(today),
                getMyPoints(),
                getActivityHistory()
            ]);
            setActivity(activityData);
            setPoints(pointsData);
            setHistory(historyData.activities || []);
        } catch (err) {
            console.error("Failed to load activity data:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggle(type) {
        const newState = !activity[type]?.completed;
        setSaving(type);
        try {
            const result = await logActivity(today, type, newState, activity[type]?.details || "", activity[type]?.duration || 0);
            setActivity(result.activity);
            if (result.points) {
                setPoints(prev => ({ ...prev, ...result.points }));
            }
        } catch (err) {
            console.error("Failed to log activity:", err);
        } finally {
            setSaving(null);
        }
    }

    const completedCount = [
        activity.exercise?.completed,
        activity.diet?.completed,
        activity.skinCare?.completed
    ].filter(Boolean).length;

    const progressPercent = Math.round((completedCount / 3) * 100);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto text-center py-20">
                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Loading activity data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Stats Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                        {points.totalPoints}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">Total Points</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
                        🔥 {points.currentStreak}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">Day Streak</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        🏆 #{points.rank || "—"}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">Your Rank</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                        ⭐ {points.longestStreak}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">Best Streak</p>
                </div>
            </div>

            {/* Daily Progress */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Today's Progress</h2>
                        <p className="text-sm text-slate-500">{completedCount}/3 activities completed</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-emerald-500">{progressPercent}%</span>
                        {completedCount === 3 && <span className="text-2xl">🎉</span>}
                    </div>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                {completedCount === 3 && (
                    <p className="text-sm text-emerald-600 font-medium mt-3 text-center">
                        🎯 All activities completed! You earned a +15 streak bonus!
                    </p>
                )}
                {activity.pointsEarned > 0 && (
                    <p className="text-xs text-slate-400 mt-2 text-center">
                        +{activity.pointsEarned} points earned today
                    </p>
                )}
            </div>

            {/* Activity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {ACTIVITIES.map(act => {
                    const isCompleted = activity[act.key]?.completed;
                    const isSaving = saving === act.key;

                    return (
                        <div
                            key={act.key}
                            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${isCompleted ? `${act.border} ring-2 ring-offset-2 ring-${act.border.replace('border-', '')}` : 'border-slate-200'
                                }`}
                        >
                            <div className={`bg-gradient-to-r ${act.color} p-5 text-white relative`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{act.emoji}</span>
                                        <div>
                                            <h3 className="font-bold text-lg">{act.label}</h3>
                                            <p className="text-white/80 text-xs">{act.desc}</p>
                                        </div>
                                    </div>
                                    {isCompleted && (
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                            <span className="text-lg">✅</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-5">
                                <button
                                    onClick={() => handleToggle(act.key)}
                                    disabled={isSaving}
                                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${isSaving
                                            ? 'bg-slate-100 text-slate-400 cursor-wait'
                                            : isCompleted
                                                ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                                                : `bg-gradient-to-r ${act.color} text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`
                                        }`}
                                >
                                    {isSaving
                                        ? '⏳ Saving...'
                                        : isCompleted
                                            ? '↩️ Mark Incomplete'
                                            : `✓ Mark Complete (+10 pts)`}
                                </button>

                                {isCompleted && (
                                    <p className={`text-xs text-center mt-3 font-medium ${act.border.replace('border', 'text')}`}>
                                        +10 points earned!
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* History Toggle */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xl">📊</span>
                        <div>
                            <h3 className="font-bold text-slate-800">Activity History</h3>
                            <p className="text-xs text-slate-500">Last 30 days</p>
                        </div>
                    </div>
                    <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                        className="text-slate-400"
                        style={{ transform: showHistory ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {showHistory && (
                    <div className="border-t border-slate-100 p-4 max-h-80 overflow-y-auto">
                        {history.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm py-6">No activity history yet</p>
                        ) : (
                            <div className="space-y-2">
                                {history.map((h, i) => {
                                    const count = [h.exercise?.completed, h.diet?.completed, h.skinCare?.completed].filter(Boolean).length;
                                    return (
                                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-slate-600 w-28">{h.date}</span>
                                                <div className="flex gap-1">
                                                    <span className={h.exercise?.completed ? "opacity-100" : "opacity-20"}>💪</span>
                                                    <span className={h.diet?.completed ? "opacity-100" : "opacity-20"}>🥗</span>
                                                    <span className={h.skinCare?.completed ? "opacity-100" : "opacity-20"}>✨</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">{count}/3</span>
                                                <span className="text-xs font-semibold text-amber-500">+{h.pointsEarned || 0} pts</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
