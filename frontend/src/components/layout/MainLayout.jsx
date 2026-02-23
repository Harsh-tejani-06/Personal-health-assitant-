import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isChatbot = location.pathname === "/chatbot";

  return (
    <div className="bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen text-slate-800 dark:text-slate-200 relative transition-colors duration-300">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#f0fdf4] dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] pointer-events-none transition-colors duration-300" />

      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen} />

      {/* Page Content */}
      <div
        className={`
          relative min-h-screen
          ${isChatbot ? "p-0" : "p-4 md:p-6 lg:p-8"}
          ${open ? "ml-64" : "ml-20"}
          transition-all duration-300 ease-in-out
        `}
      >
        <Outlet />
      </div>
    </div>
  );
}