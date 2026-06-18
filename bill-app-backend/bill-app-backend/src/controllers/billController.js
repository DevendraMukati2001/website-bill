const Bill = require("../models/Bill");
const Client = require("../models/Client");

// ya jahan bhi tumhara emailService hai us path se import karo
const nodemailer = require("nodemailer");
const {
  sendOverdueInvoiceEmail,
  sendBirthdayDiscountEmail,
  sendDeletedInvoiceEmail,
} = require("../services/emailService");

// @desc    Create a new bill
// @route   POST /api/bills
// @access  Private
const createBill = async (req, res) => {
  try {
    const {
      client: clientId, // ObjectId (edit mode mein aata hai)
      clientName: clientNameField, // Name string (hamesha aata hai)
      company,
      gstnum,
      email,
      phone,
      dob,
      date,
      items,
      discount,
      milestones = [],
      gstAmount: clientGstAmount,
    } = req.body;

    // Name resolve karo — clientNameField se lo
    const clientName = clientNameField || "";

    if (!clientName || !items || !date) {
      return res.status(400).json({
        message: "Please provide required fields",
      });
    }

    // ─────────────────────────────────────────
    // Client Upsert
    // ─────────────────────────────────────────
    const clientQuery = gstnum
      ? { gstNumber: gstnum }
      : { name: clientName, user: req.user.id };

    const client = await Client.findOneAndUpdate(
      clientQuery,
      {
        $set: {
          name: clientName,
          company,
          gstNumber: gstnum || "",
          email,
          phone,
          dob,
          user: req.user.id,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    // ─────────────────────────────────────────
    // Calculate Totals
    // ─────────────────────────────────────────
    const subtotal = items.reduce(
      (acc, item) => acc + item.qty * item.price,
      0,
    );

    const gstAmount =
      clientGstAmount !== undefined ? Number(clientGstAmount) : 0;

    // ─────────────────────────────────────────
    // Birthday Discount (5% if today is client's birthday)
    // ─────────────────────────────────────────
    let birthdayDiscount = 0;

    if (client.dob) {
      const today = new Date();
      const dob = new Date(client.dob);

      if (
        today.getDate() === dob.getDate() &&
        today.getMonth() === dob.getMonth()
      ) {
        birthdayDiscount = subtotal * 0.3;
      }
    }

    const finalDiscount = Number(discount || 0) + birthdayDiscount;

    const total = subtotal + gstAmount - finalDiscount;

    // ─────────────────────────────────────────
    // Invoice Number
    // ─────────────────────────────────────────
    const invoiceNumber = `INV-${Date.now()}`;

    // ── Birthday Email ──────────────────────────────
    if (birthdayDiscount > 0 && client.email) {
      sendBirthdayDiscountEmail(
        { name: client.name, email: client.email },
        birthdayDiscount,
        invoiceNumber,
      );
      // await mat karo — email background mein jaaye
    }

    // ─────────────────────────────────────────
    // Calculate Milestone Status
    // ─────────────────────────────────────────
    let paidAmount = 0;

    milestones.forEach((m) => {
      if (m.status === "paid") {
        paidAmount += Number(m.amount || 0);
      }
    });

    const remainingAmount = total - paidAmount;

    const allPaid = milestones.every((m) => m.status === "paid");

    const anyPaid = milestones.some((m) => m.status === "paid");

    const anyOverdue = milestones.some((m) => m.status === "overdue");

    let overallStatus = "pending";

    if (allPaid) {
      overallStatus = "paid";
    } else if (anyOverdue) {
      overallStatus = "overdue";
    } else if (anyPaid) {
      overallStatus = "partial";
    }

    // ─────────────────────────────────────────
    // Create Bill
    // ─────────────────────────────────────────
    const newBill = await Bill.create({
      invoiceNumber,
      client: client._id,
      user: req.user.id,
      date,

      items,

      subtotal,
      gstAmount,

      discount: finalDiscount,
      birthdayDiscount,

      total,

      milestones,

      overallStatus,

      paidAmount,

      remainingAmount,
    });

    // ─────────────────────────────────────────
    // Attach Bill To Client
    // ─────────────────────────────────────────
    if (!client.bills) {
      client.bills = [];
    }

    client.bills.push(newBill._id);

    await client.save();

    // ─────────────────────────────────────────
    // Populate Client
    // ─────────────────────────────────────────
    const populatedBill = await Bill.findById(newBill._id).populate(
      "client",
      "name company gstNumber email phone",
    );

    console.log(JSON.stringify(populatedBill, null, 2));

    res.status(201).json(populatedBill);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error while creating bill",
      error: error.message,
    });
  }
};

// @desc    Get all bills for the logged-in user (paginated)
// @route   GET /api/bills
// @access  Private
const getBills = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const bills = await Bill.find({ user: req.user.id, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("client", "name company gstNumber email phone");

    const totalBills = await Bill.countDocuments({
      user: req.user.id,
      isDeleted: false,
    });

    res.status(200).json({
      bills,
      currentPage: page,
      totalPages: Math.ceil(totalBills / limit),
      totalBills,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching bills" });
  }
};

// @desc    Get trashed bills
// @route   GET /api/bills/trash
// @access  Private
const getTrashBills = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const bills = await Bill.find({
      user: req.user.id,
      isDeleted: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("client", "name company gstNumber email phone");

    const totalBills = await Bill.countDocuments({
      user: req.user.id,
      isDeleted: true,
    });

    res.status(200).json({
      bills,
      currentPage: page,
      totalPages: Math.ceil(totalBills / limit),
      totalBills,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching trash bills",
    });
  }
};

// @desc    Update a bill's status
// @route   PATCH /api/bills/:id
// @access  Private
const updateBillStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const billId = req.params.id;

    // ✅ FIX 5: Accept all 4 milestone statuses, not just paid/unpaid
    const validStatuses = ["unpaid", "partially_paid", "paid", "overdue"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Please provide a valid status ('unpaid', 'partially_paid', 'paid', 'overdue')",
      });
    }

    const bill = await Bill.findById(billId);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (bill.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" });
    }

    bill.status = status;
    // ✅ FIX 6: Clear dueDate when moving to paid or overdue
    if (status === "paid" || status === "overdue") {
      bill.dueDate = null;
    }
    await bill.save();

    res.status(200).json(bill);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while updating bill status" });
  }
};

