export interface ICoordinates {
  lat: number;
  lng: number;
  address?: string;
}

export interface TrackingResponse {
  parcelId: string;
  status: string;
  pickup: ICoordinates;
  drop: ICoordinates;
  currentRiderLocation: ICoordinates | null;
  etaMinutes: number | null;
  distanceRemainingKm: number | null;
  riderDetails: {
    name?: string;
    phoneNumber?: string;
    countryCode?: string;
  } | null;
  isRiderOffline: boolean;
}
