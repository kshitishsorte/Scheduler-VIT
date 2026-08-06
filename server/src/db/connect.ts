import mongoose from "mongoose";
import { env } from "../config/env.js";

let memoryServer: { stop: () => Promise<boolean> } | null = null;

/**
 * Connects to MongoDB.
 *
 * When MONGODB_URI is set we use it directly. When it is not (the common case
 * on a fresh dev machine with no mongod installed) we spin up an in-memory
 * MongoDB instead, so `npm run dev` works with zero setup. That instance is
 * ephemeral - its data is gone when the process exits.
 */
export async function connectToDatabase(): Promise<void> {
  let uri = env.mongodbUri;

  if (!uri) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const instance = await MongoMemoryServer.create();
    memoryServer = instance;
    uri = instance.getUri("scheduler-vit");
    console.warn(
      "[db] MONGODB_URI not set - started an in-memory MongoDB. Data will NOT persist across restarts.",
    );
  }

  // Fail fast instead of buffering queries for 30s when the server is down.
  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });

  console.log(
    `[db] connected${env.mongodbUri ? "" : " (in-memory)"} to ${mongoose.connection.name}`,
  );
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
