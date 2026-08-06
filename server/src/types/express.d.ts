import type { UserDocument } from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth`; present on any handler mounted behind it. */
      user?: UserDocument;
    }
  }
}

export {};
