import { useState, useEffect } from "react";
import {
  getExercisePlan,
  generateExercisePlan,
  logExerciseTask,
  getExerciseLog,
  getExerciseCalendar,
  getNextDaySuggestions,
} from "../../services/exerciseService";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatDateShort(d) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PRIORITY_COLORS = {
  high: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  medium: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  low: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function Exercise() {
  const [view, setView] = useState("loading"); // loading | generate | routine | calendar
  const [plan, setPlan] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Routine state
  const [routineDate, setRoutineDate] = useState(getTodayDate());
  const [morningChecks, setMorningChecks] = useState([]);
  const [nightChecks, setNightChecks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Calendar state
  const [calendarLogs, setCalendarLogs] = useState([]);
  const [calendarMeta, setCalendarMeta] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedCalDay, setSelectedCalDay] = useState(null);
  const [calDayMorning, setCalDayMorning] = useState([]);
  const [calDayNight, setCalDayNight] = useState([]);
  const [calDaySaving, setCalDaySaving] = useState(false);

  // Next-day suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [motivation, setMotivation] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // ---- Load initial data ----
  useEffect(() => {
    loadPlan();
  }, []);

  async function loadPlan() {
    try {
      const data = await getExercisePlan();
      if (data.exists) {
        setPlan(data.plan);
        await loadDayLog(getTodayDate(), data.plan);
        setView("routine");
      } else {
        setView("generate");
      }
    } catch {
      setView("generate");
    }
  }

  async function loadDayLog(date, planData) {
    const p = planData || plan;
    try {
      const log = await getExerciseLog(date);
      const mc = log.morningCompleted?.length
        ? log.morningCompleted
        : new Array(p?.morning?.length || 0).fill(false);
      const nc = log.nightCompleted?.length
        ? log.nightCompleted
        : new Array(p?.night?.length || 0).fill(false);
      setMorningChecks(mc);
      setNightChecks(nc);
      setRoutineDate(date);
    } catch {
      setMorningChecks(new Array(p?.morning?.length || 0).fill(false));
      setNightChecks(new Array(p?.night?.length || 0).fill(false));
      setRoutineDate(date);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const data = await generateExercisePlan();
      if (data.success) {
        setPlan(data.plan);
        const mc = new Array(data.plan.morning?.length || 0).fill(false);
        const nc = new Array(data.plan.night?.length || 0).fill(false);
        setMorningChecks(mc);
        setNightChecks(nc);
        setRoutineDate(getTodayDate());
        setView("routine");
        showToast("🏋️ Your exercise plan is ready!");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Failed to generate plan. Please try again.";
      showToast(msg);
    } finally {
      setGenerating(false);
    }
  }

  // ---- Daily logging ----
  async function handleCheck(period, index) {
    const newMorning = [...morningChecks];
    const newNight = [...nightChecks];
    if (period === "morning") newMorning[index] = !newMorning[index];
    else newNight[index] = !newNight[index];
    setMorningChecks(newMorning);
    setNightChecks(newNight);

    setSaving(true);
    try {
      await logExerciseTask(routineDate, newMorning, newNight);
    } catch {
      showToast("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // ---- Calendar ----
  async function openCalendar() {
    setView("calendar");
    try {
      const data = await getExerciseCalendar();
      setCalendarLogs(data.logs || []);
      setCalendarMeta(data.plan);
    } catch {
      setCalendarLogs([]);
    }
  }

  function getLogForDate(date) {
    return calendarLogs.find((l) => l.date === date);
  }
  function getDayStatus(date) {
    const log = getLogForDate(date);
    if (!log) return "none";
    const allM = log.morningCompleted || [];
    const allN = log.nightCompleted || [];
    const total = allM.length + allN.length;
    if (total === 0) return "none";
    const done = allM.filter(Boolean).length + allN.filter(Boolean).length;
    if (done === total) return "complete";
    if (done > 0) return "partial";
    return "none";
  }

  async function selectCalendarDay(dateStr) {
    setSelectedCalDay(dateStr);
    try {
      const log = await getExerciseLog(dateStr);
      setCalDayMorning(
        log.morningCompleted?.length
          ? [...log.morningCompleted]
          : new Array(plan?.morning?.length || 0).fill(false)
      );
      setCalDayNight(
        log.nightCompleted?.length
          ? [...log.nightCompleted]
          : new Array(plan?.night?.length || 0).fill(false)
      );
    } catch {
      setCalDayMorning(new Array(plan?.morning?.length || 0).fill(false));
      setCalDayNight(new Array(plan?.night?.length || 0).fill(false));
    }
  }

  async function handleCalDayCheck(period, index) {
    const newM = [...calDayMorning];
    const newN = [...calDayNight];
    if (period === "morning") newM[index] = !newM[index];
    else newN[index] = !newN[index];
    setCalDayMorning(newM);
    setCalDayNight(newN);

    setCalDaySaving(true);
    try {
      await logExerciseTask(selectedCalDay, newM, newN);
      setCalendarLogs((prev) => {
        const idx = prev.findIndex((l) => l.date === selectedCalDay);
        const entry = {
          date: selectedCalDay,
          morningCompleted: newM,
          nightCompleted: newN,
          notes: "",
        };
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = entry;
          return copy;
        }
        return [...prev, entry];
      });
    } catch {
      showToast("Failed to save");
    } finally {
      setCalDaySaving(false);
    }
  }

  // Day navigation
  function goToDay(offset) {
    const d = new Date(routineDate + "T00:00:00");
    d.setDate(d.getDate() + offset);
    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (newDate > getTodayDate()) return;
    loadDayLog(newDate);
  }

  // Next-day suggestions
  async function handleNextDaySuggestions() {
    setShowSuggestions(true);
    setLoadingSuggestions(true);
    try {
      const data = await getNextDaySuggestions();
      setSuggestions(data.suggestions || []);
      setMotivation(data.motivation || "Keep going! 💪");
    } catch {
      showToast("Failed to load suggestions");
      setSuggestions([]);
      setMotivation("Keep working towards your goals! 💪");
    } finally {
      setLoadingSuggestions(false);
    }
  }

  // Calendar grid
  function getCalendarDays() {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push(dateStr);
    }
    return days;
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const mornDone = morningChecks.filter(Boolean).length;
  const nightDone = nightChecks.filter(Boolean).length;
  const totalSteps =
    (plan?.morning?.length || 0) + (plan?.night?.length || 0);
  const totalDone = mornDone + nightDone;
  const progress = totalSteps > 0 ? Math.round((totalDone / totalSteps) * 100) : 0;

  const totalCalBurned = [
    ...(plan?.morning || []),
    ...(plan?.night || []),
  ].reduce((sum, ex, i) => {
    const checks = i < (plan?.morning?.length || 0) ? morningChecks : nightChecks;
    const idx = i < (plan?.morning?.length || 0) ? i : i - (plan?.morning?.length || 0);
    if (checks[idx]) return sum + (parseInt(ex.caloriesBurned) || 0);
    return sum;
  }, 0);

  // YouTube link builder
  function youtubeLink(query) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }

  // ============================================================
  // RENDER: LOADING
  // ============================================================
  if (view === "loading")
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-10 h-10 border-[3px] border-blue-200 dark:border-blue-800 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
          Loading your exercise plan...
        </p>
      </div>
    );

  // ============================================================
  // RENDER: GENERATE PLAN
  // ============================================================
  if (view === "generate")
    return (
      <div className="max-w-4xl mx-auto pb-20">
        {toast && (
          <div className="fixed top-24 right-6 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-2 animate-bounce">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {toast}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl">
                🏋️
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">
                  Your AI Exercise Plan
                </h1>
                <p className="text-white/80 text-sm font-medium mt-1">
                  Generate a personalized exercise plan based on your health
                  profile, diet, and activity history
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Card */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-lg">✨</span> What You'll Get
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: "☀️",
                title: "Morning Routine",
                desc: "6-8 exercises to kickstart your day with energy",
              },
              {
                icon: "🌙",
                title: "Night Routine",
                desc: "4-6 lighter exercises and stretches for recovery",
              },
              {
                icon: "🎯",
                title: "Goal-Based",
                desc: "Exercises tailored to your weight loss/gain goals",
              },
              {
                icon: "📺",
                title: "Video Guides",
                desc: "YouTube links for every exercise to follow along",
              },
              {
                icon: "📊",
                title: "Daily Tracking",
                desc: "Track your progress with checkboxes and calendar",
              },
              {
                icon: "🤖",
                title: "Smart Suggestions",
                desc: "AI suggests next-day exercises based on your activity",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600"
              >
                <span className="text-2xl shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {f.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all cursor-pointer ${generating
            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]"
            }`}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              AI is generating your plan...
            </span>
          ) : (
            "🏋️ Generate My Exercise Plan"
          )}
        </button>
      </div>
    );

  // ============================================================
  // RENDER: CALENDAR VIEW
  // ============================================================
  if (view === "calendar") {
    const calDays = getCalendarDays();
    const today = getTodayDate();
    return (
      <div className="max-w-4xl mx-auto pb-4">
        {toast && (
          <div className="fixed top-24 right-6 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-2 animate-bounce">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {toast}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              setSelectedCalDay(null);
              setView("routine");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 transition-all"
          >
            ← Back to Routine
          </button>
          <h1 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            📅 Exercise Calendar
          </h1>
        </div>

        {/* Month Navigation + Calendar */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() =>
                setCalendarMonth((p) => {
                  let m = p.month - 1,
                    y = p.year;
                  if (m < 0) {
                    m = 11;
                    y--;
                  }
                  return { year: y, month: m };
                })
              }
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-500 transition-all font-bold px-0"
            >
              ‹
            </button>
            <h2 className="text-lg font-black text-slate-800 dark:text-white">
              {monthNames[calendarMonth.month]} {calendarMonth.year}
            </h2>
            <button
              onClick={() =>
                setCalendarMonth((p) => {
                  let m = p.month + 1,
                    y = p.year;
                  if (m > 11) {
                    m = 0;
                    y++;
                  }
                  return { year: y, month: m };
                })
              }
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-500 transition-all font-bold px-0"
            >
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-2">
            {calDays.map((dateStr, i) => {
              if (!dateStr) return <div key={`e-${i}`} />;
              const dayNum = parseInt(dateStr.split("-")[2]);
              const status = getDayStatus(dateStr);
              const isToday = dateStr === today;
              const isFuture = dateStr > today;
              const isSelected = selectedCalDay === dateStr;
              return (
                <button
                  key={dateStr}
                  disabled={isFuture}
                  onClick={() => !isFuture && selectCalendarDay(dateStr)}
                  className={`py-2.5 sm:py-3 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all px-0
                    ${isFuture ? "opacity-30 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}
                    ${isSelected ? "ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-slate-800" : ""}
                    ${isToday ? "border-2 border-blue-400 dark:border-blue-500" : "border border-slate-100 dark:border-slate-700"}
                    ${status === "complete"
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                      : status === "partial"
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                        : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400"
                    }`}
                >
                  <span>{dayNum}</span>
                  <span className="text-[9px] mt-0.5 leading-none">
                    {status === "complete"
                      ? "✅"
                      : status === "partial"
                        ? "🟡"
                        : isFuture
                          ? ""
                          : "—"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              ✅ Complete
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              🟡 Partial
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              — Not done
            </span>
          </div>
        </div>

        {/* Selected Day Detail — Modal Overlay */}
        {selectedCalDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCalDay(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden w-[90%] max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base">
                      {selectedCalDay === today
                        ? "Today"
                        : formatDateShort(selectedCalDay)}
                    </h3>
                    <p className="text-white/80 text-[11px] font-medium">
                      {selectedCalDay} • Click checkboxes to update
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCalDay(null)}
                    className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-all px-0 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  {
                    label: "Morning Workout ☀️",
                    steps: plan?.morning || [],
                    checks: calDayMorning,
                    period: "morning",
                  },
                  {
                    label: "Night Workout 🌙",
                    steps: plan?.night || [],
                    checks: calDayNight,
                    period: "night",
                  },
                ].map((section) => (
                  <div key={section.period}>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {section.label}
                    </h4>
                    {section.steps.map((step, i) => (
                      <label
                        key={i}
                        className={`flex items-center gap-2 p-2.5 rounded-xl mb-1 cursor-pointer transition-all ${section.checks[i]
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={section.checks[i] || false}
                          onChange={() =>
                            handleCalDayCheck(section.period, i)
                          }
                          className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-semibold ${section.checks[i]
                              ? "text-emerald-700 dark:text-emerald-300 line-through"
                              : "text-slate-700 dark:text-slate-300"
                              }`}
                          >
                            {step.name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {step.instruction}
                          </p>
                        </div>
                        {step.youtubeQuery && (
                          <a
                            href={youtubeLink(step.youtubeQuery)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-red-500 hover:text-red-600 shrink-0"
                            title="Watch on YouTube"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                          </a>
                        )}
                      </label>
                    ))}
                  </div>
                ))}
                {calDaySaving && (
                  <p className="text-center text-xs text-blue-500 font-medium animate-pulse">
                    Saving...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // RENDER: DAILY ROUTINE VIEW
  // ============================================================
  return (
    <div className="max-w-4xl mx-auto pb-20">
      {toast && (
        <div className="fixed top-24 right-6 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-2 animate-bounce">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {toast}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl">
                🏋️
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">
                  My Exercise Plan
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/80 text-xs font-medium">
                    {routineDate === getTodayDate()
                      ? "Today"
                      : formatDateShort(routineDate)}
                  </span>
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-lg">
                    Follow for {plan?.followFor || "—"}
                  </span>
                  {plan?.basedOnGoal && (
                    <>
                      <span className="w-1 h-1 bg-white/40 rounded-full" />
                      <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-lg capitalize">
                        🎯 {plan.basedOnGoal.replace("_", " ")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => goToDay(-1)}
                className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all px-0 font-bold"
              >
                ‹
              </button>
              <button
                onClick={() => goToDay(1)}
                disabled={routineDate >= getTodayDate()}
                className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all px-0 font-bold disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ›
              </button>
              <button
                onClick={openCalendar}
                className="px-4 py-2 bg-white/20 rounded-xl text-xs font-bold hover:bg-white/30 transition-all"
              >
                📅 Calendar
              </button>
              <button
                onClick={handleNextDaySuggestions}
                className="px-4 py-2 bg-white/20 rounded-xl text-xs font-bold hover:bg-white/30 transition-all"
              >
                🤖 Next Day
              </button>
              <button
                onClick={() => {
                  setView("generate");
                }}
                className="px-4 py-2 bg-white/20 rounded-xl text-xs font-bold hover:bg-white/30 transition-all"
              >
                🔄 Regenerate
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs font-bold text-white/80 mb-1.5">
              <span>
                {totalDone}/{totalSteps} exercises done
              </span>
              <span className="flex items-center gap-3">
                {totalCalBurned > 0 && (
                  <span>🔥 ~{totalCalBurned} kcal burned</span>
                )}
                <span>{progress}%</span>
              </span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && (
              <p className="text-xs text-white/90 font-bold mt-2 text-center">
                🎉 All exercises completed for{" "}
                {routineDate === getTodayDate() ? "today" : "this day"}!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Routine Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[
          {
            label: "Morning Workout",
            emoji: "☀️",
            gradient: "from-amber-400 to-orange-500",
            steps: plan?.morning || [],
            checks: morningChecks,
            period: "morning",
            border: "border-amber-200 dark:border-amber-800",
            bg: "bg-amber-50 dark:bg-amber-950/20",
          },
          {
            label: "Night Workout",
            emoji: "🌙",
            gradient: "from-indigo-400 to-purple-500",
            steps: plan?.night || [],
            checks: nightChecks,
            period: "night",
            border: "border-indigo-200 dark:border-indigo-800",
            bg: "bg-indigo-50 dark:bg-indigo-950/20",
          },
        ].map((r) => {
          const done = r.checks.filter(Boolean).length;
          const sectionCal = r.steps.reduce((sum, ex, i) => {
            if (r.checks[i]) return sum + (parseInt(ex.caloriesBurned) || 0);
            return sum;
          }, 0);
          return (
            <div
              key={r.period}
              className={`bg-white dark:bg-slate-800/80 rounded-2xl border-2 ${r.border} overflow-hidden shadow-sm`}
            >
              <div
                className={`bg-gradient-to-r ${r.gradient} p-5 text-white relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.emoji}</span>
                    <div>
                      <h3 className="font-bold text-lg">{r.label}</h3>
                      <p className="text-white/80 text-xs font-medium">
                        {done}/{r.steps.length} completed
                        {sectionCal > 0 && ` • 🔥 ~${sectionCal} kcal`}
                      </p>
                    </div>
                  </div>
                  {done === r.steps.length && r.steps.length > 0 && (
                    <span className="text-2xl">✅</span>
                  )}
                </div>
              </div>
              <div className={`p-4 ${r.bg}`}>
                {r.steps.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-6">
                    No exercises in this routine
                  </p>
                ) : (
                  <div className="space-y-2">
                    {r.steps.map((step, i) => (
                      <label
                        key={i}
                        className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all ${r.checks[i]
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                          : "bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 hover:shadow-md"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={r.checks[i] || false}
                          onChange={() => handleCheck(r.period, i)}
                          className="w-5 h-5 rounded-md accent-blue-500 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                              {step.step}
                            </span>
                            <p
                              className={`text-sm font-bold ${r.checks[i]
                                ? "text-emerald-700 dark:text-emerald-300 line-through"
                                : "text-slate-700 dark:text-slate-300"
                                }`}
                            >
                              {step.name}
                            </p>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-8">
                            {step.instruction}
                          </p>
                          {/* Exercise details badges */}
                          <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                            {step.sets && (
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">
                                {step.sets}
                              </span>
                            )}
                            {step.reps && (
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">
                                {step.reps}
                              </span>
                            )}
                            {step.duration && (
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">
                                ⏱️ {step.duration}
                              </span>
                            )}
                            {step.caloriesBurned && (
                              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-lg">
                                🔥 {step.caloriesBurned}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* YouTube link */}
                        {step.youtubeQuery && (
                          <a
                            href={youtubeLink(step.youtubeQuery)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all shrink-0"
                            title="Watch on YouTube"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                            <span className="text-[10px] font-bold hidden sm:inline">
                              Watch
                            </span>
                          </a>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips Section */}
      {plan?.tips?.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6 mb-6">
          <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2 text-sm">
            <span className="text-lg">💡</span> Personalized Fitness Tips
          </h3>
          <ul className="space-y-2.5">
            {plan.tips.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium"
              >
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-xs font-black text-blue-500 shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {saving && (
        <p className="text-center text-xs text-blue-500 font-medium mt-4 animate-pulse">
          Saving...
        </p>
      )}

      {/* ============================================================ */}
      {/* NEXT-DAY SUGGESTIONS MODAL */}
      {/* ============================================================ */}
      {showSuggestions && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowSuggestions(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "fadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🤖</span>
                  <div>
                    <h3 className="font-black text-xl tracking-tight">
                      Next Day Suggestions
                    </h3>
                    <p className="text-white/80 text-xs font-bold">
                      Based on your activity & diet
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all px-0"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingSuggestions ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-10 h-10 border-[3px] border-blue-200 dark:border-blue-800 border-t-blue-500 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                    AI is analyzing your activity...
                  </p>
                </div>
              ) : (
                <>
                  {/* Motivation */}
                  {motivation && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-2xl p-4 mb-5 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-bold text-blue-700 dark:text-blue-300 text-center">
                        {motivation}
                      </p>
                    </div>
                  )}

                  {/* Suggestions */}
                  <div className="space-y-3">
                    {suggestions.map((s, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-2xl border ${PRIORITY_COLORS[s.priority] ||
                          PRIORITY_COLORS.medium
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-black uppercase tracking-wider opacity-60">
                                {s.period === "morning" ? "☀️" : "🌙"}{" "}
                                {s.period}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${s.priority === "high"
                                  ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200"
                                  : s.priority === "low"
                                    ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200"
                                    : "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200"
                                  }`}
                              >
                                {s.priority}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                              {s.exercise}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {s.reason}
                            </p>
                          </div>
                          {s.youtubeQuery && (
                            <a
                              href={youtubeLink(s.youtubeQuery)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all shrink-0"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                              </svg>
                              <span className="text-[10px] font-bold">
                                Watch
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {suggestions.length === 0 && (
                    <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">
                      No suggestions available. Complete some exercises first!
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}