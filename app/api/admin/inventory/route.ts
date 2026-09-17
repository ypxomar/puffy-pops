import { and, asc, desc, eq, or } from "drizzle-orm";
import { getDb } from "../../../../db";
import { branchProductInventory, inventory, inventoryMovements, stockRequests } from "../../../../db/schema";
import { getBranch } from "../../../catalog";
import { verifySession } from "../../../server/admin-session";
import { ensureAllInventory, ensureBranchInventory } from "../../../server/inventory";
import { ensureProductInventory } from "../../../server/product-inventory";

const shortText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const safeNumber = (value: unknown, fallback = 0) => {
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 && result <= 1_000_000 ? result : fallback;
};

function requestWithProducts(request: typeof stockRequests.$inferSelect) {
  try {
    const products = JSON.parse(request.requestedProductsJson) as unknown;
    const missingProducts = JSON.parse(request.missingProductsJson) as unknown;
    return { ...request, products: Array.isArray(products) ? products : [], missingProducts: Array.isArray(missingProducts) ? missingProducts : [] };
  } catch {
    return { ...request, products: [], missingProducts: [] };
  }
}

export async function GET(request: Request) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = await getDb();
    if (session.role === "owner") {
      await ensureAllInventory(db);
      await ensureProductInventory(db);
      const [ingredients, products, requests] = await Promise.all([
        db.select().from(inventory).orderBy(asc(inventory.branchId), asc(inventory.category), asc(inventory.name)),
        db.select().from(branchProductInventory).orderBy(asc(branchProductInventory.branchId), asc(branchProductInventory.productName)),
        db.select().from(stockRequests).orderBy(desc(stockRequests.createdAt)),
      ]);
      return Response.json({ role: "owner", inventory: ingredients, ingredients, products, transferRequests: requests.map(requestWithProducts) });
    }

    await ensureBranchInventory(db, session.branchId);
    await ensureProductInventory(db, session.branchId);
    const [ingredients, products, requests] = await Promise.all([
      db.select().from(inventory).where(eq(inventory.branchId, session.branchId)).orderBy(asc(inventory.category), asc(inventory.name)),
      db.select().from(branchProductInventory).where(eq(branchProductInventory.branchId, session.branchId)).orderBy(asc(branchProductInventory.productName)),
      db.select().from(stockRequests).where(or(
        eq(stockRequests.targetBranchId, session.branchId),
        eq(stockRequests.sourceBranchId, session.branchId),
      )).orderBy(desc(stockRequests.createdAt)),
    ]);
    const alerts = [
      ...ingredients.filter((item) => item.currentStock <= item.reorderLevel).map((item) => ({ kind: "ingredient", id: item.id, message: `${item.name} is low. Restock when available.` })),
      ...products.filter((item) => !item.available || (item.trackQuantity && item.currentStock <= item.reorderLevel)).map((item) => ({ kind: "product", id: item.id, message: `${item.productName} is out of stock or low. Restock when available.` })),
    ];
    return Response.json({
      role: "branch",
      branch: getBranch(session.branchId),
      inventory: ingredients,
      ingredients,
      products,
      transferRequests: requests.map(requestWithProducts),
      alerts,
    });
  } catch (error) {
    console.error("Inventory load failed", error);
    return Response.json({ error: "Inventory could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await verifySession(request);
  if (!session || session.role !== "branch") return Response.json({ error: "Branch access required." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const name = shortText(body.name, 100);
  const category = shortText(body.category, 60) || "Ingredients";
  const unit = shortText(body.unit, 30) || "units";
  const sku = (shortText(body.sku, 60) || `CUSTOM-${crypto.randomUUID().slice(0, 8)}`).toUpperCase().replace(/[^A-Z0-9_-]+/g, "-");
  if (!name) return Response.json({ error: "Enter an ingredient name." }, { status: 400 });
  try {
    const db = await getDb();
    const [created] = await db.insert(inventory).values({
      branchId: session.branchId,
      sku,
      name,
      category,
      unit,
      currentStock: safeNumber(body.currentStock),
      reorderLevel: safeNumber(body.reorderLevel),
      unitCost: Math.round(safeNumber(body.unitCost)),
      updatedAt: new Date().toISOString(),
    }).returning();
    return Response.json({ ingredient: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && /unique/i.test(error.message)
      ? "This branch already has an ingredient with that SKU."
      : "The ingredient could not be added.";
    return Response.json({ error: message }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  const session = await verifySession(request);
  if (!session || session.role !== "branch") return Response.json({ error: "The owner dashboard is read-only." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const id = Math.floor(Number(body.id));
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Choose a valid inventory item." }, { status: 400 });

  try {
    const db = await getDb();
    if (body.kind === "product") {
      const [existing] = await db.select().from(branchProductInventory).where(and(
        eq(branchProductInventory.id, id),
        eq(branchProductInventory.branchId, session.branchId),
      )).limit(1);
      if (!existing) return Response.json({ error: "Product inventory item not found." }, { status: 404 });
      const trackQuantity = body.trackQuantity === true;
      const [updated] = await db.update(branchProductInventory).set({
        available: body.available !== false,
        trackQuantity,
        currentStock: safeNumber(body.currentStock, existing.currentStock),
        reorderLevel: safeNumber(body.reorderLevel, existing.reorderLevel),
        updatedAt: new Date().toISOString(),
      }).where(eq(branchProductInventory.id, existing.id)).returning();
      return Response.json({ product: updated });
    }

    const [existing] = await db.select().from(inventory).where(and(eq(inventory.id, id), eq(inventory.branchId, session.branchId))).limit(1);
    if (!existing) return Response.json({ error: "Ingredient not found." }, { status: 404 });
    const currentStock = safeNumber(body.currentStock, existing.currentStock);
    const reason = shortText(body.reason, 80) || "Manual count";
    const [updated] = await db.update(inventory).set({
      name: shortText(body.name, 100) || existing.name,
      category: shortText(body.category, 60) || existing.category,
      unit: shortText(body.unit, 30) || existing.unit,
      currentStock,
      reorderLevel: safeNumber(body.reorderLevel, existing.reorderLevel),
      unitCost: Math.round(safeNumber(body.unitCost, existing.unitCost)),
      updatedAt: new Date().toISOString(),
    }).where(eq(inventory.id, existing.id)).returning();
    if (currentStock !== existing.currentStock) {
      await db.insert(inventoryMovements).values({
        inventoryId: existing.id,
        branchId: session.branchId,
        itemName: updated.name,
        previousStock: existing.currentStock,
        newStock: currentStock,
        reason,
        createdAt: new Date().toISOString(),
      });
    }
    return Response.json({ ingredient: updated, inventory: updated });
  } catch (error) {
    console.error("Inventory update failed", error);
    return Response.json({ error: "The inventory item could not be saved." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await verifySession(request);
  if (!session || session.role !== "branch") return Response.json({ error: "Branch access required." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { id?: unknown; confirm?: unknown };
  const id = Math.floor(Number(body.id));
  if (!body.confirm || !Number.isInteger(id)) return Response.json({ error: "Confirm which ingredient should be removed." }, { status: 400 });
  try {
    const db = await getDb();
    const [removed] = await db.delete(inventory).where(and(eq(inventory.id, id), eq(inventory.branchId, session.branchId))).returning();
    if (!removed) return Response.json({ error: "Ingredient not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "The ingredient could not be removed." }, { status: 500 });
  }
}
