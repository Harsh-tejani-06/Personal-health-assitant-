const uploadLimitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  count: {
    type: Number,
    default: 0
  },
  resetTime: Date
});

export default mongoose.model("UploadLimit", uploadLimitSchema);