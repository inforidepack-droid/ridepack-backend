export const VEHICLE_TYPE = {
  PUBLIC_TRANSPORT: "public_transport",
  OWN_VEHICLE: "own_vehicle",
} as const;

export type VehicleType = (typeof VEHICLE_TYPE)[keyof typeof VEHICLE_TYPE];
