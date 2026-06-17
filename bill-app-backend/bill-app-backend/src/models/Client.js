const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    // models/Client.js — add dob to clientSchema
dob: {
  type: Date,
  default: null,
},
    gstNumber: {
      type: String,
      required: true,
      unique: true, // GST number should be unique for each client
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    // We will store a list of bills associated with this client
    bills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bill",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Client = mongoose.model("Client", clientSchema);

module.exports = Client;
