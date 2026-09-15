import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

const testSessionSecret = "test-only-owner-session-secret-32-characters";
const testOwnerCode = "PP-OWNER-TEST-ACCESS";
const testDeveloperCode = "PP-DEV-TEST-ACCESS";
process.env.ADMIN_SESSION_SECRET = testSessionSecret;
process.env.OWNER_CODE_HASH = createHash("sha256").update(`puffy-pops:owner:${testOwnerCode}`).digest("hex");
process.env.CMS_CODE_HASH = createHash("sha256").update(`puffy-pops:cms:${testDeveloperCode}`).digest("hex");
const testEnv = {
  ADMIN_SESSION_SECRET: testSessionSecret,
  OWNER_CODE_HASH: process.env.OWNER_CODE_HASH,
  CMS_CODE_HASH: process.env.CMS_CODE_HASH,
  ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
};

function adminCookie(identity) {
  const payload = Buffer.from(JSON.stringify({ ...identity, version: 2, expires: Date.now() + 60_000 })).toString("base64url");
  const signature = createHmac("sha256", testSessionSecret).update(payload).digest("base64url");
  return `puffy_branch_session=${payload}.${signature}`;
}

function adminToken(identity) {
  return adminCookie(identity).replace("puffy_branch_session=", "");
}

function employeeTestDatabase() {
  let insertCount = 0;
  const employeeRow = [1, "staff-test", "kafr-abdo", "Endpoint Test Worker", "team", 1, null, "", "", "", "", "2026-08-27 00:00:00", "2026-08-27 00:00:00"];
  class Statement {
    constructor(sql) { this.sql = sql; this.params = []; }
    bind(...params) { this.params = params; return this; }
    async all() { return { results: [], success: true, meta: {} }; }
    async raw() {
      if (/select[\s\S]+from\s+["`]employees["`]/i.test(this.sql) && /["`]employee_key["`]/i.test(this.sql)) return [employeeRow];
      if (/select[\s\S]+from\s+["`]employees["`]/i.test(this.sql) && /where[\s\S]+["`]id["`]/i.test(this.sql)) return [[employeeRow[0]]];
      return [];
    }
    async run() {
      if (/insert\s+into\s+["`]?employees["`]?/i.test(this.sql)) insertCount += 1;
      return { success: true, meta: { changes: 1 } };
    }
    async first() { return null; }
  }
  return {
    prepare(sql) { return new Statement(sql); },
    async batch(statements) { return Promise.all(statements.map((statement) => statement.run())); },
    get insertCount() { return insertCount; },
  };
}

test("renders the storefront without a public admin link", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ADMIN_SESSION_SECRET: testSessionSecret,
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, developmentPreviewMeta);
  assert.doesNotMatch(html, /Two cities · two local menus · one joyful order/i);
  assert.doesNotMatch(html, /href=["']\/admin["']/i);
  assert.doesNotMatch(html, />Branch admin</i);
  assert.match(html, /\/api\/media\?slot=site-logo/i);
  assert.match(html, /class="[^"]*ss-site-shell/i);
  assert.match(html, /Your new<[^>]*> soft spot\./i);

  // One page, one header and one footer: the soft-serve landing and the
  // storefront home share the same chrome instead of rendering two of each.
  assert.equal((html.match(/<header/g) ?? []).length, 1);
  assert.equal((html.match(/<footer/g) ?? []).length, 1);
  assert.doesNotMatch(html, /ss-site-header|ss-site-footer|ss-footer-wordmark|ss-mobile-nav/);
  assert.match(html, /Spreading joy, one bite at a time\./);

  // Landing sections plus the storefront bands they were merged with.
  for (const marker of ["ss-hero", "ss-story-section", "ss-flavours-section", "cinema-highlights", "puffy-order-story", "ss-moments-section", "ss-locations-section", "cinema-proof", "cinema-closing", "ss-signoff"]) {
    assert.match(html, new RegExp(marker), marker);
  }

  // In-page navigation on "/", route navigation everywhere else.
  assert.match(html, /<a href="#flavours">Flavours<\/a>/);
  assert.match(html, /<a href="\/menu">Full menu<\/a>/);

  assert.match(html, /<link[^>]+rel=["']stylesheet["'][^>]+href=["']\/assets\/storefront\.css["']/i);
  assert.match(
    html,
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']\/assets\/soft-serve-landing\.css["']/i,
  );
});

test("does not publish management pages while keeping their APIs locked", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("developer-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const context = { waitUntil() {}, passThroughOnException() {} };
  for (const pathname of ["/admin", "/admin/owner", "/admin/dashboard", "/developers", "/pos", "/pos/register"]) {
    const response = await worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), testEnv, context);
    assert.equal(response.status, 404, pathname);
  }

  const apiResponse = await worker.fetch(new Request("http://localhost/api/cms/catalog"), testEnv, context);
  assert.equal(apiResponse.status, 401);
});

test("accepts a signed owner bearer token for the private app session", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("owner-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const ownerResponse = await worker.fetch(
    new Request("http://localhost/api/app/session", { headers: { accept: "application/json", authorization: `Bearer ${adminToken({ role: "owner" })}` } }),
    testEnv,
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(ownerResponse.status, 200);
  assert.equal((await ownerResponse.json()).role, "owner");
});

test("logs the owner and developer into the native app through their real endpoints", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("login-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const context = { waitUntil() {}, passThroughOnException() {} };

  const ownerResponse = await worker.fetch(new Request("http://localhost/api/app/login", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify({ code: testOwnerCode }),
  }), testEnv, context);
  assert.equal(ownerResponse.status, 200);
  const owner = await ownerResponse.json();
  assert.equal(owner.role, "owner");
  assert.ok(owner.token);

  const developerResponse = await worker.fetch(new Request("http://localhost/api/cms/login", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify({ password: testDeveloperCode }),
  }), testEnv, context);
  assert.equal(developerResponse.status, 200);
  const developer = await developerResponse.json();
  assert.equal(developer.role, "developer");
  assert.ok(developer.token);
});

test("creates a worker through the compiled private Team endpoint", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("employee-create-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const database = employeeTestDatabase();
  const response = await worker.fetch(new Request("http://localhost/api/admin/staff", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${adminToken({ role: "owner" })}`,
      origin: "http://localhost",
    },
    body: JSON.stringify({ branchId: "kafr-abdo", name: "Endpoint Test Worker", role: "team" }),
  }), { ...testEnv, DB: database }, { waitUntil() {}, passThroughOnException() {} });

  assert.equal(response.status, 201, await response.text());
  assert.equal(database.insertCount, 1);

  const cashierResponse = await worker.fetch(new Request("http://localhost/api/admin/staff", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${adminToken({ role: "owner" })}`,
      origin: "http://localhost",
    },
    body: JSON.stringify({ branchId: "kafr-abdo", name: "Endpoint Test Cashier", role: "cashier", username: "endpoint.cashier", password: "safe-test-password" }),
  }), { ...testEnv, DB: database }, { waitUntil() {}, passThroughOnException() {} });

  assert.equal(cashierResponse.status, 201, await cashierResponse.text());
  assert.equal(database.insertCount, 2);

  const updateResponse = await worker.fetch(new Request("http://localhost/api/admin/staff", {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${adminToken({ role: "owner" })}`,
      origin: "http://localhost",
    },
    body: JSON.stringify({ id: 1, branchId: "kafr-abdo", name: "Updated Endpoint Worker", role: "team", active: true }),
  }), { ...testEnv, DB: database }, { waitUntil() {}, passThroughOnException() {} });

  assert.equal(updateResponse.status, 200, await updateResponse.text());
});

test("publishes the native app compatibility endpoint", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("health-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/api/app/health", { headers: { accept: "application/json" } }),
    testEnv,
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "puffy-control-api",
    protocol: 5,
    compatibleProtocols: [4, 5],
    loginMethods: ["management-code", "cashier-credentials", "developer-code"],
  });
});

