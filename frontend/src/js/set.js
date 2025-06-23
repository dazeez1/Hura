// Password toggle functionality
function togglePassword() {
  const passwordInput = document.getElementById("password");
  const passwordIcon = document.getElementById("passwordIcon");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    passwordIcon.className = "fas fa-eye";
  } else {
    passwordInput.type = "password";
    passwordIcon.className = "fas fa-eye-slash";
  }
}

// Photo upload functionality
document.getElementById("photoInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be smaller than 10MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Preview image
    const reader = new FileReader();
    reader.onload = function (e) {
      const placeholder = document.getElementById("photoPlaceholder");
      placeholder.style.backgroundImage = `url(${e.target.result})`;
      placeholder.style.backgroundSize = "cover";
      placeholder.style.backgroundPosition = "center";
      placeholder.innerHTML = "";
    };
    reader.readAsDataURL(file);
  }
});

// Form submission
document
  .getElementById("settingsForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    // Validate form
    const requiredFields = [
      "displayName",
      "fullName",
      "email",
      "phone",
      "password",
    ];
    let isValid = true;

    requiredFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (!field.value.trim()) {
        isValid = false;
        field.style.borderColor = "#dc3545";
      } else {
        field.style.borderColor = "#e9ecef";
      }
    });

    // Email validation
    const email = document.getElementById("email").value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      isValid = false;
      document.getElementById("email").style.borderColor = "#dc3545";
    }

    if (isValid) {
      // Show success message
      const successMessage = document.getElementById("successMessage");
      successMessage.classList.add("show");

      // Hide success message after 3 seconds
      setTimeout(() => {
        successMessage.classList.remove("show");
      }, 3000);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      alert("Please fill in all required fields correctly");
    }
  });

// Navigation functionality
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function () {
    // Remove active class from all items
    document.querySelectorAll(".nav-item").forEach((nav) => {
      nav.classList.remove("active");
    });

    // Add active class to clicked item
    this.classList.add("active");
  });
});

// Real-time form validation
document.querySelectorAll(".form-input").forEach((input) => {
  input.addEventListener("blur", function () {
    if (this.hasAttribute("required") && !this.value.trim()) {
      this.style.borderColor = "#dc3545";
    } else if (this.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.value)) {
        this.style.borderColor = "#dc3545";
      } else {
        this.style.borderColor = "#28a745";
      }
    } else {
      this.style.borderColor = "#28a745";
    }
  });

  input.addEventListener("input", function () {
    if (this.style.borderColor === "rgb(220, 53, 69)") {
      this.style.borderColor = "#e9ecef";
    }
  });
});

// Smooth scrolling for internal links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Initialize tooltips (if needed)
document.addEventListener("DOMContentLoaded", function () {
  // Add any initialization code here
  console.log("Hura Settings page loaded successfully");

  // Hamburger menu functionality
  const hamburgerMenu = document.getElementById("hamburgerMenu");
  const navMenu = document.getElementById("navMenu");

  if (hamburgerMenu && navMenu) {
    hamburgerMenu.addEventListener("click", function () {
      hamburgerMenu.classList.toggle("active");
      navMenu.classList.toggle("show");
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (event) {
      const isClickInsideSidebar = event.target.closest(".sidebar");
      const isClickOnHamburger = event.target.closest(".hamburger-menu");

      if (
        !isClickInsideSidebar &&
        !isClickOnHamburger &&
        navMenu.classList.contains("show")
      ) {
        hamburgerMenu.classList.remove("active");
        navMenu.classList.remove("show");
      }
    });

    // Close menu when window is resized to desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth > 995) {
        hamburgerMenu.classList.remove("active");
        navMenu.classList.remove("show");
      }
    });
  }
});
