import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const healthChatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: String, // "YYYY-MM-DD"
        required: true
    },
    messages: [chatMessageSchema]
}, { timestamps: true });

// One document per user per date
healthChatSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("HealthChat", healthChatSchema);
