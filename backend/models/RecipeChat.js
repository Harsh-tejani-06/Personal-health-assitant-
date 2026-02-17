import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "ai"],
    required: true
  },
  text: String,
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const recipeChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  messages: [messageSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("RecipeChat", recipeChatSchema);
