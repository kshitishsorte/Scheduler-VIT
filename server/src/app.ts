import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";

export function createApp() {
  const app = express();

  // Behind a proxy (most hosts), this is what makes `secure` cookies work.
  app.set("trust proxy", 1);

  // The client sends its session cookie cross-origin in dev (5173 -> 5000), so
  // the allowed origin must be explicit - `*` is rejected with credentials.
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", env: env.nodeEnv });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
