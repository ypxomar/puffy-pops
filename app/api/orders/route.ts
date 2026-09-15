import { getDb } from "../../../db";
import { orderItems, orders, stockRequests } from "../../../db/schema";
import { branches, getBranch } from "../../catalog";
import { branchesByDistance, normalizeEgyptCoordinates } from "../../location";
import { getManagedMenuItem } from "../../server/catalog-store";
import { deliveryQuotes } from "../../server/delivery";
import { cardPaymentConfigured, createCardCheckout } from "../../server/payment";
import { branchCanFulfil, deductTrackedProducts, missingProductsForBranch, type RequestedProduct } from "../../server/product-inventory";
import { randomToken, receiptTokenHash } from "../../server/security";

type OrderPayload = {
  branchId?: string;
  fulfilment?: "delivery" | "pickup";
  paymentMethod?: "cash" | "card";
  customer?: { name?: unknown; phone?: unknown; address?: unknown; notes?: unknown };
  coordinates?: { latitude?: unknown; longitude?: unknown };
  lines?: Array<{ itemId?: unknown; variantId?: unknown; choice?: unknown; quantity?: unknown }>;
};

const text = (value: unknown, max = 250) => typeof value === "string" ? value.trim().slice(0, max) : "";

function databaseError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown database error";
  if (message.startsWith("Google Maps")) return message;
  return message.includes("no such table") ? "The order database has not been migrated yet. Deploy the newest website build and try again." : "The order could not be saved. Please try again.";
}

