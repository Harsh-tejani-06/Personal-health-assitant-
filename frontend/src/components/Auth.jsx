import { useState } from "react";
import ai_assistant from "../assets/image.png";
import { signupUser, loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { getOnboardingStatus } from "../services/profileService";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (isLogin) {
        await loginUser({ email, password });
      } else {
        await signupUser({ fullname, email, password });
      }

      const status = await getOnboardingStatus();

      if (status.completed) {
        navigate("/dashboard");
      } else {
        navigate("/questionnaire");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#f0fdf4] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#06b6d4]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#0ea5e9]/5 rounded-full blur-3xl" />
      </div>

      {/* Floating medical decorations */}
      <div className="absolute top-20 left-20 text-[#06b6d4]/20 text-6xl animate-bounce hidden lg:block">+</div>
      <div className="absolute bottom-32 right-32 text-[#10b981]/20 text-4xl animate-bounce delay-700 hidden lg:block">+</div>

      {/* Main container */}
      <div className="relative w-full max-w-6xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden animate-fade-up">
        
        {/* Header accent bar */}
        <div className="h-2 bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#10b981]" />

        <div className="flex flex-col lg:flex-row min-h-[600px]">
          
          {/* ================= LEFT SIDE - Visual Showcase ================= */}
          <div className="w-full lg:w-1/2 relative bg-gradient-to-br from-[#06b6d4]/5 to-[#10b981]/5 p-8 lg:p-12 flex items-center justify-center overflow-hidden">
            
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2306b6d4\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />

            {/* SVG Dotted Orbit */}
            <svg
              className="absolute w-full h-full max-w-[500px] max-h-[500px]"
              viewBox="0 0 600 600"
              fill="none"
            >
              <circle
                cx="300"
                cy="300"
                r="220"
                stroke="rgba(6, 182, 212, 0.2)"
                strokeWidth="2"
                strokeDasharray="6 8"
                className="animate-spin-slow"
                style={{ transformOrigin: 'center', animationDuration: '20s' }}
              />
              <circle
                cx="300"
                cy="300"
                r="160"
                stroke="rgba(16, 185, 129, 0.15)"
                strokeWidth="2"
                strokeDasharray="4 6"
                className="animate-spin-slow"
                style={{ transformOrigin: 'center', animationDuration: '15s', animationDirection: 'reverse' }}
              />
            </svg>

            {/* Feature Cards */}
            <div className="relative w-full max-w-md h-[500px]">
              {/* Card 1 - Diet */}
              <div className="absolute top-0 left-0 lg:left-4 z-20 animate-card-float">
                <FeatureCard
                  title="Personalized Diet"
                  image="https://static.wixstatic.com/media/fdf916_9390a661c06f432e9ffeb569bb01628b~mv2.jpg/v1/fill/w_1000,h_666,al_c,q_90,usm_0.66_1.00_0.01/fdf916_9390a661c06f432e9ffeb569bb01628b~mv2.jpg"
                  bg="from-[#10b981] to-[#059669]"
                  icon="🥗"
                />
              </div>

              {/* Card 2 - Workouts */}
              <div className="absolute top-1/3 right-0 lg:right-4 z-10 animate-card-float-delay-1">
                <FeatureCard
                  title="Smart Workouts"
                  image="https://watermark.lovepik.com/photo/40011/3176.jpg_wh1200.jpg"
                  bg="from-[#06b6d4] to-[#0891b2]"
                  icon="🏃"
                />
              </div>

              {/* Card 3 - AI Assistant */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-30 animate-card-float-delay-2">
                <FeatureCard
                  title="AI Assistant"
                  image={ai_assistant}
                  bg="from-[#0ea5e9] to-[#0284c7]"
                  icon="🤖"
                />
              </div>

              {/* Orbit Icons */}
              <OrbitIcon icon="❤️" />
              <OrbitIcon icon="⚡" reverse />
            </div>
          </div>

          {/* ================= RIGHT SIDE - Auth Form ================= */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white">
            <div className="w-full max-w-md">
              
              {/* Logo/Brand */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-[#06b6d4] to-[#10b981] rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                  🏥
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">Health Assistant</h1>
                  <p className="text-xs text-slate-500">Your wellness companion</p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                  {isLogin ? "Welcome back" : "Create account"}
                </h2>
                <p className="text-slate-600 text-sm">
                  {isLogin 
                    ? "Enter your credentials to access your health dashboard" 
                    : "Start your personalized health journey today"}
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {!isLogin && (
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">👤</span>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10 transition-all duration-300"
                      />
                    </div>
                  </div>
                )}

                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">✉️</span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10 transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">🔒</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10 transition-all duration-300"
                    />
                  </div>
                </div>

                {isLogin && (
                  <div className="flex justify-end">
                    <button className="text-sm text-[#06b6d4] hover:text-[#0891b2] font-medium transition-colors">
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white font-bold rounded-xl shadow-lg shadow-[#06b6d4]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#06b6d4]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      {isLogin ? "Sign In" : "Create Account"}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">or continue with</span>
                </div>
              </div>


              {/* Toggle */}
              <p className="mt-8 text-center text-slate-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-bold text-[#06b6d4] hover:text-[#0891b2] transition-colors"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>

              {/* Trust badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure 256-bit SSL encrypted
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.8s ease-out; }
        
        @keyframes card-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-card-float { animation: card-float 4s ease-in-out infinite; }
        .animate-card-float-delay-1 { animation: card-float 4s ease-in-out infinite 1s; }
        .animate-card-float-delay-2 { animation: card-float 4s ease-in-out infinite 2s; }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
      `}</style>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function FeatureCard({ title, image, bg, icon }) {
  return (
    <div className="w-48 md:w-56 bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-slate-100">
      <div className={`h-2 bg-gradient-to-r ${bg}`} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
        </div>
        {image && (
          <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-100">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-110"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function OrbitIcon({ icon, reverse = false }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
        reverse ? "animate-[spin_15s_linear_infinite_reverse]" : "animate-[spin_20s_linear_infinite]"
      }`}
    >
      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-lg border border-slate-100 transform translate-x-28 md:translate-x-36">
        {icon}
      </div>
    </div>
  );
}