import type { Branch } from "../catalog";
import { deliveryFee, distanceKm, normalizeEgyptCoordinates, type Coordinates } from "../location";
import { getRuntimeBindings } from "./runtime-bindings";

type MapsEnvironment = Record<string, string | undefined>;

type GeocodeResponse = {
  status?: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
};

type RouteMatrixElement = {
  destinationIndex?: number;
  distanceMeters?: number;
  duration?: string;
  condition?: string;
  status?: { code?: number; message?: string };
};

export type GoogleDeliveryQuote = {
  branch: Branch;
  distanceKm: number;
  durationSeconds: number | null;
  fee: number | null;
};

async function mapsEnvironment(): Promise<MapsEnvironment> {
  return { ...process.env, ...(getRuntimeBindings() as MapsEnvironment) };
}

async function requiredServerKey() {
  const runtime = await mapsEnvironment();
  const key = runtime.GOOGLE_MAPS_SERVER_KEY?.trim();
  if (!key) throw new Error("Google Maps server key is not configured.");
  return key;
}

export async function googleMapsBrowserConfig() {
  const runtime = await mapsEnvironment();
  return {
    apiKey: runtime.GOOGLE_MAPS_BROWSER_KEY?.trim() ?? "",
  };
}

function checkedCoordinates(value: Coordinates) {
  const coordinates = normalizeEgyptCoordinates(value);
  if (!coordinates) throw new Error("Use a valid delivery pin inside Egypt.");
  return coordinates;
}

async function readGeocodeResponse(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.json() as GeocodeResponse;
    if (!response.ok || data.status !== "OK" || !data.results?.[0]) {
      const message = data.status === "ZERO_RESULTS"
        ? "Google Maps could not find that address. Try adding the area and city."
        : data.error_message || "Google Maps address lookup is temporarily unavailable.";
      throw new Error(message);
    }
    return data.results[0];
  } finally {
    clearTimeout(timeout);
  }
}

export async function googleGeocodeAddress(query: string, city: string) {
  const key = await requiredServerKey();
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", `${query}${city ? `, ${city}` : ""}, Egypt`);
  url.searchParams.set("components", "country:EG");
  url.searchParams.set("language", "en");
  url.searchParams.set("region", "eg");
  url.searchParams.set("key", key);
  const result = await readGeocodeResponse(url);
  const coordinates = normalizeEgyptCoordinates({
    latitude: Number(result.geometry?.location?.lat),
    longitude: Number(result.geometry?.location?.lng),
  });
  if (!coordinates) throw new Error("Google Maps returned a location outside Egypt.");
  return { coordinates, displayName: result.formatted_address || query };
}

export async function googleReverseGeocode(value: Coordinates) {
  const coordinates = checkedCoordinates(value);
  const key = await requiredServerKey();
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${coordinates.latitude},${coordinates.longitude}`);
  url.searchParams.set("language", "en");
  url.searchParams.set("region", "eg");
  url.searchParams.set("key", key);
  const result = await readGeocodeResponse(url);
  return { coordinates, displayName: result.formatted_address || `${coordinates.latitude}, ${coordinates.longitude}` };
}

export async function googleDeliveryQuotes(originValue: Coordinates, destinations: Branch[]): Promise<GoogleDeliveryQuote[]> {
  const origin = checkedCoordinates(originValue);
  if (!destinations.length) return [];
  const key = await requiredServerKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7500);
  try {
    const response = await fetch("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
        "x-goog-fieldmask": "originIndex,destinationIndex,distanceMeters,duration,status,condition",
      },
      body: JSON.stringify({
        origins: [{ waypoint: { location: { latLng: origin } } }],
        destinations: destinations.map((branch) => ({
          waypoint: { location: { latLng: { latitude: branch.latitude, longitude: branch.longitude } } },
        })),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        languageCode: "en-US",
        regionCode: "EG",
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const details = await response.text();
      console.error("Google Routes API rejected the route matrix", response.status, details.slice(0, 500));
      throw new Error("Google Maps could not calculate delivery routes right now.");
    }
    const matrix = await response.json() as RouteMatrixElement[];
    return matrix.flatMap((entry) => {
      const branch = destinations[Number(entry.destinationIndex)];
      const distance = Number(entry.distanceMeters) / 1000;
      if (!branch || entry.condition !== "ROUTE_EXISTS" || entry.status?.code || !Number.isFinite(distance)) return [];
      const straight = distanceKm(origin, branch);
      if (distance < straight * 0.8 || distance > straight * 4 + 10) return [];
      const duration = Number.parseFloat(String(entry.duration ?? "").replace(/s$/, ""));
      return [{
        branch,
        distanceKm: distance,
        durationSeconds: Number.isFinite(duration) ? duration : null,
        fee: deliveryFee(distance),
      }];
    }).sort((left, right) => left.distanceKm - right.distanceKm);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Google Maps")) throw error;
    throw new Error("Google Maps could not calculate delivery routes right now.");
  } finally {
    clearTimeout(timeout);
  }
}
