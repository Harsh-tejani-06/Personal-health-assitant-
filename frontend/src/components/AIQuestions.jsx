import { useEffect, useState } from "react";
import { getAIQuestions, saveAIAnswers } from "../services/profileService";
import { useNavigate } from "react-router-dom";

// Sample 10 AI questions (defined outside component for stable reference)
const sampleQuestions = [
    {
        question: "How do you typically handle stress after a long workday?",
        options: ["Meditation or deep breathing", "Physical exercise", "Watch TV or scroll social media", "Eat comfort food", "Talk to friends/family"]
    },
    {
        question: "What's your biggest challenge in maintaining a healthy diet?",
        options: ["Cravings for unhealthy food", "Lack of time to prepare meals", "Expensive healthy options", "Conflicting nutrition information", "Social eating situations"]
    },
    {
        question: "How many hours do you spend sitting during a typical day?",
        options: ["Less than 4 hours", "4-6 hours", "6-8 hours", "8-10 hours", "More than 10 hours"]
    },
    {
        question: "What's your primary motivation for improving your health?",
        options: ["Increase energy levels", "Improve physical appearance", "Prevent future health issues", "Boost mental clarity", "Keep up with family/activities"]
    },
    {
        question: "How often do you experience midday energy crashes?",
        options: ["Never", "Rarely (once a month)", "Sometimes (weekly)", "Often (2-3 times weekly)", "Daily"]
    },
    {
        question: "Which health metric matters most to you right now?",
        options: ["Weight/BMI", "Sleep quality", "Stress levels", "Fitness endurance", "Overall mood"]
    },
    {
        question: "What's your preferred time for physical activity?",
        options: ["Early morning (5-8 AM)", "Mid-morning (9-11 AM)", "Afternoon (12-4 PM)", "Evening (5-8 PM)", "Late night (9 PM+)", "No preference"]
    },
    {
        question: "How would you describe your current relationship with food?",
        options: ["Mindful and intentional", "Emotional/stress eating", "Convenient/fast-focused", "Restrictive/dieting", "Enjoyable but inconsistent"]
    },
    {
        question: "What prevents you from getting adequate sleep most often?",
        options: ["Work/study schedule", "Screen time/blue light", "Stress or anxiety", "Physical discomfort", "No issues, I sleep well"]
    },
    {
        question: "How do you prefer to track your health progress?",
        options: ["Mobile apps and wearables", "Journal or diary", "Regular check-ins with professionals", "Visual progress photos", "I don't track currently"]
    }
];

