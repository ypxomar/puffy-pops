import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../db";
import { orderItems, orders } from "../../../../db/schema";
import { getBranch } from "../../../catalog";
import { verifySession } from "../../../server/admin-session";

export async function GET(request: Request) {
  const session = await verifySession(request);
  if (!session || session.role !== "branch") return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = await getDb();
    const branchOrders = await db.select().from(orders).where(eq(orders.branchId, session.branchId)).orderBy(desc(orders.createdAt), desc(orders.id));
    const ids = branchOrders.map((order) => order.id);
    const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
    return Response.json({ branch: getBranch(session.branchId), orders: branchOrders.map((order) => ({ ...order, items: items.filter((item) => item.orderId === order.id) })) });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("no such table") ? "Order tables are not available. Apply the generated D1 migration first." : "Orders could not be loaded.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await verifySession(request);
  if (!session || session.role !== "owner") return Response.json({ error: "Owner access required." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { ids?: number[]; confirm?: boolean };
  const ids = [...new Set((body.ids ?? []).map(Number).filter(Number.isInteger))].slice(0, 500);
  if (!body.confirm || !ids.length) return Response.json({ error: "Choose one or more finished orders and confirm deletion." }, { status: 400 });
  try {
    const db = await getDb();
    const selected = await db.select({ id: orders.id, status: orders.status }).from(orders).where(inArray(orders.id, ids));
    if (selected.length !== ids.length) return Response.json({ error: "One or more selected orders no longer exist. Refresh and try again." }, { status: 409 });
    if (selected.some((order) => !["completed", "cancelled", "out_of_stock"].includes(order.status))) return Response.json({ error: "Active orders are protected and cannot be deleted." }, { status: 409 });
    await db.batch([
      db.delete(orderItems).where(inArray(orderItems.orderId, ids)),
      db.delete(orders).where(inArray(orders.id, ids)),
    ]);
    return Response.json({ ok: true, count: ids.length });
  } catch (error) {
    console.error("Bulk order deletion failed", error);
    return Response.json({ error: "Finished orders could not be deleted." }, { status: 500 });
  }
}
