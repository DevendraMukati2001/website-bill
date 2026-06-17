const Bill = require("../models/Bill");
const Client = require("../models/Client");
const mongoose = require("mongoose");

//    Get a paginated summary of clients for the logged-in user
const getClientsSummary = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const userId = new mongoose.Types.ObjectId(req.user.id);

    const pipeline = [
      // Stage 1: Filter bills to only those owned by the logged-in user.
      {
        $match: {
          user: userId,
          isDeleted: false,
        },
      },
      // Stage 2: Group documents by client to calculate aggregates.
      {
        $group: {
          _id: "$client", // Group by the client's ObjectId
          total: { $sum: "$total" }, // Sum the total of all bills for the client
          count: { $sum: 1 }, // Count the number of bills for the client
          remainingAmounts: { $push: "$remainingAmount" }, // Collect all bill statuses into an array
        },
      },
      // Stage 3: Join with the 'clients' collection to get client details.
      {
        $lookup: {
          from: "clients",
          localField: "_id",
          foreignField: "_id",
          as: "clientInfo",
        },
      },
      // Stage 4: Deconstruct the clientInfo array and handle cases where client might not be found.
      {
        $unwind: {
          path: "$clientInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Stage 5: Project the final shape of the documents.
      {
        $project: {
          _id: 1, // Keep the original _id from the $group stage, which is the client's ID
          name: "$clientInfo.name",
          total: "$total",
          count: "$count",
          // Determine status: if 'unpaid' is in the statuses array, status is 'unpaid', else 'paid'.
          overallStatus: {
            $cond: {
              if: { $gt: [{ $sum: "$remainingAmounts" }, 0] },
              then: "unpaid",
              else: "paid",
            },
          },
        },
      },
      // Stage 6: Sort the results by client name.
      {
        $sort: { name: 1 },
      },
      // Stage 7: Implement pagination using $facet.
      {
        $facet: {
          metadata: [{ $count: "totalClients" }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ];

    const results = await Bill.aggregate(pipeline);

    const clients = results[0].data;
    const totalClients = results[0].metadata[0]
      ? results[0].metadata[0].totalClients
      : 0;

    res.status(200).json({
      clients,
      currentPage: page,
      totalPages: Math.ceil(totalClients / limit),
      totalClients,
    });
  } catch (error) {
    console.error("Error fetching clients summary:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching clients summary" });
  }
};

// @desc    Get a specific client's profile with their paginated bills
// @route   GET /api/clients/:id
// @access  Private
const getClientProfile = async (req, res) => {
  try {
    const clientId = req.params.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Security Check: Verify the user has at least one bill with this client.
    // This prevents a user from accessing another user's client data.
    const hasAccess = await Bill.findOne({
      client: clientId,
      user: req.user.id,
    });

    if (!hasAccess) {
      // If no bill links this user and client, they are not authorized.
      // We send a 404 to avoid revealing that the client exists.
      return res.status(404).json({ message: "Client not found" });
    }

    // Fetch the client and populate their bills with pagination
    const client = await Client.findById(clientId).populate({
      path: "bills",
      match: { user: req.user.id }, // Only populate bills belonging to the current user
      options: {
        sort: { date: -1 },
        skip: skip,
        limit: limit,
      },
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Get total bill count for this client and user for pagination metadata
    const totalBills = await Bill.countDocuments({
      client: clientId,
      user: req.user.id,
      isDeleted: false,
    });

    res.status(200).json({
      client,
      currentPage: page,
      totalPages: Math.ceil(totalBills / limit),
      totalBills,
    });
  } catch (error) {
    console.error("Error fetching client profile:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching client profile" });
  }
};

module.exports = {
  getClientsSummary,
  getClientProfile,
};
