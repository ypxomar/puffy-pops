import { branches, type Branch } from "./catalog";

export type Coordinates = { latitude: number; longitude: number };

export const deliveryConfig = {
  baseFee: 30,
  includedKm: 2,
  perExtraKm: 7,
  maximumKm: 25,
  roundTo: 5,
};

export function normalizeEgyptCoordinates(value: Coordinates): Coordinates | null {
  let latitude = Number(value.latitude);
  let longitude = Number(value.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  // Correct the common lat/lng reversal while refusing pins outside Egypt.
  if (!(latitude >= 21.5 && latitude <= 32.2 && longitude >= 24.5 && longitude <= 36.2)
    && longitude >= 21.5 && longitude <= 32.2 && latitude >= 24.5 && latitude <= 36.2) {
    [latitude, longitude] = [longitude, latitude];
  }
  if (latitude < 21.5 || latitude > 32.2 || longitude < 24.5 || longitude > 36.2) return null;
  return { latitude, longitude };
}

export function distanceKm(a: Coordinates, b: Coordinates) {
  const radius = 6371;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(b.latitude - a.latitude);
  const longitudeDelta = radians(b.longitude - a.longitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(a.latitude)) *
      Math.cos(radians(b.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(value));
}

export function nearestBranch(coordinates: Coordinates): Branch {
  return branches.reduce((nearest, branch) =>
    distanceKm(coordinates, branch) < distanceKm(coordinates, nearest)
      ? branch
      : nearest,
  );
}

export function branchesByDistance(coordinates: Coordinates, cityId?: Branch["cityId"]) {
  return branches
    .filter((branch) => !cityId || branch.cityId === cityId)
    .map((branch) => ({ branch, distanceKm: distanceKm(coordinates, branch) }))
    .sort((left, right) => left.distanceKm - right.distanceKm);
}

export function deliveryFee(distance: number) {
  if (distance > deliveryConfig.maximumKm) return null;
  const raw =
    deliveryConfig.baseFee +
    Math.max(0, distance - deliveryConfig.includedKm) *
      deliveryConfig.perExtraKm;
  return Math.ceil(raw / deliveryConfig.roundTo) * deliveryConfig.roundTo;
}
