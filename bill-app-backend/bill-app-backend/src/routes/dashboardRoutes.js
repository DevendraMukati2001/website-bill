const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");
const { protect } = require("../middlewares/authMiddleware");

// @route   GET /api/dashboard
// This protected route returns a summary of dashboard statistics.
router.get("/", protect, getDashboardStats);

module.exports = router;
