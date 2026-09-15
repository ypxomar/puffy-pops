import type { getDb } from "../../db";
import { eq } from "drizzle-orm";
import { appSettings, inventory } from "../../db/schema";
import { branches } from "../catalog";

type Database = Awaited<ReturnType<typeof getDb>>;

const placeholderItems = [
  { sku: "RAW-DOUGH", name: "Puffy Pops dough portions", category: "Kitchen", unit: "portions", reorderLevel: 60, unitCost: 6 },
  { sku: "SPREAD-NUTELLA", name: "Nutella spread", category: "Spreads", unit: "tubs", reorderLevel: 3, unitCost: 280 },
  { sku: "SPREAD-LOTUS", name: "Lotus spread", category: "Spreads", unit: "tubs", reorderLevel: 3, unitCost: 260 },
  { sku: "CHOC-WHITE", name: "White chocolate", category: "Chocolate", unit: "kg", reorderLevel: 2, unitCost: 340 },
  { sku: "SPREAD-PISTACHIO", name: "Pistachio spread", category: "Spreads", unit: "tubs", reorderLevel: 2, unitCost: 440 },
  { sku: "PACK-BOX", name: "Dessert boxes", category: "Packaging", unit: "boxes", reorderLevel: 50, unitCost: 8 },
  { sku: "COFFEE-BEANS", name: "Coffee beans", category: "Drinks", unit: "kg", reorderLevel: 2, unitCost: 520 },
  { sku: "PACK-CUPS", name: "Cups and lids", category: "Packaging", unit: "sets", reorderLevel: 60, unitCost: 5 },
];

export async function ensureBranchInventory(db: Database, branchId: string) {
  if (!branches.some((branch) => branch.id === branchId)) return;
  const seedKey = `ingredient_inventory_seeded_${branchId}`;
  const [seeded] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, seedKey)).limit(1);
  if (seeded) return;
  await db.insert(inventory).values(placeholderItems.map((item) => ({
    branchId,
    ...item,
    currentStock: 0,
  }))).onConflictDoNothing();
  await db.insert(appSettings).values({ key: seedKey, value: "1", updatedAt: new Date().toISOString() }).onConflictDoNothing();
}

export async function ensureAllInventory(db: Database) {
  for (const branch of branches) await ensureBranchInventory(db, branch.id);
}
