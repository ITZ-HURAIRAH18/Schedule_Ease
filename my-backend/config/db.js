import mongoose from "mongoose";
import dns from "dns";

// ✅ Force use of Google and Cloudflare DNS for SRV resolution
// This fixes "querySrv ECONNREFUSED" errors common with some ISPs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  console.log("📡 DNS servers set to 8.8.8.8, 1.1.1.1 for MongoDB SRV resolution");
} catch (err) {
  console.warn("⚠️ Failed to set custom DNS servers:", err.message);
}

/**
 * MongoDB Connection Manager - Production Optimized
 *
 * Key changes:
 * - Re-enabled bufferCommands with extended timeout (prevents hard failures during cold starts)
 * - Reduced heartbeat frequency to save resources in serverless
 * - Added readPreference and writeConcern for replica set awareness
 * - Better connection state tracking with age-based refresh
 */

// Connection cache persists across serverless invocations (in same container)
let cachedConnection = null;
let connectionPromise = null;
let lastConnectionTime = 0;

// Connection age threshold - force refresh after 8 hours (serverless best practice)
const MAX_CONNECTION_AGE_MS = 8 * 60 * 60 * 1000;

/**
 * Establishes MongoDB connection with serverless-optimized settings
 * @returns {Promise<mongoose.Connection>} Active mongoose connection
 */
const connectDB = async () => {
  // Check MONGO_URI is set (after dotenv.config() in server.js)
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("❌ [DB] MONGO_URI environment variable is not set");
    throw new Error("MONGO_URI environment variable is missing");
  }

  const MASKED_URI = MONGO_URI.replace(/:[^:]*@/, ":****@");
  console.log("🔍 [DB] Attempting to connect to MongoDB...");

  // Check if connection is still valid and not too old
  const now = Date.now();
  if (
    cachedConnection &&
    mongoose.connection.readyState === 1 &&
    now - lastConnectionTime < MAX_CONNECTION_AGE_MS
  ) {
    console.log("✅ [DB] Using cached MongoDB connection");
    return cachedConnection;
  }

  // If connection is too old, close it gracefully before reconnecting
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log("♻️ [DB] Refreshing stale MongoDB connection (age limit reached)");
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    cachedConnection = null;
    connectionPromise = null;
  }

  // Return existing connection promise if connection is in progress
  if (connectionPromise) {
    console.log("⏳ [DB] MongoDB connection in progress, reusing promise");
    return connectionPromise;
  }

  console.log("🔍 [DB] Establishing new MongoDB connection...");

  // Create new connection promise
  connectionPromise = (async () => {
    try {
      // Configure mongoose for serverless environment
      mongoose.set("strictQuery", false);

      // ✅ RE-ENABLED: Buffer commands but with reasonable timeout
      // This prevents hard "buffering timed out" errors during cold starts
      // while still failing fast if the DB is genuinely unreachable
      mongoose.set("bufferCommands", true);

      const connection = await mongoose.connect(MONGO_URI, {
        // Serverless-optimized connection pool settings
        maxPoolSize: 10,              // Limit connections per container
        minPoolSize: 1,               // Maintain at least 1 connection
        maxConnecting: 2,             // Limit simultaneous connection attempts

        // Timeout settings - balanced for production
        serverSelectionTimeoutMS: 15000,  // Reduced from 30s (fail faster)
        socketTimeoutMS: 45000,           // Socket operation timeout
        connectTimeoutMS: 20000,          // Reduced from 30s

        // Replica set awareness for production
        readPreference: "primaryPreferred",
        writeConcern: { w: "majority" },

        // Retry writes for reliability
        retryWrites: true,
        retryReads: true,

        // Heartbeat - less aggressive for serverless (saves resources)
        heartbeatFrequencyMS: 30000,      // Increased from 10s → 30s
      });

      // Cache the successful connection
      cachedConnection = connection;
      lastConnectionTime = now;
      connectionPromise = null;

      // Set up connection event listeners
      setupConnectionListeners(mongoose.connection);

      console.log(`✅ [DB] MongoDB connected successfully: ${connection.connection.host}`);
      return cachedConnection;
    } catch (error) {
      console.error(`❌ [DB] MongoDB connection failed: ${error.message}`);
      console.error("📋 [DB] Error code:", error.code);
      console.error("📋 [DB] Error name:", error.name);

      // Reset promise on failure so next attempt can retry
      connectionPromise = null;
      console.error("💡 [DB] TIP: Verify your MONGO_URI and network firewall settings.");
      throw error;
    }
  })();

  return connectionPromise;
};

/**
 * Sets up event listeners for MongoDB connection monitoring
 * @param {mongoose.Connection} connection - Active mongoose connection
 */
const setupConnectionListeners = (connection) => {
  connection.on("error", (error) => {
    console.error("❌ [DB] MongoDB connection error:", error.message);
    // Clear cache on error to force reconnection
    cachedConnection = null;
    connectionPromise = null;
  });

  connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected");
    // Clear cache to allow reconnection on next request
    cachedConnection = null;
    connectionPromise = null;
  });

  connection.on("reconnected", () => {
    console.log("🔄 MongoDB reconnected");
    lastConnectionTime = Date.now();
  });

  connection.on("open", () => {
    console.log("✅ MongoDB connection opened");
  });
};

/**
 * Checks if database connection is currently active
 * @returns {boolean} Connection status
 */
const isDbConnected = () => {
  return mongoose.connection.readyState === 1; // 1 = connected
};

/**
 * Waits for database connection to be established
 * Useful for ensuring connection before handling requests
 * @param {number} timeoutMs - Maximum time to wait (default: 30s)
 * @returns {Promise<boolean>} Whether connection was established
 */
const waitForConnection = async (timeoutMs = 30000) => {
  if (isDbConnected()) return true;

  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (isDbConnected()) return true;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return false;
};

export { connectDB, isDbConnected, waitForConnection };
export default connectDB;
