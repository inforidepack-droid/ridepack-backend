export const VEHICLE_CATEGORIES = ["bike", "car", "suv", "van", "truck"] as const;

export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export const REGISTRATION_NUMBER_PATTERN = /^[A-Za-z0-9-]{5,20}$/;

export const DEFAULT_MAX_VEHICLES_PER_RIDER = 1;

