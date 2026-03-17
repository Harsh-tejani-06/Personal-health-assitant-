import mongoose from "mongoose";

const recipeItemSchema = new mongoose.Schema({
    recipeName: { type: String, required: true },
    ingredients: [String],
    calories: String,
    protein: String,
    bestTime: String,
    reason: String,
    addedAt: { type: Date, default: Date.now }
});

const dietSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: String, // "YYYY-MM-DD"
        required: true
    },
    morning: [recipeItemSchema],
    afternoon: [recipeItemSchema],
    night: [recipeItemSchema]
}, { timestamps: true });

// One diet document per user per day
dietSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("Diet", dietSchema);