// @desc    Restore bill from trash
// @route   PATCH /api/bills/:id/restore
// @access  Private
const restoreBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    if (bill.user.toString() !== req.user.id) {
      return res.status(401).json({
        message: "User not authorized",
      });
    }

    bill.isDeleted = false;

    await bill.save();

    res.status(200).json({
      message: "Bill restored successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while restoring bill",
    });
  }
};

const updateBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    if (bill.user.toString() !== req.user.id) {
      return res.status(401).json({
        message: "User not authorized",
      });
    }
    const {
      client: clientId,
      clientName: clientNameField,
      company,
      gstnum,
      email,
      phone,
      date,
      milestones = [],
      items,
      subtotal,
      gstAmount,
      discount,
      birthdayDiscount,
      total,
    } = req.body;

    // Client resolve karo — name se dhundo
    const resolvedName = clientNameField || "";
    const clientQuery = gstnum
      ? { gstNumber: gstnum }
      : { name: resolvedName, user: req.user.id };

    let existingClient = await Client.findOneAndUpdate(
      clientQuery,
      {
        $set: {
          name: resolvedName,
          company,
          gstNumber: gstnum || "",
          email,
          phone,
          user: req.user.id,
        },
      },
      { new: true, upsert: true },
    );

    bill.client = existingClient._id;
    bill.date = date;
    // ✅ FIX 8: Clear dueDate for paid AND overdue (was only checking paid before)
    // ─────────────────────────────────────
    // Recalculate Milestone Status
    // ─────────────────────────────────────

    let paidAmount = 0;

    milestones.forEach((m) => {
      if (m.status === "paid") {
        paidAmount += Number(m.amount || 0);
      }
    });

    const remainingAmount = total - paidAmount;

    const allPaid = milestones.every((m) => m.status === "paid");

    const anyPaid = milestones.some((m) => m.status === "paid");

    const anyOverdue = milestones.some((m) => m.status === "overdue");

    let overallStatus = "pending";

    if (allPaid) {
      overallStatus = "paid";
    } else if (anyOverdue) {
      overallStatus = "overdue";
    } else if (anyPaid) {
      overallStatus = "partial";
    }
    bill.overallStatus = overallStatus;

    bill.paidAmount = paidAmount;

    bill.remainingAmount = remainingAmount;
    bill.milestones = milestones;
    bill.items = items;

    const recalculatedSubtotal = items.reduce(
      (acc, item) => acc + item.qty * item.price,
      0,
    );

    const recalculatedGst = gstAmount || 0;

    const recalculatedDiscount =
      Number(discount || 0) + Number(birthdayDiscount || 0);
    const recalculatedTotal =
      recalculatedSubtotal + recalculatedGst - recalculatedDiscount;

    bill.subtotal = recalculatedSubtotal;
    bill.gstAmount = recalculatedGst;
    bill.discount = recalculatedDiscount;
    bill.birthdayDiscount = Number(birthdayDiscount || 0);
    bill.total = recalculatedTotal;

    await bill.save();

    res.status(200).json({
      message: "Invoice updated successfully",
      bill,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error while updating invoice",
    });
  }
};

