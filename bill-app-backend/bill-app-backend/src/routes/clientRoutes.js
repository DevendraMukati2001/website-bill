const express = require("express");
const router = express.Router();
const {
  getClientsSummary,
  getClientProfile,
} = require("../controllers/clientController");
const { protect } = require("../middlewares/authMiddleware");

// @route   GET /api/clients
// This protected route returns a paginated summary of clients.
router.get("/", protect, getClientsSummary);

// @route   GET /api/clients/:id
// This protected route gets a specific client's profile and their bills.
router.get("/:id", protect, getClientProfile);

module.exports = router;
