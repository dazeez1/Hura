// Tab toggle logic
const signupTab = document.getElementById("signupTab");
const loginTab = document.getElementById("loginTab");
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const switchToLogin = document.getElementById("switchToLogin");
const switchToSignup = document.getElementById("switchToSignup");

function showSignup() {
  signupTab.classList.add("active");
  loginTab.classList.remove("active");
  signupForm.style.display = "";
  loginForm.style.display = "none";
}
function showLogin() {
  loginTab.classList.add("active");
  signupTab.classList.remove("active");
  loginForm.style.display = "";
  signupForm.style.display = "none";
}

signupTab.addEventListener("click", showSignup);
loginTab.addEventListener("click", showLogin);
if (switchToLogin) {
  switchToLogin.addEventListener("click", (e) => {
    e.preventDefault();
    showLogin();
  });
}
if (switchToSignup) {
  switchToSignup.addEventListener("click", (e) => {
    e.preventDefault();
    showSignup();
  });
}

// Password visibility toggle
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", function () {
    const input = this.previousElementSibling;
    const eyeOn = this.querySelector(".eye-on");
    const eyeOff = this.querySelector(".eye-off");
    if (input.type === "password") {
      input.type = "text";
      eyeOn.style.display = "none";
      eyeOff.style.display = "";
      eyeOff.style.stroke = "#764ba2";
    } else {
      input.type = "password";
      eyeOn.style.display = "";
      eyeOff.style.display = "none";
      eyeOn.style.stroke = "#667eea";
    }
  });
});

// Utility to show messages in the UI
function showMessage(element, message, type = "") {
  element.textContent = message;
  element.className = "form-message" + (type ? " " + type : "");
}

// Signup form submission logic
if (signupForm) {
  const signupMessage = document.createElement("div");
  signupMessage.className = "form-message";
  signupForm.appendChild(signupMessage);
  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    // Collect form data
    const fullName = document.getElementById("signupFullName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById(
      "signupConfirmPassword"
    ).value;
    const role = "user";
    // Basic client-side validation
    if (!fullName || !email || !password || !confirmPassword) {
      showMessage(signupMessage, "Please fill in all fields.", "error");
      return;
    }
    if (password !== confirmPassword) {
      showMessage(signupMessage, "Passwords do not match.", "error");
      return;
    }
    try {
      const response = await fetch("hura-28tbty1lv-damis-projects-8bd6b2ff.vercel.app/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role }),
      });
      const data = await response.json();
      if (response.ok) {
        showMessage(
          signupMessage,
          "Signup successful! You can now log in.",
          "success"
        );
        showLogin();
      } else {
        showMessage(
          signupMessage,
          data.error || "Signup failed. Please try again.",
          "error"
        );
      }
    } catch (err) {
      showMessage(
        signupMessage,
        "Network error. Please try again later.",
        "error"
      );
    }
  });
}

// Login form submission logic
if (loginForm) {
  const loginMessage = document.createElement("div");
  loginMessage.className = "form-message";
  loginForm.appendChild(loginMessage);
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    if (!email || !password) {
      showMessage(
        loginMessage,
        "Please enter your email and password.",
        "error"
      );
      return;
    }
    try {
      const response = await fetch("hura-28tbty1lv-damis-projects-8bd6b2ff.vercel.app/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        showMessage(
          loginMessage,
          "Login successful! Redirecting...",
          "success"
        );
        // Phone number and notifications are now stored separately and don't need merging
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log(
          "[DEBUG] New user in localStorage after login:",
          JSON.parse(localStorage.getItem("user"))
        );
        setTimeout(() => {
          if (data.user.role === "admin") {
            window.location.href = "../dashboard.html";
          } else {
            window.location.href = "../chatbot.html";
          }
        }, 1000);
      } else {
        showMessage(
          loginMessage,
          data.error || "Login failed. Please try again.",
          "error"
        );
      }
    } catch (err) {
      showMessage(
        loginMessage,
        "Network error. Please try again later.",
        "error"
      );
    }
  });
}

// Forgot password modal logic
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const forgotPasswordModal = document.getElementById("forgotPasswordModal");
const closeForgotPasswordModal = document.getElementById(
  "closeForgotPasswordModal"
);
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotPasswordMessage = document.getElementById("forgotPasswordMessage");

if (forgotPasswordLink && forgotPasswordModal && closeForgotPasswordModal) {
  forgotPasswordLink.addEventListener("click", function (e) {
    e.preventDefault();
    forgotPasswordModal.style.display = "block";
    forgotPasswordMessage.textContent = "";
    forgotPasswordForm.reset();
  });
  closeForgotPasswordModal.addEventListener("click", function () {
    forgotPasswordModal.style.display = "none";
  });
  window.addEventListener("click", function (event) {
    if (event.target === forgotPasswordModal) {
      forgotPasswordModal.style.display = "none";
    }
  });
}

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("forgotPasswordEmail").value.trim();
    if (!email) {
      showMessage(forgotPasswordMessage, "Please enter your email.", "error");
      return;
    }
    try {
      const response = await fetch(
        "hura-28tbty1lv-damis-projects-8bd6b2ff.vercel.app/api/auth/password-reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        showMessage(
          forgotPasswordMessage,
          data.message || "If that email exists, a reset link has been sent.",
          "success"
        );
      } else {
        showMessage(
          forgotPasswordMessage,
          data.error || "Failed to send reset link.",
          "error"
        );
      }
    } catch (err) {
      showMessage(
        forgotPasswordMessage,
        "Network error. Please try again later.",
        "error"
      );
    }
  });
}
