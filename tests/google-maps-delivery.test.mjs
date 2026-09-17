import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("checkout provides a Google Maps pin selector", async () => {
  const checkout = await source("../app/checkout/page.tsx");
  const map = await source("../app/components/DeliveryMap.tsx");
  assert.match(checkout, /<DeliveryMap/);
  assert.match(checkout, /reverse-geocode/);
  assert.match(checkout, /Confirmed Google Maps address/);
  assert.match(map, /maps\.googleapis\.com\/maps\/api\/js/);
  assert.match(map, /draggable: true/);
  assert.match(map, /map\.addListener\("click"/);
  assert.match(map, /gm_authFailure/);
  assert.match(map, /auth_referrer_policy=origin/);
  assert.match(map, /The map needs one setup fix/);
});

test("server uses Google Routes and Google Geocoding only", async () => {
  const googleMaps = await source("../app/server/google-maps.ts");
  const delivery = await source("../app/server/delivery.ts");
  const geocode = await source("../app/api/geocode/route.ts");
  assert.match(googleMaps, /routes\.googleapis\.com\/distanceMatrix\/v2:computeRouteMatrix/);
  assert.match(googleMaps, /maps\.googleapis\.com\/maps\/api\/geocode\/json/);
  assert.match(googleMaps, /GOOGLE_MAPS_SERVER_KEY/);
  assert.match(delivery, /googleDeliveryQuotes/);
  assert.match(geocode, /googleGeocodeAddress/);
  assert.doesNotMatch(`${googleMaps}\n${delivery}\n${geocode}`, /router\.project-osrm|nominatim\.openstreetmap/i);
});

test("Google keys are runtime secrets and API protocol is bumped", async () => {
  const config = await source("../wrangler.jsonc");
  const health = await source("../app/api/app/health/route.ts");
  assert.match(config, /GOOGLE_MAPS_BROWSER_KEY/);
  assert.match(config, /GOOGLE_MAPS_SERVER_KEY/);
  assert.match(health, /protocol: 5/);
  assert.match(health, /compatibleProtocols: \[4, 5\]/);
  assert.doesNotMatch(config, /AIza[0-9A-Za-z_-]{20,}/);
});
