import {
  menus,
  type CityId,
  type MenuCategory,
  type MenuItem,
  type PriceVariant,
} from "./catalog";

export type RuntimeMenus = typeof menus;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readCategory(value: unknown): MenuCategory | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.label !== "string") return null;
  return {
    id: value.id,
    label: value.label,
    tagline: typeof value.tagline === "string" ? value.tagline : "",
  };
}

function readVariant(value: unknown): PriceVariant | null {
  if (
    !isRecord(value)
    || typeof value.id !== "string"
    || typeof value.label !== "string"
    || typeof value.price !== "number"
    || !Number.isFinite(value.price)
  ) return null;
  return {
    id: value.id,
    label: value.label,
    price: value.price,
    ...(typeof value.originalPrice === "number" && Number.isFinite(value.originalPrice) ? { originalPrice: value.originalPrice } : {}),
    ...(typeof value.salePercent === "number" && Number.isFinite(value.salePercent) ? { salePercent: value.salePercent } : {}),
  };
}

function readItem(value: unknown): MenuItem | null {
  if (
    !isRecord(value)
    || typeof value.id !== "string"
    || typeof value.name !== "string"
    || typeof value.category !== "string"
    || !Array.isArray(value.variants)
  ) return null;

  const variants = value.variants.map(readVariant).filter((entry): entry is PriceVariant => entry !== null);
  if (!variants.length) return null;

  const choices = Array.isArray(value.choices)
    ? value.choices.filter((entry): entry is string => typeof entry === "string")
    : undefined;

  return {
    id: value.id,
    name: value.name,
    category: value.category,
    variants,
    ...(typeof value.note === "string" ? { note: value.note } : {}),
    ...(choices?.length ? { choices } : {}),
    ...(typeof value.image === "string" ? { image: value.image } : {}),
    ...(value.realFavorite === true ? { realFavorite: true } : {}),
    ...(typeof value.salePercent === "number" && Number.isFinite(value.salePercent) ? { salePercent: value.salePercent } : {}),
  };
}

function readCity(value: unknown, cityId: CityId): RuntimeMenus[CityId] {
  if (!isRecord(value) || !Array.isArray(value.categories) || !Array.isArray(value.items)) {
    return menus[cityId];
  }

  const categories = value.categories.map(readCategory).filter((entry): entry is MenuCategory => entry !== null);
  const items = value.items.map(readItem).filter((entry): entry is MenuItem => entry !== null);

  // A damaged or half-created catalog should never be able to blank the customer menu.
  return {
    categories: categories.length ? categories : menus[cityId].categories,
    items: value.items.length > 0 && items.length === 0 ? menus[cityId].items : items,
  };
}

/** Accept both the API's `{ menus }` response and the older direct menu response. */
export function normalizeCatalogResponse(payload: unknown): RuntimeMenus {
  const source = isRecord(payload) && isRecord(payload.menus) ? payload.menus : payload;
  const record = isRecord(source) ? source : {};

  return {
    alexandria: readCity(record.alexandria, "alexandria"),
    cairo: readCity(record.cairo, "cairo"),
  };
}
