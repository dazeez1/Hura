document.addEventListener("DOMContentLoaded", () => {
  // Display admin name in feedback user-profile area
  const adminNameFeedback = document.getElementById("adminNameFeedback");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (adminNameFeedback && user && user.fullName) {
    adminNameFeedback.textContent = user.fullName;
  }

  // Display admin profile picture in feedback page
  const userAvatar = document.querySelector(".user-avatar");

  // Load profile picture from MongoDB
  async function loadProfilePicture() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("hura-28tbty1lv-damis-projects-8bd6b2ff.vercel.app/api/admin/profile", {
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
  // --- Sidebar/Hamburger Menu Logic (from dashboard) ---
  const hamburgerMenu = document.getElementById("hamburgerMenu");
  const navMenu = document.getElementById("navMenu");
  const sidebar = document.querySelector(".sidebar");

  if (hamburgerMenu && navMenu) {
    hamburgerMenu.addEventListener("click", () => {
      hamburgerMenu.classList.toggle("active");
      navMenu.classList.toggle("show");
    });

    document.addEventListener("click", (event) => {
      if (
        !sidebar.contains(event.target) &&
        navMenu.classList.contains("show")
      ) {
        hamburgerMenu.classList.remove("active");
        navMenu.classList.remove("show");
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 995) {
        hamburgerMenu.classList.remove("active");
        navMenu.classList.remove("show");
      }
    });
  }

  // --- Fetch real feedback data from backend ---
  async function fetchFeedback() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("hura-28tbty1lv-damis-projects-8bd6b2ff.vercel.app/api/chat/feedback", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        updateUI(result.data);
      } else {
        updateUI([]);
      }
    } catch (err) {
      updateUI([]);
    }
  }
  fetchFeedback();

  function updateUI(feedbackList) {
    // Separate flagged and recent feedback
    const flagged = feedbackList.filter(
      (fb) => fb.reason === "Negative sentiment" || fb.status === "new"
    );
    const recent = feedbackList;

    // Populate Flagged for Review
    const flaggedList = document.getElementById("flagged-list");
    flaggedList.innerHTML = "";
    if (flagged.length > 0) {
      flagged.forEach((item) => {
        const div = document.createElement("div");
        div.className = "flagged-item";
        div.innerHTML = `
            <div class="flagged-row"><span class="flagged-label">User:</span> <span class="flagged-value">${
              item.userId ? item.userId.fullName : "Anonymous"
            }</span></div>
            <div class="flagged-row"><span class="flagged-label">Session:</span> <span class="flagged-value">${
              item.sessionId || "-"
            }</span></div>
            <div class="flagged-row"><span class="flagged-label">Date:</span> <span class="flagged-value">${new Date(
              item.date
            ).toLocaleString()}</span></div>
            <div class="flagged-row"><span class="flagged-label">Reason:</span> <span class="flagged-value">${
              item.reason
            }</span></div>
            <div class="flagged-row"><span class="flagged-label">Comment:</span> <span class="flagged-value">${
              item.comment || "-"
            }</span></div>
            <div class="flagged-row"><span class="flagged-label">Status:</span> <span class="flagged-value">${
              item.status
            }</span></div>
          `;
        flaggedList.appendChild(div);
      });
    } else {
      flaggedList.innerHTML =
        '<p class="loading-text">No items flagged for review.</p>';
    }

    // Populate Recent Feedback Table
    const feedbackTbody = document.getElementById("feedback-tbody");
    feedbackTbody.innerHTML = "";
    recent.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${item.userId ? item.userId.fullName : "Anonymous"}</td>
          <td>${item.sessionId || "-"}</td>
          <td>${new Date(item.date).toLocaleString()}</td>
          <td>${item.reason}</td>
          <td>${item.comment || "-"}</td>
          <td class="status ${item.status}">${item.status}</td>
        `;
      feedbackTbody.appendChild(tr);
    });
  }
});
