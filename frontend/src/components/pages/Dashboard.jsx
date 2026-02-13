import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [greeting, setGreeting] = useState("Good morning");
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

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

  const user = {
    fullname: "Harsh Tejani(Leader)",
    height: 179,
    weight: 70,
    goal: "Maintain Fitness",
    streak: 12,
    avatar: "/user.png"
  };

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

  const weeklyProgress = [
    { name: "Completed", value: 75, color: "#b89cff" },
    { name: "Remaining", value: 25, color: "#e2e8f0" }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 md:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Subtle background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#f0f9ff] via-[#f8fafc] to-[#f0fdf4] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[#0891b2] text-sm font-medium">{currentDate}</span>
              <span className="text-slate-300">|</span>
              <span className="text-[#0891b2] text-sm font-mono">{currentTime}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
              {greeting}, <span className="text-[#b89cff]">{user.fullname.split(' ')[0]}</span>! 👋
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2 border border-slate-200 shadow-sm">
            <div className="w-3 h-3 bg-[#10b981] rounded-full animate-pulse" />
            <span className="text-slate-600 text-sm font-medium">All systems active</span>
          </div>
        </div>

        {/* TOP SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#b89cff] to-[#7f2dd0] p-1">
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover border-4 border-white"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center text-white text-sm border-4 border-white">
                  ✓
                </div>
              </div>
              
              <div className="flex-1">
                <p className="text-[#b89cff] text-sm font-medium mb-1">Health Enthusiast</p>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">{user.fullname}</h2>
                
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
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#b89cff]"></span>
                Today's Activity
              </h3>
              <span className="text-xs bg-[#b89cff]/10 text-[#7f2dd0] px-3 py-1 rounded-full font-medium border border-[#b89cff]/20">
                {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            </div>
            
            <div className="space-y-3">
              <LightActivityRow label="Morning Exercise" value={today.Exercise} time="7:00 AM" icon="🏃" />
              <LightActivityRow label="Healthy Diet" value={today.Diet} time="12:30 PM" icon="🥗" />
              <LightActivityRow label="Skin Care Routine" value={today.SkinCare} time="9:00 PM" icon="✨" />
              <LightActivityRow label="Water Intake" value={today.Water} time="Ongoing" icon="💧" />
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#b89cff]/10 to-[#7f2dd0]/5 border border-[#b89cff]/20">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-1">Daily Insight</p>
                  <p className="text-xs text-slate-600">
                    You've completed 75% of today's habits. Finish strong with your skincare routine!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                Weekly Habit Tracking
              </h3>
              <div className="flex gap-4">
                <LightLegendItem color="#b89cff" label="Exercise" />
                <LightLegendItem color="#10b981" label="Diet" />
                <LightLegendItem color="#38bdf8" label="Skin Care" />
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={habitData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#94a3b8" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 1]}
                    tickFormatter={(v) => v === 1 ? "✓" : "○"}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100">
                            <p className="font-bold text-slate-800 mb-2">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: {entry.value === 1 ? 'Completed ✓' : 'Missed ○'}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="exercise" fill="#b89cff" name="Exercise" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="diet" fill="#10b981" name="Diet" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="skincare" fill="#38bdf8" name="Skin Care" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
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
          
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 flex items-center gap-4">
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
                <span className="text-lg font-bold text-slate-800">75%</span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Weekly Goal</p>
              <p className="text-2xl font-bold text-slate-800">On Track</p>
              <p className="text-xs text-[#b89cff] font-medium">+5% from last week</p>
            </div>
          </div>
        </div>

        {/* Health Tip */}
        <div className="bg-gradient-to-r from-[#b89cff]/10 via-[#f0f9ff] to-[#b89cff]/10 rounded-2xl p-6 border border-[#b89cff]/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#b89cff] to-[#7f2dd0] rounded-xl flex items-center justify-center text-white text-2xl shrink-0">
              🎯
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 mb-1">Today's Health Focus</h4>
              <p className="text-slate-600 text-sm">
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
    </div>
  );
}

// Light Theme Components (matching sidebar)
function LightStatCard({ title, value, subtitle, icon, highlight = false, color }) {
  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 ${
      highlight 
        ? 'bg-[#b89cff]/10 border-[#b89cff]/30' 
        : 'bg-slate-50 border-slate-200 hover:border-[#b89cff]/30'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">
          {title}
        </p>
      </div>
      <p className={`text-xl font-bold ${highlight ? 'text-[#7f2dd0]' : 'text-slate-800'}`}>
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
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#b89cff]/30 transition-all group">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
          isDone ? 'bg-[#10b981]/10' : isPending ? 'bg-[#f59e0b]/10' : 'bg-slate-100'
        }`}>
          {icon}
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm">{label}</p>
          <p className="text-xs text-slate-500">{time}</p>
        </div>
      </div>
      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
        isDone 
          ? 'bg-[#10b981]/10 text-[#059669] border border-[#10b981]/20' 
          : isPending 
          ? 'bg-[#f59e0b]/10 text-[#d97706] border border-[#f59e0b]/20'
          : 'bg-red-50 text-red-600 border border-red-200'
      }`}>
        {value}
      </span>
    </div>
  );
}

function LightLegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
      {label}
    </div>
  );
}

function LightQuickStatCard({ title, value, subtitle, icon, color, progress }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          {icon}
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}