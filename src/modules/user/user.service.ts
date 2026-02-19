import { createError } from "@/utils/appError";
import * as userRepository from "@/modules/user/user.repository";
import { HTTP_STATUS } from "@/constants/http.constants";

export const getById = async (id: string) => {
  const user = await userRepository.findById(id);
  if (!user) throw createError("User not found", HTTP_STATUS.NOT_FOUND);
  return user;
};

export const getProfile = getById;

export type UpdateProfileInput = { name?: string; email?: string };

export const updateProfile = async (userId: string, data: UpdateProfileInput) => {
  const updated = await userRepository.updateById(userId, data);
  if (!updated) throw createError("User not found", HTTP_STATUS.NOT_FOUND);
  return updated;
};
