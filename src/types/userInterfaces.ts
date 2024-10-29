import { Document } from "mongoose";
import { Request } from "express";

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: string;
  bio: string;
  profilePicture?: string;
  blocked?: boolean;
  following?: string[];
  followers?: string[];
  requests?: string[];
  blockedUsers?: string[];
  isAdmin?: boolean;
  isVerified?: boolean;
  isPrivate?: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  blockedMe?: string[];
}

export interface DecodedToken {
  id: string;
}

export interface CustomRequest extends Request {
  currentUser?: { id: string };
}