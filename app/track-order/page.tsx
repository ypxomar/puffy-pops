"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatPrice } from "../catalog";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

type TrackedOrder = {
  orderNumber: string; branchName: string; city: string; fulfilment: string; total: number; deliveryFee: number;
  paymentMethod: string; paymentStatus: string; status: string; createdAt: string; updatedAt: string;
  items: Array<{ itemName: string; variantLabel: string; choice: string; quantity: number; lineTotal: number }>;
};

const labels: Record<string, string> = {
  awaiting_stock: "Checking nearby stock", out_of_stock: "Out of stock",
  new: "Order received", accepted: "Accepted", preparing: "Preparing", ready: "Ready for pickup",
  out_for_delivery: "Out for delivery", completed: "Completed", cancelled: "Cancelled",
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("puffy_last_order") ?? "null") as { orderNumber?: string; phone?: string } | null;
      // Restore the customer's most recent order after browser hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved?.orderNumber) setOrderNumber(saved.orderNumber);
      if (saved?.phone) setPhone(saved.phone);
    } catch { /* Ignore damaged device-local history. */ }
  }, []);

  const steps = useMemo(() => order?.fulfilment === "pickup"
    ? ["awaiting_stock", "new", "accepted", "preparing", "ready", "completed"]
    : ["awaiting_stock", "new", "accepted", "preparing", "out_for_delivery", "completed"], [order?.fulfilment]);
  const activeIndex = order ? steps.indexOf(order.status) : -1;

  const track = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(""); setOrder(null);
    try {
      const response = await fetch("/api/track-order", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const data = await response.json() as { order?: TrackedOrder; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error ?? "Order not found.");
      setOrder(data.order);
      window.localStorage.setItem("puffy_last_order", JSON.stringify({ orderNumber: data.order.orderNumber, phone }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Order not found."); }
    finally { setBusy(false); }
  };

  const cancelOrder = async () => {
    if (!order || !window.confirm(`Cancel order ${order.orderNumber}? This cannot be undone.`)) return;
    setCancelling(true); setError("");
    try {
      const response = await fetch("/api/track-order", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber: order.orderNumber, phone, confirm: true }),
      });
      const data = await response.json() as { order?: { status: string; updatedAt: string }; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error ?? "The order could not be cancelled.");
      setOrder({ ...order, status: data.order.status, updatedAt: data.order.updatedAt });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The order could not be cancelled."); }
    finally { setCancelling(false); }
  };

  return <main><SiteHeader /><section className="tracking-hero"><p className="eyebrow">Where is my joy?</p><h1>Track your <em>order.</em></h1><p>Use the order number from your receipt and the same phone number you entered at checkout.</p><form onSubmit={track}><label><span>Order number</span><input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="PP-KAF-1234567-ABC" autoCapitalize="characters" required /></label><label><span>Checkout phone number</span><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" required /></label><button type="submit" disabled={busy}>{busy ? "Finding order…" : "Track order"}</button></form>{error && <p className="tracking-error" role="alert">{error}</p>}</section>{order && <section className="tracking-result" aria-live="polite"><div className="tracking-summary"><div><span>{order.branchName} · {order.city}</span><h2>{labels[order.status] ?? order.status.replaceAll("_", " ")}</h2><p>{order.orderNumber}</p></div><strong>{formatPrice(order.total)}</strong></div>{order.status === "cancelled" ? <div className="tracking-cancelled"><strong>This order was cancelled.</strong><span>Call the branch if you need more information.</span></div> : order.status === "out_of_stock" ? <div className="tracking-cancelled"><strong>The nearby branches confirmed this item is out of stock.</strong><span>You were not charged. Check the menu again after the branches restock it.</span></div> : <div className="tracking-steps">{steps.map((step, index) => <div className={index <= activeIndex ? "done" : ""} key={step}><i>{index < activeIndex ? "✓" : index + 1}</i><span>{labels[step]}</span></div>)}</div>}<div className="tracking-details"><article><h3>Order details</h3>{order.items.map((item, index) => <div key={`${item.itemName}-${index}`}><p><strong>{item.quantity}× {item.itemName}</strong><span>{item.variantLabel}{item.choice ? ` · ${item.choice}` : ""}</span></p><strong>{formatPrice(item.lineTotal)}</strong></div>)}</article><article><h3>Delivery & payment</h3><div><span>Order type</span><strong>{order.fulfilment === "pickup" ? "Branch pickup" : "Delivery"}</strong></div><div><span>Payment</span><strong>{order.paymentMethod === "card" ? "Card" : "Cash"} · {order.paymentStatus.replaceAll("_", " ")}</strong></div><div><span>Placed</span><strong>{new Date(order.createdAt).toLocaleString("en-EG", { dateStyle: "medium", timeStyle: "short" })}</strong></div><a href="tel:+201002018510">Need help? Call Puffy Pops</a>{["awaiting_stock", "new", "accepted"].includes(order.status) && <div className="tracking-cancel-action"><strong>Need to change your plans?</strong><p>You can cancel before the branch starts preparing your order.</p><button type="button" disabled={cancelling} onClick={cancelOrder}>{cancelling ? "Cancelling…" : "Cancel this order"}</button></div>}</article></div></section>}<SiteFooter /></main>;
}
