import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { appSettings, catalogProducts, mediaAssets, siteAssets } from "../../db/schema";
import { menus as builtInMenus, talabatImages, type CityId, type MenuItem, type PriceVariant } from "../catalog";

export const siteAssetSlots = [
  { slot: "site-logo", label: "Logo used across the website", fallbackUrl: "/puffy-pops-logo.png" },
  { slot: "home-hero", label: "Homepage hero image", fallbackUrl: "/puffy-pops-logo.png" },
  { slot: "home-favorite-1", label: "Homepage favorite · Nutella", fallbackUrl: talabatImages.nutella },
  { slot: "home-favorite-2", label: "Homepage favorite · White Chocolate", fallbackUrl: talabatImages.whiteChocolate },
  { slot: "home-favorite-3", label: "Homepage favorite · Caramel", fallbackUrl: talabatImages.caramel },
  { slot: "story-main", label: "Story page main image", fallbackUrl: talabatImages.assorted },
  { slot: "story-secondary", label: "Story page secondary image", fallbackUrl: talabatImages.nutella },
] as const;

export const existingPhotoLibrary = [
  { id: "puffy-logo", label: "Puffy Pops logo", url: "/puffy-pops-logo.png" },
  { id: "puffy-nutella", label: "Nutella Puffy Pops", url: talabatImages.nutella },
  { id: "puffy-assorted", label: "Assorted Puffy Pops", url: talabatImages.assorted },
  { id: "puffy-white-chocolate", label: "White Chocolate Puffy Pops", url: talabatImages.whiteChocolate },
  { id: "puffy-caramel", label: "Caramel Puffy Pops", url: talabatImages.caramel },
] as const;

const SEED_KEY = "catalog_seeded_v1";
export const PROMOTIONS_KEY = "catalog_promotions_v1";

export type PromotionSettings = {
  storePercent: number;
  productPercents: Record<string, number>;
  favoriteIds: string[];
};

const emptyPromotions: PromotionSettings = { storePercent: 0, productPercents: {}, favoriteIds: [] };
const percent = (value: unknown) => Math.max(0, Math.min(90, Math.round(Number(value) || 0)));

function safePromotions(value?: string): PromotionSettings {
  try {
    const parsed = JSON.parse(value || "{}") as Partial<PromotionSettings>;
    const productPercents = parsed.productPercents && typeof parsed.productPercents === "object"
      ? Object.fromEntries(Object.entries(parsed.productPercents).flatMap(([id, amount]) => {
        const clean = percent(amount);
        return id && clean ? [[id, clean]] : [];
      }))
      : {};
    return {
      storePercent: percent(parsed.storePercent),
      productPercents,
      favoriteIds: Array.isArray(parsed.favoriteIds) ? [...new Set(parsed.favoriteIds.filter((id): id is string => typeof id === "string" && Boolean(id)))] : [],
    };
  } catch { return { ...emptyPromotions }; }
}

export async function getPromotions(db: Awaited<ReturnType<typeof getDb>>) {
  const [row] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, PROMOTIONS_KEY)).limit(1);
  return safePromotions(row?.value);
}

export async function savePromotions(next: PromotionSettings) {
  const db = await ensureCatalog();
  const value = JSON.stringify(safePromotions(JSON.stringify(next)));
  await db.insert(appSettings).values({ key: PROMOTIONS_KEY, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date().toISOString() } });
  return safePromotions(value);
}

function safeVariants(value: string): PriceVariant[] {
  try {
    const parsed = JSON.parse(value) as PriceVariant[];
    return Array.isArray(parsed) && parsed.length ? parsed.filter((entry) => entry && typeof entry.id === "string" && typeof entry.label === "string" && Number.isFinite(entry.price)) : [];
  } catch { return []; }
}

function safeChoices(value: string) {
  try {
    const parsed = JSON.parse(value) as string[];
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === "string" && entry.trim()).map((entry) => entry.trim()) : [];
  } catch { return []; }
}

export async function ensureCatalog() {
  const db = await getDb();
  const [seeded] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, SEED_KEY)).limit(1);
  if (!seeded) {
    const values = (Object.entries(builtInMenus) as Array<[CityId, typeof builtInMenus[CityId]]>).flatMap(([cityId, menu]) => menu.items.map((item, index) => ({
      id: item.id,
      cityId,
      category: item.category,
      name: item.name,
      note: item.note ?? "",
      variantsJson: JSON.stringify(item.variants),
      choicesJson: JSON.stringify(item.choices ?? []),
      imageUrl: item.image ?? "",
      sortOrder: index,
    })));
    // D1 limits the number of bound values in one query. The full two-city
    // catalog is intentionally seeded in small batches so first-run setup
    // works on existing production databases as well as fresh deployments.
    for (let index = 0; index < values.length; index += 8) {
      await db.insert(catalogProducts).values(values.slice(index, index + 8)).onConflictDoNothing();
    }
    await db.insert(appSettings).values({ key: SEED_KEY, value: "1", updatedAt: new Date().toISOString() }).onConflictDoNothing();
  }
  await db.insert(siteAssets).values(siteAssetSlots.map((asset) => ({ ...asset }))).onConflictDoNothing();
  return db;
}

