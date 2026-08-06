import type { RequestHandler } from "express";

/**
 * Express 4 does not catch rejected promises from handlers - an async handler
 * that throws would hang the request until it timed out. Wrapping forwards the
 * rejection to the error middleware instead.
 */
export function asyncHandler(
  handler: (...args: Parameters<RequestHandler>) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
