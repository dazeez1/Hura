document.addEventListener("DOMContentLoaded", () => {
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

  // --- Feedback Data (for demonstration, replace with real API call) ---
  const data = {
    flagged: [
      {
        userid: "12345",
        chatbot: "HuraBot",
        date: "2024-07-20",
        reason: "Negative sentiment detected",
        action: "Review",
      },
      {
        userid: "23456",
        chatbot: "HuraBot",
        date: "2024-07-19",
        reason: "Urgent language used",
        action: "Resolve",
      },
    ],
    recent: [
      {
        userid: "12345",
        chatbot: "HuraBot",
        date: "2024-07-20",
        reason: "Negative sentiment detected",
        action: "Review",
      },
      {
        userid: "23456",
        chatbot: "HuraBot",
        date: "2024-07-19",
        reason: "Urgent language used",
        action: "Resolve",
      },
      {
        userid: "34567",
        chatbot: "HuraBot",
        date: "2024-07-18",
        reason: "Feature request",
        action: "Review",
      },
    ],
  };
  updateUI(data);

  function updateUI(data) {
    // Populate Flagged for Review
    const flaggedList = document.getElementById("flagged-list");
    flaggedList.innerHTML = "";
    if (data.flagged.length > 0) {
      data.flagged.forEach((item) => {
        const div = document.createElement("div");
        div.className = "flagged-item";
        div.innerHTML = `
            <div class="flagged-row"><span class="flagged-label">User ID:</span> <span class="flagged-value">${item.userid}</span></div>
            <div class="flagged-row"><span class="flagged-label">Chatbot:</span> <span class="flagged-value">${item.chatbot}</span></div>
            <div class="flagged-row"><span class="flagged-label">Date:</span> <span class="flagged-value">${item.date}</span></div>
            <div class="flagged-row"><span class="flagged-label">Reason:</span> <span class="flagged-value">${item.reason}</span></div>
            <div class="flagged-row"><span class="flagged-label">Action:</span> <span class="flagged-value">${item.action}</span></div>
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
    data.recent.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${item.userid}</td>
          <td>${item.chatbot}</td>
          <td>${item.date}</td>
          <td>${item.reason}</td>
          <td class="action">${item.action}</td>
        `;
      feedbackTbody.appendChild(tr);
    });
  }
});
