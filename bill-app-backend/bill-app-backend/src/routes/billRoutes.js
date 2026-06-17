const express = require("express");
const router = express.Router();
const {
  createBill,
  getBills,
  updateBillStatus,
  deleteBill,
  updateBill,
  getTrashBills,
  restoreBill,
  permanentDeleteBill,
  markMilestonePaid,
} = require("../controllers/billController");
const { protect } = require("../middlewares/authMiddleware");

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  IMPORTANT: Specific routes MUST come before wildcard /:id routes
//     otherwise Express matches "trash" and "restore" as an :id value
// ─────────────────────────────────────────────────────────────────────────────

// Specific static routes first
router.get("/trash", protect, getTrashBills); // ✅ before GET /:id

// Standard CRUD
router.post("/", protect, createBill);
router.get("/", protect, getBills);

// Wildcard /:id routes after
router.get("/:id", protect, (req, res) =>
  res.status(404).json({ message: "Not found" }),
); // placeholder if you add getBillById
router.patch(
  "/:billId/milestones/:milestoneId/pay",
  protect,
  markMilestonePaid,
);
// Nested /:id/action routes
router.patch("/:id/restore", protect, restoreBill);
router.delete("/:id/permanent", protect, permanentDeleteBill);

router.put("/:id", protect, updateBill);

router.delete("/:id", protect, deleteBill);



module.exports = router;
