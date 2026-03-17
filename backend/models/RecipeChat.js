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
  date: {
    type: String, // "YYYY-MM-DD"
    required: true
  },
  messages: [messageSchema]
}, { timestamps: true });

// One document per user per date
recipeChatSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("RecipeChat", recipeChatSchema);
