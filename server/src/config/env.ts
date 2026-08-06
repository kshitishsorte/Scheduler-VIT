import "dotenv/config";
import { z } from "zod";

/**
 * All configuration is read and validated exactly once, here. Nothing else in
 * the codebase touches `process.env` directly, so a missing or malformed value
 * fails loudly at boot rather than as an undefined deep inside a request.
 */
const DEV_JWT_SECRET = "dev-only-insecure-secret-do-not-use-in-production";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  /**
   * Left unset in development, in which case the server starts a throwaway
   * in-memory MongoDB. Point this at Atlas or a local mongod for real data.
   */
  MONGODB_URI: z.string().url().optional(),

  JWT_SECRET: z.string().min(32).optional(),

  /** How long an issued session cookie stays valid. */
  JWT_EXPIRES_IN: z.string().default("7d"),

  /** Origin allowed to send credentialed requests (the Vite dev server). */
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

const raw = parsed.data;
const isProduction = raw.NODE_ENV === "production";

// A production deployment must never fall back to the shared dev secret: doing
// so would let anyone forge a session token for any account.
if (isProduction && !raw.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is required in production and must be at least 32 characters.",
  );
}

if (isProduction && !raw.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is required in production; the in-memory database is dev-only.",
  );
}

if (!raw.JWT_SECRET) {
  console.warn(
    "[env] JWT_SECRET is not set - falling back to a well-known development secret.",
  );
}

export const env = {
  nodeEnv: raw.NODE_ENV,
  isProduction,
  isTest: raw.NODE_ENV === "test",
  port: raw.PORT,
  mongodbUri: raw.MONGODB_URI,
  jwtSecret: raw.JWT_SECRET ?? DEV_JWT_SECRET,
  jwtExpiresIn: raw.JWT_EXPIRES_IN,
  clientOrigin: raw.CLIENT_ORIGIN,
} as const;
