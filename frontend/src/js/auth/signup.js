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
