export const TRIP_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  CANCELLED: "cancelled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export type TripStatus = (typeof TRIP_STATUS)[keyof typeof TRIP_STATUS];

export const PUBLISH_ALLOWED_STATUS = TRIP_STATUS.DRAFT;
