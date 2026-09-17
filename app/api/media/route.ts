import { eq } from "drizzle-orm";
import { catalogProducts, mediaAssets, siteAssets } from "../../../db/schema";
import { ensureCatalog } from "../../server/catalog-store";
import { getRuntimeBindings } from "../../server/runtime-bindings";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("product")?.slice(0, 120) ?? "";
  const slot = url.searchParams.get("slot")?.slice(0, 120) ?? "";
  const libraryId = Number(url.searchParams.get("library"));
  if (!productId && !slot && !Number.isInteger(libraryId)) return new Response("Image not found", { status: 404 });
  try {
    const db = await ensureCatalog();
    const [record] = productId
      ? await db.select({ imageKey: catalogProducts.imageKey, fallbackUrl: catalogProducts.imageUrl }).from(catalogProducts).where(eq(catalogProducts.id, productId)).limit(1)
      : slot
        ? await db.select({ imageKey: siteAssets.imageKey, fallbackUrl: siteAssets.fallbackUrl }).from(siteAssets).where(eq(siteAssets.slot, slot)).limit(1)
        : await db.select({ imageKey: mediaAssets.imageKey, fallbackUrl: mediaAssets.imageKey }).from(mediaAssets).where(eq(mediaAssets.id, libraryId)).limit(1);
    if (!record) return new Response("Image not found", { status: 404 });
    if (record.imageKey) {
      const object = await getRuntimeBindings().BUCKET?.get(record.imageKey);
      if (object) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("cache-control", "public, max-age=86400");
        headers.set("x-content-type-options", "nosniff");
        return new Response(object.body, { headers });
      }
    }
    if (record.fallbackUrl) return Response.redirect(new URL(record.fallbackUrl, request.url), 302);
    return new Response("Image not found", { status: 404 });
  } catch {
    return new Response("Image unavailable", { status: 404 });
  }
}
