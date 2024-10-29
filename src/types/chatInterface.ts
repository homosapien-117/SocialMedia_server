
import mongoose, { ObjectId } from "mongoose";

export interface Ichat extends Document {
  participants: mongoose.Types.ObjectId[];
  type: "message" | "request";
  groupName?: string;
  admin: mongoose.Types.ObjectId[]; 
  lastMessage: {
    messageId: ObjectId | null;
  };

  timeStamp: Date;
  status: boolean;
  readAt: Date;
  isDeleted: boolean;
}
