// Initialize API instance
const api = new HuraAPI();

// DOM elements
const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessage = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = fileUploadWrapper.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

// User data and state
const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
};

// Store chat history
const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

// Create message element with dynamic classes
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Generate bot response using FastAPI backend
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  try {
    // Get response from API
    const data = await api.askQuestion(
      userData.message,
      window.currentSessionId,
      getCurrentUserId()
    );
    const responseText =
      data.response || "Sorry, I couldn't process your request.";

    // Update sessionId if returned (for continuity)
    if (data.sessionId) {
      window.currentSessionId = data.sessionId;
      sessionStarted = true;
    }

    // Display response
    messageElement.innerText = responseText;

    // Add conversation to chat history
    chatHistory.push({
      role: "user",
      content: userData.message,
      timestamp: new Date().toISOString(),
    });

    chatHistory.push({
      role: "assistant",
      content: responseText,
      timestamp: new Date().toISOString(),
    });
    saveChatHistoryToBackend();
  } catch (error) {
    console.error("API Error:", error);
    messageElement.innerText =
      "Sorry, I'm having trouble connecting to the server. Please try again later.";
    messageElement.style.color = "#ff0000";
  } finally {
    // Reset user's file data, removing thinking indicator and scroll chat to bottom
    userData.file = {};
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

// Track current chatbot mode
let chatbotMode = null; // null, 'qa', etc.

// Handle outgoing user messages
const handleOutgoingMessage = async (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();

  if (!userData.message) return;

  // Handle invalid option at main menu
  if (
    !chatbotMode &&
    !["1", "2", "3", "4", "menu", "quit"].includes(
      userData.message.trim().toLowerCase()
    )
  ) {
    const errorMessage = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" />
      <div class="message-text">
        ❌ Please select a valid option (1-4).<br><br>
        📋 <b>Main Menu</b><br><br>
        1️⃣ Ask Questions<br>
        2️⃣ Translation<br>
        3️⃣ Location Help<br>
        4️⃣ Weather<br><br>
        Type a number to continue, or type <b>menu</b> to see the full menu again.
      </div>`;
    const errorDiv = createMessageElement(errorMessage, "bot-message");
    chatBody.appendChild(errorDiv);
    chatHistory.push({
      role: "system",
      content: errorMessage,
      timestamp: new Date().toISOString(),
    });
    saveChatHistoryToBackend();
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    detectFeedbackTrigger(userData.message);
    return;
  }

  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));
  fileUploadWrapper.classList.remove("file-uploaded");

  // Create and display user message
  const messageContent = `<div class="message-text"></div>
                          ${
                            userData.file.data
                              ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />`
                              : ""
                          }`;

  const outgoingMessageDiv = createMessageElement(
    messageContent,
    "user-message"
  );
  outgoingMessageDiv.querySelector(".message-text").innerText =
    userData.message;
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  // Save user message to chat history and backend
  chatHistory.push({
    role: "user",
    content: userData.message,
    timestamp: new Date().toISOString(),
  });
  saveChatHistoryToBackend();

  // Always exit Q&A mode on menu or quit
  if (["menu", "quit"].includes(userData.message.trim().toLowerCase())) {
    chatbotMode = null;
  }

  // Intercept 'menu' command and show custom menu
  if (userData.message.trim().toLowerCase() === "menu") {
    const menuMessage = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" />
      <div class="message-text">
        📋 <b>Main Menu</b><br><br>
        Please select a service:<br><br>
        <b>1️⃣ Ask Questions</b><br>
        Get information about Kigali, attractions, culture, and tourism.<br><br>
        <b>2️⃣ Translation</b><br>
        Translate between English and Kinyarwanda.<br><br>
        <b>3️⃣ Location Help</b><br>
        Find places, get directions, and discover nearby locations.<br><br>
        <b>4️⃣ Weather</b><br>
        Get current weather and forecasts for Kigali.<br><br>
        <hr style='border: none; border-top: 1px solid #eee; margin: 1em 0;'>
        <b>Commands:</b><br>
        •⁠  ⁠Type a number (1-4) to select a service<br>
        •⁠  ⁠Type <b>menu</b> to see this menu again<br>
        •⁠  ⁠Type <b>quit</b> to reset and start over
      </div>`;
    const menuDiv = createMessageElement(menuMessage, "bot-message");
    chatBody.appendChild(menuDiv);
    chatHistory.push({
      role: "system",
      content: menuMessage,
      timestamp: new Date().toISOString(),
    });
    saveChatHistoryToBackend();
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    detectFeedbackTrigger(userData.message);
    return;
  }

  // Intercept 'quit' command and reset chat
  if (userData.message.trim().toLowerCase() === "quit") {
    // Optionally clear chat or reset state here
    const quitMessage = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" />
      <div class="message-text">Chat has been reset. Type <b>menu</b> to start again.</div>`;
    const quitDiv = createMessageElement(quitMessage, "bot-message");
    chatBody.appendChild(quitDiv);
    chatHistory.push({
      role: "system",
      content: quitMessage,
      timestamp: new Date().toISOString(),
    });
    saveChatHistoryToBackend();
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    detectFeedbackTrigger(userData.message);
    return;
  }

  // Intercept '1' command and show Q&A service info, enter Q&A mode
  if (userData.message.trim() === "1") {
    chatbotMode = "qa";
    const qaMessage = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" />
      <div class="message-text">
        🤖 <b>Question & Answer Service</b><br><br>
        I can answer questions about Kigali, Rwanda, tourism, culture, and attractions.<br><br>
        <b>Examples of what you can ask:</b><br>
        •⁠  ⁠"Tell me about Kigali Genocide Memorial"<br>
        •⁠  ⁠"What are the best restaurants in Kigali?"<br>
        •⁠  ⁠"How safe is Kigali for tourists?"<br>
        •⁠  ⁠"What's the best time to visit Rwanda?"<br>
        •⁠  ⁠"Tell me about Rwandan culture"<br><br>
        Please type your question:<br><br>
        <hr style='border: none; border-top: 1px solid #eee; margin: 1em 0;'>
        <b>Commands:</b><br>
        •⁠  ⁠Type <b>menu</b> to go back to main menu<br>
        •⁠  ⁠Type <b>quit</b> to reset and start over
      </div>`;
    const qaDiv = createMessageElement(qaMessage, "bot-message");
    chatBody.appendChild(qaDiv);
    chatHistory.push({
      role: "system",
      content: qaMessage,
      timestamp: new Date().toISOString(),
    });
    saveChatHistoryToBackend();
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    detectFeedbackTrigger(userData.message);
    return;
  }

  // Intercept '2' command and show Translation service info, enter translation mode
  if (userData.message.trim() === "2") {
    chatbotMode = "translation";
    chatbotTranslationDirection = null;
    const translationMessage = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" />
      <div class="message-text">
        🔄 <b>Translation Service</b><br><br>
        Choose a translation direction:<br><br>
        <b>a) English to Kinyarwanda</b><br>
        Translate English text to Kinyarwanda.<br><br>
        <b>b) Kinyarwanda to English</b><br>
        Translate Kinyarwanda text to English.<br><br>
        <hr style='border: none; border-top: 1px solid #eee; margin: 1em 0;'>
        <b>Commands:</b><br>
        •⁠  ⁠Type 'a' or 'b' to select direction<br>
        •⁠  ⁠Type <b>menu</b> to go back to main menu<br>
        •⁠  ⁠Type <b>quit</b> to reset and start over
      </div>`;
    const translationDiv = createMessageElement(
      translationMessage,
      "bot-message"
    );
    chatBody.appendChild(translationDiv);
    chatHistory.push({
      role: "system",
      content: translationMessage,
      timestamp: new Date().toISOString(),
    });
    saveChatHistoryToBackend();
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    detectFeedbackTrigger(userData.message);
    return;
  }

  // Handle translation direction selection in translation mode
  if (
    chatbotMode === "translation" &&
    userData.message.trim().toLowerCase() === "a"
  ) {
    chatbotTranslationDirection = "en2rw";
    const en2rwMessage = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" />
      <div class="message-text">
        🔄 <b>English to Kinyarwanda Translation</b><br><br>
        Please type the English text you want to translate:<br><br>
        <i>Example: Hello, how are you?</i><br><br>
        <hr style='border: none; border-top: 1px solid #eee; margin: 1em 0;'>
        Type <b>menu</b> to go back to main menu
      </div>`;
    const en2rwDiv = createMessageElement(en2rwMessage, "bot-message");
    chatBody.appendChild(en2rwDiv);
    chatHistory.push({
      role: "system",
      content: en2rwMessage,
      timestamp: new Date().toISOString(),
    });
    saveChatHistoryToBackend();
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    detectFeedbackTrigger(userData.message);
    return;
  }
  if (
    chatbotMode === "translation" &&
    userData.message.trim().toLowerCase() === "b"
  ) {
    chatbotTranslationDirection = "rw2en";
    const rw2enMessage = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" />
      <div class="message-text">
        🔄 <b>Kinyarwanda to English Translation</b><br><br>
        Please type the Kinyarwanda text you want to translate:<br><br>
        <i>Example: Muraho, amakuru?</i><br><br>
        <hr style='border: none; border-top: 1px solid #eee; margin: 1em 0;'>
        Type <b>menu</b> to go back to main menu
      </div>`;
    const rw2enDiv = createMessageElement(rw2enMessage, "bot-message");
    chatBody.appendChild(rw2enDiv);
    chatHistory.push({
      role: "system",
      content: rw2enMessage,
      timestamp: new Date().toISOString(),
    });
    saveChatHistoryToBackend();
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    detectFeedbackTrigger(userData.message);
    return;
  }

  // Intercept '3' command and show Location service info, enter location mode
  if (userData.message.trim() === "3") {
    chatbotMode = "location";
    const locationMessage = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" />
      <div class="message-text">
        🗺️ <b>Location Service</b><br><br>
        I can help you find places and get directions in Kigali.<br><br>
        <b>Examples of what you can ask:</b><br>
        •⁠  ⁠"Where is Kimironko market?"<br>
        •⁠  ⁠"How do I get to Kigali Genocide Memorial?"<br>
        •⁠  ⁠"Find restaurants near me"<br>
        •⁠  ⁠"Directions to Kigali International Airport"<br><br>
        Please type your location question:<br><br>
        <hr style='border: none; border-top: 1px solid #eee; margin: 1em 0;'>
        <b>Commands:</b><br>
        •⁠  ⁠Type <b>menu</b> to go back to main menu<br>
        •⁠  ⁠Type <b>quit</b> to reset and start over
      </div>`;
    const locationDiv = createMessageElement(locationMessage, "bot-message");
    chatBody.appendChild(locationDiv);
    chatHistory.push({
      role: "system",
      content: locationMessage,
      timestamp: new Date().toISOString(),
    });
    saveChatHistoryToBackend();
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    detectFeedbackTrigger(userData.message);
    return;
  }

  // If in location mode, send question to maps endpoint and show answer
  if (
    chatbotMode === "location" &&
    !["menu", "quit", "1", "2", "3", "4"].includes(
      userData.message.trim().toLowerCase()
    )
  ) {
    setTimeout(async () => {
      const messageContent = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" /> 
            <div class="message-text">
              <div class="thinking-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
              </div>
            </div>`;
      const incomingMessageDiv = createMessageElement(
        messageContent,
        "bot-message",
        "thinking"
      );
      chatBody.appendChild(incomingMessageDiv);
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
      try {
        const result = await api.getLocationInfo(userData.message);
        let locationAnswer =
          result.answer ||
          result.response ||
          result.location ||
          "[No location info returned]";
        // Try to extract address for Google Maps link
        let address = "";
        let name = "";
        // Simple regex to extract name and address from the format: 📍 **Name** 📍 Address: ...
        const match = locationAnswer.match(/\*\*(.+)\*\*.*Address: (.+)/);
        if (match) {
          name = match[1].trim();
          address = match[2].trim();
        } else {
          address = locationAnswer
            .replace(/<[^>]+>/g, "")
            .replace(/Address:/i, "")
            .trim();
        }
        if (address) {
          const mapsQuery = encodeURIComponent(address);
          locationAnswer += `<br>🔗 <a href="https://www.google.com/maps/search/?api=1&query=${mapsQuery}" target="_blank">View on Google Maps</a>`;
        }
        incomingMessageDiv.classList.remove("thinking");
        incomingMessageDiv.querySelector(".message-text").innerHTML =
          locationAnswer;
      } catch (error) {
        incomingMessageDiv.classList.remove("thinking");
        incomingMessageDiv.querySelector(".message-text").innerHTML =
          "Sorry, I couldn't find that location. Please try again later.";
      }
    }, 600);
    detectFeedbackTrigger(userData.message);
    return;
  }

  // Intercept '4' command and show Weather service info, enter weather mode
  if (userData.message.trim() === "4") {
    chatbotMode = "weather";
    const weatherMessage = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" />
      <div class="message-text">
        🌤️ <b>Weather Service</b><br><br>
        I can provide weather information for Kigali.<br><br>
        <b>Examples of what you can ask:</b><br>
        •⁠  ⁠"What's the weather today?"<br>
        •⁠  ⁠"Weather forecast for this week"<br>
        •⁠  ⁠"Is it going to rain tomorrow?"<br>
        •⁠  ⁠"Temperature in Kigali"<br><br>
        Please type your weather question:<br><br>
        <hr style='border: none; border-top: 1px solid #eee; margin: 1em 0;'>
        <b>Commands:</b><br>
        •⁠  ⁠Type <b>menu</b> to go back to main menu<br>
        •⁠  ⁠Type <b>quit</b> to reset and start over
      </div>`;
    const weatherDiv = createMessageElement(weatherMessage, "bot-message");
    chatBody.appendChild(weatherDiv);
    chatHistory.push({
      role: "system",
      content: weatherMessage,
      timestamp: new Date().toISOString(),
    });
    saveChatHistoryToBackend();
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    detectFeedbackTrigger(userData.message);
    return;
  }

  // If in weather mode, send question to weather endpoint and show answer
  if (
    chatbotMode === "weather" &&
    !["menu", "quit", "1", "2", "3", "4"].includes(
      userData.message.trim().toLowerCase()
    )
  ) {
    setTimeout(async () => {
      const messageContent = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" /> 
            <div class="message-text">
              <div class="thinking-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
              </div>
            </div>`;
      const incomingMessageDiv = createMessageElement(
        messageContent,
        "bot-message",
        "thinking"
      );
      chatBody.appendChild(incomingMessageDiv);
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
      try {
        const result = await api.getWeather(userData.message);
        const weatherAnswer =
          result.answer ||
          result.response ||
          result.weather ||
          "[No weather info returned]";
        incomingMessageDiv.classList.remove("thinking");
        incomingMessageDiv.querySelector(".message-text").innerHTML =
          weatherAnswer;
      } catch (error) {
        incomingMessageDiv.classList.remove("thinking");
        incomingMessageDiv.querySelector(".message-text").innerHTML =
          "Sorry, I couldn't get the weather information. Please try again later.";
      }
    }, 600);
    detectFeedbackTrigger(userData.message);
    return;
  }

  // If in Q&A mode, send question to API and show answer
  if (chatbotMode === "qa") {
    // Simulate bot response with thinking indicator after a delay
    setTimeout(() => {
      const messageContent = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" /> 
            <div class="message-text">
              <div class="thinking-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
              </div>
            </div>`;

      const incomingMessageDiv = createMessageElement(
        messageContent,
        "bot-message",
        "thinking"
      );
      chatBody.appendChild(incomingMessageDiv);
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
      generateBotResponse(incomingMessageDiv);
    }, 600);
    detectFeedbackTrigger(userData.message);
    return;
  }

  // If in translation mode and a direction is selected, send text to translation endpoint
  if (
    chatbotMode === "translation" &&
    chatbotTranslationDirection &&
    !["a", "b", "menu", "quit"].includes(userData.message.trim().toLowerCase())
  ) {
    // Show thinking indicator
    setTimeout(async () => {
      const messageContent = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" /> 
            <div class="message-text">
              <div class="thinking-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
              </div>
            </div>`;
      const incomingMessageDiv = createMessageElement(
        messageContent,
        "bot-message",
        "thinking"
      );
      chatBody.appendChild(incomingMessageDiv);
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
      try {
        let result;
        if (chatbotTranslationDirection === "en2rw") {
          result = await api.translateEnToRw(userData.message);
        } else {
          result = await api.translateRwToEn(userData.message);
        }
        const translation =
          result.translation ||
          result.translated ||
          result.response ||
          "[No translation returned]";
        incomingMessageDiv.classList.remove("thinking");
        incomingMessageDiv.querySelector(
          ".message-text"
        ).innerHTML = `<b>Translation:</b><br>${translation}`;
      } catch (error) {
        incomingMessageDiv.classList.remove("thinking");
        incomingMessageDiv.querySelector(".message-text").innerHTML =
          "Sorry, I couldn't translate your text. Please try again later.";
      }
      // After translation, reset direction but stay in translation mode
      chatbotTranslationDirection = null;
    }, 600);
    detectFeedbackTrigger(userData.message);
    return;
  }

  // Simulate bot response with thinking indicator after a delay
  setTimeout(() => {
    const messageContent = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" /> 
          <div class="message-text">
            <div class="thinking-indicator">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>`;

    const incomingMessageDiv = createMessageElement(
      messageContent,
      "bot-message",
      "thinking"
    );
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv);
  }, 600);

  // Always check for feedback trigger after sending a message
  detectFeedbackTrigger(userData.message);
};

// Adjust input field height dynamically
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius =
    messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// Handle Enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  if (
    e.key === "Enter" &&
    !e.shiftKey &&
    userMessage &&
    window.innerWidth > 768
  ) {
    handleOutgoingMessage(e);
  }
});

// Handle file input change and preview the selected file
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    fileInput.value = "";
    fileUploadWrapper.querySelector("img").src = e.target.result;
    fileUploadWrapper.classList.add("file-uploaded");
    const base64String = e.target.result.split(",")[1];

    // Store file data in userData
    userData.file = {
      data: base64String,
      mime_type: file.type,
    };
  };

  reader.readAsDataURL(file);
});

// Cancel file upload
fileCancelButton.addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-uploaded");
});

// Initialize emoji picker and handle emoji selection
const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if (e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    } else {
      document.body.classList.remove("show-emoji-picker");
    }
  },
});

document.querySelector(".chat-form").appendChild(picker);

// Event listeners
sendMessage.addEventListener("click", (e) => handleOutgoingMessage(e));
document
  .querySelector("#file-upload")
  .addEventListener("click", () => fileInput.click());
closeChatbot.addEventListener("click", () =>
  document.body.classList.remove("show-chatbot")
);
chatbotToggler.addEventListener("click", () =>
  document.body.classList.toggle("show-chatbot")
);

// Info popover and action buttons logic
const infoBtn = document.getElementById("info-chatbot");
const infoPopover = document.getElementById("info-popover");
const clearChatBtn = document.getElementById("clear-chat-btn");
const logoutBtn = document.getElementById("logout-btn");

if (infoBtn && infoPopover) {
  infoBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    infoPopover.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (
      infoPopover.classList.contains("show") &&
      !infoPopover.contains(e.target) &&
      e.target !== infoBtn
    ) {
      infoPopover.classList.remove("show");
    }
  });
}

if (clearChatBtn) {
  clearChatBtn.addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    try {
      await api.clearChatHistory(token);
      chatHistory.length = 0;
      renderChatHistory([]);
      // Show welcome message again
      const welcome = `<img src='../../public/Favicon.png' class='bot-avatar' alt='logo' />
        <div class='message-text'>🌍 <b>Welcome to Hura Tourism Chatbot!</b><br><br>I'm your AI assistant for exploring Kigali, Rwanda. I can help you with:<ul style='margin: 0.5em 0 0.5em 1.2em; padding: 0;'><li>Tourism information and recommendations</li><li>English ↔️ Kinyarwanda translation</li><li>Location and directions help</li><li>Weather information</li></ul><b>How to get started:</b><br>Type <b>menu</b> to see all available services and start exploring!<br><br>🇷🇼 <b>Ready to explore Rwanda? Type <span style='color:#136873'>menu</span> to begin!</b></div>`;
      chatBody.appendChild(createMessageElement(welcome, "bot-message"));
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
      infoPopover.classList.remove("show");
    } catch (err) {
      alert("Failed to clear chat history.");
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    // Show logout message in chat
    const logoutMessage = `<img src="../../public/Favicon.png" class="bot-avatar" alt="logo" />
      <div class="message-text">
        Logging out... Thank you for using Hura!
      </div>`;
    const logoutDiv = createMessageElement(logoutMessage, "bot-message");
    chatBody.appendChild(logoutDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    // Close popover
    infoPopover.classList.remove("show");

    // Wait 2 seconds, then logout
    setTimeout(() => {
      // Clear authentication data (same as settings)
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // End current chat session
      endChatSessionIfNeeded();

      // Redirect to main page (different from settings)
      window.location.href = "../../../index.html";
    }, 2000);
  });
}

