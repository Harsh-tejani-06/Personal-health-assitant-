import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

export default function GetStarted() {
  const navigate = useNavigate();

  return (
    <div className="w-screen h-screen bg-radial flex items-center justify-center overflow-hidden relative">

      {/* Floating background glow */}
      <div className="absolute w-150 h-150 bg-[#b89cff]/20 rounded-full blur-3xl animate-float" />

      {/* Main container */}
      <div className="relative w-250 h-165 bg-[#14141a]/95 rounded-2xl p-12 shadow-2xl backdrop-blur-md animate-fade-up">

        {/* Title */}
        <h1 className="text-4xl font-bold text-center mb-10 text-white">
          <span className="text-[#b89cff]">Personal Health Assistant</span>
        </h1>

        {/* CONTENT */}
        <div className="flex gap-16">

          {/* ================= LEFT SIDE ================= */}
          <div className="w-1/2 flex flex-col gap-2">

            {/* Slogan */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                Small habits. Smarter health
              </h2>
              <p className="text-sm text-[#d0cfe5] max-w-sm pt-2">
                Personalized diet, smart workouts, and AI-powered wellness
                guidance designed for your daily life.
              </p>
            </div>

            {/* Card */}
            <div className="relative flex justify-center items-center h-75">
              <Card />
            </div>
          </div>

          {/* ================= RIGHT SIDE ================= */}
          <div className="w-1/2 flex flex-col justify-center gap-8 pl-15">
            <h3 className="text-xl font-semibold text-[#f5f5f6]">
              Get clarity before you begin
            </h3>
            <div>
              <QuestionList />
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/auth")}
          className="
                w-50 ml-90 mt-4 bg-[#b89cff] text-black font-semibold px-10 py-4 rounded-full
                transition-all duration-300
                hover:scale-105 hover:shadow-xl
                active:scale-95
                cursor-pointer
              "
        >
          Get Started
        </button>

        <p className="text-xs ml-85 mt-4 text-[#9a9aa3]">
          ⚠️ This app does not provide medical advice.
        </p>
      </div>

    </div>
  );
}

/* ===== Feature Card ===== */
function Feature({ icon, title, children }) {
  return (
    <div className="
    h-50 w-60
      bg-[#0b0b0f]
      rounded-xl p-5
      text-center
      shadow-lg
      transition-transform duration-300
      hover:-translate-y-1
      hover:shadow-[0_0_20px_rgba(184,156,255,0.15)]
    ">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[#b5b4c9] leading-relaxed">
        {children}
      </p>
    </div>
  );
}

/* ===== Card ===== */
function Card() {
  const cards = [
    { icon: "🥗", title: "Personalized Diet", desc: "Meal plans tailored to your body, goals, and lifestyle." },
    { icon: "🏃", title: "Smart Workouts", desc: "Exercise routines based on your fitness level and time." },
    { icon: "🤖", title: "AI Health Assistant", desc: "Ask questions and get instant, non-medical guidance." },
    { icon: "📊", title: "Progress Tracking", desc: "Track habits, consistency, and improvements over time." },
    { icon: "🧠", title: "Lifestyle Tips", desc: "Simple advice for sleep, hydration, and daily wellness." },
    { icon: "🔒", title: "Privacy First", desc: "Your data stays private. No diagnosis, no data misuse." },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % cards.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full flex items-center justify-center">
      {cards.map((card, index) => {
        let offset = index - current;

        if (offset > cards.length / 2) offset -= cards.length;
        if (offset < -cards.length / 2) offset += cards.length;

        if (Math.abs(offset) > 1) return null;

        return (
          <div
            key={index}
            className="absolute transition-all duration-700 ease-in-out"
            style={{
              transform: `
                translateX(${offset * 130}px)
                scale(${offset === 0 ? 1 : 0.9})
              `,
              opacity: offset === 0 ? 1 : 0.6,
              zIndex: offset === 0 ? 20 : 10,
            }}
          >
            <Feature icon={card.icon} title={card.title}>
              {card.desc}
            </Feature>
          </div>
        );
      })}
    </div>
  );
}

function QuestionList() {
  const questions = [
    {
      q: "How does this personal health assistant work?",
      a: (
        <>
          This system works by understanding your lifestyle goals, daily habits,
          and preferences through the information you choose to share.
          <br /><br />
          Using AI-driven logic, it analyzes patterns related to diet, activity,
          and wellness, then offers personalized suggestions and insights.
          <br /><br />
          The system is built around a simple, continuous cycle:
          <br />
          <strong>Plan → Act → Track → Improve</strong>
          <br /><br />
          Over time, it adapts its guidance to match your routine
          while clearly avoiding medical advice or diagnosis.
        </>
      )
    },
    {
      q: "What can this system help me with?",
      a: (
        <>
          This system helps you make better daily wellness decisions by providing guidance
          around diet, physical activity, and lifestyle habits.
          <br /><br />
          It can support you with things like planning balanced meals, staying active in a way that fits your
          routine, and building healthier habits over time.
          <br /><br />
          The assistant also helps you track consistency, reflect on patterns, and understand what’s working for you.
          <br /><br />
          Its purpose is to guide, support, and inform your wellness journey, not to diagnose conditions
          or replace professional medical advice.
        </>
      )
    },
    {
      q: "How does the AI assistant support me daily?",
      a: (
        <>
          The AI assistant supports you by offering day-to-day guidance based on your goals, preferences, and routine.
          <br /><br />
          It helps you explore meal ideas, activity suggestions, and wellness tips that fit into your lifestyle.
          <br /><br />
          Over time, the assistant notices patterns in your habits and interactions, allowing it to adjust
          suggestions and provide more relevant insights.
          <br /><br />
          Its role is to act as a supportive guide — helping you stay aware, consistent, and motivated in your
          daily wellness journey.
        </>
      )
    },
    {
      q: "How are recommendations personalized?",
      a: (
        <>
          Recommendations are personalized based on the information you choose to share, such as your goals,
          preferences, daily habits, and activity patterns.
          <br /><br />
          The system looks for trends over time rather than focusing on individual actions, helping it
          understand what works best for you.
          <br /><br />
          As your routine, interests, or goals change, the assistant adjusts its suggestions to stay relevant and supportive.
        </>
      )
    },
    {
      q: "Is my data stored securely?",
      a: (
        <>
          Yes. Your data is handled securely and responsibly within the system.
          <br /><br />
          Only the information you choose to share is used, and it is stored in a protected manner
          to support personalization and improve your experience.
          <br /><br />
          The system is designed with privacy in mind, avoiding unnecessary data collection and never
          requiring medical or sensitive health records.
          <br /><br />
          You remain in control of your information, and data is used solely to provide guidance within the platform.
        </>
      )
    },
  ];

  const [activeIndex, setActiveIndex] = useState(null);
  const containerRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveIndex(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* QUESTIONS LIST */}
      <div className="space-y-0.5">
        {questions.map((item, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className="
              w-full flex items-center justify-between
              px-6 py-4 first:pt-0
              text-left
              text-white font-medium
              border-b border-white/20
              hover:bg-white/5
              transition
              cursor-pointer
            "
          >
            <span>{item.q}</span>
            <span className="text-xl text-white/60">›</span>
          </button>
        ))}
      </div>

      {/* FLOATING ANSWER CARD */}
      {activeIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">

          {/* background click area */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* Answer Card */}
          <div
            ref={containerRef}
            className="
              relative w-105
              bg-[#14141a]
              rounded-2xl
              p-6
              shadow-2xl
              text-[#b5b4c9]
              animate-fade-up
            "
          >
            <h4 className="text-white font-semibold mb-3">
              {questions[activeIndex].q}
            </h4>

            <p className="text-sm leading-relaxed">
              {questions[activeIndex].a}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

