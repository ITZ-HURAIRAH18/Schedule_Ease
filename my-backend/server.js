import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import https from "https";
import fs from "fs";
import { Server } from "socket.io";
import connectDB from "./config/db.js";

// ✅ Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import hostRoutes from "./routes/hostRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Initialize DB connection on first request
let dbConnected = false;
app.use(async (req, res, next) => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error) {
      console.error("DB connection failed:", error.message);
      return res.status(500).json({ error: "Database connection failed" });
    }
  }
  next();
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/host", hostRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/meetings", meetingRoutes);

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
// SOCKET.IO Setup (Local Development Only)
// ===============================
let server;
let io;

if (process.env.NODE_ENV !== "production") {
  // Local development setup with socket.io
  try {
    const keyPath = new URL("./localhost-key.pem", import.meta.url);
    const certPath = new URL("./localhost.pem", import.meta.url);
    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    server = https.createServer(sslOptions, app);
    console.log("🔐 HTTPS enabled (localhost-key.pem, localhost.pem)");
  } catch (err) {
    console.warn("⚠️ HTTPS certificates not found. Using HTTP for development");
    server = http.createServer(app);
  }

  io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling'], // Support both transports
  allowEIO3: true, // Backward compatibility
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  connectTimeout: 45000, // 45 seconds
});

// ✅ Track meeting rooms
const meetingRooms = {};

// ===============================
// 🌍 GLOBAL SOCKET (dashboard, host updates, chat)
// ===============================
io.on("connection", (socket) => {
  console.log("🟢 Dashboard/Global Client Connected:", socket.id);

  // Chat / broadcast messages
  socket.on("send_message", (msg) => {
    console.log("💬 Global Message:", msg);
    io.emit("receive_message", msg);
  });

  // Host joins private room for dashboard live updates
  socket.on("join_host_room", (hostId) => {
    socket.join(hostId);
    console.log(`🏠 Host ${hostId} joined private dashboard room`);
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

    // Join specific meeting room
    socket.on("join_meeting_room", (roomId) => {
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
    });

    // WebRTC signaling between peers
    socket.on("signal", ({ roomId, signal, sender }) => {
      socket.to(roomId).emit("signal", { signal, sender });
    });

    // ✅ MEETING disconnect (separate from global)
    socket.on("disconnect", () => {
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
    });
  });

  // ✅ Start server for local development
  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || '0.0.0.0';
  server.listen(PORT, HOST, () =>
    console.log(`✅ Development server running on ${HOST}:${PORT}`)
  );
}

// ===============================
// EXPORT FOR VERCEL & EXTERNAL USE
// ===============================
export default app;
export { io, server };