// Initialize API health check on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const healthData = await api.checkHealth();
    console.log("API Health Check:", healthData);

    if (healthData.status === "healthy") {
      console.log("✅ Hura API is healthy and ready!");
    } else {
      console.warn("⚠️ API health check returned unexpected status");
    }
  } catch (error) {
    console.error("❌ API health check failed:", error);
    console.warn("Some features may not work properly");
  }
});

// Feedback modal logic
let feedbackShown = false;
const feedbackModal = document.getElementById("feedbackModal");
const feedbackForm = document.getElementById("feedbackForm");
const feedbackThankYou = document.getElementById("feedbackThankYou");
const closeFeedbackModal = document.getElementById("closeFeedbackModal");

function showFeedbackModal() {
  if (feedbackShown) return;
  feedbackModal.style.display = "flex";
  feedbackThankYou.style.display = "none";
  feedbackForm.style.display = "block";
  feedbackShown = true;
}

function hideFeedbackModal() {
  feedbackModal.style.display = "none";
}

if (closeFeedbackModal) {
  closeFeedbackModal.addEventListener("click", hideFeedbackModal);
}

if (feedbackModal) {
  feedbackModal.addEventListener("click", (e) => {
    if (e.target === feedbackModal) hideFeedbackModal();
  });
}

if (feedbackForm) {
  feedbackForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const reason = document.getElementById("feedbackReason").value;
    const comment = document.getElementById("feedbackComment").value;
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const sessionId = window.currentSessionId || null;
    if (!reason) {
      document.getElementById("feedbackReason").focus();
      return;
    }
    try {
      const response = await fetch("https://huraaichat.com/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          comment,
          sessionId,
          userId: user ? user.id : null,
        }),
      });
      if (response.ok) {
        console.log("Feedback submitted successfully");
      } else {
        console.error("Feedback submission failed", await response.text());
      }
      feedbackForm.style.display = "none";
      feedbackThankYou.style.display = "block";
      setTimeout(hideFeedbackModal, 2000);
    } catch (err) {
      alert("Failed to submit feedback. Please try again later.");
    }
  });
}

