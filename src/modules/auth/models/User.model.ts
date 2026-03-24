import mongoose, { Schema, Document, Model } from "mongoose";
import { hashPassword } from "@/utils/password.util";

export interface IUser extends Document {
  email?: string;
  password?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  gender?: "male" | "female" | "other";
  phoneNumber?: string;
  countryCode?: string;
  googleId?: string;
  profileImage?: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isBlocked: boolean;
  isVerified: boolean;
  role: string;
  authProvider?: "google" | "phone";
  stripeCustomerId?: string;
  stripeAccountId?: string;
  verification?: {
    provider?: string;
    sessionId?: string;
    verificationUrl?: string;
    status?: string;
    createdAt?: Date;
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
    firstName: {
      type: String,
      required: false,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: false,
    },
    googleId: {
      type: String,
      required: false,
      sparse: true,
    },
    profileImage: {
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
    isEmailVerified: {
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
      verificationUrl: {
        type: String,
      },
      status: {
        type: String,
        enum: ["not_started", "pending", "approved", "declined", "expired"],
        default: "not_started",
      },
      createdAt: {
        type: Date,
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
    authProvider: {
      type: String,
      enum: ["google", "phone"],
      default: "phone",
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
