import mongoose from "mongoose";

const starredRecipeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    recipe: {
        recipe_name: { type: String, required: true },
        ingredients: [String],
        steps: [String],
        calories: { type: mongoose.Schema.Types.Mixed },
        protein: String,
        best_time: String,
        reason: String,
    },
}, { timestamps: true });

// Prevent duplicate starred recipes for the same user
starredRecipeSchema.index({ user: 1, "recipe.recipe_name": 1 }, { unique: true });

export default mongoose.models.StarredRecipe || mongoose.model("StarredRecipe", starredRecipeSchema);