test("rejects anonymous employee and completed-order deletion", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("owner-delete-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const context = { waitUntil() {}, passThroughOnException() {} };

  const staffResponse = await worker.fetch(
    new Request("http://localhost/api/admin/staff", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: 1, confirmName: "Nobody" }),
    }),
    testEnv,
    context,
  );
  assert.equal(staffResponse.status, 403);

  const orderResponse = await worker.fetch(
    new Request("http://localhost/api/admin/orders/1", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmOrderNumber: "PP-TEST" }),
    }),
    testEnv,
    context,
  );
  assert.equal(orderResponse.status, 403);

  const bulkOrderResponse = await worker.fetch(
    new Request("http://localhost/api/admin/orders", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: [1, 2], confirm: true }),
    }),
    testEnv,
    context,
  );
  assert.equal(bulkOrderResponse.status, 403);
});

test("renders the separate customer pages", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("pages-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const cases = [
    ["/menu", /Find your/i],
    ["/locations", /Puffy place/i],
    ["/story", /Born in Alexandria/i],
    ["/track-order", /Track your/i],
  ];
  for (const [pathname, expected] of cases) {
    const response = await worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.status, 200, pathname);
    assert.match(await response.text(), expected);
  }
});

test("serves browser assets directly through the Cloudflare asset binding", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("asset-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  let forwardedUrl = "";

  const response = await worker.fetch(
    new Request("http://localhost/assets/storefront.css"),
    {
      ASSETS: {
        fetch: async (request) => {
          forwardedUrl = request.url;
          return new Response("body { color: #5b1f19; }", {
            headers: { "content-type": "text/css; charset=utf-8" },
          });
        },
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.equal(forwardedUrl, "http://localhost/assets/storefront.css");
  assert.match(response.headers.get("content-type") ?? "", /^text\/css\b/i);
  assert.match(await response.text(), /color: #5b1f19/);

  // The soft-serve landing artwork in /images is served the same direct way.
  let forwardedImageUrl = "";
  const imageResponse = await worker.fetch(
    new Request("http://localhost/images/soft-serve-strawberry.png"),
    {
      ASSETS: {
        fetch: async (request) => {
          forwardedImageUrl = request.url;
          return new Response("png-bytes", {
            headers: { "content-type": "image/png" },
          });
        },
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(imageResponse.status, 200);
  assert.equal(
    forwardedImageUrl,
    "http://localhost/images/soft-serve-strawberry.png",
  );
  assert.match(imageResponse.headers.get("content-type") ?? "", /^image\/png\b/i);
});

test("requires verified confirmation before customer order cancellation", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("cancel-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/api/track-order", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderNumber: "PP-KAF-1234567-ABC", phone: "01000000000", confirm: false }),
    }),
    testEnv,
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Confirm the cancellation/i);
});

test("allows only packaged-app origins to preflight private APIs", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("cors-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const context = { waitUntil() {}, passThroughOnException() {} };
  const allowed = await worker.fetch(new Request("http://localhost/api/app/session", { method: "OPTIONS", headers: { origin: "capacitor://localhost", "access-control-request-method": "GET", "access-control-request-headers": "authorization" } }), testEnv, context);
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get("access-control-allow-origin"), "capacitor://localhost");
  assert.match(allowed.headers.get("access-control-allow-headers") ?? "", /authorization/i);

  const denied = await worker.fetch(new Request("http://localhost/api/app/session", { method: "OPTIONS", headers: { origin: "https://untrusted.example", "access-control-request-method": "GET" } }), testEnv, context);
  assert.equal(denied.status, 403);
});
