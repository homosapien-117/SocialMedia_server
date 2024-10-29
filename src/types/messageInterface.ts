import mongoose, { Document } from "mongoose";

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  type: "message" | "request";
  senderId: mongoose.Types.ObjectId;
  content: string;
  senderName:string;
  imageUrl?: string[];
  documentUrl: string[]; 
  timeStamp: Date;
  ReadStatus: boolean;  
}
