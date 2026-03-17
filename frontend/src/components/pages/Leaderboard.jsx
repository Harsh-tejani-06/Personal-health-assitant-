import { useState, useEffect, useMemo } from "react";
import { getLeaderboard, getMyPoints } from "../../services/gamificationService";

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [myStats, setMyStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!loading) {
            setTimeout(() => setAnimateIn(true), 100);
        }
    }, [loading]);

    async function loadData() {
        setLoading(true);
        try {
            const [lbData, meData] = await Promise.all([
                getLeaderboard(),
                getMyPoints()
            ]);
            setLeaderboard(lbData.leaderboard || []);
            setMyStats(meData);

            if (meData?.rank && meData.rank <= 3) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 6000);
            }
        } catch (err) {
            console.error("Failed to load leaderboard:", err);
        } finally {
            setLoading(false);
        }
    }

    const topThree = leaderboard.slice(0, 3);
    const maxPoints = leaderboard[0]?.totalPoints || 1;

    if (loading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="max-w-5xl mx-auto px-4 pb-12 relative">
            {showConfetti && <Confetti />}

            {/* ====== Hero Stats Banner ====== */}
            <div
                className={`relative overflow-hidden rounded-3xl mb-8 transition-all duration-700 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
            >
                {/* Gradient background with animated mesh */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500" />
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full blur-[120px] -mr-32 -mt-32 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-rose-400 rounded-full blur-[100px] -ml-20 -mb-20" />
                    <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
                </div>

                {/* Floating decorations */}
                <div className="absolute top-6 right-8 text-5xl opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>🏆</div>
                <div className="absolute bottom-4 right-24 text-3xl opacity-15 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>⭐</div>
                <div className="absolute top-12 right-40 text-2xl opacity-10 animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }}>🔥</div>

                <div className="relative p-8 text-white">
                    <div className="flex items-start gap-5">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl shadow-xl border border-white/20">
                            🏆
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Leaderboard</h1>
                            <p className="text-white/70 text-sm font-medium">Compete • Achieve • Inspire</p>
                        </div>
                    </div>

                    {myStats && (
                        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard
                                label="Your Rank"
                                value={`#${myStats.rank}`}
                                icon={myStats.rank <= 3 ? ['🥇', '🥈', '🥉'][myStats.rank - 1] : '📊'}
                                highlight={myStats.rank <= 3}
                            />
                            <StatCard
                                label="Total Points"
                                value={myStats.totalPoints?.toLocaleString()}
                                icon="💎"
                            />
                            <StatCard
                                label="Current Streak"
                                value={`${myStats.currentStreak}d`}
                                icon="🔥"
                            />
                            <StatCard
                                label="Best Streak"
                                value={`${myStats.longestStreak || myStats.currentStreak}d`}
                                icon="⚡"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ====== Top 3 Podium ====== */}
            {topThree.length > 0 && (
                <div
                    className={`mb-10 transition-all duration-700 delay-200 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white text-sm">👑</div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Champions</h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent dark:from-amber-500/20" />
                    </div>

                    <div className="flex items-end justify-center gap-3 sm:gap-5 px-4">
                        {/* 2nd Place */}
                        {topThree[1] && (
                            <PodiumCard
                                user={topThree[1]}
                                rank={2}
                                podiumHeight="h-32"
                                gradientFrom="from-slate-300"
                                gradientTo="to-slate-400"
                                darkGradientFrom="dark:from-slate-500"
                                darkGradientTo="dark:to-slate-600"
                                emoji="🥈"
                                delay="0.3s"
                                ringColor="ring-slate-300 dark:ring-slate-500"
                                bgAccent="bg-slate-100 dark:bg-slate-700"
                                maxPoints={maxPoints}
                            />
                        )}

                        {/* 1st Place */}
                        {topThree[0] && (
                            <PodiumCard
                                user={topThree[0]}
                                rank={1}
                                podiumHeight="h-44"
                                gradientFrom="from-amber-300"
                                gradientTo="to-yellow-500"
                                darkGradientFrom="dark:from-amber-500"
                                darkGradientTo="dark:to-yellow-600"
                                emoji="🥇"
                                delay="0s"
                                isFirst
                                ringColor="ring-amber-300 dark:ring-amber-500"
                                bgAccent="bg-amber-50 dark:bg-amber-900/20"
                                maxPoints={maxPoints}
                            />
                        )}

                        {/* 3rd Place */}
                        {topThree[2] && (
                            <PodiumCard
                                user={topThree[2]}
                                rank={3}
                                podiumHeight="h-24"
                                gradientFrom="from-orange-300"
                                gradientTo="to-amber-500"
                                darkGradientFrom="dark:from-orange-500"
                                darkGradientTo="dark:to-amber-600"
                                emoji="🥉"
                                delay="0.5s"
                                ringColor="ring-orange-300 dark:ring-orange-500"
                                bgAccent="bg-orange-50 dark:bg-orange-900/20"
                                maxPoints={maxPoints}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* ====== Full Rankings ====== */}
            <div
                className={`transition-all duration-700 delay-400 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white text-sm">📋</div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Full Rankings</h2>
                    <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                        {leaderboard.length} Players
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent dark:from-blue-500/20" />
                </div>

                <div className="bg-white dark:bg-slate-800/80 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden backdrop-blur-sm">
                    {/* Table Header */}
                    <div className="grid grid-cols-[60px_1fr_100px_100px_80px] px-6 py-3 bg-slate-50/80 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <span>Rank</span>
                        <span>Player</span>
                        <span className="text-center">Points</span>
                        <span className="text-center">Streak</span>
                        <span className="text-center">Progress</span>
                    </div>

                    <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                        {leaderboard.length === 0 ? (
                            <EmptyState />
                        ) : (
                            leaderboard.map((user, i) => (
                                <LeaderboardRow
                                    key={user._id || i}
                                    user={user}
                                    index={i}
                                    isCurrentUser={user.isCurrentUser}
                                    maxPoints={maxPoints}
                                    animateIn={animateIn}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ====== Motivational Footer ====== */}
            <div
                className={`mt-8 transition-all duration-700 delay-500 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
            >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white text-center shadow-xl shadow-purple-200/30 dark:shadow-none">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full blur-[60px]" />
                        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-white rounded-full blur-[40px]" />
                    </div>
                    <div className="relative">
                        <p className="text-2xl mb-2">
                            {myStats?.rank <= 3 ? '🎉' : '🎯'}
                        </p>
                        <p className="text-lg font-bold mb-1">
                            {myStats?.rank <= 3
                                ? "You're on the podium! Incredible work!"
                                : "Keep pushing forward!"}
                        </p>
                        <p className="text-sm text-white/80">
                            {myStats?.rank > 3
                                ? `You're ${myStats.rank - 3} position${myStats.rank - 3 > 1 ? 's' : ''} away from the podium. Stay consistent!`
                                : "Maintain your streak and inspire others on this journey."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Inline styles for custom animations */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes podiumRise {
                    0% { transform: scaleY(0); opacity: 0; }
                    60% { transform: scaleY(1.05); }
                    100% { transform: scaleY(1); opacity: 1; }
                }
                @keyframes glowPulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.3); }
                    50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.6); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
                .animate-podium-rise {
                    animation: podiumRise 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    transform-origin: bottom;
                }
                .animate-glow-pulse {
                    animation: glowPulse 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}

// ====== Stat Card (Hero Section) ======
function StatCard({ label, value, icon, highlight }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-4 backdrop-blur-md border transition-transform hover:scale-105 ${highlight
            ? 'bg-white/25 border-white/30 shadow-lg'
            : 'bg-white/15 border-white/20'
            }`}>
            {highlight && (
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
            )}
            <div className="relative">
                <span className="text-2xl mb-1 block">{icon}</span>
                <p className="text-2xl font-extrabold">{value}</p>
                <p className="text-[10px] uppercase tracking-widest text-white/60 mt-1 font-semibold">{label}</p>
            </div>
        </div>
    );
}

// ====== Podium Card ======
function PodiumCard({ user, rank, podiumHeight, gradientFrom, gradientTo, darkGradientFrom, darkGradientTo, emoji, delay, isFirst, ringColor, bgAccent }) {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 200);
        return () => clearTimeout(timer);
    }, []);



    return (
        <div
            className={`relative flex flex-col items-center transition-all duration-700 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}
            style={{ transitionDelay: delay, flex: isFirst ? '1.2' : '1', maxWidth: isFirst ? '180px' : '150px' }}
        >
            {/* Crown for first place */}
            {isFirst && (
                <div className="absolute -top-10 z-10">
                    <span className="text-4xl block animate-bounce" style={{ animationDuration: '2s' }}>👑</span>
                </div>
            )}

            {/* User Card */}
            <div className={`relative w-full mb-0 z-10 ${isFirst ? 'animate-glow-pulse' : ''}`}>
                <div className={`${bgAccent} rounded-2xl p-4 text-center shadow-xl border border-white/50 dark:border-slate-600 transform transition-all duration-300 hover:scale-105 cursor-pointer`}>
                    {/* Avatar */}
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} ${darkGradientFrom} ${darkGradientTo} flex items-center justify-center text-2xl font-bold text-white ring-4 ${ringColor} shadow-lg ${isFirst ? 'w-20 h-20 text-3xl' : ''}`}>
                        {user.fullname?.charAt(0)?.toUpperCase()}
                    </div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm truncate mb-1">{user.fullname}</p>
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{user.totalPoints}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">pts</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>🔥</span>
                        <span>{user.currentStreak}d streak</span>
                    </div>
                </div>

                {/* Rank Badge */}
                <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg bg-white dark:bg-slate-800 border-2 ${ringColor} z-20`}>
                    {emoji}
                </div>
            </div>

            {/* Podium Base */}
            <div
                className={`w-full ${podiumHeight} bg-gradient-to-b ${gradientFrom} ${gradientTo} ${darkGradientFrom} ${darkGradientTo} rounded-t-2xl mt-4 ${animate ? 'animate-podium-rise' : 'scale-y-0 opacity-0'}`}
                style={{ animationDelay: delay }}
            >
                <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl font-black text-white/20">{rank}</span>
                </div>
            </div>
        </div>
    );
}

// ====== Leaderboard Row ======
function LeaderboardRow({ user, index, isCurrentUser, maxPoints, animateIn }) {
    const pointsPercent = maxPoints > 0 ? Math.round((user.totalPoints / maxPoints) * 100) : 0;

    const rankColors = {
        1: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white',
        2: 'bg-gradient-to-r from-slate-300 to-slate-400 text-white',
        3: 'bg-gradient-to-r from-orange-300 to-amber-500 text-white',
    };

    const avatarColors = [
        'from-blue-400 to-indigo-500',
        'from-emerald-400 to-teal-500',
        'from-purple-400 to-violet-500',
        'from-pink-400 to-rose-500',
        'from-cyan-400 to-blue-500',
        'from-orange-400 to-red-500',
    ];

    return (
        <div
            className={`grid grid-cols-[60px_1fr_100px_100px_80px] items-center px-6 py-4 transition-all duration-300 hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent dark:hover:from-slate-700/30 group ${isCurrentUser ? 'bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20 ring-1 ring-inset ring-blue-200 dark:ring-blue-800' : ''
                }`}
            style={{
                transitionDelay: `${index * 50}ms`,
                opacity: animateIn ? 1 : 0,
                transform: animateIn ? 'translateX(0)' : 'translateX(-20px)',
                transition: `all 0.4s ease ${index * 50}ms`
            }}
        >
            {/* Rank */}
            <div className="flex justify-center">
                {user.rank <= 3 ? (
                    <div className={`w-8 h-8 rounded-full ${rankColors[user.rank]} flex items-center justify-center text-xs font-bold shadow-md`}>
                        {user.rank}
                    </div>
                ) : (
                    <span className="text-sm font-bold text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                        #{user.rank}
                    </span>
                )}
            </div>

            {/* Player */}
            <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[index % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm ring-2 ring-white dark:ring-slate-800 shadow-md shrink-0 group-hover:scale-110 transition-transform`}>
                    {user.fullname?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2 truncate">
                        {user.fullname}
                        {isCurrentUser && (
                            <span className="text-[10px] bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm shrink-0">
                                YOU
                            </span>
                        )}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Best: {user.longestStreak || 0}d streak
                    </p>
                </div>
            </div>

            {/* Points */}
            <div className="text-center">
                <p className="font-bold text-amber-500 dark:text-amber-400 text-sm">{user.totalPoints?.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">pts</p>
            </div>

            {/* Streak */}
            <div className="text-center">
                <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm flex items-center justify-center gap-1">
                    <span className="text-xs">🔥</span> {user.currentStreak}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">days</p>
            </div>

            {/* Progress Bar */}
            <div className="flex justify-center">
                <div className="w-full max-w-[60px]">
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${pointsPercent}%`, transitionDelay: `${index * 100 + 500}ms` }}
                        />
                    </div>
                    <p className="text-[9px] text-slate-400 text-center mt-1 font-medium">{pointsPercent}%</p>
                </div>
            </div>
        </div>
    );
}

