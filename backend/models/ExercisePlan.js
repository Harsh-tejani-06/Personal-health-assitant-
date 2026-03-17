import mongoose from "mongoose";

// -------- Individual exercise step --------
const exerciseStepSchema = new mongoose.Schema({
    step: { type: Number, required: true },
    name: { type: String, required: true },
    instruction: { type: String, required: true },
    duration: { type: String, default: "" },       // e.g. "30 seconds", "2 minutes"
    sets: { type: String, default: "" },            // e.g. "3 sets"
    reps: { type: String, default: "" },            // e.g. "12 reps"
    youtubeQuery: { type: String, default: "" },    // search-friendly name for YouTube link
    caloriesBurned: { type: String, default: "" }   // e.g. "50 kcal"
}, { _id: false });

// -------- Daily log entry --------
const dailyLogSchema = new mongoose.Schema({
    date: { type: String, required: true }, // "YYYY-MM-DD"
    morningCompleted: { type: [Boolean], default: [] },
    nightCompleted: { type: [Boolean], default: [] },
    notes: { type: String, default: "" }
}, { _id: false });

// -------- Main schema --------
const exercisePlanSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true // one plan per user
    },
    plan: {
        morning: [exerciseStepSchema],
        night: [exerciseStepSchema],
        followFor: { type: String, default: "" },         // e.g. "30 days"
        tips: { type: [String], default: [] },
        basedOnGoal: { type: String, default: "" },       // e.g. "weight_loss"
        generatedAt: { type: Date, default: Date.now }
    },
    dailyLogs: [dailyLogSchema]
}, { timestamps: true });

export default mongoose.model("ExercisePlan", exercisePlanSchema);
