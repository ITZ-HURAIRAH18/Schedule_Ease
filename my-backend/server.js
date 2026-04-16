import dotenv from "dotenv";

// ✅ Load environment variables FIRST before any other imports
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import https from "https";
import fs from "fs";
import { Server } from "socket.io";
import { connectDB, isDbConnected, waitForConnection } from "./config/db.js";
import { setIO, isIOInitialized } from "./config/socket.js";

// ✅ Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import hostRoutes from "./routes/hostRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";

const app = express();

// ✅ Global error handlers for unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // Log but don't exit - allows server to continue
});

// ✅ Configure CORS for development and production
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      // Local development
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      // Production
      'https://schedule-ease-a4ur.vercel.app',
      'https://schedule-ease-zeta.vercel.app',
      'https://localhost:5173', // HTTPS localhost
      process.env.FRONTEND_URL?.replace(/\/$/, ''), // Remove trailing slash from .env
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

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
      // If DB is already connected, proceed immediately
      if (isDbConnected()) {
        res.locals.dbStatus = 'connected';
        return next();
      }

      // Wait for DB connection (with 15s timeout for mobile/slow networks)
      console.log(`⏳ Waiting for DB connection for request: ${req.path}`);
      const ready = await waitForConnection(15000);

      if (!ready || !isDbConnected()) {
        console.error("❌ Database not ready for request:", req.path);
        return res.status(503).json({
          error: 'Service unavailable',
          message: 'Database connection is being established. Please try again in a moment.',
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
// SOCKET.IO Setup (All Environments)
// ===============================
let server;
let io;
let httpServer;

// For Vercel serverless, we can't maintain persistent WebSocket connections
// Socket.IO will be initialized but won't work in serverless environment
// Alternative: Use a dedicated WebSocket service (Pusher, Ably, Supabase Realtime)
const isServerless = process.env.VERCEL || process.env.NODE_ENV === "production";

if (!isServerless) {
  // Local development setup with socket.io
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
    console.warn("⚠️ HTTPS certificates not found. Using HTTP for development");
  }

  // Create primary server (HTTPS if certs available, otherwise HTTP)
  if (useHTTPS) {
    server = https.createServer(sslOptions, app);
  } else {
    server = http.createServer(app);
  }

  // Create secondary HTTP server for browser compatibility (when using HTTPS)
  if (useHTTPS) {
    httpServer = http.createServer(app);
    console.log("🌐 HTTP server also available on port 5001 for browser compatibility");
  }

  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'https://schedule-ease-a4ur.vercel.app',
        'https://schedule-ease-zeta.vercel.app',
        'https://localhost:5173'
      ],
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
  });

  // ✅ Register the io instance with our singleton manager
  setIO(io);
} else {
  // Production (Vercel serverless) - Socket.IO cannot work here
  // Log warning and provide alternative
  console.log("⚠️ Running on Vercel serverless - Socket.IO WebSockets are not supported");
  console.log("💡 Consider using: Pusher, Ably, or Supabase Realtime for production WebSockets");
  console.log("💡 Alternative: Use HTTP polling/polling for real-time updates");
  
  // Don't initialize Socket.IO in serverless environment
  // The setIO will not be called, and safeEmit will log warnings
}

// ✅ Track meeting rooms (only used in development)
const meetingRooms = {};

// ===============================
// 🌍 GLOBAL SOCKET (dashboard, host updates, chat)
// ===============================
if (!isServerless && io) {
  io.on("connection", (socket) => {
    console.log("🟢 Dashboard/Global Client Connected:", socket.id);

    // Add error handler for this socket
    socket.on("error", (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });

    // Chat / broadcast messages
    socket.on("send_message", (msg) => {
      try {
        console.log("💬 Global Message:", msg);
        io.emit("receive_message", msg);
      } catch (error) {
        console.error("❌ Error broadcasting message:", error);
      }
    });

    // Host joins private room for dashboard live updates
    socket.on("join_host_room", (hostId) => {
      try {
        socket.join(hostId);
        console.log(`🏠 Host ${hostId} joined private dashboard room`);
      } catch (error) {
        console.error("❌ Error joining host room:", error);
      }
    });

    // ✅ Dashboard disconnect
    socket.on("disconnect", () => {
      console.log("🔴 Dashboard/Global Client Disconnected:", socket.id);
    });
  });

  // ===============================
  // 🎥 MEETING SOCKET NAMESPACE
  // ===============================
  const meetingNamespace = io.of("/meeting");

  meetingNamespace.on("connection", (socket) => {
    console.log("🎥 Meeting Client Connected:", socket.id);

    // Add error handler for this socket
    socket.on("error", (error) => {
      console.error(`❌ Meeting socket error for ${socket.id}:`, error);
    });

    // Join specific meeting room
    socket.on("join_meeting_room", (roomId) => {
      try {
        if (!meetingRooms[roomId]) meetingRooms[roomId] = [];
        meetingRooms[roomId].push(socket.id);
        socket.join(roomId);
        console.log(`👥 ${socket.id} joined meeting room ${roomId}`);

        const users = meetingRooms[roomId];

        // Assign roles for WebRTC
        if (users.length === 1) {
          socket.emit("meeting_role", { initiator: false });
        } else if (users.length === 2) {
          socket.emit("meeting_role", { initiator: true });
          const [firstUser] = users;
          meetingNamespace.to(firstUser).emit("peer_ready");
        } else {
          socket.emit("room_full");
        }
      } catch (error) {
        console.error("❌ Error joining meeting room:", error);
      }
    });

    // WebRTC signaling between peers
    socket.on("signal", ({ roomId, signal, sender }) => {
      try {
        socket.to(roomId).emit("signal", { signal, sender });
      } catch (error) {
        console.error("❌ Error sending signal:", error);
      }
    });

    // ✅ MEETING disconnect (separate from global)
    socket.on("disconnect", () => {
      try {
        console.log("❌ Meeting Client Disconnected:", socket.id);

        for (const roomId in meetingRooms) {
          meetingRooms[roomId] = meetingRooms[roomId].filter(
            (id) => id !== socket.id
          );

          if (meetingRooms[roomId].length === 0) {
            delete meetingRooms[roomId];
            console.log(`🧹 Meeting room ${roomId} deleted (empty)`);
          }
        }
      } catch (error) {
        console.error("❌ Error handling meeting disconnect:", error);
      }
    });
  });

  // ✅ Start server for local development
  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || '0.0.0.0';
  server.listen(PORT, HOST, () =>
    console.log(`✅ Development server running on ${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`)
  );

  // Start HTTP fallback server on different port if HTTPS is enabled
  if (httpServer) {
    const HTTP_PORT = parseInt(PORT) + 1; // Use PORT+1 (e.g., 5002 if PORT is 5001)
    httpServer.listen(HTTP_PORT, HOST, () =>
      console.log(`✅ HTTP fallback server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${HTTP_PORT}`)
    );
  }
}

// ===============================
// EXPORT FOR VERCEL & EXTERNAL USE
// ===============================
export default app;
export { io, server };
