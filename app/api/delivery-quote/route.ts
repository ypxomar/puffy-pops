import { branches, type CityId } from "../../catalog";
import { normalizeEgyptCoordinates } from "../../location";
import { deliveryQuotes } from "../../server/delivery";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const cityId = search.get("cityId") as CityId | null;
  const coordinates = normalizeEgyptCoordinates({
    latitude: Number(search.get("latitude")),
    longitude: Number(search.get("longitude")),
  });
  if (!coordinates || !cityId || !["alexandria", "cairo"].includes(cityId)) {
    return Response.json({ error: "Use a valid delivery pin inside Egypt." }, { status: 400 });
  }

  const candidates = branches.filter((branch) => branch.cityId === cityId);
  let quotes;
  try {
    quotes = await deliveryQuotes(coordinates, candidates);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Google Maps could not calculate delivery routes right now.";
    return Response.json({ error: message }, { status: 503 });
  }
  const nearest = quotes[0];
  if (!nearest) return Response.json({ error: "The delivery distance could not be calculated." }, { status: 503 });
  if (nearest.fee == null) {
    return Response.json({
      error: "This pin is outside the current delivery radius.",
      branch: nearest.branch,
      distanceKm: nearest.distanceKm,
    }, { status: 422 });
  }
  return Response.json({
    branch: nearest.branch,
    distanceKm: Number(nearest.distanceKm.toFixed(2)),
    deliveryFee: nearest.fee,
    durationSeconds: nearest.durationSeconds,
    provider: "google_maps",
    candidates: quotes.map((entry) => ({
      branchId: entry.branch.id,
      distanceKm: Number(entry.distanceKm.toFixed(2)),
      deliveryFee: entry.fee,
      durationSeconds: entry.durationSeconds,
    })),
  }, { headers: { "cache-control": "no-store" } });
}
