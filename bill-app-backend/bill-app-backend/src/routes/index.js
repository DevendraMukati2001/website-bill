const express = require("express");

const { healthRouter } = require("./health.routes");
const authRoutes = require("./authRoutes");
const billRoutes = require("./billRoutes");
const clientRoutes = require("./clientRoutes");
const dashboardRoutes = require("./dashboardRoutes");

const router = express.Router();

router.use("/health", healthRouter);
router.use("/auth", authRoutes);
router.use("/bills", billRoutes);
router.use("/clients", clientRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = { router };
