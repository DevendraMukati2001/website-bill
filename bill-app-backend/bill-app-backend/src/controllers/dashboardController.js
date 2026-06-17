const Bill = require("../models/Bill");
const mongoose = require("mongoose");

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const pipeline = [
      // ─────────────────────────────
      // Match current user's invoices
      // ─────────────────────────────
      {
        $match: {
          user: userId,
          isDeleted: false,
        },
      },

      // ─────────────────────────────
      // Multiple pipelines
      // ─────────────────────────────
      {
        $facet: {
          // Total invoice count
          totalInvoices: [
            {
              $count: "count",
            },
          ],

          // Revenue & Pending
          revenueAndPending: [
            {
              $group: {
                _id: null,

                revenue: {
                  $sum: {
                    $ifNull: ["$paidAmount", 0],
                  },
                },

                pending: {
                  $sum: {
                    $ifNull: ["$remainingAmount", 0],
                  },
                },
              },
            },
          ],

          // Unpaid invoices
          unpaidInvoices: [
            {
              $match: {
                overallStatus: {
                  $ne: "paid",
                },
              },
            },

            {
              $sort: {
                date: -1,
              },
            },

            // Client Join
            {
              $lookup: {
                from: "clients",
                localField: "client",
                foreignField: "_id",
                as: "clientInfo",
              },
            },

            // Prevent invoice removal if client missing
            {
              $unwind: {
                path: "$clientInfo",
                preserveNullAndEmptyArrays: true,
              },
            },

            // Final data
            {
              $project: {
                invoiceNumber: 1,

                total: 1,

                subtotal: 1,

                gstAmount: 1,

                discount: 1,

                date: 1,

                overallStatus: 1,

                paidAmount: 1,

                remainingAmount: 1,

                milestones: 1,

                isDeleted: 1,

                clientName: "$clientInfo.name",

                client: {
                  name: "$clientInfo.name",

                  company: "$clientInfo.company",

                  phone: "$clientInfo.phone",

                  email: "$clientInfo.email",
                },
              },
            },
          ],
        },
      },
    ];

    const results = await Bill.aggregate(pipeline);

    const stats = results[0];

    // ─────────────────────────────
    // Safe values
    // ─────────────────────────────
    const totalInvoices = stats.totalInvoices?.[0]?.count || 0;

    const revenue = stats.revenueAndPending?.[0]?.revenue || 0;

    const pending = stats.revenueAndPending?.[0]?.pending || 0;

    const unpaidInvoices = stats.unpaidInvoices || [];

    // ─────────────────────────────
    // Final response
    // ─────────────────────────────
    res.status(200).json({
      totalInvoices,

      revenue,

      pending,

      unpaidInvoices,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);

    res.status(500).json({
      message: "Server error while fetching dashboard stats",
    });
  }
};

module.exports = {
  getDashboardStats,
};
