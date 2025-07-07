const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Sign up (user or admin)
router.post("/signup", authController.signup);

// Login
router.post("/login", authController.login);

// Password reset
router.post("/password-reset", authController.initiatePasswordReset);
router.post("/password-reset/:token", authController.completePasswordReset);

module.exports = router;
