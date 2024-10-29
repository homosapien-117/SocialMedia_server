import mongoose, { Document, Schema } from "mongoose";
import { Comment, PostDocument } from "../types/postInterfaces";

const commentSchema: Schema<Comment> = new Schema(
  {
    text: { type: String, required: true },
    username: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const postSchema: Schema<PostDocument> = new Schema(
  {
    userId: { type: String, required: true },
    username: { type: String },
    desc: { type: String },
    img: [{ type: String }],
    profilepic: { type: String },
    likes: [{ type: String }],
    comments: [commentSchema],
    blocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });

const PostModel = mongoose.model<PostDocument>("Post", postSchema);
export default PostModel;

export type { PostDocument };
