import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = resolve(import.meta.dirname, "..");
const workerPath = resolve(projectRoot, "dist", "server", "index.js");
const hostingPath = resolve(projectRoot, "dist", ".openai", "hosting.json");
const wranglerPath = resolve(projectRoot, "dist", "server", "wrangler.json");
const clientManifestPath = resolve(
  projectRoot,
  "dist",
  "client",
  ".vite",
  "manifest.json",
);
const storefrontCssPath = resolve(
  projectRoot,
  "dist",
  "client",
  "assets",
  "storefront.css",
);
const landingCssPath = resolve(
  projectRoot,
  "dist",
  "client",
  "assets",
  "soft-serve-landing.css",
);

async function requireFile(path, message) {
  try {
    await access(path);
  } catch {
    throw new Error(message);
  }
}

await requireFile(workerPath, "Missing Sites Worker entry: dist/server/index.js");
await requireFile(
  hostingPath,
  "Missing packaged Sites manifest: dist/.openai/hosting.json",
);
await requireFile(
  wranglerPath,
  "Missing generated Cloudflare configuration: dist/server/wrangler.json",
);
await requireFile(
  clientManifestPath,
  "Missing client asset manifest: dist/client/.vite/manifest.json",
);
await requireFile(
  storefrontCssPath,
  "Missing explicit storefront stylesheet: dist/client/assets/storefront.css",
);
await requireFile(
  landingCssPath,
  "Missing explicit soft-serve landing stylesheet: dist/client/assets/soft-serve-landing.css",
);

JSON.parse(await readFile(hostingPath, "utf8"));

const wrangler = JSON.parse(await readFile(wranglerPath, "utf8"));
if (wrangler.assets?.run_worker_first !== true) {
  throw new Error(
    "The Worker must run first so its explicit CSS and JavaScript asset route is active",
  );
}

const clientManifest = JSON.parse(await readFile(clientManifestPath, "utf8"));
const browserEntry = clientManifest["virtual:vinext-app-browser-entry"]?.file;
if (!browserEntry) {
  throw new Error("Missing Vinext browser JavaScript entry in client manifest");
}
await requireFile(
  resolve(projectRoot, "dist", "client", browserEntry),
  `Missing browser JavaScript asset: ${browserEntry}`,
);

const workerUrl = pathToFileURL(workerPath);
workerUrl.searchParams.set("sites-validation", `${process.pid}-${Date.now()}`);
const worker = await import(workerUrl.href);

if (!worker.default || typeof worker.default.fetch !== "function") {
  throw new Error(
    "dist/server/index.js must have an ESM default export with fetch(request, env, ctx)",
  );
}

console.log(
  "Validated Sites artifact: Worker, hosting manifest, and explicit client asset route are present.",
);
