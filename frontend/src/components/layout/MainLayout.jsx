import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#f0fdf4] pointer-events-none" />
      
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen} />

      {/* Page Content */}
      <div
        className={`
          relative min-h-screen p-4 md:p-6 lg:p-8
          ${open ? "ml-64" : "ml-20"}
          transition-all duration-300 ease-in-out
        `}
      >
        <Outlet />
      </div>
    </div>
  );
}