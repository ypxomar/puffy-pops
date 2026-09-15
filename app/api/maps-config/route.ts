import { googleMapsBrowserConfig } from "../../server/google-maps";

export async function GET() {
  const config = await googleMapsBrowserConfig();
  if (!config.apiKey) return Response.json({ error: "Google Maps is not configured yet." }, { status: 503 });
  return Response.json(config, { headers: { "cache-control": "no-store" } });
}