const markMilestonePaid = async (req, res) => {
  try {
    const { billId, milestoneId } = req.params;

    const bill = await Bill.findById(billId);

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    const milestone = bill.milestones.id(milestoneId);

    if (!milestone) {
      return res.status(404).json({
        message: "Milestone not found",
      });
    }

    milestone.status = "paid";
    milestone.paidAt = new Date();

    // ─────────────────────────────────────
    // Recalculate Amounts
    // ─────────────────────────────────────
    let paidAmount = 0;

    bill.milestones.forEach((m) => {
      if (m.status === "paid") {
        paidAmount += Number(m.amount);
      }
    });

    bill.paidAmount = paidAmount;
    bill.remainingAmount = bill.total - paidAmount;

    // ─────────────────────────────────────
    // Overall Status
    // ─────────────────────────────────────
    const allPaid = bill.milestones.every((m) => m.status === "paid");

    const anyOverdue = bill.milestones.some((m) => m.status === "overdue");

    if (allPaid) {
      bill.overallStatus = "paid";
    } else if (anyOverdue) {
      bill.overallStatus = "overdue";
    } else {
      bill.overallStatus = "partial";
    }

    await bill.save();

    res.status(200).json({
      message: "Milestone marked paid",
      bill,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Permanently delete bill
// @route   DELETE /api/bills/:id/permanent
// @access  Private
const permanentDeleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    if (bill.user.toString() !== req.user.id) {
      return res.status(401).json({
        message: "User not authorized",
      });
    }

    const clientId = bill.client;

    await Bill.findByIdAndDelete(req.params.id);

   
    // ✅ FIX 9: Wrap email in try/catch so email failure doesn't block delete response
    try {
      await sendDeletedInvoiceEmail(bill, req.user);
    } catch (mailErr) {
      console.log("MAIL ERROR:", mailErr.message);
    }

    const remainingBills = await Bill.countDocuments({
      client: clientId,
    });

    if (remainingBills === 0) {
      await Client.findByIdAndDelete(clientId);
    }

    res.status(200).json({
      message: "Bill permanently deleted",
    });
  } catch (error) {
    console.log("DELETE ERROR:", error);

    res.status(500).json({
      message: "Server error while deleting bill",
    });
  }
};

// @desc    Move a bill to trash (soft delete)
// @route   DELETE /api/bills/:id
// @access  Private
const deleteBill = async (req, res) => {
  try {
    const billId = req.params.id;

    const bill = await Bill.findById(billId);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (bill.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" });
    }

    bill.isDeleted = true;
    await bill.save();

    res.status(200).json({ message: "Bill moved to trash successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while moving bill to trash" });
  }
};



module.exports = {
  createBill,
  getBills,
  updateBillStatus,
  deleteBill,
  getTrashBills,
  restoreBill,
  updateBill,
  markMilestonePaid,
  permanentDeleteBill,
};
