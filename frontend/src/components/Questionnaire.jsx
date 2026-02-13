import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveHealthProfile, generateAIQuestions } from "../services/profileService";

export default function Questionnaire() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const totalSteps = 3;

  const [form, setForm] = useState({
    ageGroup: "",
    gender: "",
    height: "",
    weight: "",
    primaryGoal: "",
    activityLevel: "",
    dietType: "",
    allergies: "",
    monthlyFoodBudget: "",
    sleepHours: "",
    skinType: "",
    waterIntakeLiters: ""
  });

  // Define mandatory fields per step
  const mandatoryFields = {
    1: ["ageGroup", "gender", "height", "weight"],
    2: ["primaryGoal", "activityLevel", "dietType"],
    3: ["monthlyFoodBudget", "sleepHours", "skinType", "waterIntakeLiters"]
  };

  // All mandatory fields for final validation
  const allMandatoryFields = [
    ...mandatoryFields[1],
    ...mandatoryFields[2],
    ...mandatoryFields[3]
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateStep = (step) => {
    const stepErrors = {};
    let isValid = true;

    mandatoryFields[step].forEach(field => {
      if (!form[field] || form[field].toString().trim() === "") {
        stepErrors[field] = "This field is required";
        isValid = false;
      }
    });

    // Additional validation for numeric fields
    if (step === 1) {
      if (form.height && (isNaN(form.height) || form.height <= 0)) {
        stepErrors.height = "Please enter a valid height";
        isValid = false;
      }
      if (form.weight && (isNaN(form.weight) || form.weight <= 0)) {
        stepErrors.weight = "Please enter a valid weight";
        isValid = false;
      }
    }

    if (step === 3) {
      if (form.sleepHours && (isNaN(form.sleepHours) || form.sleepHours < 0 || form.sleepHours > 24)) {
        stepErrors.sleepHours = "Please enter valid hours (0-24)";
        isValid = false;
      }
      if (form.waterIntakeLiters && (isNaN(form.waterIntakeLiters) || form.waterIntakeLiters < 0)) {
        stepErrors.waterIntakeLiters = "Please enter a valid amount";
        isValid = false;
      }
      if (form.monthlyFoodBudget && isNaN(form.monthlyFoodBudget)) {
        stepErrors.monthlyFoodBudget = "Please enter a valid amount";
        isValid = false;
      }
    }

    setErrors(stepErrors);
    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        setErrors({});
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    // Validate all steps before submission
    let allValid = true;
    for (let i = 1; i <= totalSteps; i++) {
      if (!validateStep(i)) {
        allValid = false;
        setCurrentStep(i);
        break;
      }
    }

    if (!allValid) return;

    setIsLoading(true);
    setIsProcessing(true);

    try {
      // Save profile
      await saveHealthProfile(form);
      
      // Generate AI questions - this might take time
      await generateAIQuestions(form);
      
      navigate("/ai-questions");
    } catch (err) {
      console.log(err.response?.data || err.message);
      alert("AI generation failed. Please try again.");
      setIsProcessing(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Form sections for stepper
  const formSections = {
    1: [
      { type: 'select', label: "Age Group", name: "ageGroup", options: ["Under 18", "18‑25", "26‑35", "36‑45", "46‑60", "60+"] },
      { type: 'select', label: "Gender", name: "gender", options: ["Male", "Female", "Other"] },
      { type: 'input', label: "Height (cm)", name: "height", placeholder: "e.g., 175", inputType: "number" },
      { type: 'input', label: "Weight (kg)", name: "weight", placeholder: "e.g., 70", inputType: "number" },
    ],
    2: [
      { type: 'select', label: "Primary Health Goal", name: "primaryGoal", options: ["weight_loss", "weight_gain", "maintain_fitness", "improve_stamina", "better_skin", "general_wellness"] },
      { type: 'select', label: "Activity Level", name: "activityLevel", options: ["low", "moderate", "high"] },
      { type: 'select', label: "Diet Type", name: "dietType", options: ["vegetarian", "vegan", "eggetarian", "non_vegetarian", "mixed"] },
      { type: 'input', label: "Allergies (if any)", name: "allergies", placeholder: "e.g., Nuts, Dairy (Optional)", isOptional: true },
    ],
    3: [
      { type: 'input', label: "Monthly Meal Budget ($)", name: "monthlyFoodBudget", placeholder: "e.g., 500", inputType: "number" },
      { type: 'input', label: "Sleep Hours per Night", name: "sleepHours", placeholder: "e.g., 7.5", inputType: "number" },
      { type: 'select', label: "Skin Type", name: "skinType", options: ["oily", "dry", "combination", "normal", "sensitive"] },
      { type: 'input', label: "Daily Water Intake (Liters)", name: "waterIntakeLiters", placeholder: "e.g., 2.5", inputType: "number" },
    ]
  };

  // AI Processing Screen
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#f0fdf4] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#06b6d4]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-16 text-center animate-fade-up">
          <div className="mb-8 relative">
            {/* Animated AI Brain */}
            <div className="w-32 h-32 mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#06b6d4] to-[#10b981] rounded-full animate-ping opacity-20" />
              <div className="absolute inset-2 bg-gradient-to-r from-[#06b6d4] to-[#10b981] rounded-full animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
            Creating Your Personalized Plan
          </h2>
          
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Our AI is analyzing your profile to generate customized health recommendations. This may take a moment...
          </p>

          {/* Processing Steps */}
          <div className="space-y-4 max-w-md mx-auto">
            <ProcessingStep 
              icon="📝" 
              text="Analyzing your profile" 
              delay={0} 
              isActive={true}
            />
            <ProcessingStep 
              icon="🧬" 
              text="Generating personalized questions" 
              delay={500} 
              isActive={true}
            />
            <ProcessingStep 
              icon="✨" 
              text="Preparing your wellness plan" 
              delay={1000} 
              isActive={true}
            />
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing... Please don't close this window
          </div>
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
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#06b6d4]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Floating medical decorations */}
      <div className="absolute top-20 left-20 text-[#06b6d4]/20 text-6xl animate-bounce hidden lg:block">+</div>
      <div className="absolute bottom-32 right-32 text-[#10b981]/20 text-4xl animate-bounce delay-700 hidden lg:block">+</div>

      {/* Main container */}
      <div className="relative w-full max-w-4xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden animate-fade-up">
        
        {/* Header accent bar */}
        <div className="h-2 bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#10b981]" />

        <div className="p-6 md:p-10 lg:p-12">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[#ecfeff] rounded-full border border-[#06b6d4]/20">
              <span className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse" />
              <span className="text-sm font-medium text-[#0891b2]">Step {currentStep} of {totalSteps}</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-3">
              Complete Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] to-[#10b981]">Health Profile</span>
            </h2>
            <p className="text-slate-600 max-w-lg mx-auto">
              Help us create your personalized wellness plan by sharing a few details about yourself
            </p>
          </div>

          {/* Progress bar */}
          <div className="max-w-md mx-auto mb-10">
            <div className="flex justify-between mb-2">
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  onClick={() => {
                    // Allow going back to previous steps
                    if (step < currentStep) setCurrentStep(step);
                  }}
                  className={`flex flex-col items-center transition-all duration-300 ${
                    step < currentStep ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    step <= currentStep 
                      ? 'bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white shadow-lg' 
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {step < currentStep ? '✓' : step}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    step <= currentStep ? 'text-[#0891b2]' : 'text-slate-400'
                  }`}>
                    {step === 1 ? 'Basic' : step === 2 ? 'Goals' : 'Lifestyle'}
                  </span>
                </button>
              ))}
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#06b6d4] to-[#10b981] transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Validation Error Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-up">
              <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-red-800 text-sm">Please fill in all required fields</p>
                <p className="text-red-600 text-xs mt-1">Fields marked with * are mandatory</p>
              </div>
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {formSections[currentStep].map((field) => (
              field.type === 'select' ? (
                <Select
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  options={field.options}
                  value={form[field.name]}
                  handleChange={handleChange}
                  icon={getIcon(field.name)}
                  error={errors[field.name]}
                  isOptional={field.isOptional}
                />
              ) : (
                <Input
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  value={form[field.name]}
                  placeholder={field.placeholder}
                  handleChange={handleChange}
                  icon={getIcon(field.name)}
                  error={errors[field.name]}
                  inputType={field.inputType}
                  isOptional={field.isOptional}
                />
              )
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="flex-1 py-4 px-6 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white font-bold rounded-xl shadow-lg shadow-[#06b6d4]/25 hover:shadow-xl hover:shadow-[#06b6d4]/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Continue
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold rounded-xl shadow-lg shadow-[#10b981]/25 hover:shadow-xl hover:shadow-[#10b981]/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    Complete Profile
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Security note */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your data is encrypted and secure
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
      `}</style>
    </div>
  );
}

// Processing Step Component
function ProcessingStep({ icon, text, delay, isActive }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) return null;

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-fade-up">
      <div className="w-10 h-10 bg-gradient-to-r from-[#06b6d4] to-[#10b981] rounded-lg flex items-center justify-center text-xl">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-slate-800 text-sm">{text}</p>
        <div className="h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#06b6d4] to-[#10b981] rounded-full animate-[loading_2s_ease-in-out_infinite]" 
               style={{ width: '0%', animation: 'loading 2s ease-in-out infinite' }} />
        </div>
      </div>
      <div className="w-6 h-6 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Helper function for icons
function getIcon(fieldName) {
  const icons = {
    ageGroup: "🎂",
    gender: "⚧",
    height: "📏",
    weight: "⚖️",
    primaryGoal: "🎯",
    activityLevel: "🏃",
    dietType: "🥗",
    allergies: "⚠️",
    monthlyFoodBudget: "💰",
    sleepHours: "😴",
    skinType: "✨",
    waterIntakeLiters: "💧"
  };
  return icons[fieldName] || "📋";
}

/* INPUT COMPONENT */
function Input({ label, name, value, placeholder, handleChange, icon, error, inputType = "text", isOptional = false }) {
  return (
    <div className="group">
      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        {label}
        {!isOptional && <span className="text-red-500">*</span>}
        {isOptional && <span className="text-xs font-normal text-slate-400 ml-1">(Optional)</span>}
      </label>
      <div className="relative">
        <input
          type={inputType}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          className={`w-full px-4 py-3.5 rounded-xl border text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none transition-all duration-300 ${
            error 
              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
              : 'border-slate-200 focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10'
          }`}
        />
        {error && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1 animate-fade-up">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/* SELECT COMPONENT */
function Select({ label, name, options, value, handleChange, icon, error, isOptional = false }) {
  return (
    <div className="group">
      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        {label}
        {!isOptional && <span className="text-red-500">*</span>}
        {isOptional && <span className="text-xs font-normal text-slate-400 ml-1">(Optional)</span>}
      </label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={handleChange}
          className={`w-full px-4 py-3.5 rounded-xl border text-slate-800 bg-slate-50 focus:bg-white focus:outline-none transition-all duration-300 appearance-none cursor-pointer ${
            error 
              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
              : 'border-slate-200 focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10'
          }`}
        >
          <option value="">{isOptional ? `Select ${label} (Optional)` : `Select ${label}`}</option>
          {options.map((opt, index) => (
            <option key={index} value={opt}>
              {opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2 text-red-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1 animate-fade-up">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}