const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { router } = require("./routes");

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/", (req, res) => {
    res.json({ ok: true, message: "bill-app-backend" });
  });

  app.use("/api", router);

  // Basic 404
  app.use((req, res) => {
    res.status(404).json({ ok: false, message: "Not found" });
  });

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.statusCode || err.status || 500; // ✅ fixed
    res.status(status).json({
      ok: false,
      message: err.message || "Internal Server Error",
    });
  });

  return app;
}

module.exports = { createApp };
