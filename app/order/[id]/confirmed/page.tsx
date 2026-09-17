"use client";

/* eslint-disable @next/next/no-img-element */

import { use, useEffect, useState } from "react";
import { formatPrice } from "../../../catalog";
import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";
import ScrollProgress from "../../../components/ScrollProgress";
import DeliveryStrip from "../../../components/DeliveryStrip";
import { getStoredLanguage, translations, type Language } from "../../../i18n";
import { Check, Clock, Copy, ExternalLink, MessageCircle, Navigation, QrCode, ShieldCheck, Sparkles, Truck } from "lucide-react";

export default function OrderConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawOrderNumber } = use(params);
  const orderNumber = decodeURIComponent(rawOrderNumber);
  const [lang, setLang] = useState<Language>("en");
  const [copied, setCopied] = useState(false);
  const [fawryCode, setFawryCode] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    setLang(getStoredLanguage());
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const fawryParam = url.searchParams.get("fawry");
      const methodParam = url.searchParams.get("method");
      const tokenParam = url.searchParams.get("token");

      if (fawryParam) setFawryCode(fawryParam);
      else if (methodParam === "fawry") setFawryCode("82941038");
      if (methodParam) setPaymentMethod(methodParam);
      if (tokenParam) setToken(tokenParam);
    }
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const waSupportMsg = encodeURIComponent(
    `Hi Puffy Pops! I'm inquiring about my order #${orderNumber}.`
  );

  return (
    <main className="order-confirmed-page">
      <ScrollProgress />
      <DeliveryStrip />
      <SiteHeader />

      <div className="confirmed-shell">
        <div className="confirmed-hero-card">
          <div className="celebration-badge">
            <span className="celebration-icon">🎉</span>
          </div>
          <span className="order-received-kicker">
            {lang === "ar" ? "تم استلام طلبك بنجاح!" : "Order Confirmed & Received!"}
          </span>
          <h1>
            {lang === "ar" ? "فرحتك في طريقها إليك" : "Your box of joy is on its way."}
          </h1>
          <p className="order-number-display">
            <span>{lang === "ar" ? "رقم الطلب:" : "Order Number:"}</span>
            <strong>{orderNumber}</strong>
            <button
              type="button"
              className="copy-btn"
              onClick={() => copyToClipboard(orderNumber)}
              title="Copy Order Number"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </p>

          <div className="confirmed-eta-card">
            <Clock size={20} className="eta-icon" />
            <div>
              <strong>{lang === "ar" ? "الوقت المتوقع للوصول: ٣٠ - ٤٥ دقيقة" : "Estimated Arrival: 30–45 minutes"}</strong>
              <p>
                {lang === "ar"
                  ? "يتم إعداد الدفعات طازجة كل ٢٠ دقيقة وتوصيلها بالدبوس المحدد."
                  : "Baked fresh and dispatched with your dedicated courier."}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Payment Next-Step Instructions */}
        {paymentMethod === "fawry" && (
          <section className="fawry-action-card">
            <div className="fawry-header">
              <span className="fawry-tag">🟡 FawryPay</span>
              <h2>{lang === "ar" ? "كود الدفع في فوري باي" : "FawryPay Reference Code"}</h2>
              <p>{lang === "ar" ? "صالح لمدة ساعتين من الآن" : "Valid for 2 hours at any Fawry retail machine or myFawry"}</p>
            </div>
            <div className="fawry-code-box">
              <span className="code-label">{lang === "ar" ? "رقم مرجع فوري:" : "Reference Number:"}</span>
              <strong className="code-digits">{fawryCode || "82941038"}</strong>
              <button
                type="button"
                className="fawry-copy-btn"
                onClick={() => copyToClipboard(fawryCode || "82941038")}
              >
                {copied ? "تم النسخ ✓" : "نسخ الكود"}
              </button>
            </div>
            <ol className="fawry-steps-list">
              <li>{lang === "ar" ? "توجه لأقرب كشك، سوبرماركت، أو صيدلية بها ماكينة فوري." : "Visit any supermarket, kiosk or pharmacy with a Fawry machine."}</li>
              <li>{lang === "ar" ? "اختر خدمة «مدفوعات فوري باي» وأدخل كود المرجع الموضح أعلاه." : "Select 'FawryPay Payments' and enter the 8-digit code."}</li>
              <li>{lang === "ar" ? "ادفع المبلغ نقداً، وسيبدأ الفرع في تحضير طلبك فوراً!" : "Pay cash, keep the receipt, and your box will begin baking!"}</li>
            </ol>
          </section>
        )}

        {paymentMethod === "instapay" && (
          <section className="instapay-action-card">
            <div className="instapay-header">
              <span className="instapay-tag">⚡ InstaPay IPN</span>
              <h2>{lang === "ar" ? "التحويل اللحظي عبر إنستاباي" : "Complete Your InstaPay Transfer"}</h2>
              <p>{lang === "ar" ? "شبكة المدفوعات اللحظية - البنك المركزي المصري" : "Central Bank of Egypt Instant Payment Network"}</p>
            </div>
            <div className="instapay-ipa-card">
              <div>
                <span>{lang === "ar" ? "عنوان الدفع اللحظي (IPA):" : "InstaPay Address (IPA):"}</span>
                <code>puffypops@instapay</code>
              </div>
              <button
                type="button"
                className="instapay-copy-btn"
                onClick={() => copyToClipboard("puffypops@instapay")}
              >
                {copied ? "تم النسخ ✓" : "نسخ العنوان"}
              </button>
            </div>
            <div className="instapay-qr-section">
              <div className="qr-placeholder">
                <QrCode size={120} />
                <small>puffypops@instapay</small>
              </div>
              <div className="qr-steps">
                <p><strong>١.</strong> {lang === "ar" ? "افتح تطبيق InstaPay على هاتفك." : "Open your InstaPay app."}</p>
                <p><strong>٢.</strong> {lang === "ar" ? "اختر «تحويل أموال» إلى حساب / عنوان IPA." : "Choose 'Send Money' to Payment Address (IPA)."}</p>
                <p><strong>٣.</strong> {lang === "ar" ? `أدخل puffypops@instapay واكتب رقم الطلب (${orderNumber}) في خانة الملاحظات.` : `Enter puffypops@instapay with order #${orderNumber} in notes.`}</p>
              </div>
            </div>
          </section>
        )}

        {paymentMethod === "cash" && (
          <section className="cash-reminder-card">
            <span className="cash-icon">💵</span>
            <div>
              <h3>{lang === "ar" ? "الدفع نقداً عند الاستلام" : "Cash on Delivery"}</h3>
              <p>
                {lang === "ar"
                  ? "يرجى تجهيز المبلغ المطلوب للمندوب عند وصوله بالجنيه المصري. شكراً لتعاونك!"
                  : "Please have the required amount in Egyptian Pounds ready for the courier. Exact change is appreciated!"}
              </p>
            </div>
          </section>
        )}

        {/* Action Buttons */}
        <div className="confirmed-action-row">
          <a href="/track-order" className="track-order-btn">
            <Truck size={18} />
            <span>{lang === "ar" ? "تتبع حالة الطلب خطوة بخطوة" : "Track Order Live"}</span>
            <span>→</span>
          </a>

          <a
            href={`https://wa.me/201002018510?text=${waSupportMsg}`}
            target="_blank"
            rel="noreferrer"
            className="whatsapp-support-btn"
          >
            <MessageCircle size={18} />
            <span>{lang === "ar" ? "تواصل مع الفرع عبر واتساب" : "WhatsApp Branch Support"} ↗</span>
          </a>

          <a
            href={`/receipt/${encodeURIComponent(orderNumber)}${token ? `?token=${encodeURIComponent(token)}` : ""}`}
            className="official-receipt-btn"
          >
            <ExternalLink size={16} />
            <span>{lang === "ar" ? "عرض وطباعة الفاتورة الرسمية" : "View Official Receipt"}</span>
          </a>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
