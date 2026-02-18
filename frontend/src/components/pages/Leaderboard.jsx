import { useState, useEffect } from "react";
import { getLeaderboard, getMyPoints } from "../../services/gamificationService";

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [myStats, setMyStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [lbData, meData] = await Promise.all([
                getLeaderboard(),
                getMyPoints()
            ]);
            setLeaderboard(lbData.leaderboard || []);
            setMyStats(meData);
            
            // Trigger confetti if user is in top 3
            if (meData?.rank && meData.rank <= 3) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
            }
        } catch (err) {
            console.error("Failed to load leaderboard:", err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-orange-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
                </div>
                <p className="text-slate-400 mt-4 font-medium">Loading champions...</p>
            </div>
        );
    }

    const topThree = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <div className="max-w-4xl mx-auto px-4 pb-8">
            {/* Confetti Effect */}
            {showConfetti && <Confetti />}

            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-8 mb-8 text-white shadow-2xl shadow-orange-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -ml-10 -mb-10" />
                
                <div className="relative flex items-center gap-5">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl shadow-lg animate-bounce">
                        🏆
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Leaderboard</h1>
                        <p className="text-white/80 text-sm font-medium">Compete • Achieve • Inspire</p>
                    </div>
                </div>

                {/* Stats Row */}
                {myStats && (
                    <div className="relative mt-6 pt-6 border-t border-white/20 flex items-center gap-8">
                        <div>
                            <p className="text-3xl font-bold">{myStats.totalPoints}</p>
                            <p className="text-xs text-white/70 uppercase tracking-wider">Your Points</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold flex items-center gap-1">
                                🔥 {myStats.currentStreak}
                            </p>
                            <p className="text-xs text-white/70 uppercase tracking-wider">Day Streak</p>
                        </div>
                        <div className="ml-auto">
                            <div className={`px-4 py-2 rounded-xl font-bold text-lg ${
                                myStats.rank === 1 ? 'bg-amber-300 text-amber-900' :
                                myStats.rank === 2 ? 'bg-slate-300 text-slate-800' :
                                myStats.rank === 3 ? 'bg-orange-300 text-orange-900' :
                                'bg-white/20 text-white'
                            }`}>
                                #{myStats.rank}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Top 3 Podium */}
            {topThree.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-end justify-center gap-4 mb-6">
                        {/* 2nd Place */}
                        {topThree[1] && (
                            <PodiumCard 
                                user={topThree[1]} 
                                rank={2} 
                                height="h-48"
                                color="from-slate-300 to-slate-400"
                                emoji="🥈"
                                delay="0.2s"
                            />
                        )}
                        
                        {/* 1st Place */}
                        {topThree[0] && (
                            <PodiumCard 
                                user={topThree[0]} 
                                rank={1} 
                                height="h-64"
                                color="from-amber-300 via-amber-400 to-yellow-500"
                                emoji="🥇"
                                delay="0s"
                                isFirst
                            />
                        )}
                        
                        {/* 3rd Place */}
                        {topThree[2] && (
                            <PodiumCard 
                                user={topThree[2]} 
                                rank={3} 
                                height="h-40"
                                color="from-orange-300 to-amber-600"
                                emoji="🥉"
                                delay="0.4s"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Rest of Leaderboard */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full" />
                        Rankings
                    </h3>
                </div>

                <div className="divide-y divide-slate-100">
                    {rest.length === 0 && leaderboard.length === 0 ? (
                        <EmptyState />
                    ) : (
                        rest.map((user, i) => (
                            <LeaderboardRow 
                                key={user._id || i} 
                                user={user} 
                                isCurrentUser={user.isCurrentUser}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Motivation Card */}
            <div className="mt-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white text-center">
                <p className="text-lg font-medium mb-2">🎯 Keep pushing forward!</p>
                <p className="text-sm text-white/80">
                    {myStats?.rank > 3 
                        ? `You're ${myStats.rank - 3} positions away from the podium. Stay consistent!`
                        : "You're in the top 3! Amazing work!"}
                </p>
            </div>
        </div>
    );
}

// Podium Card Component
function PodiumCard({ user, rank, height, color, emoji, delay, isFirst }) {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div 
            className={`relative flex flex-col items-center transition-all duration-700 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{ transitionDelay: delay }}
        >
            {/* Crown for first place */}
            {isFirst && (
                <div className="absolute -top-8 animate-bounce">
                    <span className="text-4xl">👑</span>
                </div>
            )}

            {/* User Card */}
            <div className={`relative w-28 ${isFirst ? 'w-32' : 'w-28'} mb-3`}>
                <div className={`bg-gradient-to-br ${color} rounded-2xl p-3 text-center shadow-xl transform transition-transform hover:scale-105 cursor-pointer`}>
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white border-4 border-white/50">
                        {user.fullname?.charAt(0)}
                    </div>
                    <p className="font-bold text-white text-sm truncate">{user.fullname}</p>
                    <p className="text-white/80 text-xs">{user.totalPoints} pts</p>
                </div>
                
                {/* Rank Badge */}
                <div className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-2xl shadow-lg ${isFirst ? 'bg-amber-400 animate-pulse' : 'bg-white'}`}>
                    {emoji}
                </div>
            </div>

            {/* Podium Base */}
            <div className={`w-full ${height} bg-gradient-to-b ${color} rounded-t-2xl opacity-30`} />
        </div>
    );
}

// Leaderboard Row Component
function LeaderboardRow({ user, isCurrentUser }) {
    return (
        <div className={`flex items-center px-6 py-4 transition-all hover:bg-slate-50 ${isCurrentUser ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-200' : ''}`}>
            <div className="w-12 text-center">
                <span className="text-sm font-bold text-slate-400">#{user.rank}</span>
            </div>
            
            <div className="flex items-center gap-3 flex-1 ml-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                    {user.fullname?.charAt(0)}
                </div>
                <div>
                    <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                        {user.fullname}
                        {isCurrentUser && (
                            <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">YOU</span>
                        )}
                    </p>
                    <p className="text-xs text-slate-400">Best: {user.longestStreak}d streak</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="text-center min-w-[60px]">
                    <p className="font-bold text-amber-500">{user.totalPoints}</p>
                    <p className="text-[10px] text-slate-400 uppercase">pts</p>
                </div>
                <div className="text-center min-w-[60px]">
                    <p className="font-medium text-slate-700">🔥 {user.currentStreak}</p>
                    <p className="text-[10px] text-slate-400 uppercase">streak</p>
                </div>
            </div>
        </div>
    );
}

// Empty State
function EmptyState() {
    return (
        <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🏃</span>
            </div>
            <h3 className="font-bold text-slate-700 mb-2">No rankings yet</h3>
            <p className="text-slate-400 text-sm">Start tracking your activities to earn points and climb the leaderboard!</p>
        </div>
    );
}

// Confetti Effect Component
function Confetti() {
    const colors = ['#fbbf24', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];
    
    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(50)].map((_, i) => (
                <div
                    key={i}
                    className="absolute animate-confetti"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: '-10px',
                        width: `${Math.random() * 10 + 5}px`,
                        height: `${Math.random() * 10 + 5}px`,
                        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${Math.random() * 3 + 2}s`,
                        transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                />
            ))}
            
            <style>{`
                @keyframes confetti {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .animate-confetti {
                    animation: confetti linear forwards;
                }
            `}</style>
        </div>
    );
}