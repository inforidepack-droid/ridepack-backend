import { env } from "@/config/env.config";
import { DEFAULT_AVERAGE_SPEED_KMH } from "@/modules/tracking/tracking.constants";

const EARTH_RADIUS_KM = 6371;

/** Haversine distance in km */
export const haversineKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

/** ETA in minutes from distance (km) and speed (km/h) */
export const etaMinutesFromDistance = (
  distanceKm: number,
  speedKmh: number = DEFAULT_AVERAGE_SPEED_KMH
): number => {
  if (speedKmh <= 0) return 0;
  return (distanceKm / speedKmh) * 60;
};

export type EtaResult = { etaMinutes: number; distanceKm: number };

/**
 * Get ETA and distance from current to destination using Google Directions API.
 * Falls back to haversine + average speed if key missing or request fails.
 */
export const getEtaAndDistance = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<EtaResult> => {
  const distanceKm = haversineKm(fromLat, fromLng, toLat, toLng);
  const fallback: EtaResult = {
    distanceKm,
    etaMinutes: Math.round(etaMinutesFromDistance(distanceKm)),
  };

  if (!env.GOOGLE_MAPS_API_KEY?.trim()) {
    return fallback;
  }

  try {
    const origin = `${fromLat},${fromLng}`;
    const dest = `${toLat},${toLng}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&key=${env.GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      routes?: Array<{
        legs?: Array<{ distance?: { value: number }; duration?: { value: number } }>;
      }>;
      status?: string;
    };

    if (data?.status !== "OK" || !data?.routes?.[0]?.legs?.[0]) {
      return fallback;
    }

    const leg = data.routes[0].legs[0];
    const distanceMeters = leg.distance?.value ?? 0;
    const durationSeconds = leg.duration?.value ?? 0;
    const distanceKmFromApi = distanceMeters / 1000;
    const etaMinutesFromApi = durationSeconds / 60;

    return {
      distanceKm: Math.round(distanceKmFromApi * 100) / 100,
      etaMinutes: Math.round(etaMinutesFromApi),
    };
  } catch {
    return fallback;
  }
};
