/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { VERIFIED_ADMIN_BRANCH_HEADER, VERIFIED_ADMIN_EXPIRES_HEADER, VERIFIED_ADMIN_ROLE_HEADER, setRuntimeAccessConfig, verifySession } from "../app/server/admin-session";
import { setRuntimeSessionSecret } from "../app/server/security";
import { setRuntimeBindings } from "../app/server/runtime-bindings";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  BUCKET: R2Bucket;
  ADMIN_SESSION_SECRET?: string;
  ADMIN_CODE_HASH_KAFR_ABDO?: string;
  ADMIN_CODE_HASH_SMOUHA?: string;
  ADMIN_CODE_HASH_GREEN_PLAZA?: string;
  ADMIN_CODE_HASH_ARKAN?: string;
  ADMIN_CODE_HASH_GOLF_CENTRAL?: string;
  OWNER_CODE_HASH?: string;
  CMS_CODE_HASH?: string;
  GOOGLE_MAPS_BROWSER_KEY?: string;
  GOOGLE_MAPS_SERVER_KEY?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    setRuntimeBindings({
      DB: env.DB,
      BUCKET: env.BUCKET,
      GOOGLE_MAPS_BROWSER_KEY: env.GOOGLE_MAPS_BROWSER_KEY,
      GOOGLE_MAPS_SERVER_KEY: env.GOOGLE_MAPS_SERVER_KEY,
    });
    setRuntimeSessionSecret(env.ADMIN_SESSION_SECRET, env.CMS_CODE_HASH);
    setRuntimeAccessConfig({
      ADMIN_SESSION_SECRET: env.ADMIN_SESSION_SECRET,
      ADMIN_CODE_HASH_KAFR_ABDO: env.ADMIN_CODE_HASH_KAFR_ABDO,
      ADMIN_CODE_HASH_SMOUHA: env.ADMIN_CODE_HASH_SMOUHA,
      ADMIN_CODE_HASH_GREEN_PLAZA: env.ADMIN_CODE_HASH_GREEN_PLAZA,
      ADMIN_CODE_HASH_ARKAN: env.ADMIN_CODE_HASH_ARKAN,
      ADMIN_CODE_HASH_GOLF_CENTRAL: env.ADMIN_CODE_HASH_GOLF_CENTRAL,
      OWNER_CODE_HASH: env.OWNER_CODE_HASH,
    });
    const url = new URL(request.url);
    const requestOrigin = request.headers.get("origin");
    const appOrigins = new Set(["null", "capacitor://localhost", "http://localhost", "https://localhost", "http://localhost:5173", "http://127.0.0.1:5173"]);
    const appOrigin = requestOrigin && appOrigins.has(requestOrigin) ? requestOrigin : null;

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      if (!appOrigin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: {
        "access-control-allow-origin": appOrigin,
        "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "authorization,content-type",
        "access-control-max-age": "86400",
        vary: "Origin",
      } });
    }

    // Vinext runs route modules in a separate bundle. Verify management tokens
    // at the public Worker boundary, erase any caller-supplied trust headers,
    // and pass only the server-verified role into the internal API renderer.
    if (url.pathname.startsWith("/api/")) {
      const headers = new Headers(request.headers);
      headers.delete(VERIFIED_ADMIN_ROLE_HEADER);
      headers.delete(VERIFIED_ADMIN_BRANCH_HEADER);
      headers.delete(VERIFIED_ADMIN_EXPIRES_HEADER);
      const sanitized = new Request(request, { headers });
      const admin = await verifySession(sanitized, env.ADMIN_SESSION_SECRET, false);
      if (admin) {
        headers.set(VERIFIED_ADMIN_ROLE_HEADER, admin.role);
        headers.set(VERIFIED_ADMIN_EXPIRES_HEADER, String(admin.expires));
        if (admin.role === "branch") headers.set(VERIFIED_ADMIN_BRANCH_HEADER, admin.branchId);
      }
      request = new Request(sanitized, { headers });
    }

    // Serve built browser files directly from Cloudflare's asset binding.
    // This avoids sending CSS, JavaScript, fonts and public images through the
    // application router, which can otherwise turn asset requests into HTML.
    // `/images/` holds the soft-serve landing artwork.
    const isStaticAsset =
      url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/images/") ||
      url.pathname === "/puffy-pops-logo.png" ||
      url.pathname === "/favicon.svg" ||
      url.pathname === "/favicon.ico";

    if ((request.method === "GET" || request.method === "HEAD") && isStaticAsset) {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const response = await handler.fetch(request, env, ctx);
    if (!appOrigin || !url.pathname.startsWith("/api/")) return response;
    const headers = new Headers(response.headers);
    headers.set("access-control-allow-origin", appOrigin);
    headers.set("access-control-allow-headers", "authorization,content-type");
    headers.append("vary", "Origin");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};

export default worker;
