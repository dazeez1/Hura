document.addEventListener("DOMContentLoaded", () => {
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

  // --- API Data Simulation ---
  const fetchDashboardData = () => {
    // Simulated data based on the provided image
    const data = {
      liveMetrics: {
        activeSessions: 1234,
        sessionsChange: 12,
        topIntent: "Travel Planning",
        nlpDrift: "Normal",
        translationAccuracy: 98,
        accuracyChange: -2,
      },
      userIntents: {
        labels: [
          "Travel Planning",
          "Accommodation",
          "Local Cuisine",
          "Transportation",
        ],
        data: [55, 30, 25, 15],
      },
      translationAccuracyData: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        data: [82, 85, 88, 86, 90, 92],
      },
      activityFeed: [
        {
          icon: "fas fa-user-plus",
          title: "New User Session",
          subtitle: "User ID: 12345",
        },
        {
          icon: "fas fa-file-alt",
          title: "Content Update",
          subtitle: "Attraction: The Grand Palace",
        },
        {
          icon: "fas fa-paper-plane",
          title: "User Feedback",
          subtitle: "Intent: Travel Planning",
        },
      ],
    };

    updateUI(data);
  };

  // --- UI Update Functions ---
  const updateUI = (data) => {
    // Live Metrics
    document.getElementById("active-sessions").textContent =
      data.liveMetrics.activeSessions.toLocaleString();
    document.getElementById(
      "sessions-change"
    ).textContent = `+${data.liveMetrics.sessionsChange}%`;
    document.getElementById("top-intent").textContent =
      data.liveMetrics.topIntent;
    document.getElementById("nlp-drift").textContent =
      data.liveMetrics.nlpDrift;
    document.getElementById(
      "translation-accuracy"
    ).textContent = `${data.liveMetrics.translationAccuracy}%`;
    document.getElementById(
      "accuracy-change"
    ).textContent = `${data.liveMetrics.accuracyChange}%`;

    // Activity Feed
    const activityList = document.getElementById("activity-list");
    activityList.innerHTML = ""; // Clear existing
    data.activityFeed.forEach((item) => {
      const li = document.createElement("li");
      li.className = "activity-item";
      li.innerHTML = `
          <i class="activity-icon ${item.icon}"></i>
          <div class="activity-details">
            <p>${item.title}</p>
            <span>${item.subtitle}</span>
          </div>
        `;
      activityList.appendChild(li);
    });

    // Render Charts
    renderUserIntentsChart(data.userIntents);
    renderTranslationAccuracyChart(data.translationAccuracyData);
  };

  // --- Chart Rendering ---
  const renderUserIntentsChart = (chartData) => {
    const ctx = document.getElementById("userIntentsChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: "User Intents",
            data: chartData.data,
            backgroundColor: "#f0f0f5",
            borderColor: "#e0e0e5",
            borderWidth: 1,
            borderRadius: 5,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { display: false },
            ticks: { display: false },
          },
          x: { grid: { display: false } },
        },
      },
    });
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

  // --- Initial Load ---
  fetchDashboardData();
});
