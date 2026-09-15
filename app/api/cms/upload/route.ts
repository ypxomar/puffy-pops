import { eq } from "drizzle-orm";
import { catalogProducts, mediaAssets, siteAssets } from "../../../../db/schema";
import { ensureCatalog, existingPhotoLibrary, siteAssetSlots } from "../../../server/catalog-store";
import { verifyCmsSession } from "../../../server/cms-session";
import { requireRuntimeBucket } from "../../../server/runtime-bindings";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const extensionFor = (type: string) => ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[type] ?? "bin");
const clean = (value: FormDataEntryValue | string | null, max = 120) => typeof value === "string" ? value.trim().slice(0, max) : "";

async function bucket() {
  return requireRuntimeBucket();
}

export async function POST(request: Request) {
  if (!await verifyCmsSession(request)) return Response.json({ error: "Developer login required." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const targetType = clean(form?.get("targetType") ?? null, 20);
  const targetId = clean(form?.get("targetId") ?? null);
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size < 1 || file.size > 8 * 1024 * 1024) return Response.json({ error: "Choose a JPG, PNG, WebP or GIF image up to 8 MB." }, { status: 400 });
  if (!(["product", "slot", "library"].includes(targetType)) || !targetId) return Response.json({ error: "Choose where this image belongs." }, { status: 400 });
  if (targetType === "slot" && !siteAssetSlots.some((slot) => slot.slot === targetId)) return Response.json({ error: "Unknown website image slot." }, { status: 400 });
  try {
    const db = await ensureCatalog();
    if (targetType === "library") {
      const objectKey = `library/${crypto.randomUUID()}.${extensionFor(file.type)}`;
      const r2 = await bucket();
      await r2.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" } });
      const [created] = await db.insert(mediaAssets).values({ label: targetId.slice(0, 100), imageKey: objectKey }).returning({ id: mediaAssets.id });
      return Response.json({ ok: true, id: created.id }, { status: 201 });
    }
    const [target] = targetType === "product"
      ? await db.select({ key: catalogProducts.imageKey }).from(catalogProducts).where(eq(catalogProducts.id, targetId)).limit(1)
      : await db.select({ key: siteAssets.imageKey }).from(siteAssets).where(eq(siteAssets.slot, targetId)).limit(1);
    if (!target) return Response.json({ error: "Image target not found." }, { status: 404 });
    const objectKey = `${targetType === "product" ? "products" : "site"}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
    const r2 = await bucket();
    await r2.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" } });
    const updatedAt = new Date().toISOString();
    if (targetType === "product") await db.update(catalogProducts).set({ imageKey: objectKey, imageUrl: "", updatedAt }).where(eq(catalogProducts.id, targetId));
    else await db.update(siteAssets).set({ imageKey: objectKey, updatedAt }).where(eq(siteAssets.slot, targetId));
    if (target.key) await r2.delete(target.key);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Image upload failed", error);
    return Response.json({ error: error instanceof Error && error.message === "R2_BINDING_MISSING" ? "Image storage is not connected. Run the one-time Cloudflare setup command from the included guide." : "Image could not be uploaded." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!await verifyCmsSession(request)) return Response.json({ error: "Developer login required." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { targetType?: string; targetId?: string };
  const targetType = clean(body.targetType ?? null, 20);
  const targetId = clean(body.targetId ?? null);
  if (!(["product", "slot", "library"].includes(targetType)) || !targetId) return Response.json({ error: "Choose an image." }, { status: 400 });
  try {
    const db = await ensureCatalog();
    if (targetType === "library") {
      const id = Number(targetId);
      if (!Number.isInteger(id)) return Response.json({ error: "Saved image not found." }, { status: 404 });
      const [saved] = await db.select({ key: mediaAssets.imageKey }).from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
      if (!saved) return Response.json({ error: "Saved image not found." }, { status: 404 });
      const reference = `/api/media?library=${id}`;
      const [productUse] = await db.select({ id: catalogProducts.id }).from(catalogProducts).where(eq(catalogProducts.imageUrl, reference)).limit(1);
      const [slotUse] = await db.select({ slot: siteAssets.slot }).from(siteAssets).where(eq(siteAssets.fallbackUrl, reference)).limit(1);
      if (productUse || slotUse) return Response.json({ error: "This image is still being used. Replace it on those products or website sections before removing it." }, { status: 409 });
      await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
      await (await bucket()).delete(saved.key);
      return Response.json({ ok: true });
    }
    const [target] = targetType === "product"
      ? await db.select({ key: catalogProducts.imageKey }).from(catalogProducts).where(eq(catalogProducts.id, targetId)).limit(1)
      : await db.select({ key: siteAssets.imageKey }).from(siteAssets).where(eq(siteAssets.slot, targetId)).limit(1);
    if (!target) return Response.json({ error: "Image target not found." }, { status: 404 });
    if (targetType === "product") await db.update(catalogProducts).set({ imageKey: "", imageUrl: "", updatedAt: new Date().toISOString() }).where(eq(catalogProducts.id, targetId));
    else {
      const original = siteAssetSlots.find((entry) => entry.slot === targetId);
      await db.update(siteAssets).set({ imageKey: "", fallbackUrl: original?.fallbackUrl ?? "", updatedAt: new Date().toISOString() }).where(eq(siteAssets.slot, targetId));
    }
    if (target.key) await (await bucket()).delete(target.key);
    return Response.json({ ok: true });
  } catch (error) { console.error("Image removal failed", error); return Response.json({ error: "Image could not be removed." }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  if (!await verifyCmsSession(request)) return Response.json({ error: "Developer login required." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { targetType?: string; targetId?: string; photoId?: string };
  const targetType = clean(body.targetType ?? null, 20);
  const targetId = clean(body.targetId ?? null);
  const photoId = clean(body.photoId ?? null);
  if (!(targetType === "product" || targetType === "slot") || !targetId || !photoId) return Response.json({ error: "Choose a saved photo and where to use it." }, { status: 400 });
  try {
    const db = await ensureCatalog();
    const builtInPhoto = existingPhotoLibrary.find((entry) => entry.id === photoId);
    const mediaId = photoId.startsWith("media-") ? Number(photoId.slice(6)) : NaN;
    const [uploadedPhoto] = Number.isInteger(mediaId) ? await db.select({ id: mediaAssets.id }).from(mediaAssets).where(eq(mediaAssets.id, mediaId)).limit(1) : [];
    const photoUrl = builtInPhoto?.url ?? (uploadedPhoto ? `/api/media?library=${uploadedPhoto.id}` : "");
    if (!photoUrl) return Response.json({ error: "Saved photo not found." }, { status: 404 });
    const [target] = targetType === "product"
      ? await db.select({ key: catalogProducts.imageKey }).from(catalogProducts).where(eq(catalogProducts.id, targetId)).limit(1)
      : await db.select({ key: siteAssets.imageKey }).from(siteAssets).where(eq(siteAssets.slot, targetId)).limit(1);
    if (!target) return Response.json({ error: "Image target not found." }, { status: 404 });
    const updatedAt = new Date().toISOString();
    if (targetType === "product") await db.update(catalogProducts).set({ imageKey: "", imageUrl: photoUrl, updatedAt }).where(eq(catalogProducts.id, targetId));
    else await db.update(siteAssets).set({ imageKey: "", fallbackUrl: photoUrl, updatedAt }).where(eq(siteAssets.slot, targetId));
    if (target.key) await (await bucket()).delete(target.key);
    return Response.json({ ok: true });
  } catch (error) { console.error("Saved photo assignment failed", error); return Response.json({ error: "Saved photo could not be applied." }, { status: 500 }); }
}
