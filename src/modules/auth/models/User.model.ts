import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email?: string;
  password?: string;
  name?: string;
  phoneNumber?: string;
  countryCode?: string;
  isPhoneVerified: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
    countryCode: {
      type: String,
      required: false,
      trim: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for phone lookup
userSchema.index({ phoneNumber: 1, countryCode: 1 }, { unique: true, sparse: true });

// Create model
const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
