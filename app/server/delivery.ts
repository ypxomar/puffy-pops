import type { Branch } from "../catalog";
import type { Coordinates } from "../location";
import { googleDeliveryQuotes } from "./google-maps";

export async function routedDistanceKm(originValue: Coordinates, branch: Branch) {
  return (await googleDeliveryQuotes(originValue, [branch]))[0]?.distanceKm ?? null;
}

export async function deliveryQuote(origin: Coordinates, branch: Branch) {
  const quote = (await googleDeliveryQuotes(origin, [branch]))[0];
  return quote ? { distanceKm: quote.distanceKm, fee: quote.fee } : null;
}

export const deliveryQuotes = googleDeliveryQuotes;
