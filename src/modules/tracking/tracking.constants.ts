export const RIDER_LOCATION_UPDATE_INTERVAL_MS = 3000;

/** Consider rider offline if no location update in this many ms */
export const RIDER_OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const LAT_MIN = -90;
export const LAT_MAX = 90;
export const LNG_MIN = -180;
export const LNG_MAX = 180;

/** Default average speed km/h for haversine ETA when Google Maps unavailable */
export const DEFAULT_AVERAGE_SPEED_KMH = 40;
