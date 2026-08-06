import type { RequestHandler } from "express";
import { ApiError } from "../lib/ApiError.js";
import { SESSION_COOKIE, verifySessionToken } from "../lib/token.js";
import { User } from "../models/User.js";

/**
 * Gate for every route that touches user data. Rejects with 401 unless the
 * request carries a valid session cookie *and* that user still exists - a token
 * for a deleted account must not keep working until it expires.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;

  if (!token) {
    next(ApiError.unauthorized());
    return;
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    next(ApiError.unauthorized("Session expired or invalid"));
    return;
  }

  User.findById(payload.sub)
    .then((user) => {
      if (!user) {
        next(ApiError.unauthorized("Account no longer exists"));
        return;
      }
      req.user = user;
      next();
    })
    .catch(next);
};

/**
 * Narrows `req.user` for handlers behind `requireAuth`. Throwing here would
 * mean the route was mounted without the guard - a wiring bug, not a user error.
 */
export function requireUser(req: Express.Request): NonNullable<
  Express.Request["user"]
> {
  if (!req.user) {
    throw new Error("requireUser called on a route not behind requireAuth");
  }
  return req.user;
}
