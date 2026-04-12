import type { RequestQueryStatus } from "@/modules/request/request.constants";
import type { IParcel, IContactDetails } from "@/modules/booking/booking.types";

export type RequestListSort = "asc" | "desc";

export type ListMyRequestsQuery = {
  page: number;
  limit: number;
  status?: RequestQueryStatus;
  sort: RequestListSort;
};

export type TripLocationLean = {
  address?: string;
  lat?: number;
  lng?: number;
};

export type RequestLocationDetail = {
  lat?: number;
  lng?: number;
  address?: string;
};

export type RequestTripCapacity = {
  maxWeight: number;
  maxLength: number;
  maxWidth: number;
  maxHeight: number;
};

export type RequestRiderSummary = {
  userId: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  ratingAverage?: number;
  ratingCount?: number;
  phoneNumber?: string;
  countryCode?: string;
};

export type RequestTripDetail = {
  tripId: string;
  status?: string;
  travelDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  price?: number;
  vehicleType?: string;
  capacity?: RequestTripCapacity | null;
  remainingCapacity?: RequestTripCapacity | null;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  pickup: RequestLocationDetail | null;
  dropoff: RequestLocationDetail | null;
  rider: RequestRiderSummary | null;
};

export type RequestListItem = {
  requestId: string;
  bookingId: string;
  /** Mapped bucket for filters: pending | accepted | rejected | cancelled */
  status: string;
  /** Raw `Booking.status` value */
  bookingStatus: string;
  pickupLocation: string;
  dropLocation: string;
  pickup: RequestLocationDetail | null;
  dropoff: RequestLocationDetail | null;
  parcel: IParcel;
  senderDetails: IContactDetails;
  receiverDetails: IContactDetails;
  packageImages: string[];
  agreedPrice: number;
  illegalItemsDeclaration: boolean;
  paymentTransactionId?: string;
  escrowAmount?: number;
  createdAt: string;
  updatedAt: string;
  trip: RequestTripDetail | null;
};
