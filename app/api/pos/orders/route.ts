import { orderItems, orders } from "../../../../db/schema";
import { getBranch } from "../../../catalog";
import { getManagedMenuItem } from "../../../server/catalog-store";
import { verifyCashierSession } from "../../../server/cashier-session";
import { randomToken, receiptTokenHash } from "../../../server/security";
import { branchCanFulfil, deductTrackedProducts, type RequestedProduct } from "../../../server/product-inventory";

type Payload = { paymentMethod?: string; customerName?: string; notes?: string; lines?: Array<{ itemId?: string; variantId?: string; choice?: string; quantity?: number }> };
const clean = (value: unknown, max = 100) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  const session = await verifyCashierSession(request);
  if (!session) return Response.json({ error: "Cashier sign-in required." }, { status: 401 });
  const payload = await request.json().catch(() => ({})) as Payload;
  const branch = getBranch(session.employee.branchId);
  if (!branch || !Array.isArray(payload.lines) || payload.lines.length < 1 || payload.lines.length > 80) return Response.json({ error: "The counter order is empty or invalid." }, { status: 400 });
  const paymentMethod = payload.paymentMethod === "card" ? "card" : "cash";
  const validated = (await Promise.all(payload.lines.map(async (line) => {
    const item = await getManagedMenuItem(branch.cityId, clean(line.itemId));
    const variant = item?.variants.find((entry) => entry.id === clean(line.variantId));
    const quantity = Math.floor(Number(line.quantity));
    const choice = clean(line.choice, 80);
    if (!item || !variant || quantity < 1 || quantity > 30 || (choice && item.choices && !item.choices.includes(choice))) return null;
    return { item, variant, choice, quantity, lineTotal: variant.price * quantity };
  }))).filter((line): line is NonNullable<typeof line> => line !== null);
  if (validated.length !== payload.lines.length) return Response.json({ error: "One or more menu selections are invalid." }, { status: 400 });
  const subtotal = validated.reduce((sum, line) => sum + line.lineTotal, 0);
  const requestedMap = new Map<string, RequestedProduct>();
  for (const line of validated) {
    const existing = requestedMap.get(line.item.id);
    requestedMap.set(line.item.id, { productId: line.item.id, productName: line.item.name, quantity: (existing?.quantity ?? 0) + line.quantity });
  }
  const requestedProducts = [...requestedMap.values()];
  const orderNumber = `PP-${branch.id.slice(0, 3).toUpperCase()}-POS-${Date.now().toString().slice(-6)}-${crypto.randomUUID().slice(0, 3).toUpperCase()}`;
  const receiptToken = randomToken();
  try {
    if (!await branchCanFulfil(session.db, branch.id, requestedProducts)) return Response.json({ error: "One or more products are out of stock at this branch. Update inventory before selling them." }, { status: 409 });
    const [created] = await session.db.insert(orders).values({
      orderNumber, branchId: branch.id, originalBranchId: branch.id, branchName: branch.name, city: branch.city,
      customerName: clean(payload.customerName, 80) || "Walk-in guest", phone: "Counter sale", address: "In-store counter",
      latitude: branch.latitude, longitude: branch.longitude, distanceKm: 0, fulfilment: "onsite",
      subtotal, deliveryFee: 0, total: subtotal, paymentMethod, paymentStatus: "paid", status: "completed",
      notes: clean(payload.notes, 300), source: "pos", cashierEmployeeId: session.employee.id,
      cashierName: session.employee.name, receiptTokenHash: await receiptTokenHash(receiptToken),
    }).returning({ id: orders.id });
    await session.db.insert(orderItems).values(validated.map((line) => ({ orderId: created.id, itemId: line.item.id, itemName: line.item.name, variantLabel: line.variant.label, choice: line.choice, unitPrice: line.variant.price, quantity: line.quantity, lineTotal: line.lineTotal })));
    await deductTrackedProducts(session.db, branch.id, requestedProducts);
    return Response.json({ orderNumber, receiptUrl: `/receipt/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(receiptToken)}&pos=1` }, { status: 201 });
  } catch {
    return Response.json({ error: "The counter sale could not be saved." }, { status: 500 });
  }
}
