import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { orderItems, orders, stockRequests } from "../../../db/schema";
import { constantTimeEqual } from "../../server/security";

const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const normalizePhone = (value: string) => value.replace(/\D/g, "").replace(/^00/, "");

export async function POST(request: Request) {
  let payload: { orderNumber?: unknown; phone?: unknown };
  try { payload = await request.json() as { orderNumber?: unknown; phone?: unknown }; }
  catch { return Response.json({ error: "Enter your order number and phone number." }, { status: 400 }); }

  const orderNumber = clean(payload.orderNumber, 80).toUpperCase();
  const phone = normalizePhone(clean(payload.phone, 30));
  if (orderNumber.length < 8 || phone.length < 8) {
    return Response.json({ error: "Enter your full order number and the phone number used at checkout." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    const storedPhone = normalizePhone(order?.phone ?? "");
    if (!order || !constantTimeEqual(storedPhone, phone) || order.source !== "online") {
      return Response.json({ error: "We could not match that order number and phone number." }, { status: 404 });
    }
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    return Response.json({
      order: {
        orderNumber: order.orderNumber,
        branchName: order.branchName,
        city: order.city,
        fulfilment: order.fulfilment,
        total: order.total,
        deliveryFee: order.deliveryFee,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: items.map(({ itemName, variantLabel, choice, quantity, lineTotal }) => ({ itemName, variantLabel, choice, quantity, lineTotal })),
      },
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Tracking is temporarily unavailable. Please try again." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let payload: { orderNumber?: unknown; phone?: unknown; confirm?: unknown };
  try { payload = await request.json() as { orderNumber?: unknown; phone?: unknown; confirm?: unknown }; }
  catch { return Response.json({ error: "Enter your order number and phone number." }, { status: 400 }); }

  const orderNumber = clean(payload.orderNumber, 80).toUpperCase();
  const phone = normalizePhone(clean(payload.phone, 30));
  if (payload.confirm !== true || orderNumber.length < 8 || phone.length < 8) {
    return Response.json({ error: "Confirm the cancellation using your full order number and checkout phone." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    const storedPhone = normalizePhone(order?.phone ?? "");
    if (!order || !constantTimeEqual(storedPhone, phone) || order.source !== "online") {
      return Response.json({ error: "We could not match that order number and phone number." }, { status: 404 });
    }
    if (!["awaiting_stock", "new", "accepted"].includes(order.status)) {
      const message = order.status === "cancelled"
        ? "This order is already cancelled."
        : "This order can no longer be cancelled online because the branch has started preparing it.";
      return Response.json({ error: message }, { status: 409 });
    }

    const updatedAt = new Date().toISOString();
    const [updated] = await db.update(orders)
      .set({ status: "cancelled", updatedAt })
      .where(and(eq(orders.id, order.id), inArray(orders.status, ["awaiting_stock", "new", "accepted"])))
      .returning({ status: orders.status, updatedAt: orders.updatedAt });
    if (!updated) {
      return Response.json({ error: "The branch has already started this order, so it can no longer be cancelled online." }, { status: 409 });
    }
    await db.update(stockRequests).set({ status: "cancelled", resolvedAt: updatedAt }).where(and(eq(stockRequests.orderId, order.id), eq(stockRequests.status, "pending")));
    return Response.json({ ok: true, order: updated }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "The order could not be cancelled. Please try again or call the branch." }, { status: 500 });
  }
}
