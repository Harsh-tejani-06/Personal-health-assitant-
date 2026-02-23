import {
  PieChart,
  Pie,
  ResponsiveContainer
} from "recharts";
import { useState, useEffect } from "react";
import { updateUserProfile } from "../../services/profileService";
import { getActivity, logActivity } from "../../services/activityService";

export default function Dashboard() {
  const [greeting, setGreeting] = useState("Good morning");
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [waterIntake, setWaterIntake] = useState(0);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const activity = await getActivity(today);
        if (activity && activity.water) {
          setWaterIntake(activity.water.amount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      }
    };
    fetchActivity();
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    setCurrentDate(new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const handleNameSave = async () => {
    if (!editedName.trim()) return;
    try {
      await updateUserProfile({ displayName: editedName });
      setUser(prev => ({ ...prev, displayName: editedName }));
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update name:", error);
      alert("Failed to update name");
    }
  };

  // Fetch User Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();

        if (res.ok) {
          setUser({
            fullname: data.fullname || "User",
            displayName: data.displayName || "", // Store displayName
            height: data.healthProfile?.height || 0,
            weight: data.healthProfile?.weight || 0,
            goal: data.healthProfile?.primaryGoal?.replace("_", " ") || "Stay Fit",
            streak: 12,
            avatar: data.avatar ? `http://localhost:5000${data.avatar}` : "/user.png"
          });
          setEditedName(data.displayName || data.fullname || "User");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("http://localhost:5000/api/upload-avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUser((prev) => ({
          ...prev,
          avatar: `http://localhost:5000${data.avatar}`,
        }));
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  if (loading) return <div className="text-center p-10 dark:text-white">Loading Dashboard...</div>;
  if (!user) return <div className="text-center p-10 dark:text-white">User not found</div>;

  const bmi = (user.weight / ((user.height / 100) ** 2)).toFixed(1);
  const bmiStatus = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : bmi < 30 ? "Overweight" : "Obese";
  const bmiColor = bmi < 18.5 ? "#f59e0b" : bmi < 25 ? "#10b981" : bmi < 30 ? "#f97316" : "#ef4444";

  const habitData = [
    { day: "Mon", exercise: 1, diet: 1, skincare: 0, water: 2.5 },
    { day: "Tue", exercise: 1, diet: 0, skincare: 1, water: 3.0 },
    { day: "Wed", exercise: 0, diet: 1, skincare: 1, water: 2.0 },
    { day: "Thu", exercise: 1, diet: 1, skincare: 1, water: 2.8 },
    { day: "Fri", exercise: 0, diet: 1, skincare: 0, water: 1.5 },
    { day: "Sat", exercise: 1, diet: 1, skincare: 1, water: 3.2 },
    { day: "Sun", exercise: 1, diet: 0, skincare: 1, water: 2.6 }
  ];

  const today = {
    Exercise: "Done",
    Diet: "Done",
    SkinCare: "Pending",
    Water: "2.5L"
  };

  const monthlyHabits = {
    "2026-02-01": { exercise: 1, diet: 1, skincare: 1 },
    "2026-02-02": { exercise: 1, diet: 0, skincare: 1 },
    "2026-02-03": { exercise: 0, diet: 0, skincare: 0 },
    "2026-02-04": { exercise: 1, diet: 1, skincare: 1 },
    "2026-02-05": { exercise: 1, diet: 1, skincare: 0 },
    "2026-02-06": { exercise: 0, diet: 0, skincare: 0 },
    "2026-02-07": { exercise: 1, diet: 1, skincare: 1 }
  };

  const weeklyProgress = [
    { name: "Completed", value: 75, color: "#b89cff" },
    { name: "Remaining", value: 25, color: "#e2e8f0" }
  ];

  const longestStreak = calculateLongestStreak(monthlyHabits);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-transparent text-slate-800 dark:text-slate-200 p-4 md:p-6 lg:p-8 relative overflow-hidden transition-colors duration-300">

      {/* Subtle background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#f0f9ff] via-[#f8fafc] to-[#f0fdf4] dark:from-transparent dark:via-transparent dark:to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[#0891b2] dark:text-[#22d3ee] text-sm font-medium">{currentDate}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-[#0891b2] dark:text-[#22d3ee] text-sm font-mono">{currentTime}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white flex items-center gap-2 flex-wrap">
              {greeting},
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="bg-transparent border-b-2 border-[#b89cff] text-[#b89cff] focus:outline-none min-w-[150px] max-w-[250px]"
                    autoFocus
                  />
                  <button onClick={handleNameSave} className="text-green-500 hover:text-green-600 text-xl md:text-2xl" title="Save">✓</button>
                  <button onClick={() => { setIsEditingName(false); setEditedName(user.displayName || user.fullname); }} className="text-red-500 hover:text-red-600 text-xl md:text-2xl" title="Cancel">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <span className="text-[#b89cff]">{user.displayName || user.fullname}</span>! 👋
                  <button
                    onClick={() => { setIsEditingName(true); setEditedName(user.displayName || user.fullname); }}
                    className="text-slate-400 hover:text-[#b89cff] opacity-0 group-hover:opacity-100 transition-opacity text-lg md:text-xl cursor-pointer"
                    title="Edit Name"
                  >
                    ✎
                  </button>
                </div>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-3 h-3 bg-[#10b981] rounded-full animate-pulse" />
            <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">All systems active</span>
          </div>
        </div>

        {/* TOP SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 md:p-8 transition-colors">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <div className="w-26 h-26 rounded-full bg-gradient-to-br from-[#b89cff] to-[#7f2dd0] p-1 relative group cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowPreview(true)}>
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-800"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center text-white text-sm border-4 border-white dark:border-slate-800">
                  ✓
                </div>
              </div>

              <div className="flex-1">
                <p className="text-[#b89cff] text-sm font-medium mb-1">Health Enthusiast</p>
                {/* <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">{user.fullname}</h2> */}
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">{editedName}</h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <LightStatCard title="Height" value={`${user.height} cm`} icon="📏" />
                  <LightStatCard title="Weight" value={`${user.weight} kg`} icon="⚖️" />
                  <LightStatCard title="Goal" value={user.goal} icon="🎯" highlight />
                  <LightStatCard title="BMI" value={bmi} subtitle={bmiStatus} icon="💪" color={bmiColor} />
                </div>
              </div>
            </div>
          </div>

          {/* Streak Card */}
          <div className="bg-gradient-to-br from-[#b89cff] to-[#7f2dd0] rounded-3xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-10 -mt-10 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10 blur-xl" />

            <div className="relative">
              <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">
                Current Streak
              </p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl md:text-7xl font-bold">🔥</span>
                <span className="text-5xl md:text-6xl font-bold text-white">{user.streak}</span>
              </div>
              <p className="text-white/80 text-lg mb-4">Days in a row</p>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
                <p className="text-sm text-white">
                  🎉 Keep it up! You're building great habits consistently.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Activity */}
          <div className="bg-white dark:bg-slate-800/80 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#b89cff]"></span>
                Today's Activity
              </h3>
              <span className="text-xs bg-[#b89cff]/10 text-[#7f2dd0] dark:text-[#c4b5fd] px-3 py-1 rounded-full font-medium border border-[#b89cff]/20">
                {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            </div>

            <div className="space-y-3">
              <LightActivityRow label="Morning Exercise" value={today.Exercise} time="7:00 AM" icon="🏃" />
              <LightActivityRow label="Healthy Diet" value={today.Diet} time="12:30 PM" icon="🥗" />
              <LightActivityRow label="Skin Care Routine" value={today.SkinCare} time="9:00 PM" icon="✨" />
              <LightActivityRow label="Water Intake" value={today.Water} time="Ongoing" icon="💧" />
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#b89cff]/10 to-[#7f2dd0]/5 dark:from-[#b89cff]/20 dark:to-[#7f2dd0]/10 border border-[#b89cff]/20">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Daily Insight</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    You've completed 75% of today's habits. Finish strong with your skincare routine!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                Weekly Habit Tracking
              </h3>
            </div>

            <div className="w-full overflow-x-auto">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 mb-2 min-w-[500px]">
                <div className="col-span-1"></div>
                {habitData.map((d, i) => (
                  <div key={i} className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {d.day}
                  </div>
                ))}
              </div>

              {/* Habit Rows */}
              {['Exercise', 'Diet', 'SkinCare', 'Water'].map((habit) => (
                <div key={habit} className="grid grid-cols-8 gap-2 mb-3 items-center min-w-[500px]">
                  <div className="col-span-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {habit}
                  </div>
                  {habitData.map((dayData, index) => {
                    const key = habit.toLowerCase();
                    let isDone = false;
                    if (key === 'water') {
                      isDone = dayData[key] >= 2.0;
                    } else {
                      isDone = dayData[key] === 1;
                    }
                    return (
                      <div key={index} className="flex justify-center">
                        <div
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                            ${isDone
                              ? 'bg-gradient-to-br from-[#4ade80] to-[#22c55e] shadow-md shadow-green-200 dark:shadow-green-900/30 scale-95'
                              : 'bg-slate-100 dark:bg-slate-700 scale-90 opacity-70'}
                          `}
                          title={`${dayData.day}: ${habit} ${isDone ? 'Completed' : 'Missed'}`}
                        >
                          {isDone ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-500"></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Weekly Summary Section */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4">Weekly Summary</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(() => {
                  const stats = [
                    { name: 'Exercise', key: 'exercise', icon: '🏃' },
                    { name: 'Diet', key: 'diet', icon: '🥗' },
                    { name: 'Skin Care', key: 'skincare', icon: '✨' },
                    { name: 'Water', key: 'water', icon: '💧' }
                  ].map(habit => {
                    const completed = habitData.filter(d => {
                      if (habit.key === 'water') return d[habit.key] >= 2.0;
                      return d[habit.key] === 1;
                    }).length;
                    return { ...habit, completed };
                  });

                  const best = [...stats].sort((a, b) => b.completed - a.completed)[0];
                  // Needs attention: missed > 3 days (so completed < 4)
                  const worst = stats.filter(h => h.completed < 4).sort((a, b) => a.completed - b.completed)[0];

                  return (
                    <>
                      {/* Best Habit */}
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-100 dark:border-green-800 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-800/40 rounded-xl flex items-center justify-center text-2xl">
                          {best.icon}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Best Habit</p>
                          <p className="font-bold text-slate-800 dark:text-white">{best.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{best.completed}/7 days completed</p>
                        </div>
                      </div>

                      {/* Needs Attention */}
                      <div className={`rounded-2xl p-4 border flex items-center gap-4 ${worst ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${worst ? 'bg-red-100 dark:bg-red-800/40' : 'bg-blue-100 dark:bg-blue-800/40'}`}>
                          {worst ? worst.icon : '🌟'}
                        </div>
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-wider ${worst ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {worst ? 'Needs Attention' : 'All Good!'}
                          </p>
                          <p className="font-bold text-slate-800 dark:text-white">{worst ? worst.name : 'On Track'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {worst ? `Missed ${7 - worst.completed} days this week` : 'Keep it up!'}
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <LightQuickStatCard
            title="Weekly Exercise"
            value="5/7 days"
            subtitle="71% consistency"
            icon="🏃"
            color="#b89cff"
            progress={71}
          />

          <LightQuickStatCard
            title="Diet Adherence"
            value="85%"
            subtitle="Great job!"
            icon="🥗"
            color="#10b981"
            progress={85}
          />

          <LightQuickStatCard
            title="Skin Care Routine"
            value="6/7 days"
            subtitle="86% consistency"
            icon="✨"
            color="#38bdf8"
            progress={86}
          />

          <div className="bg-white dark:bg-slate-800/80 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 flex items-center gap-4 transition-colors">
            <div className="w-20 h-20 relative">
              <PieChart width={80} height={80}>
                <Pie
                  data={weeklyProgress}
                  cx={40}
                  cy={40}
                  innerRadius={28}
                  outerRadius={36}
                  paddingAngle={0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {weeklyProgress.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-800 dark:text-white">75%</span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Weekly Goal</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">On Track</p>
              <p className="text-xs text-[#b89cff] font-medium">+5% from last week</p>
            </div>
          </div>
        </div>

        {/* Water Tracker & Streak Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <WaterTracker
            current={waterIntake}
            goal={3}
            onAdd={() => {
              const newValue = Math.min(waterIntake + 0.25, 4);
              setWaterIntake(newValue);
              logActivity(null, "water", false, newValue);
            }}
            onReduce={() => {
              const newValue = Math.max(waterIntake - 0.25, 0);
              setWaterIntake(newValue);
              logActivity(null, "water", false, newValue);
            }}
          />

          <div className="lg:col-span-2 h-full">
            <StreakCalendar
              habits={monthlyHabits}
              currentStreak={user.streak}
              longestStreak={longestStreak}
            />
          </div>
        </div>

        {/* Health Tip */}
        <div className="bg-gradient-to-r from-[#b89cff]/10 via-[#f0f9ff] to-[#b89cff]/10 dark:from-[#b89cff]/20 dark:via-slate-800/50 dark:to-[#b89cff]/20 rounded-2xl p-6 border border-[#b89cff]/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#b89cff] to-[#7f2dd0] rounded-xl flex items-center justify-center text-white text-2xl shrink-0">
              🎯
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 dark:text-white mb-1">Today's Health Focus</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Based on your profile, we recommend focusing on <span className="font-semibold text-[#b89cff]">hydration</span> today.
                Aim for 3 liters of water to support your fitness goals and skin health.
              </p>
            </div>
            <button className="px-4 py-2 bg-[#b89cff] text-white font-medium rounded-lg hover:bg-[#a78bfa] transition-all text-sm whitespace-nowrap shadow-lg shadow-[#b89cff]/25">
              View Plan
            </button>
          </div>
        </div>
      </div>

      {/* Profile Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowPreview(false)}>
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-2 max-w-sm w-full shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/20 hover:bg-black/40 rounded-full text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            <div className="relative aspect-square w-full rounded-2xl overflow-hidden">
              <img
                src={user.avatar}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />

              {/* Edit Button */}
              <label className="absolute bottom-4 right-4 w-12 h-12 bg-[#b89cff] hover:bg-[#a78bfa] text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleImageUpload(e);
                    setShowPreview(false);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Sub-Components ====================

function LightStatCard({ title, value, subtitle, icon, highlight = false, color }) {
  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 ${highlight
      ? 'bg-[#b89cff]/10 border-[#b89cff]/30'
      : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-[#b89cff]/30'
      }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
          {title}
        </p>
      </div>
      <p className={`text-xl font-bold ${highlight ? 'text-[#7f2dd0] dark:text-[#c4b5fd]' : 'text-slate-800 dark:text-white'}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs mt-1" style={{ color: color || '#64748b' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function LightActivityRow({ label, value, time, icon }) {
  const isDone = value === "Done" || value.includes("L");
  const isPending = value === "Pending";

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 hover:border-[#b89cff]/30 transition-all group">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${isDone ? 'bg-[#10b981]/10' : isPending ? 'bg-[#f59e0b]/10' : 'bg-slate-100 dark:bg-slate-600'
          }`}>
          {icon}
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-white text-sm">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{time}</p>
        </div>
      </div>
      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${isDone
        ? 'bg-[#10b981]/10 text-[#059669] dark:text-[#34d399] border border-[#10b981]/20'
        : isPending
          ? 'bg-[#f59e0b]/10 text-[#d97706] dark:text-[#fbbf24] border border-[#f59e0b]/20'
          : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
        {value}
      </span>
    </div>
  );
}

function LightLegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
      {label}
    </div>
  );
}

function LightQuickStatCard({ title, value, subtitle, icon, color, progress }) {
  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          {icon}
        </div>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function WaterTracker({ current, goal, onAdd, onReduce }) {
  const remaining = Math.max(goal - current, 0);
  const data = [
    { name: "Consumed", value: current, color: "#3b82f6" },
    { name: "Remaining", value: remaining, color: "#e2e8f0" },
  ];

  const percent = Math.min((current / goal) * 100, 100);

  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 flex flex-col items-center justify-center relative transition-colors">
      <h3 className="font-bold mb-4 self-start w-full flex justify-between items-center text-slate-800 dark:text-white">
        <span>💧 Water Tracker</span>
        <span className="text-xs font-normal text-slate-400 dark:text-slate-500">Goal: {goal}L</span>
      </h3>

      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-slate-800 dark:text-white">{current}L</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{percent.toFixed(0)}%</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-6 w-full justify-center">
        <button
          onClick={onReduce}
          className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all text-xl font-bold pb-1 cursor-pointer"
          title="Reduce by 0.25L"
        >
          -
        </button>
        <button
          onClick={onAdd}
          className="w-10 h-10 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30 hover:bg-blue-600 hover:scale-105 active:scale-95 flex items-center justify-center transition-all text-xl font-bold pb-1 cursor-pointer"
          title="Add 0.25L"
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ================= STREAK CALENDAR ================= */

function StreakCalendar({ habits, currentStreak, longestStreak }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getColor = (status) => {
    switch (status) {
      case "complete": return "bg-green-500";
      case "partial": return "bg-yellow-400";
      case "missed": return "bg-red-500";
      default: return "bg-slate-100 dark:bg-slate-700";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 h-full flex flex-col transition-colors">
      {/* Header with Title and Streak Stats */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 mb-2">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
          <span className="text-xl">📅</span> Habit Calendar
        </h3>

        <div className="flex gap-2">
          <div className="bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-lg border border-purple-100 dark:border-purple-800 flex flex-col items-center min-w-[100px]">
            <span className="text-[14px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Longest Streak</span>
            <div className="flex items-center gap-1">
              <span className="text-purple-500 text-xs">🏆</span>
              <span className="text-base font-bold text-slate-700 dark:text-white">{longestStreak}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4 mb-3">
        <button
          onClick={prevMonth}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          title="Previous Month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-base font-bold text-slate-700 dark:text-white min-w-[120px] text-center">
          {monthName} {year}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          title="Next Month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`${d}-${i}`} className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 flex-2">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="h-8 w-8" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const status = getHabitStatus(habits[dateStr]);
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

          return (
            <div
              key={day}
              className={`
                 h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300 mx-auto
                 ${getColor(status)} 
                 ${status === 'none' ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600' : 'text-white shadow-sm hover:scale-110 hover:shadow-md'}
                 ${isToday ? 'ring-2 ring-offset-1 ring-[#b89cff] dark:ring-offset-slate-800' : ''}
               `}
              title={status === 'none' ? 'No Data' : `Status: ${status}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 justify-center border-t border-slate-50 dark:border-slate-700 pt-2">
        <Legend color="bg-green-500" label="Done" />
        <Legend color="bg-yellow-400" label="Partial" />
        <Legend color="bg-red-500" label="Missed" />
        <Legend color="bg-slate-100 dark:bg-slate-700" label="Empty" />
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-3 h-3 rounded ${color}`} />
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

// Determine habit completion status for a date
function getHabitStatus(habit) {
  if (!habit) return "none";
  const total = habit.exercise + habit.diet + habit.skincare;
  if (total === 3) return "complete";
  if (total === 0) return "missed";
  return "partial";
}

// Calculate longest streak from habits data
function calculateLongestStreak(habits) {
  const dates = Object.keys(habits).sort();
  let longest = 0;
  let current = 0;

  dates.forEach(date => {
    const status = getHabitStatus(habits[date]);
    if (status === "complete") {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  });

  return longest;
}
