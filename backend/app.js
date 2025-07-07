const dotenv = require("dotenv");
// Load environment variables
dotenv.config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// Import DB connection
require("./config/db");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.options(
  "*",
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Routes (to be added)
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Hura backend is running." });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Server error", details: err.message });
});

module.exports = app;
