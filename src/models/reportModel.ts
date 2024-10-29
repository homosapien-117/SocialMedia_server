import mongoose, { Document, Schema } from "mongoose";
import { IReport } from "../types/reportInterfaces";



const reportSchema: Schema<IReport> = new Schema({
  reason: {
    type: String,
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  personId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reportedDatetime: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

// Create the Report Model
const Report = mongoose.model<IReport>("Report", reportSchema);

export default Report;

export type { IReport };
