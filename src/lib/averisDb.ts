import mongoose from "mongoose";

const AVERIS_URI = process.env.AVERIS_MONGODB_URI;

interface AverisCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

const g = global as Record<string, unknown>;
if (!g.__averisMongoose) {
  g.__averisMongoose = { conn: null, promise: null } as AverisCache;
}
const cached = g.__averisMongoose as AverisCache;

export async function connectAverisDb(): Promise<mongoose.Connection> {
  if (!AVERIS_URI) {
    throw new Error("AVERIS_MONGODB_URI is not defined in environment variables.");
  }

  if (cached.conn && cached.conn.readyState === 1) return cached.conn;

  if (!cached.promise) {
    const conn = mongoose.createConnection(AVERIS_URI, {
      bufferCommands: false,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });
    cached.promise = conn.asPromise();
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
