import mongoose from "mongoose";
import User, { IUser } from "@/modules/auth/models/User.model";

export const findById = (id: string) => User.findById(id).lean().exec();

export const findByEmail = (email: string) => User.findOne({ email }).lean().exec();

export const findByEmailExcludingId = (email: string, excludeUserId: string) =>
  User.findOne({
    email: email.toLowerCase().trim(),
    _id: { $ne: new mongoose.Types.ObjectId(excludeUserId) },
  })
    .lean()
    .exec();

export const findByPhoneExcludingId = (
  phoneNumber: string,
  countryCode: string,
  excludeUserId: string
) =>
  User.findOne({
    phoneNumber: phoneNumber.trim(),
    countryCode: countryCode.trim(),
    _id: { $ne: new mongoose.Types.ObjectId(excludeUserId) },
  })
    .lean()
    .exec();

export const findByPhone = (phoneNumber: string, countryCode?: string) =>
  User.findOne({ phoneNumber, ...(countryCode && { countryCode }) }).lean().exec();

export const create = (data: Partial<IUser>) => User.create(data);

export const updateById = (id: string, data: Partial<IUser>) =>
  User.findByIdAndUpdate(id, data, { new: true }).lean().exec();
