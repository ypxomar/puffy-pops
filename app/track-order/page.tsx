"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatPrice } from "../catalog";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import ScrollProgress from "../components/ScrollProgress";
import DeliveryStrip from "../components/DeliveryStrip";
import PersistentOrderBar from "../components/PersistentOrderBar";
import BranchModal from "../components/BranchModal";
import { getStoredLanguage, translations, type Language } from "../i18n";
import { Check, Clock, MessageCircle, Phone, Sparkles, Truck, Utensils } from "lucide-react";

type TrackedOrder = {
  orderNumber: string;
  branchName: string;
  city: string;
  fulfilment: string;
  total: number;
  deliveryFee: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{ itemName: string; variantLabel: string; choice: string; quantity: number; lineTotal: number }>;
};

const labelsEn: Record<string, string> = {
  awaiting_stock: "Checking nearby stock",
  out_of_stock: "Out of stock",
  new: "Order received",
  accepted: "Accepted",
  preparing: "Preparing fresh",
  ready: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Delivered & Joyful",
  cancelled: "Cancelled",
};

const labelsAr: Record<string, string> = {
  awaiting_stock: "التحقق من مخزون الفرع",
  out_of_stock: "نفد من المخزون",
  new: "تم استلام الطلب",
  accepted: "تم قبول الطلب",
  preparing: "جاري التحضير طازة",
  ready: "جاهز للاستلام",
  out_for_delivery: "خرج مع المندوب",
  completed: "تم التسليم بنجاح",
  cancelled: "تم إلغاء الطلب",
};