export default function AIQuestions() {
    const navigate = useNavigate();
    const [answers, setAnswers] = useState({});
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [progress, setProgress] = useState(0);



    const handleOptionChange = (questionIndex, option) => {
        setAnswers(prev => ({
            ...prev,
            [questionIndex]: option
        }));

        // Auto-advance after selection with delay for better UX
        setTimeout(() => {
            if (questionIndex < questions.length - 1) {
                setCurrentQuestion(questionIndex + 1);
            }
        }, 400);
    };

    const handleSubmit = async () => {
        // Check if all questions answered
        const answeredCount = Object.keys(answers).length;
        if (answeredCount < questions.length) {
            const firstUnanswered = questions.findIndex((_, idx) => !answers[idx]);
            setCurrentQuestion(firstUnanswered);
            return;
        }

        setIsSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers).map(([idx, answer]) => ({
                question: questions[idx].question,
                answer
            }));

            await saveAIAnswers(formattedAnswers);
            navigate("/dashboard");
        } catch {
            alert("Failed to save answers. Please try again.");
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const loadQuestions = async () => {
            setIsLoading(true);
            try {
                // Call backend API
                const data = await getAIQuestions();
                setQuestions(data.aiQuestions);

                // Expected format from backend:
                // [
                //   { question: "...", options: ["a","b","c"] }
                // ]

                if (data && data.length > 0) {
                    setQuestions(data);
                } else {
                    // fallback if DB empty
                    setQuestions(sampleQuestions);
                }
            } catch (err) {
                console.error("Failed to load AI questions:", err);
                // fallback if API fails
                setQuestions(sampleQuestions);
            } finally {
                setIsLoading(false);
            }
        };

        loadQuestions();
    }, []);

    // Update progress
    useEffect(() => {
        const answered = Object.keys(answers).length;
        setProgress((answered / questions.length) * 100);
    }, [answers, questions.length]);

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#f0fdf4] flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-[#06b6d4]/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl animate-pulse delay-1000" />
                </div>

                <div className="relative w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-12 text-center animate-fade-up">
                    <div className="w-20 h-20 mx-auto mb-6 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#06b6d4] to-[#10b981] rounded-full animate-ping opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#06b6d4] to-[#10b981] rounded-full animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Generating Your Questions</h2>
                    <p className="text-slate-600">AI is creating personalized questions based on your profile...</p>
                </div>

                <style>{`
          @keyframes fade-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-up { animation: fade-up 0.8s ease-out; }
        `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#f0fdf4] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">

            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-[#06b6d4]/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Floating decorations */}
            <div className="absolute top-20 left-20 text-[#06b6d4]/20 text-6xl animate-bounce hidden lg:block">?</div>
            <div className="absolute bottom-32 right-32 text-[#10b981]/20 text-4xl animate-bounce delay-700 hidden lg:block">💡</div>

            {/* Main Container */}
            <div className="relative w-full max-w-4xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden animate-fade-up">

                {/* Header accent */}
                <div className="h-2 bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#10b981]" />

                <div className="p-6 md:p-10 lg:p-12">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[#ecfeff] rounded-full border border-[#06b6d4]/20">
                            <span className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-[#0891b2]">AI-Powered Assessment</span>
                        </div>

                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-3">
                            Personalized <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] to-[#10b981]">Health Questions</span>
                        </h2>
                        <p className="text-slate-600 max-w-lg mx-auto">
                            Answer these 10 questions to help our AI create your customized wellness plan
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="max-w-2xl mx-auto mb-8">
                        <div className="flex justify-between text-sm font-medium text-slate-600 mb-2">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#06b6d4] to-[#10b981] transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-center text-sm text-slate-500 mt-2">
                            {Object.keys(answers).length} of {questions.length} answered
                        </p>
                    </div>

                    {/* Questions Container */}
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {questions.map((q, index) => {
                            const isActive = index === currentQuestion;
                            const isAnswered = answers[index] !== undefined;


                            return (
                                <div
                                    key={index}
                                    className={`
                    rounded-2xl border-2 transition-all duration-500 overflow-hidden
                    ${isActive
                                            ? 'border-[#06b6d4] shadow-lg shadow-[#06b6d4]/10 bg-white scale-100'
                                            : isAnswered
                                                ? 'border-[#10b981]/30 bg-[#f0fdf4]/50 scale-[0.98]'
                                                : 'border-slate-100 bg-slate-50/50 scale-[0.98] opacity-60'
                                        }
                  `}
                                >
                                    {/* Question Header */}
                                    <div
                                        className={`
                      p-5 md:p-6 cursor-pointer flex items-center justify-between
                      ${isActive ? 'bg-gradient-to-r from-[#06b6d4]/5 to-[#10b981]/5' : ''}
                    `}
                                        onClick={() => setCurrentQuestion(index)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                        ${isAnswered
                                                    ? 'bg-[#10b981] text-white'
                                                    : isActive
                                                        ? 'bg-[#06b6d4] text-white'
                                                        : 'bg-slate-200 text-slate-500'
                                                }
                      `}>
                                                {isAnswered ? '✓' : index + 1}
                                            </div>
                                            <h3 className={`font-semibold text-lg ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                                                {q.question}
                                            </h3>
                                        </div>
                                        {isAnswered && !isActive && (
                                            <span className="text-[#10b981] font-medium text-sm bg-[#10b981]/10 px-3 py-1 rounded-full">
                                                Answered
                                            </span>
                                        )}
                                    </div>

                                    {/* Options */}
                                    <div className={`
                    px-6 pb-6 transition-all duration-500
                    ${isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}
                  `}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                            {q.options.map((opt, i) => (
                                                <label
                                                    key={i}
                                                    className={`
                            relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                            ${answers[index] === opt
                                                            ? 'border-[#06b6d4] bg-[#06b6d4]/5 shadow-md'
                                                            : 'border-slate-200 hover:border-[#06b6d4]/50 hover:bg-slate-50'
                                                        }
                          `}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`q-${index}`}
                                                        checked={answers[index] === opt}
                                                        onChange={() => handleOptionChange(index, opt)}
                                                        className="w-5 h-5 text-[#06b6d4] border-slate-300 focus:ring-[#06b6d4] focus:ring-2"
                                                    />
                                                    <span className={`ml-3 font-medium ${answers[index] === opt ? 'text-[#0891b2]' : 'text-slate-700'}`}>
                                                        {opt}
                                                    </span>
                                                    {answers[index] === opt && (
                                                        <div className="absolute right-4 text-[#06b6d4]">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Navigation & Submit */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-10 max-w-3xl mx-auto">
                        <button
                            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                            disabled={currentQuestion === 0}
                            className="flex-1 py-4 px-6 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Previous
                        </button>

                        {currentQuestion < questions.length - 1 ? (
                            <button
                                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                                className="flex-1 py-4 px-6 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white font-bold rounded-xl shadow-lg shadow-[#06b6d4]/25 hover:shadow-xl hover:shadow-[#06b6d4]/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                Next Question
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || Object.keys(answers).length < questions.length}
                                className="flex-1 py-4 px-6 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold rounded-xl shadow-lg shadow-[#10b981]/25 hover:shadow-xl hover:shadow-[#10b981]/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Complete Assessment
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Skip hint */}
                    <p className="text-center text-xs text-slate-400 mt-6">
                        Click on any question number above to jump to that question
                    </p>
                </div>
            </div>

            {/* Custom animations */}
            <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.8s ease-out; }
      `}</style>
        </div>
    );
}