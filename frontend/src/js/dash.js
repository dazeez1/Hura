document.addEventListener("DOMContentLoaded", () => {
  // Check if user is authenticated and is admin
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user || user.role !== "admin") {
    window.location.href = "./auth/signup.html";
    return;
  }

  // API Base URL
  const API_BASE_URL = "http://localhost:4000/api";

  // Display admin name
  const adminNameElement = document.getElementById("adminName");
  if (adminNameElement) {
    adminNameElement.textContent = user.fullName;
  }

  // Display admin profile picture
  const userAvatar = document.querySelector(".user-avatar");

  // Load profile picture from MongoDB
  async function loadProfilePicture() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const profilePicture = data.data.settings.profilePicture;

        if (userAvatar && profilePicture) {
          userAvatar.style.backgroundImage = `url(${profilePicture})`;
          userAvatar.style.backgroundSize = "cover";
          userAvatar.style.backgroundPosition = "center";
          userAvatar.innerHTML = ""; // Remove the default icon
        }
      }
    } catch (error) {
      console.error("Error loading profile picture:", error);
    }
  }

  // Load profile picture
  loadProfilePicture();

  // Retry loading profile picture after a short delay to ensure DOM is ready
  setTimeout(() => {
    loadProfilePicture();
  }, 1000);

  // --- Sidebar/Hamburger Menu Logic ---
  const hamburgerMenu = document.getElementById("hamburgerMenu");
  const navMenu = document.getElementById("navMenu");
  const sidebar = document.querySelector(".sidebar");

  if (hamburgerMenu && navMenu) {
    hamburgerMenu.addEventListener("click", () => {
      hamburgerMenu.classList.toggle("active");
      navMenu.classList.toggle("show");
    });

    // Close menu when clicking outside of the sidebar
    document.addEventListener("click", (event) => {
      if (
        !sidebar.contains(event.target) &&
        navMenu.classList.contains("show")
      ) {
        hamburgerMenu.classList.remove("active");
        navMenu.classList.remove("show");
      }
    });

    // Hide menu on resize
    window.addEventListener("resize", () => {
      if (window.innerWidth > 995) {
        hamburgerMenu.classList.remove("active");
        navMenu.classList.remove("show");
      }
    });
  }

  // --- API Data Fetching ---
  let lastDashboardData = null;
  let lastActivityData = null;
  let totalMessagesHistory = [];
  let userMessagesHistory = [];
  let botMessagesHistory = [];
  let totalMessagesChart = null;
  let userMessagesChart = null;
  let botMessagesChart = null;

  // Chart data persistence keys
  const CHART_STORAGE_KEYS = {
    totalMessages: "dashboard_total_messages_history",
    userMessages: "dashboard_user_messages_history",
    botMessages: "dashboard_bot_messages_history",
    lastUpdate: "dashboard_last_update",
  };

  // Save chart history to localStorage
  const saveChartHistory = () => {
    try {
      localStorage.setItem(
        CHART_STORAGE_KEYS.totalMessages,
        JSON.stringify(totalMessagesHistory)
      );
      localStorage.setItem(
        CHART_STORAGE_KEYS.userMessages,
        JSON.stringify(userMessagesHistory)
      );
      localStorage.setItem(
        CHART_STORAGE_KEYS.botMessages,
        JSON.stringify(botMessagesHistory)
      );
      localStorage.setItem(
        CHART_STORAGE_KEYS.lastUpdate,
        new Date().toISOString()
      );
    } catch (error) {
      console.warn("Failed to save chart history:", error);
    }
  };

  // Load chart history from localStorage
  const loadChartHistory = () => {
    try {
      const lastUpdate = localStorage.getItem(CHART_STORAGE_KEYS.lastUpdate);
      const now = new Date();

      // Check if stored data is from today (within 24 hours)
      if (lastUpdate) {
        const lastUpdateDate = new Date(lastUpdate);
        const hoursDiff = (now - lastUpdateDate) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          // Load stored data
          const storedTotal = localStorage.getItem(
            CHART_STORAGE_KEYS.totalMessages
          );
          const storedUser = localStorage.getItem(
            CHART_STORAGE_KEYS.userMessages
          );
          const storedBot = localStorage.getItem(
            CHART_STORAGE_KEYS.botMessages
          );

          if (storedTotal) totalMessagesHistory = JSON.parse(storedTotal);
          if (storedUser) userMessagesHistory = JSON.parse(storedUser);
          if (storedBot) botMessagesHistory = JSON.parse(storedBot);

          return true;
        }
      }
    } catch (error) {
      console.warn("Failed to load chart history:", error);
    }

    return false;
  };

  // Initialize chart history with some default data points to prevent single-dot charts
  const initializeChartHistory = () => {
    // Try to load existing history first
    const hasStoredData = loadChartHistory();

    if (!hasStoredData) {
      // Create default data points only if no stored data exists
      const now = new Date();

      // Create 5 default data points with 0 values to show a baseline
      for (let i = 4; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 6 * 60 * 1000); // 6 minutes apart
        const timeLabel = time.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        totalMessagesHistory.push({ time: timeLabel, value: 0 });
        userMessagesHistory.push({ time: timeLabel, value: 0 });
        botMessagesHistory.push({ time: timeLabel, value: 0 });
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch real-time metrics
      const realtimeResponse = await fetch(
        `${API_BASE_URL}/chat/metrics/realtime`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!realtimeResponse.ok) {
        throw new Error("Failed to fetch real-time metrics");
      }

      const realtimeData = await realtimeResponse.json();

      // Combine data
      const data = {
        totalUsers: realtimeData.data.totalUsers,
        totalMessages: realtimeData.data.totalMessages,
        userMessages: realtimeData.data.userMessages,
        botMessages: realtimeData.data.botMessages,
      };

      // Check if data has actually changed
      const hasChanged =
        !lastDashboardData ||
        lastDashboardData.totalUsers !== data.totalUsers ||
        lastDashboardData.totalMessages !== data.totalMessages ||
        lastDashboardData.userMessages !== data.userMessages ||
        lastDashboardData.botMessages !== data.botMessages;

      if (hasChanged) {
        lastDashboardData = data;
        updateUI(data);
        updateTotalMessagesChart(data);
        updateUserMessagesChart(data);
        updateBotMessagesChart(data);

        // Save chart history after updates
        saveChartHistory();
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (lastDashboardData) {
        updateUI(lastDashboardData);
      }
    }
  };

  const updateUI = (data) => {
    // 1. Total Active Users
    const totalUsersElement = document.getElementById("total-users");
    if (totalUsersElement) {
      totalUsersElement.textContent = data.totalUsers || 0;
    }

    // 2. Total Messages
    const totalMessagesElement = document.getElementById("total-messages");
    if (totalMessagesElement) {
      totalMessagesElement.textContent = data.totalMessages || 0;
    }

    // 3. User Messages
    const userMessagesElement = document.getElementById("user-messages");
    if (userMessagesElement) {
      userMessagesElement.textContent = data.userMessages || 0;
    }

    // 4. Bot Messages
    const botMessagesElement = document.getElementById("bot-messages");
    if (botMessagesElement) {
      botMessagesElement.textContent = data.botMessages || 0;
    }
  };

  // --- Chart Rendering ---
  const updateTotalMessagesChart = (data) => {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Check if this is the first real data update (not initialization)
    const isFirstUpdate =
      totalMessagesHistory.length === 5 &&
      totalMessagesHistory.every((item) => item.value === 0);

    if (isFirstUpdate) {
      // Replace the last default point with real data
      totalMessagesHistory[totalMessagesHistory.length - 1] = {
        time: timeLabel,
        value: data.totalMessages || 0,
      };
    } else {
      // Add new data point to history (keep last 10 points)
      totalMessagesHistory.push({
        time: timeLabel,
        value: data.totalMessages || 0,
      });

      // Keep only last 10 data points
      if (totalMessagesHistory.length > 10) {
        totalMessagesHistory.shift();
      }
    }

    // Prepare chart data
    const labels = totalMessagesHistory.map((item) => item.time);
    const chartData = totalMessagesHistory.map((item) => item.value);

    // Destroy existing chart if it exists
    if (totalMessagesChart) {
      totalMessagesChart.destroy();
    }

    // Create new chart
    const ctx = document.getElementById("totalMessagesChart");
    if (ctx) {
      totalMessagesChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Total Messages",
              data: chartData,
              borderColor: "#136873",
              backgroundColor: "rgba(19, 104, 115, 0.2)",
              tension: 0.4,
              fill: true,
              borderWidth: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "#f0f0f5" },
              ticks: {
                stepSize: 1,
              },
            },
            x: {
              grid: { display: false },
              ticks: {
                maxRotation: 0,
              },
            },
          },
          interaction: {
            intersect: false,
            mode: "index",
          },
        },
      });
    }
  };

  const updateUserMessagesChart = (data) => {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Check if this is the first real data update (not initialization)
    const isFirstUpdate =
      userMessagesHistory.length === 5 &&
      userMessagesHistory.every((item) => item.value === 0);

    if (isFirstUpdate) {
      // Replace the last default point with real data
      userMessagesHistory[userMessagesHistory.length - 1] = {
        time: timeLabel,
        value: data.userMessages || 0,
      };
    } else {
      // Add new data point to history (keep last 10 points)
      userMessagesHistory.push({
        time: timeLabel,
        value: data.userMessages || 0,
      });

      // Keep only last 10 data points
      if (userMessagesHistory.length > 10) {
        userMessagesHistory.shift();
      }
    }

    // Prepare chart data
    const labels = userMessagesHistory.map((item) => item.time);
    const chartData = userMessagesHistory.map((item) => item.value);

    // Destroy existing chart if it exists
    if (userMessagesChart) {
      userMessagesChart.destroy();
    }

    // Create new chart
    const ctx = document.getElementById("userMessagesChart");
    if (ctx) {
      userMessagesChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "User Messages",
              data: chartData,
              borderColor: "#28a745",
              backgroundColor: "rgba(40, 167, 69, 0.2)",
              tension: 0.4,
              fill: true,
              borderWidth: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "#f0f0f5" },
              ticks: {
                stepSize: 1,
              },
            },
            x: {
              grid: { display: false },
              ticks: {
                maxRotation: 0,
              },
            },
          },
          interaction: {
            intersect: false,
            mode: "index",
          },
        },
      });
    }
  };

  const updateBotMessagesChart = (data) => {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Check if this is the first real data update (not initialization)
    const isFirstUpdate =
      botMessagesHistory.length === 5 &&
      botMessagesHistory.every((item) => item.value === 0);

    if (isFirstUpdate) {
      // Replace the last default point with real data
      botMessagesHistory[botMessagesHistory.length - 1] = {
        time: timeLabel,
        value: data.botMessages || 0,
      };
    } else {
      // Add new data point to history (keep last 10 points)
      botMessagesHistory.push({
        time: timeLabel,
        value: data.botMessages || 0,
      });

      // Keep only last 10 data points
      if (botMessagesHistory.length > 10) {
        botMessagesHistory.shift();
      }
    }

    // Prepare chart data
    const labels = botMessagesHistory.map((item) => item.time);
    const chartData = botMessagesHistory.map((item) => item.value);

    // Destroy existing chart if it exists
    if (botMessagesChart) {
      botMessagesChart.destroy();
    }

    // Create new chart
    const ctx = document.getElementById("botMessagesChart");
    if (ctx) {
      botMessagesChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Bot Messages",
              data: chartData,
              borderColor: "#ffc107",
              backgroundColor: "rgba(255, 193, 7, 0.2)",
              tension: 0.4,
              fill: true,
              borderWidth: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "#f0f0f5" },
              ticks: {
                stepSize: 1,
              },
            },
            x: {
              grid: { display: false },
              ticks: {
                maxRotation: 0,
              },
            },
          },
          interaction: {
            intersect: false,
            mode: "index",
          },
        },
      });
    }
  };

  const renderTranslationAccuracyChart = (chartData) => {
    const ctx = document
      .getElementById("translationAccuracyChart")
      .getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: "Accuracy",
            data: chartData.data,
            borderColor: "#5a5a5a",
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: false, grid: { color: "#f0f0f5" } },
          x: { grid: { display: false } },
        },
      },
    });
  };

  // --- Activity Feed ---
  const fetchActivityFeed = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/activity?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch activity feed");
      }

      const data = await response.json();

      // Check if activity data has actually changed
      const currentActivityHash = JSON.stringify(data.data);
      const hasChanged =
        !lastActivityData || lastActivityData !== currentActivityHash;

      if (hasChanged) {
        lastActivityData = currentActivityHash;
        updateActivityFeed(data.data);
      }
    } catch (error) {
      console.error("Error fetching activity feed:", error);
    }
  };

  const updateActivityFeed = (activities) => {
    const activityList = document.getElementById("activity-list");
    if (!activityList) return;

    if (!activities || activities.length === 0) {
      activityList.innerHTML = `
        <li class="activity-item">
          <div class="activity-icon">📊</div>
          <div class="activity-details">
            <p>No recent activity</p>
            <span>Activity will appear here as users interact with the chatbot</span>
          </div>
        </li>
      `;
      return;
    }

    activityList.innerHTML = activities
      .map((activity) => {
        const timeAgo = getTimeAgo(activity.timestamp);
        return `
          <li class="activity-item">
            <div class="activity-icon">
              <i class="${activity.icon}"></i>
            </div>
            <div class="activity-details">
              <p>${activity.title}</p>
              <span>${activity.subtitle} • ${timeAgo}</span>
            </div>
          </li>
        `;
      })
      .join("");
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  // Smart polling with change detection
  const startSmartPolling = () => {
    // Initialize chart history first
    initializeChartHistory();

    // Initial load
    fetchDashboardData();
    fetchActivityFeed();

    // Smart polling - check for changes every 30 seconds
    setInterval(() => {
      fetchDashboardData();
    }, 30000);

    setInterval(() => {
      fetchActivityFeed();
    }, 30000);
  };

  // Start smart polling
  startSmartPolling();

  // Also refresh when user becomes active after being idle
  let isIdle = false;
  let idleTimer;

  const resetIdleTimer = () => {
    if (isIdle) {
      isIdle = false;
      fetchDashboardData(); // Refresh data when user becomes active
    }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      isIdle = true;
    }, 300000); // 5 minutes
  };

  // Reset idle timer on user activity
  document.addEventListener("mousemove", resetIdleTimer);
  document.addEventListener("keypress", resetIdleTimer);
  document.addEventListener("click", resetIdleTimer);

  // Initial idle timer
  resetIdleTimer();
});
