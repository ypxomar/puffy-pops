import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("initial Small option remains immediately addable after managed catalog hydration", async () => {
  const source = await readFile(new URL("../app/menu/page.tsx", import.meta.url), "utf8");
  assert.match(source, /const selectedVariantId = item\.variants\.some/);
  assert.match(source, /value=\{selectedVariantId\}/);
  assert.match(source, /onAdd\(item, \{ variantId: selectedVariantId, choice: selectedChoice \}\)/);
  assert.doesNotMatch(source, /onAdd\(item, \{ variantId, choice \}\)/);
});

test("piece count in a size label never becomes the ordered plate quantity", async () => {
  const menu = await readFile(new URL("../app/menu/page.tsx", import.meta.url), "utf8");
  const cart = await readFile(new URL("../app/cart.ts", import.meta.url), "utf8");
  assert.match(menu, /quantity: 1/);
  assert.match(cart, /puffy-pops-cart-v3/);
  assert.doesNotMatch(`${menu}\n${cart}`, /parseInt\([^\n]*(?:variant|label|piece)/i);
});
