import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Questionnaire() {

  const navigate = useNavigate();

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

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  };

  const handleSubmit = () => {

    console.log("User Profile Data:", form);

    navigate("/dashboard");

  };

  return (

    <div className="w-screen min-h-screen bg-linear-to-br from-[#2a0748] via-[#7f2dd0] to-[#0b0b0f] flex items-center justify-center py-10">

      <div className="w-200 bg-[#14141a]/95 backdrop-blur-md rounded-2xl shadow-2xl p-10">

        {/* TITLE */}

        <h2 className="text-3xl font-semibold text-white mb-2">
          Complete Your Health Profile
        </h2>

        <p className="text-gray-400 mb-8">
          Help us personalize your experience
        </p>


        {/* QUESTIONS */}

        <div className="grid grid-cols-2 gap-5">

          <Select
            label="Age Group"
            name="ageGroup"
            options={[
              "Under 18",
              "18‑25",
              "26‑35",
              "36‑45",
              "46‑60",
              "60+"
            ]}
            handleChange={handleChange}
          />

          <Select
            label="Gender"
            name="gender"
            options={[
              "Male",
              "Female",
              "Other"
            ]}
            handleChange={handleChange}
          />

          <Input
            label="Height (cm)"
            name="height"
            handleChange={handleChange}
          />

          <Input
            label="Weight (kg)"
            name="weight"
            handleChange={handleChange}
          />

          <Select
            label="Primary Health Goal"
            name="primaryGoal"
            options={[
              "weight_loss",
              "weight_gain",
              "maintain_fitness",
              "improve_stamina",
              "better_skin",
              "general_wellness"
            ]}
            handleChange={handleChange}
          />

          <Select
            label="Activity Level"
            name="activityLevel"
            options={[
              "low",
              "moderate",
              "high"
            ]}
            handleChange={handleChange}
          />

          <Select
            label="Diet Type"
            name="dietType"
            options={[
              "vegetarian",
              "vegan",
              "eggetarian",
              "non_vegetarian",
              "mixed"
            ]}
            handleChange={handleChange}
          />

          <Input
            label="Allergies ( If any )"
            name="allergies"
            handleChange={handleChange}
          />

          <Input
            label="Monthly Meal Budget ( How much you can spend )"
            name="monthlyFoodBudget"
            handleChange={handleChange}
          />

          <Input
            label="Sleep Hours"
            name="sleepHours"
            handleChange={handleChange}
          />

          <Select
            label="Skin Type"
            name="skinType"
            options={[
              "oily",
              "dry",
              "combination",
              "normal",
              "sensitive"
            ]}
            handleChange={handleChange}
          />

          <Input
            label="Water Intake (Liters)"
            name="waterIntakeLiters"
            handleChange={handleChange}
          />

        </div>


        {/* BUTTON */}

        <button
          onClick={handleSubmit}
          className="
            mt-10
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
          Continue
        </button>


      </div>

    </div>

  );

}



/* INPUT COMPONENT */

function Input({ label, name, handleChange }) {

  return (

    <div>

      <label className="text-gray-300 text-sm mb-1 block">
        {label}
      </label>

      <input
        name={name}
        onChange={handleChange}
        className="
          w-full
          bg-[#0f172a]
          text-white
          px-4 py-3
          rounded-lg
          border border-white/10
          focus:outline-none
          focus:border-[#b89cff]
        "
      />

    </div>

  );

}



/* SELECT COMPONENT */

function Select({ label, name, options, handleChange }) {

  return (

    <div>

      <label className="text-gray-300 text-sm mb-1 block">
        {label}
      </label>

      <select
        name={name}
        onChange={handleChange}
        className="
          w-full
          bg-[#0f172a]
          text-white
          px-4 py-3
          rounded-lg
          border border-white/10
        "
      >

        <option value="">Select</option>

        {options.map((opt, index) => (

          <option key={index} value={opt}>
            {opt}
          </option>

        ))}

      </select>

    </div>

  );

}
