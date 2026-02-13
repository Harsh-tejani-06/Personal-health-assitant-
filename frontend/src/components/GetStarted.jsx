import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

export default function GetStarted() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#f0fdf4] flex items-center justify-center overflow-hidden relative p-4 md:p-8">
      
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-[#06b6d4]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#0ea5e9]/5 rounded-full blur-3xl" />
      </div>

      {/* Floating medical cross decorations */}
      <div className="absolute top-20 left-20 text-[#06b6d4]/20 text-6xl animate-bounce hidden lg:block">+</div>
      <div className="absolute bottom-32 right-32 text-[#10b981]/20 text-4xl animate-bounce delay-700 hidden lg:block">+</div>

      {/* Main container */}
      <div className="relative w-full max-w-6xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden animate-fade-up">
        
        {/* Header accent bar */}
        <div className="h-2 bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#10b981]" />

        <div className="p-6 md:p-12 lg:p-16">
          {/* Title */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[#ecfeff] rounded-full border border-[#06b6d4]/20">
              <span className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse" />
              <span className="text-sm font-medium text-[#0891b2]">AI-Powered Health Companion</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800">
              Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] to-[#10b981]">Health Assistant</span>
            </h1>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto text-sm md:text-base">
              Your intelligent companion for a healthier, happier life
            </p>
          </div>

          {/* CONTENT */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            {/* ================= LEFT SIDE ================= */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
              
              {/* Slogan Card */}
              <div className="bg-gradient-to-br from-[#f0f9ff] to-[#f0fdf4] rounded-2xl p-6 border border-[#06b6d4]/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#06b6d4] to-[#0891b2] rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                    🏥
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
                      Small habits. <span className="text-[#0891b2]">Smarter health</span>
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Personalized diet plans, intelligent workout routines, and AI-powered wellness guidance designed specifically for your daily lifestyle and goals.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Cards Carousel */}
              <div className="relative h-80 md:h-96 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2306b6d4\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
                <Card />
              </div>
            </div>

            {/* ================= RIGHT SIDE ================= */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center">
              <div className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#10b981]/10 rounded-lg flex items-center justify-center">
                    <span className="text-[#10b981] text-xl">❓</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800">
                    Get clarity before you begin
                  </h3>
                </div>
                <QuestionList />
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-10 md:mt-12 flex flex-col items-center gap-4">
            <button
              onClick={() => navigate("/auth")}
              className="group relative w-full sm:w-auto px-8 md:px-12 py-4 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white font-bold text-lg rounded-full shadow-lg shadow-[#06b6d4]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#06b6d4]/30 hover:-translate-y-1 active:translate-y-0 overflow-hidden"
            >
              <span className="relative z-10 cursor-pointer flex items-center justify-center gap-2">
                Get Started
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#0891b2] to-[#06b6d4] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs md:text-sm font-medium">
                This app does not provide medical advice
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-up {
          animation: fade-up 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}

/* ===== Feature Card ===== */
function Feature({ icon, title, children, color }) {
  const colorClasses = {
    cyan: "from-[#06b6d4] to-[#0891b2] shadow-[#06b6d4]/20",
    emerald: "from-[#10b981] to-[#059669] shadow-[#10b981]/20",
    blue: "from-[#3b82f6] to-[#2563eb] shadow-[#3b82f6]/20",
    violet: "from-[#8b5cf6] to-[#7c3aed] shadow-[#8b5cf6]/20",
    rose: "from-[#f43f5e] to-[#e11d48] shadow-[#f43f5e]/20",
    amber: "from-[#f59e0b] to-[#d97706] shadow-[#f59e0b]/20",
  };

  return (
    <div className={`
      h-64 w-64 md:h-72 md:w-72
      bg-white
      rounded-2xl p-6
      text-center
      shadow-xl ${colorClasses[color].split(' ')[1]}
      border border-slate-100
      transition-all duration-500
      hover:shadow-2xl hover:-translate-y-2
      flex flex-col items-center justify-center
    `}>
      <div className={`
        w-16 h-16 md:w-20 md:h-20
        bg-gradient-to-br ${colorClasses[color].split(' ')[0]}
        rounded-2xl
        flex items-center justify-center
        text-3xl md:text-4xl mb-4
        shadow-lg ${colorClasses[color].split(' ')[1]}
        transform transition-transform duration-300 hover:scale-110 hover:rotate-3
      `}>
        {icon}
      </div>
      <h3 className="text-slate-800 font-bold text-lg md:text-xl mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">
        {children}
      </p>
    </div>
  );
}

/* ===== Card Carousel ===== */
function Card() {
  const cards = [
    { icon: "🥗", title: "Personalized Diet", desc: "Meal plans tailored to your body, goals, and lifestyle.", color: "emerald" },
    { icon: "🏃", title: "Smart Workouts", desc: "Exercise routines based on your fitness level and time.", color: "cyan" },
    { icon: "🤖", title: "AI Health Assistant", desc: "Ask questions and get instant, non-medical guidance.", color: "blue" },
    { icon: "📊", title: "Progress Tracking", desc: "Track habits, consistency, and improvements over time.", color: "violet" },
    { icon: "🧠", title: "Lifestyle Tips", desc: "Simple advice for sleep, hydration, and daily wellness.", color: "rose" },
    { icon: "🔒", title: "Privacy First", desc: "Your data stays private. No diagnosis, no data misuse.", color: "amber" },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % cards.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Navigation dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-30">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === current ? "w-6 bg-[#06b6d4]" : "bg-slate-300 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>

      {cards.map((card, index) => {
        let offset = index - current;
        if (offset > cards.length / 2) offset -= cards.length;
        if (offset < -cards.length / 2) offset += cards.length;
        if (Math.abs(offset) > 1) return null;

        return (
          <div
            key={index}
            className="absolute transition-all duration-700 ease-out"
            style={{
              transform: `
                translateX(${offset * 120}px) 
                scale(${offset === 0 ? 1 : 0.85})
                rotateY(${offset * -15}deg)
              `,
              opacity: offset === 0 ? 1 : 0.4,
              zIndex: offset === 0 ? 20 : 10,
              filter: offset === 0 ? 'none' : 'blur(2px)',
            }}
          >
            <Feature icon={card.icon} title={card.title} color={card.color}>
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
      a: "This system understands your lifestyle goals and daily habits through information you share. Using AI-driven logic, it analyzes patterns in diet, activity, and wellness to offer personalized suggestions. The system follows a continuous cycle: Plan → Act → Track → Improve, adapting guidance to your routine while avoiding medical advice."
    },
    {
      q: "What can this system help me with?",
      a: "The assistant helps with daily wellness decisions including meal planning, fitness routines, and habit building. It tracks your consistency, reflects on patterns, and provides insights on what's working. It guides and informs your wellness journey without diagnosing conditions or replacing professional medical advice."
    },
    {
      q: "How does the AI assistant support me daily?",
      a: "The AI offers day-to-day guidance based on your goals and routine, suggesting meal ideas, activities, and wellness tips. It learns from your habits over time to provide increasingly relevant insights, acting as a supportive guide for your daily wellness journey."
    },
    {
      q: "How are recommendations personalized?",
      a: "Recommendations adapt based on your shared goals, preferences, and activity patterns. The system identifies trends over time rather than reacting to single actions, continuously adjusting suggestions as your routine and interests evolve."
    },
    {
      q: "Is my data stored securely?",
      a: "Yes, your data is handled securely using encryption and strict access controls. Only information you choose to share is used, stored in protected environments. The system minimizes data collection, never requires medical records, and gives you full control over your information."
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
      <div className="space-y-2">
        {questions.map((item, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`
              w-full flex items-center justify-between
              px-4 py-3 md:px-6 md:py-4
              text-left rounded-xl
              transition-all duration-300
              cursor-pointer group
              ${activeIndex === index 
                ? 'bg-[#06b6d4]/10 border-[#06b6d4]/30' 
                : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-[#06b6d4]/20'
              }
              border
            `}
          >
            <span className={`font-medium text-sm md:text-base transition-colors ${
              activeIndex === index ? 'text-[#0891b2]' : 'text-slate-700 group-hover:text-[#0891b2]'
            }`}>
              {item.q}
            </span>
            <span className={`text-xl transition-transform duration-300 ${
              activeIndex === index ? 'rotate-90 text-[#06b6d4]' : 'text-slate-400 group-hover:text-[#06b6d4]'
            }`}>
              ›
            </span>
          </button>
        ))}
      </div>

      {/* FLOATING ANSWER MODAL */}
      {activeIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setActiveIndex(null)}
          />
          <div
            ref={containerRef}
            className="relative w-full max-w-lg bg-white rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-100 animate-fade-up max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#06b6d4] to-[#0891b2] rounded-lg flex items-center justify-center text-white shrink-0">
                <span className="text-lg">💡</span>
              </div>
              <h4 className="text-lg md:text-xl font-bold text-slate-800 leading-tight pt-1">
                {questions[activeIndex].q}
              </h4>
            </div>
            
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                {questions[activeIndex].a}
              </p>
            </div>

            <button
              onClick={() => setActiveIndex(null)}
              className="mt-6 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}