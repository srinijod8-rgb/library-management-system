const mongoose = require('mongoose');

// Global cache for serverless environments (e.g. Vercel)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // If connection already established, return cached connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library_management_system';

  // In production, warn clearly if pointing to localhost or missing MONGODB_URI
  if (process.env.NODE_ENV === 'production' && (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('127.0.0.1') || process.env.MONGODB_URI.includes('localhost'))) {
    throw new Error(
      'MONGODB_URI is not configured for cloud deployment. Please set MONGODB_URI in your cloud environment (Render / Vercel) to your MongoDB Atlas connection string (e.g. mongodb+srv://<user>:<password>@cluster.mongodb.net/library).'
    );
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000 // 10s timeout suitable for cloud and Atlas connections
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        console.log(`[MongoDB Connected]: ${mongooseInstance.connection.host} / ${mongooseInstance.connection.name}`);
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        console.error(`[MongoDB Connection Error]: ${err.message}`);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
};

module.exports = connectDB;
