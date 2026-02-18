import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function Sidebar({ open, setOpen }) {
  const location = useLocation();
  const [progress, setProgress] = useState(67);
  const [currentTime, setCurrentTime] = useState("");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: "📊", color: "from-[#06b6d4] to-[#0891b2]" },
    { name: "Exercise", path: "/exercise", icon: "💪", color: "from-[#10b981] to-[#059669]" },
    { name: "Skin Care", path: "/skin-care", icon: "✨", color: "from-[#ec4899] to-[#db2777]" },
    { name: "Recipes", path: "/recipes", icon: "🍳", color: "from-[#8b5cf6] to-[#7c3aed]" },
    { name: "Diet Plan", path: "/diet", icon: "🥗", color: "from-[#10b981] to-[#14b8a6]" },
    { name: "Activity", path: "/activity", icon: "📋", color: "from-[#f59e0b] to-[#d97706]" },
    { name: "Leaderboard", path: "/leaderboard", icon: "🏆", color: "from-[#ef4444] to-[#dc2626]" },
    { name: "AI Assistant", path: "/chatbot", icon: "🤖", color: "from-[#06b6d4] to-[#10b981]" }
  ];

  return (
    <>
      {/* Toggle button */}
      <div className={`fixed top-4 z-50 transition-all duration-300 ${open ? 'left-64' : 'left-4'}`}>
        <button
          onClick={() => setOpen(!open)}
          className="w-12 h-12 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#06b6d4] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-all hover:shadow-xl flex items-center justify-center text-xl"
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700 shadow-2xl
        ${open ? "w-64" : "w-20"} 
        transition-all duration-300 z-40 flex flex-col`}
      >
        {/* Logo Section */}
        <div className={`pt-20 pb-6 px-4 ${open ? 'px-6' : 'px-4'} border-b border-slate-100 dark:border-slate-800`}>
          <div className={`flex items-center gap-3 ${!open && 'justify-center'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-[#06b6d4] to-[#10b981] rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              🏥
            </div>
            {open && (
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">HealthAI</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pro</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menu.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative
                  ${isActive
                    ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#06b6d4]'
                  }
                  ${!open && 'justify-center'}
                `}
                title={!open ? item.name : ''}
              >
                <span className={`text-xl ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                  {item.icon}
                </span>
                {open && (
                  <span className="font-medium text-sm">{item.name}</span>
                )}
                {isActive && open && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-white/80"></span>
                )}

                {/* Tooltip for collapsed state */}
                {!open && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">

          {/* Theme Toggle */}
          <div className={`flex ${!open ? 'justify-center' : 'justify-between items-center'}`}>
            {open && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
            )}
            <button
              onClick={toggleTheme}
              className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 group overflow-hidden"
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {/* Background glow */}
              <div className={`absolute inset-0 rounded-xl transition-all duration-500 ${theme === "dark"
                  ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30"
                  : "bg-gradient-to-br from-amber-400/20 to-orange-400/20 border border-amber-400/30"
                }`} />

              {/* Icon container with rotation */}
              <div className={`relative transition-all duration-500 ${theme === "dark" ? "rotate-0" : "rotate-180"
                }`}>
                {theme === "dark" ? (
                  /* Moon icon */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-indigo-400 drop-shadow-[0_0_6px_rgba(129,140,248,0.6)]">
                    <path
                      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  /* Sun icon */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-amber-500 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]">
                    <circle cx="12" cy="12" r="5" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </div>
            </button>
          </div>

          {/* Daily Progress */}
          {open ? (
            <div className="bg-gradient-to-br from-[#06b6d4]/5 to-[#10b981]/5 dark:from-[#06b6d4]/10 dark:to-[#10b981]/10 rounded-2xl p-4 border border-[#06b6d4]/10 dark:border-[#06b6d4]/20">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Daily Progress</p>
                <span className="text-xs font-bold text-[#06b6d4]">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-[#06b6d4] to-[#10b981] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {progress < 100 ? 'Keep going! 💪' : 'All done! 🎉'}
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#06b6d4] to-[#10b981] flex items-center justify-center text-white text-xs font-bold">
                {progress}%
              </div>
            </div>
          )}

          {/* Time Display */}
          {open && (
            <div className="text-center py-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 dark:text-slate-500">Current Time</p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200 font-mono">{currentTime}</p>
            </div>
          )}

          {/* User Mini Profile */}
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${!open && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#10b981] flex items-center justify-center text-white text-xs font-bold">
              HT
            </div>
            {open && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">Harsh Tejani(Leader)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pro Member</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}