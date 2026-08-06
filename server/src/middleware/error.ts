import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/ApiError.js";
import { env } from "../config/env.js";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`));
};

/**
 * The single place errors turn into responses. Express only routes to a handler
 * with four parameters, so `_next` must stay in the signature even unused.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Anything reaching here is unexpected - log it in full, tell the client
  // nothing beyond "something broke".
  console.error("[error] unhandled:", err);
  res.status(500).json({
    error: "Internal server error",
    ...(env.isProduction ? {} : { message: String(err) }),
  });
};
