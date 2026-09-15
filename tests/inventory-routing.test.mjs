import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("keeps ingredient and sellable-product stock separate", async () => {
  const schema = await source("../db/schema.ts");
  assert.match(schema, /branchProductInventory/);
  assert.match(schema, /trackQuantity/);
  assert.match(schema, /stockRequests/);
  assert.match(schema, /missingProductsJson/);
});

test("routes unavailable products through branch confirmation", async () => {
  const orders = await source("../app/api/orders/route.ts");
  const response = await source("../app/api/admin/inventory/requests/[id]/route.ts");
  assert.match(orders, /status: needsTransfer \? "awaiting_stock" : "new"/);
  assert.match(orders, /targetBranchId: targetCandidate\.branch\.id/);
  assert.match(response, /status: "forwarded"/);
  assert.match(response, /status: "out_of_stock"/);
});

test("delivery quote validates Egypt coordinates and uses distance pricing", async () => {
  const location = await source("../app/location.ts");
  const checkout = await source("../app/checkout/page.tsx");
  assert.match(location, /normalizeEgyptCoordinates/);
  assert.match(location, /perExtraKm: 7/);
  assert.match(checkout, /\/api\/delivery-quote\?/);
  assert.doesNotMatch(checkout, /const fee = .*deliveryFee\(distance\)/);
});

