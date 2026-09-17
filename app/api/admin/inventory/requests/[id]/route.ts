import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { orders, stockRequests } from "../../../../../../db/schema";
import { getBranch } from "../../../../../catalog";
import { branchesByDistance } from "../../../../../location";
import { verifySession } from "../../../../../server/admin-session";
import { deliveryQuote } from "../../../../../server/delivery";
import { branchCanFulfil, deductTrackedProducts, markProductsUnavailable, type RequestedProduct } from "../../../../../server/product-inventory";

function requestedProducts(value: string): RequestedProduct[] {
  try {
    const parsed = JSON.parse(value) as RequestedProduct[];
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry.productId === "string" && Number(entry.quantity) > 0) : [];
  } catch {
    return [];
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession(request);
  if (!session || session.role !== "branch") return Response.json({ error: "Branch access required." }, { status: 403 });
  const { id } = await params;
  const requestId = Math.floor(Number(id));
  const body = await request.json().catch(() => ({})) as { decision?: unknown; note?: unknown };
  const decision = body.decision === "accept" ? "accept" : body.decision === "decline" ? "decline" : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 180) : "";
  if (!requestId || !decision) return Response.json({ error: "Choose Accept or Decline." }, { status: 400 });

  try {
    const db = await getDb();
    const [transfer] = await db.select().from(stockRequests).where(and(
      eq(stockRequests.id, requestId),
      eq(stockRequests.targetBranchId, session.branchId),
      eq(stockRequests.status, "pending"),
    )).limit(1);
    if (!transfer) return Response.json({ error: "This stock request is no longer pending." }, { status: 409 });
    const [order] = await db.select().from(orders).where(eq(orders.id, transfer.orderId)).limit(1);
    if (!order || order.status !== "awaiting_stock") return Response.json({ error: "The connected order is no longer waiting for stock." }, { status: 409 });
    const products = requestedProducts(transfer.requestedProductsJson);
    const targetBranch = getBranch(session.branchId);
    if (!targetBranch || !products.length) return Response.json({ error: "The stock request is incomplete." }, { status: 409 });
    const now = new Date().toISOString();

    if (decision === "accept") {
      if (!await branchCanFulfil(db, targetBranch.id, products)) {
        return Response.json({ error: "Update these products to available with enough stock before accepting." }, { status: 409 });
      }
      const quote = order.fulfilment === "pickup"
        ? { distanceKm: 0, fee: 0 }
        : await deliveryQuote({ latitude: order.latitude, longitude: order.longitude }, targetBranch);
      if (!quote || quote.fee == null) return Response.json({ error: "This customer is outside this branch's delivery radius." }, { status: 409 });
      await db.update(stockRequests).set({ status: "accepted", responseNote: note, resolvedAt: now }).where(eq(stockRequests.id, transfer.id));
      await db.update(orders).set({
        branchId: targetBranch.id,
        branchName: targetBranch.name,
        city: targetBranch.city,
        status: "new",
        distanceKm: Number(quote.distanceKm.toFixed(2)),
        deliveryFee: quote.fee,
        total: order.subtotal + quote.fee,
        updatedAt: now,
      }).where(eq(orders.id, order.id));
      await deductTrackedProducts(db, targetBranch.id, products);
      return Response.json({ ok: true, status: "accepted", orderBranch: targetBranch });
    }

    await db.update(stockRequests).set({ status: "declined", responseNote: note, resolvedAt: now }).where(eq(stockRequests.id, transfer.id));
    const missingProducts = requestedProducts(transfer.missingProductsJson);
    await markProductsUnavailable(db, targetBranch.id, (missingProducts.length ? missingProducts : products).map((entry) => entry.productId));

    const originalBranch = getBranch(order.originalBranchId || transfer.sourceBranchId);
    if (!originalBranch) return Response.json({ error: "The original order branch is missing." }, { status: 409 });
    const candidates = branchesByDistance({ latitude: order.latitude, longitude: order.longitude }, originalBranch.cityId)
      .map((entry) => entry.branch)
      .filter((branch) => branch.id !== originalBranch.id);
    const currentIndex = candidates.findIndex((branch) => branch.id === targetBranch.id);
    const nextBranch = candidates[currentIndex + 1];
    if (nextBranch) {
      const [next] = await db.insert(stockRequests).values({
        orderId: order.id,
        orderNumber: order.orderNumber,
        sourceBranchId: originalBranch.id,
        targetBranchId: nextBranch.id,
        candidateRank: transfer.candidateRank + 1,
        requestedProductsJson: transfer.requestedProductsJson,
        missingProductsJson: transfer.missingProductsJson,
        status: "pending",
        createdAt: now,
      }).returning();
      return Response.json({ ok: true, status: "forwarded", nextBranch, transferRequest: next });
    }

    await db.update(orders).set({ status: "out_of_stock", paymentStatus: "not_charged", updatedAt: now }).where(eq(orders.id, order.id));
    return Response.json({ ok: true, status: "out_of_stock" });
  } catch (error) {
    console.error("Stock request response failed", error);
    return Response.json({ error: "The stock request response could not be saved." }, { status: 500 });
  }
}
