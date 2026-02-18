import mongoose from "mongoose";

// ---------------- BASIC HEALTH QUESTIONS ----------------
const healthProfileSchema = new mongoose.Schema({
  ageGroup: String,
  gender: String,
  height: Number,
  weight: Number,

  primaryGoal: {
    type: String,
    enum: [
      "weight_loss",
      "weight_gain",
      "maintain_fitness",
      "improve_stamina",
      "better_skin",
      "general_wellness"
    ]
  },

  activityLevel: {
    type: String,
    enum: ["low", "moderate", "high"]
  },

  dietType: {
    type: String,
    enum: ["vegetarian", "vegan", "eggetarian", "non_vegetarian", "mixed"]
  },

  foodRestrictions: String,
  monthlyFoodBudget: Number,
  sleepHours: Number,

  skinType: {
    type: String,
    enum: ["oily", "dry", "combination", "normal", "sensitive"]
  },

  waterIntakeLiters: Number

}, { _id: false });


// ---------------- DYNAMIC LLM QUESTIONS ----------------
// Flexible structure for future AI questions

const aiQuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String
}, { _id: false });
// ---------------- USER SCHEMA ----------------

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  // Step 1: Static onboarding answers
  healthProfile: healthProfileSchema,

  // Gemini generated questions
  aiQuestions: [aiQuestionSchema],

  // Gamification
  totalPoints: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActivityDate: { type: String, default: "" } // "YYYY-MM-DD"

}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
