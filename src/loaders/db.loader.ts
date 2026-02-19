import { connectDB, disconnectDB } from "@/config/db";

export const initDb = connectDB;
export const closeDb = disconnectDB;