// ====== Empty State ======
function EmptyState() {
    return (
        <div className="text-center py-16 px-6">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <span className="text-5xl">🏃</span>
            </div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg mb-2">No rankings yet</h3>
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mx-auto">
                Start tracking your activities to earn points and climb the leaderboard!
            </p>
        </div>
    );
}

// ====== Loading Skeleton ======
function LoadingSkeleton() {
    return (
        <div className="max-w-5xl mx-auto px-4 pb-8">
            {/* Hero Skeleton */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 p-8 mb-8 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl" />
                    <div>
                        <div className="w-40 h-7 bg-white/20 rounded-lg mb-2" />
                        <div className="w-28 h-4 bg-white/15 rounded-lg" />
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white/15 rounded-2xl p-4 h-24" />
                    ))}
                </div>
            </div>

            {/* Podium Skeleton */}
            <div className="flex items-end justify-center gap-5 mb-10">
                {[140, 200, 110].map((h, i) => (
                    <div key={i} className="flex flex-col items-center" style={{ maxWidth: '150px', flex: 1 }}>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-2xl p-4 mb-2">
                            <div className="w-16 h-16 mx-auto bg-slate-300 dark:bg-slate-600 rounded-full mb-3" />
                            <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded mx-auto w-20 mb-2" />
                            <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded mx-auto w-12" />
                        </div>
                        <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-t-2xl`} style={{ height: `${h}px` }} />
                    </div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg overflow-hidden border border-slate-100 dark:border-slate-700">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center px-6 py-4 border-b border-slate-50 dark:border-slate-700/50 gap-4">
                        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        <div className="flex-1">
                            <div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
                            <div className="w-20 h-3 bg-slate-100 dark:bg-slate-700/50 rounded" />
                        </div>
                        <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
}

// ====== Confetti ======
function Confetti() {
    /* eslint-disable react-hooks/purity */
    const particles = useMemo(() => {
        const colors = ['#fbbf24', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
        const shapes = ['circle', 'square', 'triangle'];
        return [...Array(60)].map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: `${Math.random() * 4}s`,
            duration: `${Math.random() * 3 + 2}s`,
            rotation: `${Math.random() * 360}deg`,
            shape: shapes[Math.floor(Math.random() * shapes.length)],
        }));
    }, []);
    /* eslint-enable react-hooks/purity */

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute animate-confetti"
                    style={{
                        left: p.left,
                        top: '-10px',
                        width: p.width,
                        height: p.height,
                        backgroundColor: p.color,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                        transform: `rotate(${p.rotation})`,
                        borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'triangle' ? '0' : '2px',
                    }}
                />
            ))}

            <style>{`
                @keyframes confetti {
                    0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
                    50% { opacity: 0.8; }
                    100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; }
                }
                .animate-confetti {
                    animation: confetti linear forwards;
                }
            `}</style>
        </div>
    );
}