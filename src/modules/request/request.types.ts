import type { RequestQueryStatus } from "@/modules/request/request.constants";

export type RequestListSort = "asc" | "desc";

export type ListMyRequestsQuery = {
  page: number;
  limit: number;
  status?: RequestQueryStatus;
  sort: RequestListSort;
};

export type RequestListItem = {
  requestId: string;
  bookingId: string;
  status: string;
  pickupLocation: string;
  dropLocation: string;
  createdAt: string;
};

export type TripLocationLean = {
  address?: string;
  lat?: number;
  lng?: number;
};
