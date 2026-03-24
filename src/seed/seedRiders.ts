/**
 * Dummy rider seeder for RidePack.
 * Run: npm run seed:riders
 * Optional: CLEAN_RIDERS=1 npm run seed:riders to remove existing seed riders first.
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "@/modules/auth/models/User.model";
import Rider from "@/modules/rider/rider.model";

const SEED_EMAIL_DOMAIN = "@ridepack-seed.local";
const SEED_PASSWORD = "Password@123";
const VEHICLE_MODELS = ["Toyota Camry", "Honda Accord", "Ford Focus", "Chevrolet Malibu", "Nissan Altima"];
const COLORS = ["Black", "White", "Silver", "Blue", "Red"];

const MONGODB_URI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_URI
    : process.env.MONGODB_URI_LOCAL || "mongodb://localhost:27017/ridepack";

const randomInRange = (min: number, max: number): number =>
  Math.round((max - min) * Math.random() + min);

const randomPlate = (): string =>
  Array.from({ length: 7 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 34)]).join("");

const run = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected to MongoDB");

    const clean = process.env.CLEAN_RIDERS === "1" || process.env.CLEAN_RIDERS === "true";
    if (clean) {
      const seedEmails = Array.from({ length: 5 }, (_, i) => `rider-seed-${i + 1}${SEED_EMAIL_DOMAIN}`);
      const users = await User.find({ email: { $in: seedEmails } }).select("_id").lean().exec();
      const userIds = (users as { _id: mongoose.Types.ObjectId }[]).map((u) => u._id);
      if (userIds.length > 0) {
        await Rider.deleteMany({ userId: { $in: userIds } }).exec();
        await User.deleteMany({ _id: { $in: userIds } }).exec();
        console.log(`Cleaned ${userIds.length} existing seed riders`);
      }
    }

    let successCount = 0;
    for (let i = 1; i <= 5; i++) {
      const email = `rider-seed-${i}${SEED_EMAIL_DOMAIN}`;
      const name = `Seed Rider ${i}`;
      const phoneNumber = `+1555000${1000 + i}`;

      const existingUser = await User.findOne({ email }).select("_id").lean().exec();
      if (existingUser) {
        console.log(`Skipping ${email}: user already exists`);
        continue;
      }

      const user = await User.create({
        name,
        email,
        phoneNumber,
        countryCode: "+1",
        password: SEED_PASSWORD,
        role: "rider",
        isVerified: true,
        isPhoneVerified: true,
        isBlocked: false,
      });

      const existingRider = await Rider.findOne({ userId: user._id }).lean().exec();
      if (existingRider) {
        console.log(`Skipping rider profile for ${email}: rider already exists`);
        continue;
      }

      await Rider.create({
        userId: user._id,
        isKycVerified: false,
        vehicleType: "own_vehicle",
        vehicleDetails: {
          model: VEHICLE_MODELS[i - 1],
          color: COLORS[i - 1],
          plateNumber: randomPlate(),
        },
        rating: Math.round((4 + Math.random()) * 10) / 10,
        totalTrips: randomInRange(0, 50),
        totalDeliveries: randomInRange(0, 100),
      });

      successCount++;
      console.log(`Created rider ${i}: ${email}`);
    }

    console.log(`Seeder finished. Success count: ${successCount}`);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
};

run();
