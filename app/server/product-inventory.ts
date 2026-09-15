import { and, asc, eq, inArray } from "drizzle-orm";
import type { getDb } from "../../db";
import { branchProductInventory } from "../../db/schema";
import { branches, type CityId } from "../catalog";
import { getManagedMenus } from "./catalog-store";

type Database = Awaited<ReturnType<typeof getDb>>;

export type RequestedProduct = {
  productId: string;
  productName: string;
  quantity: number;
};

export function productRowCanFulfil(
  row: typeof branchProductInventory.$inferSelect | undefined,
  quantity: number,
) {
  if (!row || !row.available) return false;
  return !row.trackQuantity || row.currentStock >= quantity;
}

export async function ensureProductInventory(db: Database, branchId?: string) {
  const managedMenus = await getManagedMenus();
  const selectedBranches = branchId
    ? branches.filter((branch) => branch.id === branchId)
    : branches;
  const values = selectedBranches.flatMap((branch) => managedMenus[branch.cityId].items.map((product) => ({
    branchId: branch.id,
    cityId: branch.cityId,
    productId: product.id,
    productName: product.name,
    available: true,
    trackQuantity: false,
    currentStock: 0,
    reorderLevel: 3,
  })));

  // Keep first-run D1 statements below the bound-parameter limit.
  for (let index = 0; index < values.length; index += 8) {
    await db.insert(branchProductInventory).values(values.slice(index, index + 8)).onConflictDoNothing();
  }
}

export async function branchProductRows(db: Database, branchId: string) {
  await ensureProductInventory(db, branchId);
  return db.select().from(branchProductInventory)
    .where(eq(branchProductInventory.branchId, branchId))
    .orderBy(asc(branchProductInventory.productName));
}

export async function branchCanFulfil(
  db: Database,
  branchId: string,
  requested: RequestedProduct[],
) {
  await ensureProductInventory(db, branchId);
  const ids = [...new Set(requested.map((entry) => entry.productId))];
  const rows = ids.length
    ? await db.select().from(branchProductInventory).where(and(
      eq(branchProductInventory.branchId, branchId),
      inArray(branchProductInventory.productId, ids),
    ))
    : [];
  const byId = new Map(rows.map((row) => [row.productId, row]));
  return requested.every((entry) => productRowCanFulfil(byId.get(entry.productId), entry.quantity));
}

export async function missingProductsForBranch(
  db: Database,
  branchId: string,
  requested: RequestedProduct[],
) {
  await ensureProductInventory(db, branchId);
  const ids = [...new Set(requested.map((entry) => entry.productId))];
  const rows = ids.length
    ? await db.select().from(branchProductInventory).where(and(
      eq(branchProductInventory.branchId, branchId),
      inArray(branchProductInventory.productId, ids),
    ))
    : [];
  const byId = new Map(rows.map((row) => [row.productId, row]));
  return requested.filter((entry) => !productRowCanFulfil(byId.get(entry.productId), entry.quantity));
}

export async function deductTrackedProducts(
  db: Database,
  branchId: string,
  requested: RequestedProduct[],
) {
  const rows = await branchProductRows(db, branchId);
  const byId = new Map(rows.map((row) => [row.productId, row]));
  for (const entry of requested) {
    const row = byId.get(entry.productId);
    if (!row?.trackQuantity) continue;
    await db.update(branchProductInventory).set({
      currentStock: Math.max(0, row.currentStock - entry.quantity),
      updatedAt: new Date().toISOString(),
    }).where(eq(branchProductInventory.id, row.id));
  }
}

export async function markProductsUnavailable(
  db: Database,
  branchId: string,
  productIds: string[],
) {
  const ids = [...new Set(productIds)].filter(Boolean);
  if (!ids.length) return;
  await db.update(branchProductInventory).set({
    available: false,
    updatedAt: new Date().toISOString(),
  }).where(and(
    eq(branchProductInventory.branchId, branchId),
    inArray(branchProductInventory.productId, ids),
  ));
}

export async function catalogAvailability(db: Database) {
  await ensureProductInventory(db);
  const rows = await db.select().from(branchProductInventory).orderBy(asc(branchProductInventory.branchId), asc(branchProductInventory.productName));
  const byBranch: Record<string, Record<string, { available: boolean; lowStock: boolean; currentStock: number | null }>> = {};
  for (const row of rows) {
    byBranch[row.branchId] ??= {};
    byBranch[row.branchId][row.productId] = {
      available: productRowCanFulfil(row, 1),
      lowStock: row.trackQuantity && row.currentStock <= row.reorderLevel,
      currentStock: row.trackQuantity ? row.currentStock : null,
    };
  }

  const cityAvailability: Record<CityId, Record<string, boolean>> = { alexandria: {}, cairo: {} };
  for (const branch of branches) {
    for (const [productId, availability] of Object.entries(byBranch[branch.id] ?? {})) {
      cityAvailability[branch.cityId][productId] ||= availability.available;
    }
  }
  return { byBranch, cityAvailability };
}

