import mongoose, { Schema, Document } from 'mongoose';
import { Ichat } from '../types/chatInterface';

const chatSchema = new Schema<Ichat>({
  participants: [
    {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  ],
  groupName: {
    type: String,
    required: function() {
      return this.participants.length > 2; 
    },
  },
  admin:[ {
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  lastMessage: {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  timeStamp: {
    type: Date,
    required: true,
    default: () => new Date(),
  },
  status: { type: Boolean, required: true, default: false },
  readAt: { type: Date },
  isDeleted: { type: Boolean, required: true, default: false },
});

export default mongoose.model<Ichat>('Chat', chatSchema);
