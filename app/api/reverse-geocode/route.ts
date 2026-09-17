import { googleReverseGeocode } from "../../server/google-maps";
import { normalizeEgyptCoordinates } from "../../location";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const coordinates = normalizeEgyptCoordinates({
    latitude: Number(search.get("latitude")),
    longitude: Number(search.get("longitude")),
  });
  if (!coordinates) return Response.json({ error: "Use a valid delivery pin inside Egypt." }, { status: 400 });
  try {
    return Response.json(await googleReverseGeocode(coordinates), { headers: { "cache-control": "no-store" } });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Google Maps could not identify that pin.";
    return Response.json({ error: message }, { status: 503 });
  }
}
