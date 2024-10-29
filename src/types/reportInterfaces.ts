import mongoose, { Document } from "mongoose";

export interface IReport extends Document {
  reason: string;
  postId: mongoose.Types.ObjectId;
  personId: mongoose.Types.ObjectId;
  reportedDatetime: Date;
}