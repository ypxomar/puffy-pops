import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const assetDirectory = resolve(projectRoot, "public", "assets");

await mkdir(assetDirectory, { recursive: true });
await copyFile(
  resolve(projectRoot, "app", "globals.css"),
  resolve(assetDirectory, "storefront.css"),
);
// The soft-serve landing (the "/" route) keeps its own stylesheet so the
// storefront styles stay untouched. It is namespaced under `.ss-site-shell`.
await copyFile(
  resolve(projectRoot, "app", "soft-serve-landing.css"),
  resolve(assetDirectory, "soft-serve-landing.css"),
);
