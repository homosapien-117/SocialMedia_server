import mongoose, { Document, Schema } from "mongoose";
import { INotification } from "../types/notificationInterfaces";

const notificationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  content: { type: String, required: true },
  postId: { type: Schema.Types.ObjectId, ref: "Post"},
  postImage: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<INotification>(
  "Notification",
  notificationSchema
);