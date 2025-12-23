require("dotenv").config();
const express = require("express");
const cors = require("cors");

// ----------------------------------------------------------------------
// Critical fix for internal Render connection
// ----------------------------------------------------------------------
// In production (Render), force internal host and remove credentials to ensure unauthenticated internal connection.

if (process.env.NODE_ENV === "production") {
  // 1. Set the correct internal host (as used in successful build)
  process.env.MONGO_HOST = "mongodb-o9gm";

  // 2. Remove auth credentials to prevent connection failures.
  delete process.env.MONGO_USER;
  delete process.env.MONGO_PASS;

  // 3. Optionally clear legacy MONGO_URI variables
  delete process.env.MONGO_URI;
  delete process.env.MONGODB_URI;
}

// ----------------------------------------------------------------------

const connectDB = require("./src/config/database");
const outlookSyncService = require("./src/services/outlookSyncService");
const emailSyncCron = require("./src/services/emailSyncCron");
const slaMonitoringService = require("./src/services/slaMonitoringService");

const app = express();

// Connect to database (using environment variables adjusted above)
connectDB();

// Initialize Outlook sync cron (every 10 minutes)
// Start cron only in production or when explicitly enabled
if (
  process.env.NODE_ENV === "production" ||
  process.env.ENABLE_OUTLOOK_SYNC === "true"
) {
  outlookSyncService.scheduledSync(10); // Sync every 10 minutes
}

// Initialize Email sync cron (Outlook + IMAP/SMTP) every 5 minutes
// Start in production or when explicitly enabled
if (
  process.env.NODE_ENV === "production" ||
  process.env.ENABLE_EMAIL_SYNC === "true"
) {
  emailSyncCron.startEmailSyncCron(5); // Sync every 5 minutes
}

// Initialize SLA monitoring cron (every hour)
// Start in production or when explicitly enabled
if (
  process.env.NODE_ENV === "production" ||
  process.env.ENABLE_SLA_MONITORING === "true"
) {
  slaMonitoringService.startSlaMonitoring(60); // Check every 60 minutes
}

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server health route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "SaaS Multi-tenant server operational",
    timestamp: new Date().toISOString(),
  });
});

// MongoDB connection test route
app.get("/api/test-db", async (req, res) => {
  const mongoose = require("mongoose");

  try {
    // Check connection state
    const dbState = mongoose.connection.readyState;
    const states = {
      0: "Disconnected",
      1: "Connected",
      2: "Connecting",
      3: "Disconnecting",
    };

    if (dbState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database not connected",
        state: states[dbState],
      });
    }

    // Quick write/read test
    const models = require("./src/models");
    const testData = {
      companyName: "Test-DB-Check-" + Date.now(),
      subscriptionStatus: "Trial",
    };

    const startTime = Date.now();
    const testDoc = await models.Tenant.create(testData);
    const foundDoc = await models.Tenant.findById(testDoc._id);
    await models.Tenant.deleteOne({ _id: testDoc._id });
    const responseTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      message: "Local MongoDB connection successful",
      database: {
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        state: states[dbState],
        collections: Object.keys(mongoose.connection.collections).length,
      },
      test: {
        created: !!testDoc,
        read: !!foundDoc,
        deleted: true,
        responseTime: `${responseTime}ms`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DB test error:", error);
    res.status(500).json({
      success: false,
      message: "Error during database test",
      error: error.message,
    });
  }
});

// Routes API
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/users", require("./src/routes/userRoutes")); // Routes gestion utilisateurs (RBAC)
app.use("/api/auth/outlook", require("./src/routes/outlookRoutes"));
app.use("/api/email", require("./src/routes/emailRoutes")); // Routes IMAP/SMTP
app.use("/api/communications", require("./src/routes/communicationRoutes")); // Routes communications (GET, POST, etc.)
app.use("/api/superuser", require("./src/routes/superUserRoutes"));
app.use("/api/analytics", require("./src/routes/analyticsRoutes"));
// app.use('/api/tenants', require('./src/routes/tenantRoutes'));

// 404 error handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});

module.exports = app;
