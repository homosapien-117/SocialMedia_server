import { model, Document, Schema } from "mongoose";
import { IUser } from "../types/userInterfaces";



const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: "Write something..!!",
    },
    profilePicture: {
      type: String,
      default:
        "https://www.kindpng.com/picc/m/780-7804962_cartoon-avatar-png-image-transparent-avatar-user-image.png",
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    following: {
      type: [String],
      default: [],
    },
    followers: {
      type: [String],
      default: [],
    },
    requests: {
      type: [String],
      default: [],
    },
    blockedUsers: {
      type: [String],
      default: [],
    },
    blockedMe: {
      type: [String],
      default: [],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

const UserModel = model<IUser>("users", userSchema);
export { IUser, UserModel };
