export const USER_GENDERS = ["male", "female", "other"] as const;

export type UserGender = (typeof USER_GENDERS)[number];

/** PATCH /api/user/profile body — all fields optional; send only what changed. */
export type UpdateProfileBody = {
  name?: string;
  firstName?: string;
  lastName?: string;
  gender?: UserGender;
  profileImage?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
};
