import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("✅ MongoDB already connected");
    return;
  }

  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI environment variable is not set");
    throw new Error("MONGO_URI environment variable is missing");
  }

  console.log("🔍 Attempting to connect to MongoDB...");
  console.log("📍 Connection URI (masked):", process.env.MONGO_URI.replace(/:[^:]*@/, ":****@"));

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
    });
    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error("📋 Error code:", error.code);
    console.error("📋 Error type:", error.name);
    isConnected = false;
    throw error;
  }
};

export default connectDB;
