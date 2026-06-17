const mongoose = require("mongoose");

// ─────────────────────────────────────────────
// Invoice Item Schema
// ─────────────────────────────────────────────
const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  qty: {
    type: Number,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },
});

// ─────────────────────────────────────────────
// Milestone Schema
// ─────────────────────────────────────────────
const milestoneSchema = new mongoose.Schema({
  milestoneNumber: Number,

  title: String,

  amount: Number,

  dueAmount: Number,

  expectedDate: Date,

  dueDate: Date,

  status: {
    type: String,
    enum: [
      'pending',
      'partial',
      'paid',
      'overdue',
    ],
    default: 'pending',
  },

  reminderSent: {
    type: Boolean,
    default: false,
  },
});

// ─────────────────────────────────────────────
// Main Bill Schema
// ─────────────────────────────────────────────
const billSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // Client Reference
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    // User Reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Invoice Created Date
    date: {
      type: Date,
      required: true,
    },

    // models/Bill.js — inside billSchema
birthdayDiscount: {
  type: Number,
  default: 0,
},

    // Invoice Items
    items: [itemSchema],

    // Billing Calculations
    subtotal: {
      type: Number,
      required: true,
    },

    gstAmount: {
      type: Number,
      required: true,
    },

    discount: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
    },

    // ─────────────────────────────────────────
    // Milestone Payment System
    // ─────────────────────────────────────────
    milestones: [milestoneSchema],

    // Overall Invoice Status
    overallStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "overdue"],
      default: "pending",
    },

    // Total Paid Amount
    paidAmount: {
      type: Number,
      default: 0,
    },

    // Remaining Amount
    remainingAmount: {
      type: Number,
      default: 0,
    },

    // Soft Delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// ─────────────────────────────────────────────
// Auto Calculate Remaining Amount
// ─────────────────────────────────────────────
billSchema.pre("save", function (next) {
  this.remainingAmount = this.total - this.paidAmount;
  next();
});

// ─────────────────────────────────────────────
// Export Model
// ─────────────────────────────────────────────
const Bill = mongoose.model("Bill", billSchema, "billes");

module.exports = Bill;
