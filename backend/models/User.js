import mongoose from "mongoose";

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

  // Health personalization fields (as discussed)
  age: Number,
  gender: String,
  weight: Number,
  height: Number,
  conditions: [String],
  goals: [String]
}, { timestamps: true });

export default mongoose.model("User", userSchema);
