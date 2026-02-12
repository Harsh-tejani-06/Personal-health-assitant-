import { useEffect, useState } from "react";
import { getAIQuestions } from "../services/profileService";
import { saveAIAnswers } from "../services/profileService";
import { useNavigate } from "react-router-dom";


export default function AIQuestions() {

    const navigate = useNavigate();
    const [answers, setAnswers] = useState([]);
    const [questions, setQuestions] = useState([]);

    const handleOptionChange = (question, answer) => {
        setAnswers(prev => {
            const filtered = prev.filter(a => a.question !== question);
            return [...filtered, { question, answer }];
        });
    };

    const handleSubmit = async () => {
        try {
            await saveAIAnswers(answers);
            navigate("/dashboard");
        } catch (err) {
            alert("Failed to save answers");
        }
    };

    useEffect(() => {
        const loadQuestions = async () => {
            const data = await getAIQuestions();
            setQuestions(data);
        };

        loadQuestions();
    }, []);

    return (
        <div className="w-screen min-h-screen bg-gradient-to-br from-[#2a0748] via-[#7f2dd0] to-[#0b0b0f] flex items-center justify-center py-10">
            <div className="w-200 bg-[#14141a]/95 backdrop-blur-md rounded-2xl shadow-2xl p-10">

                {/* TITLE */}
                <h2 className="text-3xl font-semibold text-white mb-2">
                    AI Questions
                </h2>
                <p className="text-gray-400 mb-8">
                    Answer these personalized questions based on your profile
                </p>

                {questions.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">Loading questions...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {questions.map((q, index) => (
                            <div
                                key={index}
                                className="p-5 bg-[#0f172a] rounded-xl border border-white/10"
                            >
                                <p className="text-white font-semibold mb-4 text-lg">
                                    {index + 1}. {q.question}
                                </p>

                                <div className="space-y-3">
                                    {q.options.map((opt, i) => (
                                        <label key={i} className="flex items-center space-x-3 text-gray-300 hover:text-white transition cursor-pointer group">
                                            <input
                                                type="radio"
                                                name={`q-${index}`}
                                                onChange={() =>
                                                    handleOptionChange(q.question, opt)
                                                }
                                                className="
                          w-4 h-4
                          accent-[#b89cff]
                          bg-[#14141a]
                          border border-white/20
                          rounded-full
                          focus:ring-2 focus:ring-[#b89cff]/50
                          focus:outline-none
                          cursor-pointer
                        "
                                            />
                                            <span className="group-hover:text-white transition">
                                                {opt}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* SUBMIT BUTTON */}
                        <button  onClick={handleSubmit}
                            className="
                mt-8
                w-full
                bg-[#b89cff]
                text-black
                font-semibold
                py-4
                rounded-xl
                hover:scale-105
                transition
                shadow-lg
                cursor-pointer
              "
                        >
                            Submit Answers
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}