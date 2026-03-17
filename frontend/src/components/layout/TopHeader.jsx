import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function TopHeader() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);

  const logoutUser = () => {
    localStorage.removeItem("token");
    window.location.href = "/auth";
  };

  // Fetch user profile
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
            displayName: data.displayName || "",
            avatar: data.avatar ? `http://localhost:5000${data.avatar}` : "/user.png",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const initials = user
    ? (user.displayName || user.fullname)
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="relative flex items-center justify-between h-16 px-4 md:px-6 lg:px-8">

      {/* LEFT SIDE — User Profile (name + membership) & Theme Toggle */}
      <div className="flex items-center gap-4">
        {/* User Avatar & Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#10b981] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-cyan-200/30 dark:shadow-cyan-900/30 ring-2 ring-white/50 dark:ring-slate-700/50">
            {user?.avatar && user.avatar !== "/user.png" ? (
              <img
                src={user.avatar}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
              {user?.displayName || user?.fullname || "User"}
            </p>
            <p className="text-[11px] text-[#06b6d4] font-medium">Pro Member ✨</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — Theme Toggle & Logout */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 overflow-hidden"
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <div
            className={`absolute inset-0 rounded-xl transition-all duration-500 ${
              theme === "dark"
                ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30"
                : "bg-gradient-to-br from-amber-400/20 to-orange-400/20 border border-amber-400/30"
            }`}
          />
          <div
            className={`relative transition-all duration-500 ${
              theme === "dark" ? "rotate-0" : "rotate-180"
            }`}
          >
            {theme === "dark" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                className="text-indigo-400 drop-shadow-[0_0_6px_rgba(129,140,248,0.6)]">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                  fill="currentColor" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                className="text-amber-500 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]">
                <circle cx="12" cy="12" r="5" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

        {/* Logout Button */}
        <button
          onClick={logoutUser}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group"
          title="Logout"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="group-hover:scale-110 transition-transform">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="text-sm font-medium hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}
