import mongoose, { Document, Model, Schema } from "mongoose";

export interface IConversation extends Document {
  bookingId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  riderId: mongoose.Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    riderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastMessage: { type: String, trim: true },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

conversationSchema.index({ senderId: 1, lastMessageAt: -1 });
conversationSchema.index({ riderId: 1, lastMessageAt: -1 });

const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>("Conversation", conversationSchema);

export default Conversation;
