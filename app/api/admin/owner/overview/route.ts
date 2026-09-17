import { asc, desc, inArray } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { branchProductInventory, inventory, orderItems, orders, stockRequests } from "../../../../../db/schema";
import { branches } from "../../../../catalog";
import { verifySession } from "../../../../server/admin-session";
import { ensureAllInventory } from "../../../../server/inventory";
import { ensureProductInventory } from "../../../../server/product-inventory";

const PLACEHOLDER_FOOD_COST_RATE = 0.45;

export async function GET(request: Request) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner") return Response.json({ error: "Owner access required." }, { status: 403 });

  try {
    const db = await getDb();
    await ensureAllInventory(db);
    await ensureProductInventory(db);
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt), desc(orders.id));
    const orderIds = allOrders.map((order) => order.id);
    const items = orderIds.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)) : [];
    const allInventory = await db.select().from(inventory).orderBy(asc(inventory.branchId), asc(inventory.category), asc(inventory.name));
    const allProducts = await db.select().from(branchProductInventory).orderBy(asc(branchProductInventory.branchId), asc(branchProductInventory.productName));
    const allRequests = await db.select().from(stockRequests).orderBy(desc(stockRequests.createdAt));
    const activeOrders = allOrders.filter((order) => order.status !== "cancelled");
    const salesBase = activeOrders;
    const revenue = salesBase.reduce((sum, order) => sum + order.subtotal, 0);
    const deliveryCollected = salesBase.reduce((sum, order) => sum + order.deliveryFee, 0);
    const estimatedGrossProfit = Math.round(revenue * (1 - PLACEHOLDER_FOOD_COST_RATE));
    const stockValue = Math.round(allInventory.reduce((sum, item) => sum + item.currentStock * item.unitCost, 0));

    const branchMetrics = branches.map((branch) => {
      const branchOrders = activeOrders.filter((order) => order.branchId === branch.id);
      const branchRevenue = branchOrders.reduce((sum, order) => sum + order.subtotal, 0);
      const branchInventory = allInventory.filter((item) => item.branchId === branch.id);
      const branchProducts = allProducts.filter((item) => item.branchId === branch.id);
      return {
        branch,
        orders: branchOrders.length,
        revenue: branchRevenue,
        estimatedProfit: Math.round(branchRevenue * (1 - PLACEHOLDER_FOOD_COST_RATE)),
        lowStock: branchInventory.filter((item) => item.currentStock <= item.reorderLevel).length + branchProducts.filter((item) => !item.available || (item.trackQuantity && item.currentStock <= item.reorderLevel)).length,
        stockLines: branchInventory.length,
        productLines: branchProducts.length,
        pendingTransfers: allRequests.filter((request) => request.targetBranchId === branch.id && request.status === "pending").length,
      };
    });

    return Response.json({
      readOnly: true,
      summary: {
        totalOrders: allOrders.length,
        activeOrders: activeOrders.filter((order) => !["completed", "cancelled"].includes(order.status)).length,
        revenue,
        deliveryCollected,
        estimatedGrossProfit,
        stockValue,
      },
      costModel: { foodCostRate: PLACEHOLDER_FOOD_COST_RATE, placeholder: true },
      branches: branchMetrics,
      orders: allOrders.map((order) => ({ ...order, items: items.filter((item) => item.orderId === order.id) })),
      inventory: allInventory,
      products: allProducts,
      transferRequests: allRequests,
    });
  } catch {
    return Response.json({ error: "The owner overview could not be loaded." }, { status: 500 });
  }
}