export default function TrackOrderPage() {
  const [lang, setLang] = useState<Language>("en");
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);

  useEffect(() => {
    setLang(getStoredLanguage());
    try {
      const saved = JSON.parse(window.localStorage.getItem("puffy_last_order") ?? "null") as {
        orderNumber?: string;
        phone?: string;
      } | null;
      if (saved?.orderNumber) setOrderNumber(saved.orderNumber);
      if (saved?.phone) setPhone(saved.phone);
    } catch {
      /* Storage fallback */
    }

    const handleLang = (e: Event) => {
      const custom = e as CustomEvent<{ lang: Language }>;
      if (custom.detail?.lang) setLang(custom.detail.lang);
    };
    window.addEventListener("puffy-language-change", handleLang);
    return () => window.removeEventListener("puffy-language-change", handleLang);
  }, []);

  const steps = useMemo(
    () =>
      order?.fulfilment === "pickup"
        ? ["awaiting_stock", "new", "accepted", "preparing", "ready", "completed"]
        : ["awaiting_stock", "new", "accepted", "preparing", "out_for_delivery", "completed"],
    [order?.fulfilment]
  );
  const activeIndex = order ? steps.indexOf(order.status) : -1;

  const labels = lang === "ar" ? labelsAr : labelsEn;

  const track = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setOrder(null);
    try {
      const response = await fetch("/api/track-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const data = (await response.json()) as { order?: TrackedOrder; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error ?? "Order not found.");
      setOrder(data.order);
      window.localStorage.setItem("puffy_last_order", JSON.stringify({ orderNumber: data.order.orderNumber, phone }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Order not found.");
    } finally {
      setBusy(false);
    }
  };

  const cancelOrder = async () => {
    if (!order || !window.confirm(`Cancel order ${order.orderNumber}? This cannot be undone.`)) return;
    setCancelling(true);
    setError("");
    try {
      const response = await fetch("/api/track-order", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber: order.orderNumber, phone, confirm: true }),
      });
      const data = (await response.json()) as { order?: { status: string; updatedAt: string }; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error ?? "The order could not be cancelled.");
      setOrder({ ...order, status: data.order.status, updatedAt: data.order.updatedAt });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The order could not be cancelled.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <main className="tracking-page-view">
      <ScrollProgress />
      <DeliveryStrip onOpenBranchModal={() => setBranchModalOpen(true)} />
      <SiteHeader />

      <section className="tracking-hero">
        <p className="eyebrow">{lang === "ar" ? "أين وصل طلبي؟" : "Where is my joy?"}</p>
        <h1>
          {lang === "ar" ? "تتبع حالة" : "Track your"} <em>{lang === "ar" ? "طلبك." : "order."}</em>
        </h1>
        <p>
          {lang === "ar"
            ? "أدخل رقم الطلب من الفاتورة ورقم الهاتف المصري المسجل عند الدفع."
            : "Use the order number from your receipt and the same phone number you entered at checkout."}
        </p>

        <form onSubmit={track} className="tracking-input-form">
          <label>
            <span>{lang === "ar" ? "رقم الطلب" : "Order number"}</span>
            <input
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="PP-KAF-1234567-ABC"
              autoCapitalize="characters"
              required
            />
          </label>
          <label>
            <span>{lang === "ar" ? "رقم الهاتف عند الطلب" : "Checkout phone number"}</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="01XXXXXXXXX"
              inputMode="tel"
              required
            />
          </label>
          <button type="submit" disabled={busy} className="track-submit-btn">
            {busy ? (lang === "ar" ? "جاري البحث…" : "Finding order…") : (lang === "ar" ? "تتبع الطلب" : "Track order")}
          </button>
        </form>

        {error && (
          <p className="tracking-error" role="alert">
            {error}
          </p>
        )}
      </section>

      {order && (
        <section className="tracking-result" aria-live="polite">
          <div className="tracking-summary">
            <div>
              <span>
                {order.branchName} · {order.city}
              </span>
              <h2>{labels[order.status] ?? order.status.replaceAll("_", " ")}</h2>
              <p>{order.orderNumber}</p>
            </div>
            <strong>{formatPrice(order.total)}</strong>
          </div>

          {order.status === "cancelled" ? (
            <div className="tracking-cancelled">
              <strong>{lang === "ar" ? "تم إلغاء هذا الطلب." : "This order was cancelled."}</strong>
              <span>
                {lang === "ar"
                  ? "يرجى الاتصال بالفرع إذا كنت بحاجة لمزيد من المعلومات."
                  : "Call the branch if you need more information."}
              </span>
            </div>
          ) : order.status === "out_of_stock" ? (
            <div className="tracking-cancelled">
              <strong>
                {lang === "ar"
                  ? "أكدت الفروع المجاورة أن هذا الصنف غير متوفر حالياً."
                  : "The nearby branches confirmed this item is out of stock."}
              </strong>
              <span>
                {lang === "ar"
                  ? "لم يتم خصم أي مبالغ. يرجى تصفح المنيو مجدداً."
                  : "You were not charged. Check the menu again after the branches restock it."}
              </span>
            </div>
          ) : (
            <div className="tracking-steps">
              {steps.map((step, index) => (
                <div className={index <= activeIndex ? "done" : ""} key={step}>
                  <i>{index < activeIndex ? "✓" : index + 1}</i>
                  <span>{labels[step]}</span>
                </div>
              ))}
            </div>
          )}

          <div className="tracking-details">
            <article>
              <h3>{lang === "ar" ? "تفاصيل الطلب" : "Order details"}</h3>
              {order.items.map((item, index) => (
                <div key={`${item.itemName}-${index}`}>
                  <p>
                    <strong>
                      {item.quantity}× {item.itemName}
                    </strong>
                    <span>
                      {item.variantLabel}
                      {item.choice ? ` · ${item.choice}` : ""}
                    </span>
                  </p>
                  <strong>{formatPrice(item.lineTotal)}</strong>
                </div>
              ))}
            </article>

            <article>
              <h3>{lang === "ar" ? "التوصيل والدفع" : "Delivery & payment"}</h3>
              <div>
                <span>{lang === "ar" ? "نوع الطلب" : "Order type"}</span>
                <strong>
                  {order.fulfilment === "pickup"
                    ? lang === "ar"
                      ? "استلام من الفرع"
                      : "Branch pickup"
                    : lang === "ar"
                    ? "توصيل للعنوان"
                    : "Delivery"}
                </strong>
              </div>
              <div>
                <span>{lang === "ar" ? "طريقة الدفع" : "Payment"}</span>
                <strong>
                  {order.paymentMethod === "card"
                    ? "Card / Meeza"
                    : order.paymentMethod === "fawry"
                    ? "FawryPay"
                    : order.paymentMethod === "instapay"
                    ? "InstaPay"
                    : "Cash"}{" "}
                  · {order.paymentStatus.replaceAll("_", " ")}
                </strong>
              </div>
              <div>
                <span>{lang === "ar" ? "وقت الطلب" : "Placed"}</span>
                <strong>
                  {new Date(order.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-EG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </strong>
              </div>

              <div className="track-help-links">
                <a href="tel:+201002018510" className="call-btn">
                  <Phone size={14} />
                  <span>{lang === "ar" ? "اتصل بـ بوفي بوبس" : "Need help? Call Puffy Pops"}</span>
                </a>
                <a
                  href={`https://wa.me/201002018510?text=${encodeURIComponent(`Hi Puffy Pops! Tracking order #${order.orderNumber}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="wa-btn"
                >
                  <MessageCircle size={14} />
                  <span>{lang === "ar" ? "محادثة واتساب مباشرة" : "Chat on WhatsApp"} ↗</span>
                </a>
              </div>

              {["awaiting_stock", "new", "accepted"].includes(order.status) && (
                <div className="tracking-cancel-action">
                  <strong>{lang === "ar" ? "هل ترغب في تغيير خطتك؟" : "Need to change your plans?"}</strong>
                  <p>
                    {lang === "ar"
                      ? "يمكنك إلغاء الطلب قبل أن يبدأ الفرع في إعداده."
                      : "You can cancel before the branch starts preparing your order."}
                  </p>
                  <button type="button" disabled={cancelling} onClick={cancelOrder}>
                    {cancelling ? (lang === "ar" ? "جاري الإلغاء…" : "Cancelling…") : (lang === "ar" ? "إلغاء هذا الطلب" : "Cancel this order")}
                  </button>
                </div>
              )}
            </article>
          </div>
        </section>
      )}

      <SiteFooter />
      <PersistentOrderBar onOpenCart={() => { window.location.assign("/cart"); }} />
      <BranchModal isOpen={branchModalOpen} onClose={() => setBranchModalOpen(false)} />
    </main>
  );
}
