import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectToDatabase, disconnectFromDatabase } from "./db/connect.js";

async function main() {
  // Connect before listening, so the server never accepts a request it cannot
  // serve.
  await connectToDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[server] ${signal} received, shutting down`);
    server.close();
    await disconnectFromDatabase();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
