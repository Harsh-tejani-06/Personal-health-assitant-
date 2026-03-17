import { useState } from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatDateShort(d) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * CalendarView — Reusable calendar grid overlay/modal.
 *
 * Props:
 *   dates        — string[] of dates that have data (e.g. ["2026-03-10", "2026-03-11"])
 *   selectedDate — currently active date string
 *   onSelectDate — (dateStr) => void
 *   onClose      — () => void
 *   accentColor  — tailwind color key, e.g. "purple", "emerald", "indigo"
 *   title        — string, e.g. "Recipe Calendar"
 *   emoji        — string, e.g. "📅"
 */
export default function CalendarView({
  dates = [],
  selectedDate,
  onSelectDate,
  onClose,
  accentColor = "purple",
  title = "Calendar",
  emoji = "📅",
}) {
  const [calMonth, setCalMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate + "T00:00:00") : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const dateSet = new Set(dates);
  const today = getTodayDate();

  // Build grid
  const { year, month } = calMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calDays = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    calDays.push(dateStr);
  }

  const prevMonth = () =>
    setCalMonth((p) => {
      let m = p.month - 1, y = p.year;
      if (m < 0) { m = 11; y--; }
      return { year: y, month: m };
    });

  const nextMonth = () =>
    setCalMonth((p) => {
      let m = p.month + 1, y = p.year;
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });

  // Accent color mappings
  const colors = {
    purple: {
      gradient: "from-purple-500 to-violet-500",
      ring: "ring-purple-400",
      hoverBg: "hover:bg-purple-100 dark:hover:bg-purple-900/30",
      hoverText: "hover:text-purple-500",
      todayBorder: "border-purple-400 dark:border-purple-500",
      hasData: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
      btnBg: "bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/40",
    },
    emerald: {
      gradient: "from-emerald-500 to-teal-500",
      ring: "ring-emerald-400",
      hoverBg: "hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
      hoverText: "hover:text-emerald-500",
      todayBorder: "border-emerald-400 dark:border-emerald-500",
      hasData: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
      btnBg: "bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-800/40",
    },
    indigo: {
      gradient: "from-indigo-500 to-purple-600",
      ring: "ring-indigo-400",
      hoverBg: "hover:bg-indigo-100 dark:hover:bg-indigo-900/30",
      hoverText: "hover:text-indigo-500",
      todayBorder: "border-indigo-400 dark:border-indigo-500",
      hasData: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
      btnBg: "bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800/40",
    },
  };

  const c = colors[accentColor] || colors.purple;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden w-[92%] max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "calFadeIn 0.25s ease-out" }}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${c.gradient} p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{emoji}</span>
              <div>
                <h3 className="font-bold text-base">{title}</h3>
                <p className="text-white/80 text-[11px] font-medium">
                  Select a date to view history
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-all px-0 text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className={`w-9 h-9 rounded-xl ${c.btnBg} flex items-center justify-center text-slate-500 dark:text-slate-400 ${c.hoverText} transition-all font-bold px-0`}
            >
              ‹
            </button>
            <h2 className="text-lg font-black text-slate-800 dark:text-white">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className={`w-9 h-9 rounded-xl ${c.btnBg} flex items-center justify-center text-slate-500 dark:text-slate-400 ${c.hoverText} transition-all font-bold px-0`}
            >
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calDays.map((dateStr, i) => {
              if (!dateStr) return <div key={`e-${i}`} />;
              const dayNum = parseInt(dateStr.split("-")[2]);
              const isToday = dateStr === today;
              const isFuture = dateStr > today;
              const isSelected = selectedDate === dateStr;
              const hasData = dateSet.has(dateStr);

              return (
                <button
                  key={dateStr}
                  disabled={isFuture}
                  onClick={() => {
                    onSelectDate(dateStr);
                    onClose();
                  }}
                  className={`py-2 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all px-0
                    ${isFuture ? "opacity-30 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}
                    ${isSelected ? `ring-2 ${c.ring} ring-offset-2 dark:ring-offset-slate-800` : ""}
                    ${isToday ? `border-2 ${c.todayBorder}` : "border border-slate-100 dark:border-slate-700"}
                    ${hasData
                      ? c.hasData
                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400"
                    }`}
                >
                  <span>{dayNum}</span>
                  <span className="text-[8px] mt-0.5 leading-none">
                    {hasData ? "●" : isFuture ? "" : "·"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              ● Has data
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              · No data
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes calFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
