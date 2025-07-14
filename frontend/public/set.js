// API Base URL
const API_BASE_URL = "https://hura-q92y.onrender.com/api";

// Get authentication token
function getAuthToken() {
  return localStorage.getItem("token");
}

// Check if user is authenticated and is admin
function checkAuth() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user || user.role !== "admin") {
    window.location.href = "./auth/signup.html";
    return false;
  }
  return true;
}

// Load user profile data from MongoDB
async function loadUserProfile() {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      updateUIWithProfileData(data.data);
    } else {
      console.error("Failed to load profile data");
    }
  } catch (error) {
    console.error("Error loading profile data:", error);
  }
}

// Update UI with profile data from MongoDB
function updateUIWithProfileData(profileData) {
  const { user, settings } = profileData;

  // Update user info fields
  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const displayNameInput = document.getElementById("displayName");
  const phoneInput = document.getElementById("phone");

  if (fullNameInput) fullNameInput.value = user.fullName || "";
  if (emailInput) emailInput.value = user.email || "";
  if (displayNameInput) displayNameInput.value = user.fullName || "";
  if (phoneInput)
    phoneInput.value = user.phoneNumber || settings.phoneNumber || "";

  // Update notifications
  const allNotificationsCheckbox = document.getElementById("allNotifications");
  if (allNotificationsCheckbox && settings.notifications) {
    allNotificationsCheckbox.checked =
      settings.notifications.allNotifications !== false;
  }

  // Update profile picture
  updateProfilePictureDisplay(settings.profilePicture);
}

// Update profile picture display
function updateProfilePictureDisplay(profilePicture) {
  const placeholder = document.getElementById("photoPlaceholder");
  const removePhotoBtn = document.getElementById("removePhotoBtn");

  if (placeholder) {
    if (profilePicture) {
      placeholder.style.backgroundImage = `url(${profilePicture})`;
      placeholder.style.backgroundSize = "cover";
      placeholder.style.backgroundPosition = "center";
      placeholder.innerHTML = "";
      if (removePhotoBtn) {
        removePhotoBtn.style.display = "inline-block";
      }
    } else {
      placeholder.style.backgroundImage = "";
      placeholder.innerHTML = '<i class="fas fa-user"></i>';
      if (removePhotoBtn) {
        removePhotoBtn.style.display = "none";
      }
    }
  }
}

// Save profile data to MongoDB
async function saveProfileData(formData) {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const data = await response.json();
      showSuccessMessage("Profile updated successfully!");

      // Update localStorage user data with new phone number
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      if (currentUser && data.data.user) {
        currentUser.phoneNumber = data.data.user.phoneNumber;
        localStorage.setItem("user", JSON.stringify(currentUser));
      }

      return true;
    } else {
      const errorData = await response.json();
      showErrorMessage(errorData.error || "Failed to update profile");
      return false;
    }
  } catch (error) {
    console.error("Error saving profile data:", error);
    showErrorMessage("Network error. Please try again.");
    return false;
  }
}

// Upload profile picture to MongoDB
async function uploadProfilePicture(file) {
  try {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async function (e) {
        try {
          const token = getAuthToken();
          const response = await fetch(
            `${API_BASE_URL}/admin/profile-picture`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                profilePicture: e.target.result,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            updateProfilePictureDisplay(data.data.profilePicture);
            showSuccessMessage("Profile picture uploaded successfully!");
            resolve(true);
          } else {
            const errorData = await response.json();
            showErrorMessage(
              errorData.error || "Failed to upload profile picture"
            );
            reject(new Error(errorData.error));
          }
        } catch (error) {
          console.error("Error uploading profile picture:", error);
          showErrorMessage("Network error. Please try again.");
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error("Error in uploadProfilePicture:", error);
    showErrorMessage("Failed to upload profile picture");
    return false;
  }
}

// Remove profile picture from MongoDB
async function removeProfilePicture() {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/profile-picture`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      updateProfilePictureDisplay(null);
      showSuccessMessage("Profile picture removed successfully!");

      // Clear file input
      const photoInput = document.getElementById("photoInput");
      if (photoInput) {
        photoInput.value = "";
      }
      return true;
    } else {
      const errorData = await response.json();
      showErrorMessage(errorData.error || "Failed to remove profile picture");
      return false;
    }
  } catch (error) {
    console.error("Error removing profile picture:", error);
    showErrorMessage("Network error. Please try again.");
    return false;
  }
}

// Show success message
function showSuccessMessage(message) {
  const successMessage = document.getElementById("successMessage");
  if (successMessage) {
    successMessage.textContent = message;
    successMessage.classList.add("show");

    setTimeout(() => {
      successMessage.classList.remove("show");
    }, 3000);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// Show error message
function showErrorMessage(message) {
  alert(message); // You can replace this with a better error display
}

// Form validation
function validateForm() {
  const phoneInput = document.getElementById("phone");
  const allNotificationsCheckbox = document.getElementById("allNotifications");

  if (!phoneInput || !allNotificationsCheckbox) {
    return false;
  }

  const phone = phoneInput.value.trim();

  // Basic phone validation (you can enhance this)
  if (phone && !/^[\+]?[0-9\s\-\(\)]{7,}$/.test(phone)) {
    showErrorMessage("Please enter a valid phone number");
    return false;
  }

  return true;
}

// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  if (!checkAuth()) {
    return;
  }

  // Load profile data from MongoDB
  loadUserProfile();

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

  // Photo upload functionality
  const photoInput = document.getElementById("photoInput");
  if (photoInput) {
    photoInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          showErrorMessage("File size must be smaller than 10MB");
          return;
        }
        if (!file.type.startsWith("image/")) {
          showErrorMessage("Please select an image file");
          return;
        }

        uploadProfilePicture(file);
      }
    });
  }

  // Remove photo functionality
  const removePhotoBtn = document.getElementById("removePhotoBtn");
  if (removePhotoBtn) {
    removePhotoBtn.addEventListener("click", function () {
      removeProfilePicture();
    });
  }

  // Form submission
  const settingsForm = document.getElementById("settingsForm");
  if (settingsForm) {
    settingsForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      const phoneInput = document.getElementById("phone");
      const allNotificationsCheckbox =
        document.getElementById("allNotifications");

      const formData = {
        phoneNumber: phoneInput.value.trim(),
        notifications: {
          allNotifications: allNotificationsCheckbox.checked,
        },
      };

      const success = await saveProfileData(formData);
      if (success) {
        // Profile data saved successfully
      }
    });
  }

  // Logout functionality
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      // Clear authentication data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login page
      window.location.href = "./auth/signup.html";
    });
  }
});
