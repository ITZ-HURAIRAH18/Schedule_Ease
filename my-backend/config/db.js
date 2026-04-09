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

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      ssl: true,
    });
    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    isConnected = false;
    // Don't exit - let the caller handle the error
    throw error;
  }
};

export default connectDB;
