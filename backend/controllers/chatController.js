const Metrics = require("../models/Metrics");
const crypto = require("crypto");
const Feedback = require("../models/Feedback");
const ChatHistory = require("../models/ChatHistory");

// Helper: Generate session ID
const generateSessionId = () => {
  return crypto.randomBytes(16).toString("hex");
};

// Helper: Detect language from text
const detectLanguage = (text) => {
  // Simple language detection based on common words
  const kinyarwandaWords = [
    "murakoze",
    "amahoro",
    "mwiriwe",
    "urakoze",
    "ndagukunda",
  ];
  const frenchWords = [
    "bonjour",
    "merci",
    "au revoir",
    "s'il vous plaît",
    "excusez-moi",
  ];

  const lowerText = text.toLowerCase();

  if (kinyarwandaWords.some((word) => lowerText.includes(word))) {
    return "Kinyarwanda";
  } else if (frenchWords.some((word) => lowerText.includes(word))) {
    return "French";
  } else {
    return "English";
  }
};

// Helper: Extract intent from user message
const extractIntent = (message) => {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("travel") ||
    lowerMessage.includes("visit") ||
    lowerMessage.includes("go")
  ) {
    return "Travel Planning";
  } else if (
    lowerMessage.includes("hotel") ||
    lowerMessage.includes("stay") ||
    lowerMessage.includes("accommodation")
  ) {
    return "Accommodation";
  } else if (
    lowerMessage.includes("food") ||
    lowerMessage.includes("eat") ||
    lowerMessage.includes("restaurant")
  ) {
    return "Local Cuisine";
  } else if (
    lowerMessage.includes("transport") ||
    lowerMessage.includes("bus") ||
    lowerMessage.includes("car")
  ) {
    return "Transportation";
  } else if (
    lowerMessage.includes("culture") ||
    lowerMessage.includes("tradition") ||
    lowerMessage.includes("custom")
  ) {
    return "Cultural Information";
  } else {
    return "General Inquiry";
  }
};

