import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { orderItems, orders } from "../../../../../db/schema";
import { verifySession } from "../../../../server/admin-session";

const allowedStatuses = ["new", "accepted", "preparing", "ready", "out_for_delivery", "completed", "cancelled"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession(request);
  if (!session || session.role !== "branch") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({})) as { status?: string; paymentStatus?: string };
  const status = body.status ?? "";
  if (!allowedStatuses.includes(status)) return Response.json({ error: "Invalid order status." }, { status: 400 });
  try {
    const db = await getDb();
    const [updated] = await db.update(orders).set({ status, updatedAt: new Date().toISOString() }).where(and(eq(orders.id, Number(id)), eq(orders.branchId, session.branchId))).returning();
    if (!updated) return Response.json({ error: "Order not found." }, { status: 404 });
    return Response.json({ order: updated });
  } catch {
    return Response.json({ error: "The order could not be updated." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession(request);
  if (!session || session.role !== "owner") return Response.json({ error: "Owner access required." }, { status: 403 });
  const { id } = await params;
  const orderId = Number(id);
  const body = await request.json().catch(() => ({})) as { confirmOrderNumber?: string };
  if (!orderId) return Response.json({ error: "Choose a valid order." }, { status: 400 });
  try {
    const db = await getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
    if (!['completed', 'cancelled', 'out_of_stock'].includes(order.status)) {
      return Response.json({ error: "Only completed or cancelled orders can be deleted." }, { status: 409 });
    }
    if (body.confirmOrderNumber !== order.orderNumber) {
      return Response.json({ error: "Order deletion was not confirmed." }, { status: 400 });
    }
    await db.batch([
      db.delete(orderItems).where(eq(orderItems.orderId, order.id)),
      db.delete(orders).where(eq(orders.id, order.id)),
    ]);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Completed order deletion failed", error);
    return Response.json({ error: "The completed order could not be deleted." }, { status: 500 });
  }
}