// Detect 'thank you' or end-of-chat to show feedback modal
function detectFeedbackTrigger(message) {
  const thankYouPhrases = ["thank you", "thanks", "thx", "thank u"]; // Add more as needed
  if (
    thankYouPhrases.some((phrase) => message.toLowerCase().includes(phrase))
  ) {
    showFeedbackModal();
  }
  // You can also call showFeedbackModal() on end-of-chat event
}

// Utility: Render chat history from array
function renderChatHistory(history) {
  chatBody.innerHTML = "";
  history.forEach((msg) => {
    const content = msg.content;
    let classes = [];
    if (msg.role === "user") classes = ["user-message"];
    else if (msg.role === "assistant") classes = ["bot-message"];
    else classes = ["bot-message", "system-message"];
    const div = createMessageElement(
      `<div class='message-text'>${content}</div>`,
      ...classes
    );
    chatBody.appendChild(div);
  });
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
}

// Utility: Save chat history to backend
async function saveChatHistoryToBackend() {
  const token = localStorage.getItem("token");
  try {
    await api.saveChatHistory(chatHistory, token);
  } catch (err) {
    console.warn("Failed to save chat history to backend");
  }
}

// On page load, fetch and render chat history
window.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const res = await api.getChatHistory(token);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Copy to chatHistory array
        chatHistory.length = 0;
        res.data.forEach((m) => chatHistory.push(m));
        renderChatHistory(chatHistory);
      }
    } catch (err) {
      console.warn("Could not load chat history from backend");
    }
  }
});

