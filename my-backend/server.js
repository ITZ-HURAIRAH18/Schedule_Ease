import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

import express from "express";
import helmet from "helmet";
import cors from "cors";
import http from "http";
import https from "https";
import fs from "fs";
import { Server } from "socket.io";
import { connectDB, isDbConnected, waitForConnection } from "./config/db.js";
import { setIO, isIOInitialized } from "./config/socket.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import hostRoutes from "./routes/hostRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import { initMeetingSocket } from "./sockets/meetingSocket.js";

const app = express();

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

const FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/$/, '') || '';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5002',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5002',
  'https://localhost:5173',
  'https://127.0.0.1:5173',
];

if (FRONTEND_URL) {
  allowedOrigins.push(FRONTEND_URL);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (FRONTEND_URL && origin.startsWith(FRONTEND_URL)) {
      return callback(null, true);
    }
    try {
      const hostname = new URL(origin).hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      const isPrivate = /^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[01]))\./.test(hostname);
      if (isLocalhost || isPrivate) {
        return callback(null, true);
      }
    } catch (_) {}
    console.error(`❌ CORS blocked for: ${origin}`);
    callback(new Error('CORS not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Initialize DB connection with proper error handling
let dbConnected = false;
let dbError = null;
let dbInitializationPromise = null;

const initDB = async () => {
  // Return existing promise if initialization is already in progress
  if (dbInitializationPromise) {
    return dbInitializationPromise;
  }

  dbInitializationPromise = (async () => {
    try {
      console.log("🔄 Initializing database connection...");
      await connectDB();

      // Wait for connection to be fully established
      const ready = await waitForConnection(30000);

      if (ready && isDbConnected()) {
        dbConnected = true;
        dbError = null;
        console.log("✅ Database initialized successfully");
      } else {
        throw new Error("Database connection not established within timeout");
      }
    } catch (error) {
      dbConnected = false;
      dbError = error.message;
      console.error("⚠️ Database initialization failed:", error.message);
      console.error("❌ MongoDB URI:", process.env.MONGO_URI ? "SET but failed to connect" : "NOT SET");
      throw error;
    } finally {
      dbInitializationPromise = null;
    }
  })();

  return dbInitializationPromise;
};

// Start DB connection attempt immediately and ensure it's ready before processing requests
initDB().catch((error) => {
  console.error("❌ Database initialization failed:", error.message);
  // Don't exit - allow server to start but requests will get 503 until DB connects
});

// Middleware to check DB status before handling requests
// This ensures requests wait for DB connection to be ready
app.use(async (req, res, next) => {
  // Skip DB check for health/status endpoints
  if (req.path === '/api/health' || req.path === '/api/db-status' || req.path === '/') {
    return next();
  }

  // For API routes, ensure DB is connected
  if (req.path.startsWith('/api/')) {
    try {
      // If DB failed to initialize, return the specific error
      if (dbError) {
        console.error("❌ DB check: Previous initialization failed:", dbError);
        return res.status(503).json({
          error: 'Database unavailable',
          message: `Database connection failed: ${dbError}`,
          retryAfter: 10
        });
      }

      // Wait for DB connection (with 10s timeout for serverless)
      console.log(`⏳ Waiting for DB connection for request: ${req.path}`);
      const ready = await waitForConnection(10000);

      if (!ready || !isDbConnected()) {
        console.error("❌ Database not ready for request:", req.path);
        return res.status(503).json({
          error: 'Service unavailable',
          message: 'Database connection is taking longer than expected. Please check your MONGO_URI and IP whitelist in MongoDB Atlas.',
          retryAfter: 5
        });
      }

      res.locals.dbStatus = 'connected';
      next();
    } catch (error) {
      console.error("❌ DB connection check failed:", error.message);
      return res.status(503).json({
        error: 'Database unavailable',
        message: 'Please try again later',
        retryAfter: 5
      });
    }
  } else {
    next();
  }
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/host", hostRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/meetings", meetingRoutes);

// ✅ Root route
app.get("/", (req, res) => {
  res.json({
    message: "Schedule Ease API is running",
    status: "OK",
    version: "1.0.0",
    database: res.locals.dbStatus
  });
});

// ✅ Database status endpoint
app.get("/api/db-status", (req, res) => {
  res.json({
    connected: dbConnected,
    error: dbError || null
  });
});

// ✅ Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// ===============================
// SOCKET.IO Setup
// ===============================
let server;
let io;
let httpServer;

const isVercel = !!process.env.VERCEL;

if (!isVercel) {
  let useHTTPS = false;
  let sslOptions;

  try {
    const keyPath = new URL("./localhost-key.pem", import.meta.url);
    const certPath = new URL("./localhost.pem", import.meta.url);
    sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    useHTTPS = true;
    console.log("🔐 HTTPS enabled (localhost-key.pem, localhost.pem)");
  } catch (err) {
    console.warn("⚠️ HTTPS certificates not found. Using HTTP");
  }

  if (useHTTPS) {
    server = https.createServer(sslOptions, app);
  } else {
    server = http.createServer(app);
  }

  if (useHTTPS) {
    httpServer = http.createServer(app);
    console.log("🌐 HTTP fallback server on port 5002");
  }

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  setIO(io);
  initMeetingSocket(io);
  console.log("✅ Socket.io instance initialized");

  const PORT = process.env.PORT || 5001;
  const HTTP_PORT = 5002;

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
  });

  if (httpServer) {
    httpServer.listen(HTTP_PORT, "0.0.0.0", () => {
      console.log(`✅ HTTP fallback on port ${HTTP_PORT}`);
    });
  }
} else {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Vercel server running on port ${PORT}`);
  });
}

export default app;