
import { Document } from "mongoose";

export interface INotification extends Document {
  userId: string;
  type: string;
  content: string;
  postId: string;
  createdAt: Date;
  currentUser:string;
}
