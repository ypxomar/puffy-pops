import { googleGeocodeAddress } from "../../server/google-maps";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const query = search.get("q")?.trim() ?? "";
  const city = search.get("city")?.trim().slice(0, 40) ?? "";
  if (query.length < 8) return Response.json({ error: "Enter a more complete address." }, { status: 400 });
  try {
    return Response.json(await googleGeocodeAddress(query, city), { headers: { "cache-control": "no-store" } });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Google Maps address lookup is temporarily unavailable.";
    return Response.json({ error: message }, { status: 503 });
  }
}
