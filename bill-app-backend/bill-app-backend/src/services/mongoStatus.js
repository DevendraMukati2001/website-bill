const mongoose = require("mongoose");

async function getMongoStatus() {
  const state = mongoose.connection.readyState;

  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const map = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const status = map[state] || "unknown";
  return { state, status };
}

module.exports = { getMongoStatus };
