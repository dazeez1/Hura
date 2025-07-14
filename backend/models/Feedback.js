const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow anonymous feedback
    },
    sessionId: {
      type: String,
      required: false,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "Negative sentiment",
        "Feature request",
        "Bug",
        "End of chat",
        "Other",
      ],
    },
    comment: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["new", "reviewed", "resolved"],
      default: "new",
    },
    flaggedBy: {
      type: String,
      enum: ["user", "system"],
      default: "user",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
