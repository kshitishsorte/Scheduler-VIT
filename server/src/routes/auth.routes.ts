import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../lib/ApiError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import {
  clearSessionCookie,
  setSessionCookie,
  signSessionToken,
} from "../lib/token.js";
import { requireAuth, requireUser } from "../middleware/requireAuth.js";
import {
  User,
  hashPassword,
  toPublicUser,
  verifyPassword,
} from "../models/User.js";

const router = Router();

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password } = signupSchema.parse(
      req.body,
    );

    const existing = await User.findOne({ email });
    if (existing) {
      throw ApiError.conflict("An account with that email already exists");
    }

    let user;
    try {
      user = await User.create({
        firstName,
        lastName,
        email,
        passwordHash: await hashPassword(password),
      });
    } catch (err) {
      // Two concurrent signups can both pass the check above; the unique index
      // is what actually guarantees it, so translate its error properly.
      if (
        err &&
        typeof err === "object" &&
        (err as { code?: number }).code === 11000
      ) {
        throw ApiError.conflict("An account with that email already exists");
      }
      throw err;
    }

    setSessionCookie(res, signSessionToken(user._id.toString()));
    res.status(201).json({ user: toPublicUser(user) });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    // passwordHash is `select: false`, so it must be asked for explicitly.
    const user = await User.findOne({ email }).select("+passwordHash");

    // One identical message for "no such user" and "wrong password": a
    // different response for each would let anyone test which emails are
    // registered.
    const invalid = ApiError.unauthorized("Invalid email or password");
    if (!user) {
      throw invalid;
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      throw invalid;
    }

    setSessionCookie(res, signSessionToken(user._id.toString()));
    res.json({ user: toPublicUser(user) });
  }),
);

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

/** Lets the client restore a session on page load without storing anything. */
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: toPublicUser(requireUser(req)) });
  }),
);

export default router;
