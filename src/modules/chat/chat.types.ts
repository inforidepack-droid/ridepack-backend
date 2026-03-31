import type mongoose from "mongoose";

export type ChatMessageType = "text";

export interface ConversationLean {
  _id: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  riderId: mongoose.Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageLean {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  message: string;
  type: ChatMessageType;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageBody {
  bookingId: string;
  message: string;
}

export interface JoinRoomPayload {
  bookingId: string;
}
