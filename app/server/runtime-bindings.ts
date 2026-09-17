export type PuffyRuntimeBindings = {
  DB?: D1Database;
  BUCKET?: R2Bucket;
  GOOGLE_MAPS_BROWSER_KEY?: string;
  GOOGLE_MAPS_SERVER_KEY?: string;
};

let runtimeBindings: PuffyRuntimeBindings = {};

/**
 * Route modules are compiled separately by vinext, so importing
 * `cloudflare:workers` dynamically from a route can fail at runtime. The
 * Worker entry point injects the real bindings before handing the request to
 * the application router instead.
 */
export function setRuntimeBindings(bindings: PuffyRuntimeBindings) {
  runtimeBindings = bindings;
}

export function getRuntimeBindings() {
  return runtimeBindings;
}

export function requireRuntimeDatabase() {
  if (!runtimeBindings.DB) throw new Error("D1_BINDING_MISSING");
  return runtimeBindings.DB;
}

export function requireRuntimeBucket() {
  if (!runtimeBindings.BUCKET) throw new Error("R2_BINDING_MISSING");
  return runtimeBindings.BUCKET;
}
