import { eq, max } from "drizzle-orm";
import { catalogProducts } from "../../../../db/schema";
import { getCatalogStudioData, ensureCatalog, getPromotions, savePromotions } from "../../../server/catalog-store";
import { verifyCmsSession } from "../../../server/cms-session";
import { getRuntimeBindings } from "../../../server/runtime-bindings";

type VariantInput = { id?: unknown; label?: unknown; price?: unknown };
type ProductBody = { id?: unknown; cityId?: unknown; category?: unknown; name?: unknown; note?: unknown; choices?: unknown; variants?: VariantInput[]; enabled?: unknown; realFavorite?: unknown; salePercent?: unknown };
const clean = (value: unknown, maxLength = 100) => typeof value === "string" ? value.trim().slice(0, maxLength) : "";
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

function normalizeProduct(body: ProductBody) {
  const cityId = clean(body.cityId, 20);
  const category = clean(body.category, 60);
  const name = clean(body.name, 100);
  const note = clean(body.note, 300);
  const variants = (body.variants ?? []).slice(0, 12).flatMap((entry, index) => {
    const label = clean(entry.label, 60);
    const price = Math.round(Number(entry.price));
    if (!label || !Number.isFinite(price) || price < 0 || price > 100_000) return [];
    return [{ id: clean(entry.id, 60) || `${slug(label) || "option"}-${index + 1}`, label, price }];
  });
  const choices = Array.isArray(body.choices) ? body.choices.slice(0, 30).map((choice) => clean(choice, 80)).filter(Boolean) : [];
  if (!(["alexandria", "cairo"].includes(cityId)) || !category || name.length < 2 || !variants.length) return null;
  return { cityId, category, name, note, variants, choices, enabled: body.enabled !== false, realFavorite: body.realFavorite === true, salePercent: Math.max(0, Math.min(90, Math.round(Number(body.salePercent) || 0))) };
}

async function saveProductPresentation(id: string, product: { realFavorite: boolean; salePercent: number }) {
  const db = await ensureCatalog();
  const promotions = await getPromotions(db);
  const favoriteIds = product.realFavorite ? [...new Set([...promotions.favoriteIds, id])] : promotions.favoriteIds.filter((entry) => entry !== id);
  const productPercents = { ...promotions.productPercents };
  if (product.salePercent) productPercents[id] = product.salePercent;
  else delete productPercents[id];
  await savePromotions({ ...promotions, favoriteIds, productPercents });
}

async function authorized(request: Request) {
  return Boolean(await verifyCmsSession(request));
}

export async function GET(request: Request) {
  if (!await authorized(request)) return Response.json({ error: "Developer login required." }, { status: 401 });
  try { return Response.json(await getCatalogStudioData(), { headers: { "cache-control": "no-store" } }); }
  catch (error) { console.error("Catalog studio load failed", error); return Response.json({ error: "Catalog data could not be loaded." }, { status: 500 }); }
}

export async function POST(request: Request) {
  if (!await authorized(request)) return Response.json({ error: "Developer login required." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as ProductBody;
  const product = normalizeProduct(body);
  if (!product) return Response.json({ error: "Add a city, category, name and at least one valid price option." }, { status: 400 });
  try {
    const db = await ensureCatalog();
    const [last] = await db.select({ value: max(catalogProducts.sortOrder) }).from(catalogProducts).where(eq(catalogProducts.cityId, product.cityId));
    const id = `${product.cityId === "alexandria" ? "alex" : "cairo"}-custom-${slug(product.name) || "product"}-${crypto.randomUUID().slice(0, 8)}`;
    await db.insert(catalogProducts).values({ id, cityId: product.cityId, category: product.category, name: product.name, note: product.note, variantsJson: JSON.stringify(product.variants), choicesJson: JSON.stringify(product.choices), enabled: product.enabled, sortOrder: (last?.value ?? 0) + 1 });
    await saveProductPresentation(id, product);
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) { console.error("Product creation failed", error); return Response.json({ error: "Product could not be created." }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  if (!await authorized(request)) return Response.json({ error: "Developer login required." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as ProductBody;
  const id = clean(body.id, 120);
  const product = normalizeProduct(body);
  if (!id || !product) return Response.json({ error: "Product data is invalid." }, { status: 400 });
  try {
    const db = await ensureCatalog();
    const [updated] = await db.update(catalogProducts).set({ cityId: product.cityId, category: product.category, name: product.name, note: product.note, variantsJson: JSON.stringify(product.variants), choicesJson: JSON.stringify(product.choices), enabled: product.enabled, updatedAt: new Date().toISOString() }).where(eq(catalogProducts.id, id)).returning({ id: catalogProducts.id });
    if (!updated) return Response.json({ error: "Product not found." }, { status: 404 });
    await saveProductPresentation(id, product);
    return Response.json({ ok: true });
  } catch (error) { console.error("Product update failed", error); return Response.json({ error: "Product could not be updated." }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  if (!await authorized(request)) return Response.json({ error: "Developer login required." }, { status: 401 });
  const id = clean(new URL(request.url).searchParams.get("id"), 120);
  if (!id) return Response.json({ error: "Choose a product." }, { status: 400 });
  try {
    const db = await ensureCatalog();
    const [product] = await db.select({ id: catalogProducts.id, imageKey: catalogProducts.imageKey }).from(catalogProducts).where(eq(catalogProducts.id, id)).limit(1);
    if (!product) return Response.json({ error: "Product not found." }, { status: 404 });
    await db.delete(catalogProducts).where(eq(catalogProducts.id, id));
    const promotions = await getPromotions(db);
    const productPercents = { ...promotions.productPercents };
    delete productPercents[id];
    await savePromotions({ ...promotions, productPercents, favoriteIds: promotions.favoriteIds.filter((entry) => entry !== id) });
    if (product.imageKey) {
      await getRuntimeBindings().BUCKET?.delete(product.imageKey);
    }
    return Response.json({ ok: true });
  } catch (error) { console.error("Product deletion failed", error); return Response.json({ error: "Product could not be removed." }, { status: 500 }); }
}
