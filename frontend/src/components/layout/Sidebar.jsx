import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ open, setOpen }) {
  const location = useLocation();
  const progress = 67;

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

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700 shadow-2xl
        ${open ? "w-64" : "w-20"} 
        transition-all duration-300 z-40 flex flex-col`}
      >
        {/* Logo Section — Click to Toggle Sidebar */}
        <div
          className={`pt-6 pb-6 px-4 ${open ? 'px-6' : 'px-4'} border-b border-slate-100 dark:border-slate-800 cursor-pointer group`}
          onClick={() => setOpen(!open)}
          title={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <div className={`flex items-center gap-3 ${!open && 'justify-center'}`}>
            <div className="w-13 h-13 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-lg overflow-hidden group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
              <img src="./public/logo.png" alt="HealthAI Logo" className="w-full h-full object-cover p-1" />
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

        {/* Bottom Section — Daily Progress Only */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
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