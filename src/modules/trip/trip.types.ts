import type { TripStatus } from "@/modules/trip/trip.constants";

export interface ILocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface ICapacity {
  maxWeight: number;
  maxLength: number;
  maxWidth: number;
  maxHeight: number;
}

export interface ICompliance {
  legalItemConfirmed: boolean;
  fitsLuggageConfirmed: boolean;
  willNotOpenConfirmed: boolean;
  willMeetReceiverConfirmed: boolean;
}