// After each message, save chat history
// (Insert this after chatHistory.push in handleOutgoingMessage and generateBotResponse)

// --- Chatbot Metrics Session Management ---
let sessionStarted = false;
window.currentSessionId = null;

async function startChatSessionIfNeeded() {
  if (!sessionStarted) {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const userId = user && user.id ? user.id : null;
    try {
      const res = await api.startSession(userId, "chatbot");
      if (res.success && res.sessionId) {
        window.currentSessionId = res.sessionId;
        sessionStarted = true;
      }
    } catch (err) {
      console.warn("Failed to start chat session for metrics");
    }
  }
}

async function endChatSessionIfNeeded() {
  if (sessionStarted && window.currentSessionId) {
    try {
      await api.endSession(window.currentSessionId);
    } catch (err) {
      // Ignore errors on end
    }
    sessionStarted = false;
    window.currentSessionId = null;
  }
}

// Call start session when chatbot is opened
if (document.body.classList.contains("show-chatbot")) {
  startChatSessionIfNeeded();
}

// Also start session on first message send
const originalHandleOutgoingMessage = handleOutgoingMessage;
handleOutgoingMessage = async function (e) {
  await startChatSessionIfNeeded();
  await originalHandleOutgoingMessage(e);
};

// Log user and bot messages to metrics
async function logMessageToMetrics(role, content, responseTime = null) {
  if (window.currentSessionId) {
    try {
      await api.recordMessage(
        window.currentSessionId,
        role,
        content,
        responseTime
      );
    } catch (err) {
      // Ignore logging errors
    }
  }
}

// Patch chat message logic to log to metrics
// For user messages:
const originalUserMessagePush = chatHistory.push.bind(chatHistory);
chatHistory.push = function (msg) {
  if (msg.role === "user") {
    logMessageToMetrics("user", msg.content);
  } else if (msg.role === "assistant") {
    // For bot, try to log response time if available (not implemented here)
    logMessageToMetrics("assistant", msg.content);
  }
  return originalUserMessagePush(msg);
};

// End session when chat is closed or page unload
if (closeChatbot) {
  closeChatbot.addEventListener("click", endChatSessionIfNeeded);
}
window.addEventListener("beforeunload", endChatSessionIfNeeded);

// Utility to get userId from localStorage
function getCurrentUserId() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return user && user.id ? user.id : null;
}
