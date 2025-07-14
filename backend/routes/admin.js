const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "..", "uploads");
    // Create uploads directory if it doesn't exist
    if (!require("fs").existsSync(uploadDir)) {
      require("fs").mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed."),
        false
      );
    }
  },
});

// All routes require admin authentication
router.use(protect);
router.use(authorize("admin"));

// Settings routes
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.updateSettings);
router.post(
  "/upload-photo",
  upload.single("profilePicture"),
  adminController.uploadProfilePicture
);
router.put("/change-password", adminController.changePassword);
router.put("/update-email", adminController.updateEmail);

// Logout route
router.post("/logout", adminController.logout);

// User management routes
router.get("/users", adminController.getAllUsers);
router.get("/users/count", adminController.getUserCount);

// Profile management routes
router.get("/profile", adminController.getUserProfile);
router.put("/profile", adminController.updateUserProfile);
router.post("/profile-picture", adminController.uploadProfilePictureBase64);
router.delete("/profile-picture", adminController.removeProfilePicture);

module.exports = router;
