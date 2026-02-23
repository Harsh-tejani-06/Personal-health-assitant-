import mongoose from "mongoose";

const dailyActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: String, // "YYYY-MM-DD"
        required: true
    },
    exercise: {
        completed: { type: Boolean, default: false },
        details: { type: String, default: "" },
        duration: { type: Number, default: 0 } // minutes
    },
    diet: {
        completed: { type: Boolean, default: false },
        details: { type: String, default: "" }
    },
    skinCare: {
        completed: { type: Boolean, default: false },
        details: { type: String, default: "" }
    },
    water: {
        amount: { type: Number, default: 0 }, // in liters
        completed: { type: Boolean, default: false } // if goal reached
    },
    pointsEarned: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// One document per user per day
dailyActivitySchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyActivity", dailyActivitySchema);
