import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: 60,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    /**
     * Always a bcrypt hash, never a plaintext password. `select: false` keeps it
     * out of every query result unless explicitly asked for, so it cannot be
     * leaked by accidentally serialising a user document into a response.
     */
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

/** The only shape of a user that is ever sent to the client. */
export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export const User: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ??
  mongoose.model<UserDocument>("User", userSchema);
