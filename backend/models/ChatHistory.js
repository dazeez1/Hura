const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant", "system"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  // Optionally add: attachments, type, etc.
});

const ChatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  messages: [MessageSchema],
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatHistory", ChatHistorySchema);
