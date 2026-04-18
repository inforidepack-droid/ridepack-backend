/**
 * Backfill `User.profileOtp` for accounts that have none (5-digit pickup OTP).
 *
 * Usage:
 *   npm run profile-otp:backfill
 *   DRY_RUN=1 npm run profile-otp:backfill          # print counts only
 *   USER_ID=<mongoObjectId> npm run profile-otp:backfill   # single user
 *
 * Uses the same DB URI as the app (MONGODB_URI in production, else MONGODB_URI_LOCAL).
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "@/modules/auth/models/User.model";
import { generateOtp } from "@/utils/otp.generate.utils";

const MONGODB_URI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_URI
    : process.env.MONGODB_URI_LOCAL || "mongodb://localhost:27017/ridepack";

const missingProfileOtpFilter = {
  $or: [
    { profileOtp: { $exists: false } },
    { profileOtp: null },
    { profileOtp: "" },
  ],
};

const run = async (): Promise<void> => {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI (or MONGODB_URI_LOCAL for dev) is not set");
    process.exit(1);
  }

  const dryRun =
    process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
  const singleUserId = process.env.USER_ID?.trim();

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const baseFilter = singleUserId
    ? { _id: new mongoose.Types.ObjectId(singleUserId), ...missingProfileOtpFilter }
    : missingProfileOtpFilter;

  const toFix = await User.find(baseFilter).select("_id").lean().exec();
  const ids = toFix.map((u) => u._id.toString());

  console.log(
    `Users missing profileOtp: ${ids.length}${singleUserId ? ` (USER_ID filter)` : ""}`
  );

  if (dryRun) {
    console.log("DRY_RUN: no updates applied");
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  for (const id of ids) {
    const otp = generateOtp();
    const res = await User.findOneAndUpdate(
      { _id: id, ...missingProfileOtpFilter },
      { $set: { profileOtp: otp } },
      { new: false }
    ).exec();
    if (res) updated += 1;
  }

  console.log(`Updated ${updated} user(s) with profileOtp`);
  await mongoose.disconnect();
  console.log("Disconnected");
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
