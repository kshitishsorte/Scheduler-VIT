import jwt, { type SignOptions } from "jsonwebtoken";
import type { Response } from "express";
import { env } from "../config/env.js";

export const SESSION_COOKIE = "scheduler_session";

export interface SessionPayload {
  /** User id. */
  sub: string;
}

export function signSessionToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign({ sub: userId } satisfies SessionPayload, env.jwtSecret, options);
}

/** Returns the payload, or null when the token is missing, forged, or expired. */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded === "string" || typeof decoded.sub !== "string") {
      return null;
    }
    return { sub: decoded.sub };
  } catch {
    return null;
  }
}

/**
 * Converts a jsonwebtoken duration ("7d", "12h", "30m", "45s", or raw seconds)
 * into milliseconds, so the cookie expires alongside the token it carries.
 */
function durationToMs(duration: string): number {
  const match = /^(\d+)\s*([smhd])?$/.exec(duration.trim());
  if (!match) {
    // Fall back to 7 days rather than minting a session cookie with no expiry.
    return 7 * 24 * 60 * 60 * 1000;
  }
  const amount = Number(match[1]);
  const unit = match[2] ?? "s";
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * multipliers[unit as keyof typeof multipliers];
}

/**
 * The token goes in an httpOnly cookie rather than localStorage: JavaScript on
 * the page cannot read it, so an XSS bug cannot exfiltrate the session.
 */
export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    // Lax is correct while the client and API share a site (localhost, or one
    // domain in production). Split them across domains and this must become
    // `sameSite: "none"` with `secure: true`.
    sameSite: "lax",
    secure: env.isProduction,
    maxAge: durationToMs(env.jwtExpiresIn),
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  // Options must match those used when setting, or the browser keeps the cookie.
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
  });
}
