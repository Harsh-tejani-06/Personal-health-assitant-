import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Sidebar({ open, setOpen }) {
  const location = useLocation();
  const [progress, setProgress] = useState(67);
  const [currentTime, setCurrentTime] = useState("");

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
    { name: "AI Assistant", path: "/chatbot", icon: "🤖", color: "from-[#06b6d4] to-[#10b981]" }
  ];

  return (
    <>
      {/* Toggle button */}
      <div className={`fixed top-4 z-50 transition-all duration-300 ${open ? 'left-64' : 'left-4'}`}>
        <button
          onClick={() => setOpen(!open)}
          className="w-12 h-12 bg-white text-slate-700 hover:text-[#06b6d4] rounded-xl shadow-lg border border-slate-200 transition-all hover:shadow-xl flex items-center justify-center text-xl"
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-2xl
        ${open ? "w-64" : "w-20"} 
        transition-all duration-300 z-40 flex flex-col`}
      >
        {/* Logo Section */}
        <div className={`pt-20 pb-6 px-4 ${open ? 'px-6' : 'px-4'} border-b border-slate-100`}>
          <div className={`flex items-center gap-3 ${!open && 'justify-center'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-[#06b6d4] to-[#10b981] rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              🏥
            </div>
            {open && (
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">HealthAI</h1>
                <p className="text-xs text-slate-500">Pro</p>
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
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#06b6d4]'
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
        <div className="p-4 border-t border-slate-100 space-y-4">
          {/* Daily Progress */}
          {open ? (
            <div className="bg-gradient-to-br from-[#06b6d4]/5 to-[#10b981]/5 rounded-2xl p-4 border border-[#06b6d4]/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-600">Daily Progress</p>
                <span className="text-xs font-bold text-[#06b6d4]">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-gradient-to-r from-[#06b6d4] to-[#10b981] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
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
            <div className="text-center py-2 border-t border-slate-100">
              <p className="text-xs text-slate-400">Current Time</p>
              <p className="text-lg font-bold text-slate-700 font-mono">{currentTime}</p>
            </div>
          )}

          {/* User Mini Profile */}
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-50 ${!open && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#10b981] flex items-center justify-center text-white text-xs font-bold">
              HT
            </div>
            {open && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">Harsh Tejani(Leader)</p>
                <p className="text-xs text-slate-500">Pro Member</p>
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