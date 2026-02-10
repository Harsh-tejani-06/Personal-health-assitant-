import { useState } from "react";
import ai_assistant from "../assets/image.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    // <div className="w-screen h-screen bg-linear-to-br from-[#9b8cff] via-[#5b4fd6] to-[#0b0b0f] flex items-center justify-center">
    <div className="w-screen h-screen bg-linear-to-br from-[#2a0748] via-[#7f2dd0] to-[#0b0b0f] flex items-center justify-center">
      
      {/* Main container */}
      <div className="w-275 h-155 bg-[#0f172a] rounded-2xl shadow-2xl flex overflow-hidden">

        {/* ================= LEFT SIDE ================= */}
        <div className="w-1/2 relative mx-5 flex items-center justify-center">

          {/* SVG Dotted Orbit */}
          <svg
            className="absolute"
            width="520"
            height="520"
            viewBox="0 0 600 600"
            fill="none"
          >
            <circle
              cx="300"
              cy="300"
              r="220"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="2"
              strokeDasharray="6 8"
            />
          </svg>

          {/* Feature Card 1 – Diet */}
          <div className="absolute top-20.5 left-4 z-10 animate-card-float">
            <FeatureCard
              title="Personalized Diet"
              image="https://static.wixstatic.com/media/fdf916_9390a661c06f432e9ffeb569bb01628b~mv2.jpg/v1/fill/w_1000,h_666,al_c,q_90,usm_0.66_1.00_0.01/fdf916_9390a661c06f432e9ffeb569bb01628b~mv2.jpg"
              // desc="Meals tailored to your goals & lifestyle"
              bg="bg-[#3b82f6]"
            />
          </div>

          {/* Feature Card 2 – Exercise */}
          <div className="absolute top-50 right-1 z-10 animate-card-float-delay-1">
            <FeatureCard
              title="Smart Workouts"
              image="https://watermark.lovepik.com/photo/40011/3176.jpg_wh1200.jpg"
              // desc="Time-based exercise routines"
              // bg="bg-[#38bdf8]"
              bg="bg-[#38bff8d7]"

            />
          </div>

          {/* Feature Card 3 – AI Assistant */}
          <div className="absolute bottom-10 left-20 z-10 animate-card-float-delay-2">
            <FeatureCard
              title="AI Assistant"
              imsge=""
              image={ai_assistant}
              // desc="Ask questions & get daily guidance"
              bg="bg-[#6366f1] text-white"
            />
          </div>

          {/* Orbit Icons */}
          {/* <OrbitIcon className="top-29 left-83" icon="" /> */}
          {/* <OrbitIcon className="bottom-37 right-33" icon="➕" />
          <OrbitIcon className="bottom-67 right-111" icon="🤖" /> */}
          <OrbitIcon icon="➕" />
          <OrbitIcon icon="🤖" reverse />

        </div>

        {/* ================= RIGHT ================= */}
        {/* <div className="w-1/2 bg-white flex items-center justify-center"> */}
        {/* <div className="w-1/2 bg-[#6f348d] flex items-center justify-center"> */}
        <div className="w-1/2 bg-[#bg-[#f9fafb]] flex items-center justify-center">


          {/* Inner card */}
          {/* <div className="w-105 px-10 py-12 bg-[#3e1254] rounded-xl"> */}
          <div className="w-105 px-10 py-12 bg-[#361358] border-gray-200 rounded-xl">


            <h2 className="text-3xl font-semibold text-gray-100 mb-2">
              {isLogin ? "Login to your account" : "Create your account"}
            </h2>

            <p className="text-sm text-gray-100 mb-8 leading-relaxed">
              One place for your health & wellness journey
            </p>

            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                className="
          w-full rounded-lg px-4 py-3 mb-4
          border border-gray-300
          text-gray-100 placeholder-gray-400
          focus:outline-none focus:border-[#6f348d]
          focus:ring-2 focus:ring-[#6d5dfc]/30
          transition
        "
              />
            )}

            <input
              type="email"
              placeholder="Email"
              className="
        w-full rounded-lg px-4 py-3 mb-4
        border border-gray-300
        text-gray-100 placeholder-gray-400
        focus:outline-none focus:border-[#a257c8]
        focus:ring-2 focus:ring-[#6d5dfc]/30
        transition
      "
            />

            <input
              type="password"
              placeholder="Password"
              className="
        w-full rounded-lg px-4 py-3 mb-6
        border border-gray-300
        text-gray-100 placeholder-gray-400
        focus:outline-none focus:border-[#6f348d]
        focus:ring-2 focus:ring-[#6d5dfc]/30
        transition
      "
            />

            <button
              className="
        w-full bg-[#6e2593] text-white py-3 cursor-pointer rounded-lg
        font-semibold
        shadow-md
        transition-all duration-300
        hover:shadow-lg hover:-translate-y-0.5
        active:translate-y-0
      "
            >
              {isLogin ? "Log In" : "Sign Up"}
            </button>

            <p className="text-sm text-gray-200 mt-6 text-center">
              {isLogin ? (
                <>
                  Don’t have an account?{" "}
                  <span
                    className="text-gray-200 font-medium cursor-pointer hover:underline"
                    onClick={() => setIsLogin(false)}
                  >
                    Sign Up
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span
                    className="text-gray-100 font-medium cursor-pointer hover:underline"
                    onClick={() => setIsLogin(true)}
                  >
                    Login
                  </span>
                </>
              )}
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function FeatureCard({ title, image, bg = "bg-[#1e293b]", text = "text-white" }) {
  return (
    <div className={`w-57.5 p-4 rounded-xl shadow-lg transition-transform duration-300 hover:-translate-y-2 ${bg} ${text}`}>
      <h3 className="font-semibold">{title}</h3>
      {image && (
        <div className="w-full h-30 rounded-lg overflow-hidden bg-white/10">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}    </div>
  );
}

function OrbitIcon({ radius = 220, icon, reverse = false }) {
  return (
    <div
      className={`
        absolute inset-0 flex items-center justify-center
        ${reverse ? "animate-orbit-reverse" : "animate-orbit-slow"}
      `}
    >
      <div
        className="
          w-10 h-10 bg-white rounded-full
          flex items-center justify-center
          shadow-md text-lg
          transform translate-x-48 
        "
      >
        {icon}
      </div>
    </div>
  );
}

