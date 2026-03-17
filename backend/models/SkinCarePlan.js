import mongoose from "mongoose";

// -------- Individual step in a routine --------
const routineStepSchema = new mongoose.Schema({
    step: { type: Number, required: true },
    product: { type: String, required: true },
    instruction: { type: String, required: true },
    duration: { type: String, default: "" } // e.g. "2 minutes", "30 seconds"
}, { _id: false });

// -------- Daily log entry --------
const dailyLogSchema = new mongoose.Schema({
    date: { type: String, required: true }, // "YYYY-MM-DD"
    morningCompleted: { type: [Boolean], default: [] },
    nightCompleted: { type: [Boolean], default: [] },
    notes: { type: String, default: "" }
}, { _id: false });

// -------- Product entry --------
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ["allopathic", "homeopathic"], required: true },
    category: { type: String, default: "" } // e.g. "cleanser", "moisturizer"
}, { _id: false });

// -------- Main schema --------
const skinCarePlanSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true // one plan per user
    },
    products: [productSchema],
    plan: {
        morning: [routineStepSchema],
        night: [routineStepSchema],
        followFor: { type: String, default: "" }, // e.g. "30 days", "3 months"
        tips: { type: [String], default: [] },
        generatedAt: { type: Date, default: Date.now }
    },
    dailyLogs: [dailyLogSchema]
}, { timestamps: true });

export default mongoose.model("SkinCarePlan", skinCarePlanSchema);
