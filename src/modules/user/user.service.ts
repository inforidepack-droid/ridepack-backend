import { createError } from "@/utils/appError";
import * as userRepository from "@/modules/user/user.repository";
import { HTTP_STATUS } from "@/constants/http.constants";
import type { IUser } from "@/modules/auth/models/User.model";
import type { UpdateProfileBody } from "@/modules/user/user.types";
import { buildIdentityPatch } from "@/modules/user/user.profile.utils";

export const getById = async (id: string) => {
  const user = await userRepository.findByIdWithProfileOtp(id);
  if (!user) throw createError("User not found", HTTP_STATUS.NOT_FOUND);
  return user;
};

export const getProfile = getById;

export const updateProfile = async (userId: string, data: UpdateProfileBody) => {
  const current = await userRepository.findById(userId);
  if (!current) throw createError("User not found", HTTP_STATUS.NOT_FOUND);

  const patch: Partial<IUser> = buildIdentityPatch(
    {
      name: current.name,
      firstName: current.firstName,
      lastName: current.lastName,
    },
    data
  );

  if (data.email !== undefined) {
    const normalized = data.email.trim().toLowerCase();
    if (!normalized) {
      throw createError("Email cannot be empty", HTTP_STATUS.BAD_REQUEST);
    }
    const currentEmail = (current.email ?? "").toLowerCase().trim();
    if (normalized !== currentEmail) {
      const other = await userRepository.findByEmailExcludingId(normalized, userId);
      if (other) {
        throw createError("Email already in use", HTTP_STATUS.CONFLICT);
      }
      patch.email = normalized;
      patch.isEmailVerified = false;
    }
  }

  const phoneTouched = data.phoneNumber !== undefined || data.countryCode !== undefined;
  if (phoneTouched) {
    const nextPhone = (data.phoneNumber !== undefined ? data.phoneNumber : current.phoneNumber ?? "").trim();
    const nextCc = (data.countryCode !== undefined ? data.countryCode : current.countryCode ?? "").trim();
    if (!nextPhone || !nextCc) {
      throw createError(
        "phoneNumber and countryCode are required when updating phone",
        HTTP_STATUS.BAD_REQUEST
      );
    }
    const curP = (current.phoneNumber ?? "").trim();
    const curC = (current.countryCode ?? "").trim();
    if (nextPhone !== curP || nextCc !== curC) {
      const conflict = await userRepository.findByPhoneExcludingId(nextPhone, nextCc, userId);
      if (conflict) {
        throw createError("Phone number already in use", HTTP_STATUS.CONFLICT);
      }
      patch.phoneNumber = nextPhone;
      patch.countryCode = nextCc;
      patch.isPhoneVerified = false;
    }
  }

  if (Object.keys(patch).length === 0) {
    const self = await userRepository.findByIdWithProfileOtp(userId);
    return self ?? current;
  }

  const updated = await userRepository.updateById(userId, patch);
  if (!updated) throw createError("User not found", HTTP_STATUS.NOT_FOUND);
  const self = await userRepository.findByIdWithProfileOtp(userId);
  return self ?? updated;
};
