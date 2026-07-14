import mongoose from 'mongoose';
import https from 'https';
import dns from 'dns';

/**
 * Resolve SRV records using DNS-over-HTTPS (Cloudflare).
 * This bypasses ISP DNS blocking completely.
 */
function resolveSrvViaDoH(srvName) {
  return new Promise((resolve, reject) => {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(srvName)}&type=SRV`;
    https.get(url, { headers: { 'Accept': 'application/dns-json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.Answer || json.Answer.length === 0) {
            return reject(new Error(`No SRV records found for ${srvName}`));
          }
          // SRV data format: "priority weight port target"
          const hosts = json.Answer
            .filter(a => a.type === 33) // SRV record type
            .map(a => {
              const parts = a.data.split(' ');
              return { priority: +parts[0], weight: +parts[1], port: +parts[2], target: parts[3].replace(/\.$/, '') };
            });
          resolve(hosts);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Resolve a hostname to IP addresses using DNS-over-HTTPS.
 */
function resolveHostViaDoH(hostname) {
  return new Promise((resolve, reject) => {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`;
    https.get(url, { headers: { 'Accept': 'application/dns-json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const ips = (json.Answer || []).filter(a => a.type === 1).map(a => a.data);
          resolve(ips);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Build a direct mongodb:// connection string by resolving SRV records via DoH.
 */
async function buildDirectUri(srvUri) {
  const parsed = new URL(srvUri);
  const srvHostname = parsed.hostname;
  const srvName = `_mongodb._tcp.${srvHostname}`;

  console.log(`   Resolving SRV: ${srvName} via DNS-over-HTTPS...`);
  const hosts = await resolveSrvViaDoH(srvName);
  console.log(`   Found ${hosts.length} MongoDB hosts`);

  // Resolve each host to IP addresses (bypasses local DNS)
  const resolvedHosts = [];
  for (const host of hosts) {
    try {
      const ips = await resolveHostViaDoH(host.target);
      if (ips.length > 0) {
        resolvedHosts.push(`${ips[0]}:${host.port}`);
        console.log(`   ${host.target} → ${ips[0]}:${host.port}`);
      } else {
        // fallback to hostname
        resolvedHosts.push(`${host.target}:${host.port}`);
      }
    } catch {
      resolvedHosts.push(`${host.target}:${host.port}`);
    }
  }

  // Extract database name from path or search params
  const dbName = parsed.pathname && parsed.pathname !== '/'
    ? decodeURIComponent(parsed.pathname.slice(1).split('/')[0])
    : parsed.searchParams.get('appName') || undefined;

  // Build direct mongodb:// URI
  const auth = parsed.username
    ? `${parsed.username}:${parsed.password}@`
    : '';

  const directUri = `mongodb://${auth}${resolvedHosts.join(',')}/${dbName || ''}?ssl=true&authSource=admin&retryWrites=true&w=majority`;

  return { directUri, dbName };
}

/**
 * Extract the database name from a MongoDB URI path (e.g. /FirstData → "FirstData").
 */
function getDbNameFromUri(uri) {
  try {
    const parsed = new URL(uri);
    const pathDb = parsed.pathname && parsed.pathname !== '/'
      ? decodeURIComponent(parsed.pathname.slice(1).split('/')[0])
      : null;
    return pathDb || null;
  } catch {
    return null;
  }
}

let connectionPromise = null;

async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGO_URI is not set in your .env file. ' +
      'Please add your MongoDB connection string as MONGO_URI.'
    );
  }

  // Check if connection is already active
  if (mongoose.connection.readyState === 1) {
    console.log("✅ [DB] Using cached MongoDB connection");
    return mongoose.connection;
  }

  if (connectionPromise) {
    console.log("⏳ [DB] MongoDB connection in progress, reusing promise");
    return connectionPromise;
  }

  connectionPromise = (async () => {
    // Extract DB name from URI path (e.g. /FirstData)
    const dbName = getDbNameFromUri(uri) || 'FirstData';

    const connectOptions = {
      dbName,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 30000,
    };

    // --- Attempt 1: Try direct connection with SRV URI ---
    try {
      console.log('⏳ Connecting to MongoDB (SRV)...');
      // Set DNS to Google/Cloudflare in case system DNS is partially broken
      dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

      await mongoose.connect(uri, connectOptions);
      console.log('✅ MongoDB connected successfully (SRV)');
      console.log(`   Database: ${mongoose.connection.db.databaseName}`);
      connectionPromise = null;
      return mongoose.connection;
    } catch (srvError) {
      console.log(`⚠️  SRV connection failed: ${srvError.message}`);
      await mongoose.disconnect().catch(() => {});
    }

    // --- Attempt 2: Bypass DNS entirely using DNS-over-HTTPS ---
    if (uri.startsWith('mongodb+srv://')) {
      try {
        console.log('⏳ Bypassing DNS — resolving via DNS-over-HTTPS...');
        const { directUri } = await buildDirectUri(uri);

        await mongoose.connect(directUri, {
          ...connectOptions,
          tls: true,
          tlsAllowInvalidHostnames: true,
        });
        console.log('✅ MongoDB connected successfully (direct IP)');
        console.log(`   Database: ${mongoose.connection.db.databaseName}`);
        connectionPromise = null;
        return mongoose.connection;
      } catch (directError) {
        console.error(`❌ Direct connection also failed: ${directError.message}`);
        await mongoose.disconnect().catch(() => {});
        connectionPromise = null;
        throw directError;
      }
    }

    connectionPromise = null;
    throw new Error('Unable to connect to MongoDB');
  })();
  
  return connectionPromise;
}

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

  if (connectionPromise) {
    try {
      await Promise.race([
        connectionPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs))
      ]);
      return isDbConnected();
    } catch (e) {
      return isDbConnected();
    }
  }

  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (isDbConnected()) return true;
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return false;
};

export { connectDB, isDbConnected, waitForConnection };
export default connectDB;
