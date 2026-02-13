import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  ingredients: [String],

  recipeText: String,

  images: [String], // image paths

  createdAt: {
    type: Date,
    default: Date.now
  }
});





export default mongoose.model("Recipe", recipeSchema);
