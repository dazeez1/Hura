// API Configuration and Utilities for Hura Chatbot
class HuraAPI {
  constructor() {
    this.baseURL = "https://lola9-hura-chatbot-web.hf.space";
    this.endpoints = {
      ask: `${this.baseURL}/ask`,
      health: `${this.baseURL}/health`,
      translateEn2Rw: `${this.baseURL}/translate/en2rw`,
      translateRw2En: `${this.baseURL}/translate/rw2en`,
      maps: `${this.baseURL}/maps`,
      weather: `${this.baseURL}/weather`,
    };
    this.endpoints.chatHistory =
      "https://hura-q92y.onrender.com/api/chat/history";
  }

  // Generic API request method
  async makeRequest(endpoint, method = "GET", data = null) {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(endpoint, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check (optional)
  async checkHealth() {
    return this.makeRequest(this.endpoints.health);
  }

  // Ask question to chatbot (Q&A) via backend proxy for metrics
  async askQuestion(text, sessionId = null, userId = null) {
    const endpoint = "https://hura-q92y.onrender.com/api/chat/ask";
    const body = { text };
    if (sessionId) body.sessionId = sessionId;
    if (userId) body.userId = userId;
    return this.makeRequest(endpoint, "POST", body);
  }

  // Translate English to Kinyarwanda
  async translateEnToRw(text) {
    return this.makeRequest(this.endpoints.translateEn2Rw, "POST", { text });
  }

  // Translate Kinyarwanda to English
  async translateRwToEn(text) {
    return this.makeRequest(this.endpoints.translateRw2En, "POST", { text });
  }

  // Get location info (maps)
  async getLocationInfo(query) {
    return this.makeRequest(this.endpoints.maps, "POST", { query });
  }

  // Get weather info
  async getWeather(query) {
    return this.makeRequest(this.endpoints.weather, "POST", { query });
  }

  // Get chat history for logged-in user
  async getChatHistory(token) {
    return this.makeRequestWithAuth(
      this.endpoints.chatHistory,
      "GET",
      null,
      token
    );
  }

  // Save (replace) chat history for logged-in user
  async saveChatHistory(messages, token) {
    return this.makeRequestWithAuth(
      this.endpoints.chatHistory,
      "POST",
      { messages },
      token
    );
  }

  // Clear chat history for logged-in user
  async clearChatHistory(token) {
    return this.makeRequestWithAuth(
      this.endpoints.chatHistory,
      "DELETE",
      null,
      token
    );
  }

  // Start a chat session for metrics
  async startSession(userId = null, sessionType = "chatbot") {
    const endpoint = "https://hura-q92y.onrender.com/api/chat/session/start";
    const body = { userId, sessionType };
    return this.makeRequest(endpoint, "POST", body);
  }

  // Record a message in a chat session for metrics
  async recordMessage(
    sessionId,
    role,
    content,
    responseTime = null,
    hasFile = false,
    fileType = null
  ) {
    const endpoint = `https://hura-q92y.onrender.com/api/chat/session/${sessionId}/message`;
    const body = { role, content };
    if (responseTime !== null) body.responseTime = responseTime;
    if (hasFile) body.hasFile = true;
    if (fileType) body.fileType = fileType;
    return this.makeRequest(endpoint, "POST", body);
  }

  // End a chat session for metrics
  async endSession(sessionId) {
    const endpoint = `https://hura-q92y.onrender.com/api/chat/session/${sessionId}/end`;
    return this.makeRequest(endpoint, "POST");
  }

  // Helper for authenticated requests
  async makeRequestWithAuth(endpoint, method = "GET", data = null, token = "") {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    if (data) {
      options.body = JSON.stringify(data);
    }
    try {
      const response = await fetch(endpoint, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Detect language (simple implementation)
  detectLanguage(text) {
    // Simple detection - can be improved with a proper language detection library
    const kinyarwandaPattern = /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i;
    return kinyarwandaPattern.test(text) ? "rw" : "en";
  }
}

// Export for use in other files
window.HuraAPI = HuraAPI;