export async function POST(request: Request) {
  let payload: OrderPayload;
  try { payload = await request.json() as OrderPayload; }
  catch { return Response.json({ error: "Invalid order." }, { status: 400 }); }

  const selectedBranch = getBranch(payload.branchId);
  const fulfilment = payload.fulfilment === "pickup" ? "pickup" : "delivery";
  const paymentMethod = payload.paymentMethod === "card" ? "card" : "cash";
  const name = text(payload.customer?.name, 80);
  const phone = text(payload.customer?.phone, 30);
  const address = text(payload.customer?.address, 300);
  const notes = text(payload.customer?.notes, 500);
  const coordinates = normalizeEgyptCoordinates({
    latitude: Number(payload.coordinates?.latitude),
    longitude: Number(payload.coordinates?.longitude),
  });

  if (!selectedBranch || !name || !phone || !address || !coordinates) return Response.json({ error: "Complete the branch, contact and valid Egypt location details." }, { status: 400 });
  if (!Array.isArray(payload.lines) || payload.lines.length < 1 || payload.lines.length > 60) return Response.json({ error: "Your order is empty or too large." }, { status: 400 });
  if (paymentMethod === "card" && !cardPaymentConfigured()) return Response.json({ error: "Card payments are not connected yet. Choose cash on delivery for now." }, { status: 503 });

  const validated = (await Promise.all(payload.lines.map(async (line) => {
    const itemId = text(line.itemId, 100);
    const variantId = text(line.variantId, 100);
    const quantity = Math.floor(Number(line.quantity));
    const item = await getManagedMenuItem(selectedBranch.cityId, itemId);
    const variant = item?.variants.find((entry) => entry.id === variantId);
    const choice = text(line.choice, 80);
    if (!item || !variant || quantity < 1 || quantity > 20 || (choice && item.choices && !item.choices.includes(choice))) return null;
    return { item, variant, quantity, choice, lineTotal: variant.price * quantity };
  }))).filter((line): line is NonNullable<typeof line> => line !== null);
  if (validated.length !== payload.lines.length) return Response.json({ error: "One or more menu items are no longer valid for this branch." }, { status: 400 });

  const requestedMap = new Map<string, RequestedProduct>();
  for (const line of validated) {
    const existing = requestedMap.get(line.item.id);
    requestedMap.set(line.item.id, {
      productId: line.item.id,
      productName: line.item.name,
      quantity: (existing?.quantity ?? 0) + line.quantity,
    });
  }
  const requestedProducts = [...requestedMap.values()];

  try {
    const db = await getDb();
    const cityBranches = branches.filter((branch) => branch.cityId === selectedBranch.cityId);
    const candidates = fulfilment === "pickup"
      ? branchesByDistance(coordinates, selectedBranch.cityId).map((entry) => ({ branch: entry.branch, distanceKm: 0, fee: 0 }))
      : await deliveryQuotes(coordinates, cityBranches);
    const sourceCandidate = fulfilment === "pickup"
      ? candidates.find((entry) => entry.branch.id === selectedBranch.id) ?? candidates[0]
      : candidates[0];
    if (!sourceCandidate) return Response.json({ error: "The nearest branch could not be calculated." }, { status: 503 });
    if (sourceCandidate.fee == null) return Response.json({ error: "This location is outside the current delivery radius." }, { status: 422 });

    const orderedCandidates = [sourceCandidate, ...candidates.filter((entry) => entry.branch.id !== sourceCandidate.branch.id)];
    const sourceCanFulfil = await branchCanFulfil(db, sourceCandidate.branch.id, requestedProducts);
    const fulfilmentChecks = await Promise.all(orderedCandidates.map((entry) => branchCanFulfil(db, entry.branch.id, requestedProducts)));
    if (!fulfilmentChecks.some(Boolean)) {
      const names = requestedProducts.map((entry) => entry.productName).join(", ");
      return Response.json({ error: `${names} ${requestedProducts.length === 1 ? "is" : "are"} currently out of stock at every nearby ${selectedBranch.city} branch.` }, { status: 409 });
    }

    const needsTransfer = !sourceCanFulfil;
    const targetCandidate = needsTransfer
      ? orderedCandidates.slice(1).find((entry) => fulfilment === "pickup" || entry.fee != null)
      : undefined;
    if (needsTransfer && !targetCandidate) return Response.json({ error: "No nearby branch can currently take this order." }, { status: 409 });
    if (needsTransfer && paymentMethod === "card") {
      return Response.json({ error: "This order needs stock confirmation from another branch. Choose cash for now so you are not charged before confirmation." }, { status: 409 });
    }

    const assignedQuote = targetCandidate ?? sourceCandidate;
    const fee = fulfilment === "pickup" ? 0 : assignedQuote.fee;
    if (fee == null) return Response.json({ error: "This location is outside the current delivery radius." }, { status: 422 });
    const subtotal = validated.reduce((sum, line) => sum + line.lineTotal, 0);
    const total = subtotal + fee;
    const orderNumber = `PP-${sourceCandidate.branch.id.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-7)}-${crypto.randomUUID().slice(0, 3).toUpperCase()}`;
    const receiptToken = randomToken();
    const now = new Date().toISOString();
    const [created] = await db.insert(orders).values({
      orderNumber,
      branchId: sourceCandidate.branch.id,
      originalBranchId: sourceCandidate.branch.id,
      branchName: sourceCandidate.branch.name,
      city: sourceCandidate.branch.city,
      customerName: name,
      phone,
      address,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      distanceKm: Number(assignedQuote.distanceKm.toFixed(2)),
      fulfilment,
      subtotal,
      deliveryFee: fee,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "cash_due" : "pending",
      status: needsTransfer ? "awaiting_stock" : "new",
      notes,
      source: "online",
      receiptTokenHash: await receiptTokenHash(receiptToken),
      createdAt: now,
      updatedAt: now,
    }).returning({ id: orders.id });
    await db.insert(orderItems).values(validated.map((line) => ({
      orderId: created.id,
      itemId: line.item.id,
      itemName: line.item.name,
      variantLabel: line.variant.label,
      choice: line.choice,
      unitPrice: line.variant.price,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
    })));

    if (needsTransfer && targetCandidate) {
      const missingProducts = await missingProductsForBranch(db, sourceCandidate.branch.id, requestedProducts);
      await db.insert(stockRequests).values({
        orderId: created.id,
        orderNumber,
        sourceBranchId: sourceCandidate.branch.id,
        targetBranchId: targetCandidate.branch.id,
        candidateRank: 1,
        requestedProductsJson: JSON.stringify(requestedProducts),
        missingProductsJson: JSON.stringify(missingProducts),
        status: "pending",
        createdAt: now,
      });
      return Response.json({
        orderNumber,
        receiptToken,
        pendingStock: true,
        message: `${sourceCandidate.branch.name} requested stock confirmation from ${targetCandidate.branch.name}. Track the order for the response.`,
        receiptUrl: `/receipt/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(receiptToken)}`,
      }, { status: 202 });
    }

    await deductTrackedProducts(db, sourceCandidate.branch.id, requestedProducts);
    if (paymentMethod === "card") {
      const payment = await createCardCheckout({ orderNumber, amount: total, customerName: name, phone });
      return Response.json({ orderNumber, receiptToken, redirectUrl: payment.redirectUrl }, { status: 201 });
    }
    return Response.json({ orderNumber, receiptToken, receiptUrl: `/receipt/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(receiptToken)}` }, { status: 201 });
  } catch (error) {
    console.error("Order creation failed", error);
    return Response.json({ error: databaseError(error) }, { status: 500 });
  }
}
