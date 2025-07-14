const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { protect, authorize } = require("../middleware/auth");
const fetch = require("node-fetch");

// Public routes (no authentication required)
router.post("/session/start", chatController.startSession);
router.post("/session/:sessionId/message", chatController.recordMessage);
router.post("/session/:sessionId/end", chatController.endSession);
router.get("/session/:sessionId/messages", chatController.getSessionMessages);

// Activity feed (no auth required)
router.get("/activity", chatController.getActivityFeed);

// Protected routes (admin only)
router.get(
  "/metrics/realtime",
  protect,
  authorize("admin"),
  chatController.getRealTimeMetrics
);
router.get(
  "/metrics/historical",
  protect,
  authorize("admin"),
  chatController.getHistoricalMetrics
);

// Feedback submission (no auth required)
router.post("/feedback", chatController.submitFeedback);

// Admin fetch all feedback (protected)
router.get(
  "/feedback",
  protect,
  authorize("admin"),
  chatController.getAllFeedback
);

// Chat history endpoints (user must be logged in)
router.get("/history", protect, chatController.getChatHistory);
router.post("/history", protect, chatController.saveChatHistory);
router.delete("/history", protect, chatController.clearChatHistory);
// Delete all chat history (admin only)
router.delete(
  "/history/all",
  protect,
  authorize("admin"),
  chatController.deleteAllChatHistory
);

// Proxy endpoint for chatbot ask
router.post("/ask", async (req, res) => {
  try {
    let sessionId = req.body.sessionId;
    let userId = req.body.userId || null;
    const Metrics = require("../models/Metrics");
    let session;

    if (!sessionId) {
      // Start a new session if not provided
      const crypto = require("crypto");
      sessionId = crypto.randomBytes(16).toString("hex");
      session = new Metrics({
        sessionId,
        userId,
        sessionType: "chatbot",
        date: new Date(),
        startTime: new Date(),
        isActive: true,
        messages: [],
        totalMessages: 0,
        userMessages: 0,
        botMessages: 0,
      });
      await session.save();
    } else {
      session = await Metrics.findOne({ sessionId });
      if (!session) {
        // If sessionId was provided but not found, create a new session
        const crypto = require("crypto");
        sessionId = crypto.randomBytes(16).toString("hex");
        session = new Metrics({
          sessionId,
          userId,
          sessionType: "chatbot",
          date: new Date(),
          startTime: new Date(),
          isActive: true,
          messages: [],
          totalMessages: 0,
          userMessages: 0,
          botMessages: 0,
        });
        await session.save();
      }
    }

    // Log the user message to metrics
    if (session && Array.isArray(session.messages)) {
      session.messages.push({
        role: "user",
        content: req.body.text,
        timestamp: new Date(),
      });
      session.totalMessages += 1;
      session.userMessages += 1;
      await session.save();
    } else {
      console.error(
        "Session or session.messages is undefined after creation/lookup",
        session
      );
      return res.status(500).json({
        error: "Session or session.messages is undefined after creation/lookup",
      });
    }

    // Forward the request to the external API
    const response = await fetch(
      "https://lola9-hura-chatbot-web.hf.space/ask",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: req.body.text }),
      }
    );
    const data = await response.json();

    // Log the bot response to metrics
    if (session && Array.isArray(session.messages)) {
      session.messages.push({
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      });
      session.totalMessages += 1;
      session.botMessages += 1;
      await session.save();
    } else {
      console.error(
        "Session or session.messages is undefined after user message logging",
        session
      );
      return res.status(500).json({
        error:
          "Session or session.messages is undefined after user message logging",
      });
    }

    res.json({ ...data, sessionId });
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy error", details: err.message });
  }
});

module.exports = router;
