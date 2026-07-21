const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config({ path: "../.env" });

const connectDB = require("./config/database");

// ==========================================
// Initialize Express App
// ==========================================
const app = express();
const server = http.createServer(app);

// ==========================================
// Socket.IO Setup
// ==========================================
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible in routes
app.set("io", io);

// ==========================================
// Middleware
// ==========================================
app.use(helmet()); // Security headers
app.use(morgan("dev")); // Request logging
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// Import Routes
// ==========================================
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const freelancerRoutes = require("./routes/freelancerRoutes");
const gigRoutes = require("./routes/gigRoutes");
const proposalRoutes = require("./routes/proposalRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const messageRoutes = require("./routes/messageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const disputeRoutes = require("./routes/disputeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const searchRoutes = require("./routes/searchRoutes");

// Import Socket Handler
const initializeSocket = require("./socket/socketHandler");

// ==========================================
// Mount Routes
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/freelancers", freelancerRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/search", searchRoutes);

// ==========================================
// Health Check Route
// ==========================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 SkillSphere API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ==========================================
// Initialize Socket.IO Handler
// ==========================================
initializeSocket(io);

// ==========================================
// Global Error Handler
// ==========================================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ==========================================
// Start Server
// ==========================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Log all registered models
    const mongoose = require("mongoose");
    const models = Object.keys(mongoose.models);
    console.log(`\n📋 Registered Models (${models.length}):`);
    models.forEach((model) => console.log(`   ✓ ${model}`));

    // Start listening
    server.listen(PORT, () => {
      console.log(`\n🚀 SkillSphere Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📡 Socket.IO ready`);
      console.log(`🔗 http://localhost:${PORT}\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Import all models to register them
require("./models/User");
require("./models/FreelancerProfile");
require("./models/ClientProfile");
require("./models/Gig");
require("./models/Proposal");
require("./models/Review");
require("./models/Conversation");
require("./models/Message");
require("./models/Payment");
require("./models/Notification");
require("./models/Dispute");
require("./models/AdminLog");

startServer();

module.exports = { app, server, io };
