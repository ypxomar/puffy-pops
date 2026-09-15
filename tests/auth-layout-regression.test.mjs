import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("app API advertises the recovered role login methods", async () => {
  const source = await readFile(new URL("../app/api/app/health/route.ts", import.meta.url), "utf8");
  assert.match(source, /protocol:\s*5/);
  assert.match(source, /management-code/);
  assert.match(source, /cashier-credentials/);
  assert.match(source, /developer-code/);
});

test("cashier passwords no longer depend on session-secret rotation", async () => {
  const source = await readFile(new URL("../app/server/security.ts", import.meta.url), "utf8");
  assert.match(source, /return `v4\.\$\{await pbkdf2PasswordHash/);
  assert.match(source, /100_000/);
  assert.match(source, /storedHash\.startsWith\("v2\."\)/);
});

test("Cloudflare bindings are injected by the Worker instead of dynamically imported by routes", async () => {
  const files = [
    "../db/index.ts",
    "../app/api/media/route.ts",
    "../app/server/google-maps.ts",
    "../app/api/cms/catalog/route.ts",
    "../app/api/cms/upload/route.ts",
  ];
  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /import\(["']cloudflare:workers["']\)/, file);
  }
  const worker = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.match(worker, /setRuntimeBindings\(\{/);
  assert.match(worker, /DB:\s*env\.DB/);
});

test("the owner can turn any worker into a credentialed cashier", async () => {
  const source = await readFile(new URL("../app/api/admin/staff/route.ts", import.meta.url), "utf8");
  assert.match(source, /body\.action === "set-cashier-credentials"/);
  assert.match(source, /role = 'cashier', active = 1, username = \?/);
  assert.doesNotMatch(source, /eq\(employees\.role, "cashier"\)\)\.limit\(1\)/);
  assert.doesNotMatch(source, /\.returning\(\)/);
});

test("manager assignment remains compatible with older employee tables", async () => {
  const source = await readFile(new URL("../app/api/admin/staff/route.ts", import.meta.url), "utf8");
  assert.match(source, /const storedRole = role === "manager" \? "team" : role/);
  assert.match(source, /INSERT INTO branch_profiles/);
  assert.doesNotMatch(source, /set\(\{ role: "manager"/);
});

test("home serves the merged soft-serve landing with one shared header and footer", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const landing = await readFile(
    new URL("../app/soft-serve/SoftServeLanding.tsx", import.meta.url),
    "utf8",
  );
  const landingCss = await readFile(
    new URL("../app/soft-serve-landing.css", import.meta.url),
    "utf8",
  );
  const header = await readFile(
    new URL("../app/components/SiteHeader.tsx", import.meta.url),
    "utf8",
  );
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(page, /import SoftServeLanding from "\.\/soft-serve\/SoftServeLanding"/);
  assert.match(page, /<SoftServeLanding \/>/);
  assert.doesNotMatch(page, /cinema-|puffy-home-hero|puffy-order-story/);

  // The landing reuses the storefront chrome instead of shipping its own.
  assert.match(landing, /import SiteHeader from "\.\.\/components\/SiteHeader"/);
  assert.match(landing, /import SiteFooter from "\.\.\/components\/SiteFooter"/);
  assert.match(landing, /<SiteHeader sections=\{heroSections\} \/>/);
  assert.match(landing, /<SiteFooter \/>/);
  assert.doesNotMatch(landing, /function Header\(|function Footer\(/);

  // Storefront home bands were merged into the same page.
  for (const marker of ["cinema-highlights", "puffy-order-story", "cinema-proof", "cinema-closing"]) {
    assert.match(landing, new RegExp(marker), marker);
  }

  // In-page anchors stay opt-in so the other pages keep route navigation.
  assert.match(header, /sections\?: readonly NavLink\[\]/);
  assert.match(header, /const links: readonly NavLink\[\] = sections\?\.length/);

  // The landing stylesheet only styles its own subtree, so the shared storefront
  // rules (and, in reverse, the landing rules) stay isolated.
  assert.doesNotMatch(landingCss, /^\.(site-header|site-footer|eyebrow|button|hero)\b/m);
  assert.match(landingCss, /html:has\(\.ss-site-shell\)/);
  assert.match(landingCss, /body:has\(\.ss-site-shell\)/);

  // The story page keeps depending on the shared cinema layout.
  assert.match(css, /Story chapters use a stable editorial layout on every device/);
});
