import { Request } from "express";
import { Document } from "mongoose";



export interface Comment {
  _id: string;
  text: string;
  username: string;
  createdAt: Date;
}

export interface PostDocument extends Document {
  userId: string;
  desc?: string;
  img?: string[];
  likes: string[];
  username?: string;
  profilepic?: string;
  comments?: Comment[];
  createdAt: Date;
  blocked:boolean
}

export interface ExtendedRequest extends Request {
  files: any;
}