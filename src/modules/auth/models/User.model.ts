import mongoose, { Schema, Document, Model } from "mongoose";
import { hashPassword } from "@/utils/password.util";

export interface IUser extends Document {
  email?: string;
  password?: string;
  name?: string;
  phoneNumber?: string;
  countryCode?: string;
  isPhoneVerified: boolean;
  isBlocked: boolean;
  isVerified: boolean;
  role: string;
  stripeCustomerId?: string;
  stripeAccountId?: string;
  verification?: {
    provider?: string;
    sessionId?: string;
    status?: string;
    verifiedAt?: Date;
  };
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
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verification: {
      provider: {
        type: String,
        default: "veriff",
      },
      sessionId: {
        type: String,
      },
      status: {
        type: String,
        enum: ["not_started", "pending", "approved", "declined", "expired"],
        default: "not_started",
      },
      verifiedAt: {
        type: Date,
      },
    },
    role: {
      type: String,
      enum: ["user", "admin", "rider", "sender"],
      default: "user",
    },
    stripeCustomerId: {
      type: String,
    },
    stripeAccountId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ phoneNumber: 1, countryCode: 1 }, { unique: true, sparse: true });

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || !this.password) return next();
  hashPassword(this.password)
    .then((hashed) => {
      this.password = hashed;
      next();
    })
    .catch(next);
});

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
