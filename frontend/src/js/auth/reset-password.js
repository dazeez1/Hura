// Reset password form logic
const resetPasswordForm = document.getElementById("resetPasswordForm");
const resetPasswordMessage = document.getElementById("resetPasswordMessage");

// Utility to show messages in the UI
function showResetMessage(message, type = "") {
  resetPasswordMessage.textContent = message;
  resetPasswordMessage.className = "form-message" + (type ? " " + type : "");
}

// Helper: Get token from URL query string
function getTokenFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || "";
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword =
      document.getElementById("confirmNewPassword").value;
    if (!newPassword || !confirmNewPassword) {
      showResetMessage("Please fill in all fields.", "error");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showResetMessage("Passwords do not match.", "error");
      return;
    }
    const token = getTokenFromURL();
    if (!token) {
      showResetMessage("Invalid or missing reset token.", "error");
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:4000/api/auth/password-reset/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: newPassword }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        showResetMessage(
          "Password reset successful! You can now log in.",
          "success"
        );
        resetPasswordForm.style.display = "none";
        // Optionally, redirect after a delay:
        // setTimeout(() => { window.location.href = 'signup.html'; }, 2000);
      } else {
        showResetMessage(
          data.error || "Password reset failed. Please try again.",
          "error"
        );
      }
    } catch (err) {
      showResetMessage("Network error. Please try again later.", "error");
    }
  });
}
