import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendForgotPasswordOtp, verifyOtp, resetPassword, isLoggedIn } from "../services/authService";

const STEPS = {
    EMAIL: "email",
    OTP: "otp",
    NEW_PASSWORD: "newPassword",
    SUCCESS: "success"
};

export default function ForgotPassword() {
    const [step, setStep] = useState(STEPS.EMAIL);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [resendTimer, setResendTimer] = useState(0);

    const navigate = useNavigate();
    const otpRefs = useRef([]);

    // If already logged in, redirect to dashboard
    useEffect(() => {
        if (isLoggedIn()) {
            navigate("/dashboard", { replace: true });
        }
    }, [navigate]);

    // Resend timer countdown
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    // ========== Step 1: Send OTP ==========
    async function handleSendOtp(e) {
        e?.preventDefault();
        if (!email.trim()) {
            setError("Please enter your email");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await sendForgotPasswordOtp(email.trim());
            setSuccessMsg("OTP sent to your email!");
            setStep(STEPS.OTP);
            setResendTimer(60);
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    }

    // ========== Step 2: Verify OTP ==========
    function handleOtpChange(index, value) {
        if (value.length > 1) value = value.slice(-1);
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError("");

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    }

    function handleOtpKeyDown(index, e) {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    }

    function handleOtpPaste(e) {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(""));
            otpRefs.current[5]?.focus();
        }
    }

    async function handleVerifyOtp(e) {
        e?.preventDefault();
        const otpString = otp.join("");
        if (otpString.length !== 6) {
            setError("Please enter the complete 6-digit OTP");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await verifyOtp(email.trim(), otpString);
            setSuccessMsg("OTP verified!");
            setStep(STEPS.NEW_PASSWORD);
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    }

    // ========== Step 3: Reset Password ==========
    async function handleResetPassword(e) {
        e?.preventDefault();
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await resetPassword(email.trim(), otp.join(""), newPassword);
            setStep(STEPS.SUCCESS);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    }

    // ========== Resend OTP ==========
    async function handleResend() {
        if (resendTimer > 0) return;
        setLoading(true);
        setError("");
        try {
            await sendForgotPasswordOtp(email.trim());
            setOtp(["", "", "", "", "", ""]);
            setSuccessMsg("New OTP sent!");
            setResendTimer(60);
            setTimeout(() => setSuccessMsg(""), 3000);
            otpRefs.current[0]?.focus();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    }

    // ========== Step indicator ==========
    const stepNumber = step === STEPS.EMAIL ? 1 : step === STEPS.OTP ? 2 : step === STEPS.NEW_PASSWORD ? 3 : 4;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#f0fdf4] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-[#06b6d4]/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl animate-pulse" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
                    {/* Accent bar */}
                    <div className="h-2 bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#10b981]" />

                    <div className="p-8">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-11 h-11 bg-gradient-to-br from-[#06b6d4] to-[#10b981] rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                                🏥
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-800">Health Assistant</h1>
                                <p className="text-xs text-slate-500">Password Recovery</p>
                            </div>
                        </div>

                        {/* Steps indicator */}
                        {step !== STEPS.SUCCESS && (
                            <div className="flex items-center gap-2 mb-8">
                                {[1, 2, 3].map((s) => (
                                    <div key={s} className="flex items-center gap-2 flex-1">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s === stepNumber
                                                    ? "bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white shadow-lg shadow-[#06b6d4]/25 scale-110"
                                                    : s < stepNumber
                                                        ? "bg-emerald-500 text-white"
                                                        : "bg-slate-100 text-slate-400"
                                                }`}
                                        >
                                            {s < stepNumber ? "✓" : s}
                                        </div>
                                        {s < 3 && (
                                            <div className={`flex-1 h-0.5 rounded-full transition-all ${s < stepNumber ? "bg-emerald-400" : "bg-slate-200"}`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2 animate-shake">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        {/* Success */}
                        {successMsg && (
                            <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600 flex items-center gap-2">
                                <span>✅</span> {successMsg}
                            </div>
                        )}

                        {/* ============ STEP 1: EMAIL ============ */}
                        {step === STEPS.EMAIL && (
                            <form onSubmit={handleSendOtp}>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Forgot Password?</h2>
                                <p className="text-slate-500 text-sm mb-6">
                                    Enter your registered email address and we'll send you a verification code.
                                </p>

                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <div className="relative mb-6">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">✉️</span>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10 transition-all"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white font-bold rounded-xl shadow-lg shadow-[#06b6d4]/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Sending OTP...
                                        </>
                                    ) : (
                                        <>
                                            Send Verification Code
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* ============ STEP 2: OTP ============ */}
                        {step === STEPS.OTP && (
                            <form onSubmit={handleVerifyOtp}>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Enter Verification Code</h2>
                                <p className="text-slate-500 text-sm mb-1">
                                    We've sent a 6-digit code to
                                </p>
                                <p className="text-[#06b6d4] font-semibold text-sm mb-6">{email}</p>

                                {/* OTP Boxes */}
                                <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => (otpRefs.current[i] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none ${digit
                                                    ? "border-[#06b6d4] bg-[#06b6d4]/5 text-[#0891b2]"
                                                    : "border-slate-200 bg-slate-50 text-slate-800"
                                                } focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10`}
                                            autoFocus={i === 0}
                                        />
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otp.join("").length !== 6}
                                    className="w-full py-3.5 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white font-bold rounded-xl shadow-lg shadow-[#06b6d4]/25 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mb-4"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Verifying...
                                        </>
                                    ) : "Verify OTP"}
                                </button>

                                {/* Resend */}
                                <div className="text-center">
                                    <p className="text-sm text-slate-500">
                                        Didn't receive the code?{" "}
                                        {resendTimer > 0 ? (
                                            <span className="text-slate-400">Resend in {resendTimer}s</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResend}
                                                disabled={loading}
                                                className="text-[#06b6d4] font-semibold hover:text-[#0891b2] transition-colors"
                                            >
                                                Resend OTP
                                            </button>
                                        )}
                                    </p>
                                </div>

                                {/* Change email */}
                                <button
                                    type="button"
                                    onClick={() => { setStep(STEPS.EMAIL); setOtp(["", "", "", "", "", ""]); setError(""); }}
                                    className="w-full mt-4 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    ← Change email address
                                </button>
                            </form>
                        )}

                        {/* ============ STEP 3: NEW PASSWORD ============ */}
                        {step === STEPS.NEW_PASSWORD && (
                            <form onSubmit={handleResetPassword}>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Set New Password</h2>
                                <p className="text-slate-500 text-sm mb-6">
                                    Create a strong password that you'll remember.
                                </p>

                                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                <div className="relative mb-4">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min 6 characters"
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                                        className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10 transition-all"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                                <div className="relative mb-6">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10 transition-all"
                                    />
                                </div>

                                {/* Password strength indicator */}
                                {newPassword && (
                                    <div className="mb-4">
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3, 4].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`flex-1 h-1.5 rounded-full transition-all ${newPassword.length >= level * 3
                                                            ? level <= 1 ? "bg-red-400" : level <= 2 ? "bg-orange-400" : level <= 3 ? "bg-yellow-400" : "bg-emerald-400"
                                                            : "bg-slate-200"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            {newPassword.length < 6 ? "Too short" : newPassword.length < 9 ? "Fair" : newPassword.length < 12 ? "Good" : "Strong"} password
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white font-bold rounded-xl shadow-lg shadow-[#06b6d4]/25 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Resetting...
                                        </>
                                    ) : "Reset Password"}
                                </button>
                            </form>
                        )}

                        {/* ============ STEP 4: SUCCESS ============ */}
                        {step === STEPS.SUCCESS && (
                            <div className="text-center py-4">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-4xl shadow-xl shadow-emerald-200 mb-6 animate-bounce">
                                    ✓
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Password Reset!</h2>
                                <p className="text-slate-500 text-sm mb-8">
                                    Your password has been successfully changed. You can now login with your new password.
                                </p>
                                <button
                                    onClick={() => navigate("/auth")}
                                    className="w-full py-3.5 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white font-bold rounded-xl shadow-lg shadow-[#06b6d4]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                >
                                    Go to Login
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Back to login (for steps 1-3) */}
                        {step !== STEPS.SUCCESS && (
                            <p className="mt-6 text-center text-slate-500 text-sm">
                                Remember your password?{" "}
                                <button
                                    onClick={() => navigate("/auth")}
                                    className="font-bold text-[#06b6d4] hover:text-[#0891b2] transition-colors"
                                >
                                    Back to Login
                                </button>
                            </p>
                        )}
                    </div>
                </div>

                {/* Trust badge */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure password reset
                </div>
            </div>

            {/* Custom animations */}
            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
        </div>
    );
}
