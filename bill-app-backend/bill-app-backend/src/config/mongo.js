const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bill-app";

async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;

  mongoose.set("strictQuery", true);

  await mongoose.connect(MONGO_URI, {
    autoIndex: true,
  });

  return mongoose.connection;
}

module.exports = { connectMongo };