// @desc    Start a new chat session
// @route   POST /api/chat/session/start
exports.startSession = async (req, res) => {
  try {
    const { userId, sessionType = "chatbot" } = req.body;
    const userAgent = req.headers["user-agent"] || "Unknown";
    const ipAddress = req.ip || req.connection.remoteAddress;

    const sessionId = generateSessionId();

    const session = new Metrics({
      sessionId,
      userId,
      sessionType,
      userAgent,
      ipAddress,
      date: new Date(),
      startTime: new Date(),
      isActive: true,
      messages: [],
      totalMessages: 0,
      userMessages: 0,
      botMessages: 0,
    });

    await session.save();

    res.status(201).json({
      success: true,
      sessionId,
      message: "Session started",
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Record a message in chat session
// @route   POST /api/chat/session/:sessionId/message
exports.recordMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { role, content, hasFile, fileType, responseTime } = req.body;

    const session = await Metrics.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Extract intent and language for user messages
    let intent = null;
    let language = null;

    if (role === "user") {
      intent = extractIntent(content);
      language = detectLanguage(content);
    }

    // Add message to session
    const message = {
      role,
      content,
      hasFile: hasFile || false,
      fileType,
      intent,
      language,
      responseTime,
    };

    session.messages.push(message);
    session.totalMessages += 1;

    if (role === "user") {
      session.userMessages += 1;
    } else {
      session.botMessages += 1;
    }

    // Update average response time
    if (responseTime) {
      const totalResponseTime = session.messages
        .filter((m) => m.responseTime)
        .reduce((sum, m) => sum + m.responseTime, 0);
      const responseCount = session.messages.filter(
        (m) => m.responseTime
      ).length;
      session.averageResponseTime = totalResponseTime / responseCount;
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: "Message recorded",
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    End a chat session
// @route   POST /api/chat/session/:sessionId/end
exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Metrics.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.endTime = new Date();
    session.isActive = false;
    session.sessionDuration = Math.floor(
      (session.endTime - session.startTime) / 1000
    );

    await session.save();

    res.status(200).json({
      success: true,
      message: "Session ended",
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Get real-time dashboard metrics
// @route   GET /api/chat/metrics/realtime
exports.getRealTimeMetrics = async (req, res) => {
  try {
    const Metrics = require("../models/Metrics");
    const User = require("../models/User");

    const [totalStats, userStats] = await Promise.all([
      Metrics.aggregate([
        { $match: { sessionType: "chatbot" } },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: "$totalMessages" },
            userMessages: { $sum: "$userMessages" },
            botMessages: { $sum: "$botMessages" },
            activeSessions: { $sum: { $cond: ["$isActive", 1, 0] } },
          },
        },
      ]),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            adminUsers: {
              $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
            },
            regularUsers: {
              $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const stats = totalStats[0] || {
      totalMessages: 0,
      userMessages: 0,
      botMessages: 0,
      activeSessions: 0,
    };

    const userCount = userStats[0] || {
      totalUsers: 0,
      adminUsers: 0,
      regularUsers: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        totalUsers: userCount.totalUsers,
        adminUsers: userCount.adminUsers,
        regularUsers: userCount.regularUsers,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Get historical metrics for charts
// @route   GET /api/chat/metrics/historical
exports.getHistoricalMetrics = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get daily metrics
    const dailyMetrics = await Metrics.aggregate([
      {
        $match: {
          sessionType: "chatbot",
          startTime: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$startTime" },
          },
          sessions: { $sum: 1 },
          messages: { $sum: "$totalMessages" },
          avgResponseTime: { $avg: "$averageResponseTime" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get user intents for chart
    const userIntents = await Metrics.aggregate([
      {
        $match: {
          sessionType: "chatbot",
          startTime: { $gte: startDate, $lte: endDate },
          "messages.intent": { $exists: true, $ne: null },
        },
      },
      {
        $unwind: "$messages",
      },
      {
        $match: {
          "messages.intent": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$messages.intent",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 4,
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyMetrics,
        userIntents: {
          labels: userIntents.map((item) => item._id),
          data: userIntents.map((item) => item.count),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Get messages for a specific session
// @route   GET /api/chat/session/:sessionId/messages
exports.getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Metrics.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        startTime: session.startTime,
        totalMessages: session.totalMessages,
        userMessages: session.userMessages,
        botMessages: session.botMessages,
        messages: session.messages || [],
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Get recent activity feed
// @route   GET /api/chat/activity
exports.getActivityFeed = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentSessions = await Metrics.find({
      sessionType: "chatbot",
      startTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .populate("userId", "fullName email");

    const activityFeed = recentSessions.map((session) => {
      let title, subtitle, icon;

      if (session.sessionType === "login") {
        title = session.userId
          ? `User Login: ${session.userId.fullName}`
          : "Anonymous Login";
        subtitle = `Logged in at ${session.startTime.toLocaleTimeString()}`;
        icon = "fas fa-sign-in-alt";
      } else {
        title =
          session.userId && session.userId.fullName
            ? `Chat Session: ${session.userId.fullName}`
            : `Chat Session: ${session.sessionId.substring(0, 8)}...`;
        subtitle = `${session.totalMessages} messages`;
        icon = "fas fa-comments";
      }

      return {
        id: session._id,
        sessionId: session.sessionId,
        type: session.sessionType,
        title,
        subtitle,
        timestamp: session.startTime,
        icon,
      };
    });

    res.status(200).json({
      success: true,
      data: activityFeed,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Submit user feedback
// @route   POST /api/feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { reason, comment, sessionId } = req.body;
    let userId = null;
    if (req.user) userId = req.user.id;

    if (!reason) {
      return res.status(400).json({ error: "Reason is required" });
    }

    const feedback = new Feedback({
      userId,
      sessionId,
      reason,
      comment,
      flaggedBy: "user",
    });
    await feedback.save();
    res.status(201).json({ success: true, message: "Feedback submitted" });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Get all feedback for admin dashboard
// @route   GET /api/feedback
exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("userId", "fullName email")
      .sort({ date: -1 });
    res.status(200).json({ success: true, data: feedback });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Get chat history for logged-in user
// @route   GET /api/chat/history
// @access  Private
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await ChatHistory.findOne({ userId });
    res
      .status(200)
      .json({ success: true, data: history ? history.messages : [] });
  } catch (err) {
    console.error(
      "[getChatHistory] Error:",
      err.stack,
      "User:",
      req.user ? req.user.id : null
    );
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Save (replace) chat history for logged-in user
// @route   POST /api/chat/history
// @access  Private
exports.saveChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messages } = req.body;
    await ChatHistory.findOneAndUpdate(
      { userId },
      { $set: { messages, lastUpdated: new Date() } },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(
      "[saveChatHistory] Error:",
      err.stack,
      "User:",
      req.user ? req.user.id : null,
      "Body:",
      req.body
    );
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Clear chat history for logged-in user
// @route   DELETE /api/chat/history
// @access  Private
exports.clearChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    await ChatHistory.findOneAndUpdate(
      { userId },
      { $set: { messages: [], lastUpdated: new Date() } },
      { new: true }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(
      "[clearChatHistory] Error:",
      err.stack,
      "User:",
      req.user ? req.user.id : null
    );
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Delete all chat history (admin only)
// @route   DELETE /api/chat/history/all
// @access  Admin
exports.deleteAllChatHistory = async (req, res) => {
  try {
    await ChatHistory.deleteMany({});
    res
      .status(200)
      .json({ success: true, message: "All chat history deleted." });
  } catch (err) {
    console.error("[deleteAllChatHistory] Error:", err.stack);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
