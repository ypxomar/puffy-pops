"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { branches, formatPrice, menus, type Branch, type CityId } from "../catalog";
import { BRANCH_KEY, hydrateCart, readCart, saveCart, type CartLine } from "../cart";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import ScrollProgress from "../components/ScrollProgress";
import DeliveryStrip from "../components/DeliveryStrip";
import BranchModal from "../components/BranchModal";
import PersistentOrderBar from "../components/PersistentOrderBar";
import { getStoredLanguage, translations, type Language } from "../i18n";
import { ArrowLeft, ArrowRight, Check, Heart, Minus, Plus, ShieldCheck, Sparkles, Trash2, Truck } from "lucide-react";

export default function CartPage() {
  const [lang, setLang] = useState<Language>("en");
  const [branchId, setBranchId] = useState("kafr-abdo");
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState("");

  const refreshCart = () => {
    setCart(readCart());
    const saved = window.localStorage.getItem(BRANCH_KEY);
    if (saved && branches.some((b) => b.id === saved)) setBranchId(saved);
  };

  useEffect(() => {
    setLang(getStoredLanguage());
    refreshCart();
    window.addEventListener("puffy-cart-change", refreshCart);
    window.addEventListener("puffy-language-change", () => setLang(getStoredLanguage()));
    return () => {
      window.removeEventListener("puffy-cart-change", refreshCart);
    };
  }, []);

  const branch = branches.find((b) => b.id === branchId) ?? branches[0];
  const cityId: CityId = branch.cityId;
  const items = hydrateCart(cart, cityId, menus[cityId].items);
  const subtotal = items.reduce((sum, line) => sum + line.lineTotal, 0);

  const changeQuantity = (id: string, delta: number) => {
    const next = cart
      .map((l) => (l.id === id ? { ...l, quantity: l.quantity + delta } : l))
      .filter((l) => l.quantity > 0);
    setCart(next);
    saveCart(next);
  };

  const removeItem = (id: string) => {
    const next = cart.filter((l) => l.id !== id);
    setCart(next);
    saveCart(next);
  };

  const clearAll = () => {
    setCart([]);
    saveCart([]);
  };

  // Free delivery threshold: EGP 450
  const freeThreshold = 450;
  const remainingForFree = Math.max(0, freeThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));

  const t = translations[lang];

  return (
    <main className="cart-page-view">
      <ScrollProgress />
      <DeliveryStrip onOpenBranchModal={() => setBranchModalOpen(true)} />
      <SiteHeader />

      <div className="cart-page-container">
        <header className="cart-page-heading">
          <div>
            <p className="eyebrow">{lang === "ar" ? "صندوق السعادة" : "Your Dessert Box"}</p>
            <h1>{lang === "ar" ? "سلة" : "Review your"} <em>{lang === "ar" ? "طلباتك." : "box."}</em></h1>
          </div>
          <div className="cart-heading-branch">
            <button
              type="button"
              className="cart-branch-toggle-btn"
              onClick={() => setBranchModalOpen(true)}
            >
              <span className="dot-green" />
              <span>{lang === "ar" ? `الفرع: ${branch.name} (${branch.city}) ▾` : `Branch: ${branch.name} (${branch.city}) ▾`}</span>
            </button>
            <span className="cart-vat-note">
              {lang === "ar" ? "الأسعار شاملة ضريبة القيمة المضافة" : "VAT included"}
            </span>
          </div>
        </header>

        {items.length === 0 ? (
          <section className="cart-empty-state-view">
            <div className="empty-box-illustration">
              <span className="box-icon">📦</span>
              <span className="sparkle-float">✨</span>
            </div>
            <h2>{t.emptyCartTitle}</h2>
            <p>
              {lang === "ar"
                ? "ابدأ بتنسيق صندوق بوفي بوبس أو تصفح المنيو لاختيار نكهاتك المفضلة."
                : "Explore the menu or build a custom box with warm Belgian chocolate and rich pistachio."}
            </p>
            <div className="empty-state-actions">
              <a href="/build-your-box" className="btn-primary">
                ✨ {t.buildBoxBtn}
              </a>
              <a href="/menu" className="btn-secondary">
                {lang === "ar" ? "تصفح المنيو الكامل" : "Explore Menu"} →
              </a>
            </div>
          </section>
        ) : (
          <div className="cart-page-content-grid">
            {/* Left Column: Items List */}
            <section className="cart-items-table-col">
              {/* Free Delivery Bar */}
              <div className="cart-delivery-threshold-card">
                <div className="threshold-text-row">
                  <span className="truck-icon"><Truck size={18} /></span>
                  {remainingForFree > 0 ? (
                    <p>
                      {lang === "ar" ? (
                        <>أضف ما قيمته <strong>{formatPrice(remainingForFree)}</strong> للحصول على توصيل مجاني!</>
                      ) : (
                        <>Add <strong>{formatPrice(remainingForFree)}</strong> more for free delivery!</>
                      )}
                    </p>
                  ) : (
                    <p className="free-unlocked">
                      🎉 <strong>{lang === "ar" ? "مبروك! مؤهل للتوصيل المجاني بالكامل." : "Congrats! You unlocked free delivery."}</strong>
                    </p>
                  )}
                </div>
                <div className="threshold-progress-bar">
                  <div
                    className="threshold-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="cart-lines-list">
                {items.map((line) => (
                  <article className="cart-line-card" key={line.id}>
                    <div className="cart-line-image">
                      {line.item.image ? (
                        <img src={line.item.image} alt={line.item.name} />
                      ) : (
                        <span>{line.item.category === "puffy-pops" ? "PP" : line.item.name.charAt(0)}</span>
                      )}
                    </div>

                    <div className="cart-line-meta">
                      <div className="line-title-row">
                        <h3>{line.item.name}</h3>
                        <strong className="line-price">{formatPrice(line.lineTotal)}</strong>
                      </div>
                      <p className="line-variant-text">
                        {line.variant.label}
                        {line.choice ? ` · ${line.choice}` : ""}
                      </p>
                      <small className="unit-price">
                        {formatPrice(line.variant.price)} {lang === "ar" ? "للقطعة" : "each"}
                      </small>
                    </div>

                    <div className="cart-line-controls">
                      <div className="line-stepper">
                        <button
                          type="button"
                          onClick={() => changeQuantity(line.id, -1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={15} />
                        </button>
                        <span>{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(line.id, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="line-remove-btn"
                        onClick={() => removeItem(line.id)}
                        aria-label={`Remove ${line.item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="cart-table-footer">
                <a href="/menu" className="cart-continue-shopping">
                  ← {lang === "ar" ? "متابعة التسوق وإضافة أصناف أخرى" : "Continue browsing menu"}
                </a>
                <button type="button" className="cart-clear-all" onClick={clearAll}>
                  {lang === "ar" ? "تفريغ السلة" : "Clear cart"}
                </button>
              </div>

              {/* Special Delivery Notes */}
              <div className="cart-order-notes-box">
                <label>
                  <span>{lang === "ar" ? "ملاحظات إضافية للفرع أو المندوب (اختياري)" : "Special notes for branch or courier (optional)"}</span>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      lang === "ar"
                        ? "مثال: يرجى وضع الصوص دافئاً، الاتصال عند الوصول..."
                        : "e.g. Extra napkins, please call upon arrival..."
                    }
                  />
                </label>
              </div>
            </section>

            {/* Right Column: Order Summary & Checkout */}
            <aside className="cart-summary-col">
              <div className="cart-checkout-summary-card">
                <h2>{lang === "ar" ? "ملخص الحساب" : "Order Summary"}</h2>

                <div className="summary-rows">
                  <div className="summary-row">
                    <span>{t.subtotalLabel}</span>
                    <strong>{formatPrice(subtotal)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{t.deliveryFeeLabel}</span>
                    <strong>
                      {remainingForFree === 0
                        ? (lang === "ar" ? "مجاناً" : "Free")
                        : (lang === "ar" ? "يُحسب عند الدبوس" : "Calculated at pin")}
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span>{t.vatIncluded}</span>
                    <span className="included-pill">✓ 14% {lang === "ar" ? "مشمولة" : "Included"}</span>
                  </div>
                  <div className="summary-row total-row">
                    <span>{t.totalLabel}</span>
                    <strong className="grand-price">{formatPrice(subtotal)}</strong>
                  </div>
                </div>

                <div className="checkout-trust-points">
                  <div>
                    <ShieldCheck size={16} />
                    <span>{lang === "ar" ? "دفع آمن: كاش، بطاقات بنكية، ميزة، فوري، إنستاباي" : "Cash on delivery, Meeza, FawryPay & InstaPay"}</span>
                  </div>
                  <div>
                    <Sparkles size={16} />
                    <span>{lang === "ar" ? "تحضير فوري طازة من أقرب فرع" : "Freshly made from your nearest branch"}</span>
                  </div>
                </div>

                <a href="/checkout" className="checkout-cta-btn">
                  <span>{lang === "ar" ? "المتابعة لإتمام الطلب" : "Proceed to Checkout"}</span>
                  <span>→</span>
                </a>

                <p className="checkout-reassurance">
                  {lang === "ar"
                    ? "طلب سريع بدون الحاجة لإنشاء حساب مسبق."
                    : "Fast guest checkout • No forced account registration required."}
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>

      <SiteFooter />
      <PersistentOrderBar onOpenCart={() => {}} />
      <BranchModal isOpen={branchModalOpen} onClose={() => setBranchModalOpen(false)} />
    </main>
  );
}