export function rowToMenuItem(row: typeof catalogProducts.$inferSelect): MenuItem {
  const variants = safeVariants(row.variantsJson);
  const choices = safeChoices(row.choicesJson);
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    variants,
    ...(row.note ? { note: row.note } : {}),
    ...(choices.length ? { choices } : {}),
    ...(row.imageKey ? { image: `/api/media?product=${encodeURIComponent(row.id)}&v=${encodeURIComponent(row.updatedAt)}` } : row.imageUrl ? { image: row.imageUrl } : {}),
  };
}

function applyPromotions(item: MenuItem, promotions: PromotionSettings) {
  const salePercent = promotions.productPercents[item.id] || promotions.storePercent;
  return {
    ...item,
    ...(promotions.favoriteIds.includes(item.id) ? { realFavorite: true } : {}),
    ...(salePercent ? {
      salePercent,
      variants: item.variants.map((variant) => ({
        ...variant,
        originalPrice: variant.price,
        price: Math.max(0, Math.round(variant.price * (1 - salePercent / 100))),
        salePercent,
      })),
    } : {}),
  } satisfies MenuItem;
}

export async function getManagedMenus() {
  try {
    const db = await ensureCatalog();
    const [rows, promotions] = await Promise.all([
      db.select().from(catalogProducts).where(eq(catalogProducts.enabled, true)).orderBy(asc(catalogProducts.cityId), asc(catalogProducts.category), asc(catalogProducts.sortOrder), asc(catalogProducts.name)),
      getPromotions(db),
    ]);
    return {
      alexandria: { categories: builtInMenus.alexandria.categories, items: rows.filter((row) => row.cityId === "alexandria").map(rowToMenuItem).map((item) => applyPromotions(item, promotions)).filter((item) => item.variants.length) },
      cairo: { categories: builtInMenus.cairo.categories, items: rows.filter((row) => row.cityId === "cairo").map(rowToMenuItem).map((item) => applyPromotions(item, promotions)).filter((item) => item.variants.length) },
    };
  } catch (error) {
    console.error("Managed catalog unavailable; using built-in menu", error);
    return builtInMenus;
  }
}

export async function getManagedMenuItem(cityId: CityId, itemId: string) {
  try {
    const db = await ensureCatalog();
    const [[row], promotions] = await Promise.all([
      db.select().from(catalogProducts).where(and(eq(catalogProducts.cityId, cityId), eq(catalogProducts.id, itemId), eq(catalogProducts.enabled, true))).limit(1),
      getPromotions(db),
    ]);
    return row ? applyPromotions(rowToMenuItem(row), promotions) : undefined;
  } catch {
    return builtInMenus[cityId].items.find((item) => item.id === itemId);
  }
}

export async function getCatalogStudioData() {
  const db = await ensureCatalog();
  const [products, assets, uploadedMedia, promotions] = await Promise.all([
    db.select().from(catalogProducts).orderBy(asc(catalogProducts.cityId), asc(catalogProducts.category), asc(catalogProducts.sortOrder), asc(catalogProducts.name)),
    db.select().from(siteAssets).orderBy(asc(siteAssets.label)),
    db.select().from(mediaAssets).orderBy(asc(mediaAssets.label)),
    getPromotions(db),
  ]);
  return {
    products: products.map((row) => ({ ...row, variants: safeVariants(row.variantsJson), choices: safeChoices(row.choicesJson), image: row.imageKey ? `/api/media?product=${encodeURIComponent(row.id)}&v=${encodeURIComponent(row.updatedAt)}` : row.imageUrl, realFavorite: promotions.favoriteIds.includes(row.id), salePercent: promotions.productPercents[row.id] || 0 })),
    assets: assets.map((asset) => ({ ...asset, image: `/api/media?slot=${encodeURIComponent(asset.slot)}&v=${encodeURIComponent(asset.updatedAt)}` })),
    photoLibrary: [
      ...existingPhotoLibrary.map((photo) => ({ ...photo, removable: false })),
      ...uploadedMedia.map((photo) => ({ id: `media-${photo.id}`, label: photo.label, url: `/api/media?library=${photo.id}`, removable: true })),
    ],
    categories: { alexandria: builtInMenus.alexandria.categories, cairo: builtInMenus.cairo.categories },
    promotions,
  };
}
