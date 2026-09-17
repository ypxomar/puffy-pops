import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { orderItems, orders } from "../../../../db/schema";
import { verifySession } from "../../../server/admin-session";
import { verifyCashierSession } from "../../../server/cashier-session";
import { constantTimeEqual, receiptTokenHash } from "../../../server/security";

export async function GET(request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  try {
    const db = await getDb();
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    if (!order) return Response.json({ error: "Receipt not found." }, { status: 404 });
    const token = new URL(request.url).searchParams.get("token") ?? "";
    const tokenAllowed = Boolean(token && order.receiptTokenHash && constantTimeEqual(order.receiptTokenHash, await receiptTokenHash(token)));
    const admin = tokenAllowed ? null : await verifySession(request);
    const adminAllowed = admin?.role === "owner" || (admin?.role === "branch" && admin.branchId === order.branchId);
    const cashier = tokenAllowed || adminAllowed ? null : await verifyCashierSession(request);
    const cashierAllowed = cashier?.employee.branchId === order.branchId;
    if (!tokenAllowed && !adminAllowed && !cashierAllowed) return Response.json({ error: "Receipt access denied." }, { status: 403 });
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    return Response.json({ order: { ...order, receiptTokenHash: undefined, items } });
  } catch {
    return Response.json({ error: "Receipt could not be loaded." }, { status: 500 });
  }
}
