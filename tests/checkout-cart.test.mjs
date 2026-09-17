import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("checkout submits only menu-validated cart lines", async () => {
  const source = await readFile(new URL("../app/checkout/page.tsx", import.meta.url), "utf8");
  assert.match(source, /const validLines = cartItems\.map/);
  assert.match(source, /lines: validLines\.map/);
  assert.doesNotMatch(source, /lines: cart\.map/);
  assert.match(source, /saveCart\(validLines\)/);
});

test("checkout waits for the latest managed catalog before ordering", async () => {
  const source = await readFile(new URL("../app/checkout/page.tsx", import.meta.url), "utf8");
  assert.match(source, /const \[catalogReady, setCatalogReady\]/);
  assert.match(source, /\.finally\(\(\) => setCatalogReady\(true\)\)/);
  assert.match(source, /disabled=\{busy \|\| locationBusy \|\| !catalogReady \|\| !cartItems\.length\}/);
});
