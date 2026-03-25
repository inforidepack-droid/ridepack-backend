import type { IUser } from "@/modules/auth/models/User.model";
import type { UpdateProfileBody } from "@/modules/user/user.types";

type CurrentProfile = Pick<IUser, "name" | "firstName" | "lastName">;

const resolvePart = (incoming: string | undefined, current: string | null | undefined): string => {
  if (incoming !== undefined) return incoming.trim();
  return (current ?? "").trim();
};

/** Maps partial profile updates into User fields (name syncs when first/last change). */
export const buildIdentityPatch = (current: CurrentProfile, data: UpdateProfileBody): Partial<IUser> => {
  const patch: Partial<IUser> = {};

  if (data.profileImage !== undefined) {
    const trimmed = data.profileImage.trim();
    patch.profileImage = trimmed || undefined;
  }

  if (data.address !== undefined) {
    const trimmed = data.address.trim();
    patch.address = trimmed || undefined;
  }

  if (data.gender !== undefined) {
    patch.gender = data.gender;
  }

  const first = resolvePart(data.firstName, current.firstName);
  const last = resolvePart(data.lastName, current.lastName);

  if (data.firstName !== undefined) {
    patch.firstName = first || undefined;
  }
  if (data.lastName !== undefined) {
    patch.lastName = last || undefined;
  }

  if (data.name !== undefined) {
    patch.name = data.name.trim();
  } else if (data.firstName !== undefined || data.lastName !== undefined) {
    const combined = `${first} ${last}`.trim();
    if (combined) {
      patch.name = combined;
    }
  }

  return patch;
};
