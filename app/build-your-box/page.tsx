"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { branches, formatPrice, menus, talabatImages, type Branch, type CityId } from "../catalog";
import { BRANCH_KEY, makeLineId, readCart, saveCart, type CartLine } from "../cart";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import ScrollProgress from "../components/ScrollProgress";
import DeliveryStrip from "../components/DeliveryStrip";
import BranchModal from "../components/BranchModal";
import PersistentOrderBar from "../components/PersistentOrderBar";
import { getStoredLanguage, translations, type Language } from "../i18n";

type BoxSize = {
  id: string;
  nameEn: string;
  nameAr: string;
  pieces: number;
  maxFlavours: number;
  price: number;
  servesEn: string;
  servesAr: string;
  tagEn?: string;
  tagAr?: string;
  catalogItemId: { alexandria: string; cairo: string };
  variantId: string;
};

const BOX_SIZES: BoxSize[] = [
  {
    id: "s-6",
    nameEn: "Small Box",
    nameAr: "صندوق صغير",
    pieces: 6,
    maxFlavours: 2,
    price: 180,
    servesEn: "1 person (solo joy)",
    servesAr: "شخص واحد (روقان شخصي)",
    catalogItemId: { alexandria: "alex-half-half", cairo: "cairo-half-half" },
    variantId: "s-6",
  },
  {
    id: "m-8",
    nameEn: "Medium Box",
    nameAr: "صندوق وسط",
    pieces: 8,
    maxFlavours: 2,
    price: 195,
    servesEn: "1–2 persons (sweet duo)",
    servesAr: "١-٢ أشخاص (لمة اتنين)",
    tagEn: "Most Popular",
    tagAr: "الأكثر طلباً",
    catalogItemId: { alexandria: "alex-half-half", cairo: "cairo-half-half" },
    variantId: "m-8",
  },
  {
    id: "l-10",
    nameEn: "Large Box",
    nameAr: "صندوق كبير",
    pieces: 10,
    maxFlavours: 2,
    price: 210,
    servesEn: "2–3 persons (crowd pleaser)",
    servesAr: "٢-٣ أشخاص (يكفي الحبايب)",
    catalogItemId: { alexandria: "alex-half-half", cairo: "cairo-half-half" },
    variantId: "l-10",
  },
  {
    id: "family-36",
    nameEn: "Family Party Pack",
    nameAr: "صندوق العيلة واللمة",
    pieces: 36,
    maxFlavours: 4,
    price: 700,
    servesEn: "6–10 persons (gatherings & office)",
    servesAr: "٦-١٠ أشخاص (للعزومات والمناسبات)",
    tagEn: "Best Value",
    tagAr: "أوفر للمات",
    catalogItemId: { alexandria: "alex-family", cairo: "cairo-family" },
    variantId: "medium-36-pieces",
  },
];

const FLAVOUR_OPTIONS = [
  { id: "nutella", nameEn: "Nutella Chocolate", nameAr: "نوتيلا بالبندق", color: "#6e3b26", icon: "🍫" },
  { id: "pistachio", nameEn: "Sicilian Pistachio", nameAr: "بستاشيو صقلي فاخر", color: "#6a7b45", icon: "🥜" },
  { id: "lotus", nameEn: "Lotus Biscoff", nameAr: "لوتس بسكوف كراميل", color: "#b87033", icon: "🍪" },
  { id: "belgian", nameEn: "Belgian Milk Chocolate", nameAr: "شوكولاتة بلجيكية فاخرة", color: "#48261e", icon: "🍫" },
  { id: "white-choc", nameEn: "White Chocolate Velvet", nameAr: "وايت شوكليت مخملي", color: "#bfa382", icon: "🥛" },
  { id: "caramel", nameEn: "Golden Salted Caramel", nameAr: "كراميل ذهبي مملح", color: "#c67e2a", icon: "🍯" },
  { id: "kinder", nameEn: "Kinder Bueno Cream", nameAr: "كيندر بوينو كريمي", color: "#9c3b2e", icon: "✨" },
  { id: "mordjene", nameEn: "Mordjene Hazelnut Spread", nameAr: "كريمة مورجان بالبندق", color: "#784b36", icon: "🌰" },
  { id: "dates-cinnamon", nameEn: "Dates & Warm Cinnamon", nameAr: "تمر وقرفة دافئة (موسمي)", color: "#704128", icon: "🍂" },
];

const DIPPING_SAUCES = [
  { id: "dip-belgian", nameEn: "Belgian Chocolate Dip", nameAr: "صوص شوكولاتة بلجيكية دافئ", price: 60, icon: "🍫", alexId: "alex-extra-dip", cairoId: "cairo-topping" },
  { id: "dip-pistachio", nameEn: "Pistachio Cream Dip", nameAr: "صوص بستاشيو كريمي", price: 60, icon: "🥜", alexId: "alex-extra-dip", cairoId: "cairo-topping" },
  { id: "dip-caramel", nameEn: "Salted Caramel Dip", nameAr: "صوص كراميل مملح", price: 60, icon: "🍯", alexId: "alex-extra-dip", cairoId: "cairo-topping" },
  { id: "dip-lotus", nameEn: "Lotus Biscoff Sauce", nameAr: "صوص لوتس ذائب", price: 60, icon: "🍪", alexId: "alex-extra-dip", cairoId: "cairo-topping" },
];

export default function BuildYourBoxPage() {
  const [lang, setLang] = useState<Language>("en");
  const [branchId, setBranchId] = useState("kafr-abdo");
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<BoxSize>(BOX_SIZES[1]);
  const [selectedFlavours, setSelectedFlavours] = useState<string[]>(["nutella", "pistachio"]);
  const [selectedDips, setSelectedDips] = useState<string[]>([]);
  const [giftNote, setGiftNote] = useState("");
  const [wantsGiftNote, setWantsGiftNote] = useState(false);
  const [wantsCandle, setWantsCandle] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    setLang(getStoredLanguage());
    const saved = window.localStorage.getItem(BRANCH_KEY);
    if (saved && branches.some((b) => b.id === saved)) setBranchId(saved);

    const handleLang = (e: Event) => {
      const custom = e as CustomEvent<{ lang: Language }>;
      if (custom.detail?.lang) setLang(custom.detail.lang);
    };
    const handleBranch = (e: Event) => {
      const custom = e as CustomEvent<{ branch: { id: string } }>;
      if (custom.detail?.branch?.id) setBranchId(custom.detail.branch.id);
    };

    window.addEventListener("puffy-language-change", handleLang);
    window.addEventListener("puffy-branch-change", handleBranch);
    return () => {
      window.removeEventListener("puffy-language-change", handleLang);
      window.removeEventListener("puffy-branch-change", handleBranch);
    };
  }, []);

  const branch = branches.find((b) => b.id === branchId) ?? branches[0];
  const cityId: CityId = branch.cityId;
  const t = translations[lang];

  const handleSizeChange = (size: BoxSize) => {
    setSelectedSize(size);
    if (selectedFlavours.length > size.maxFlavours) {
      setSelectedFlavours(selectedFlavours.slice(0, size.maxFlavours));
    }
  };

  const toggleFlavour = (id: string) => {
    if (selectedFlavours.includes(id)) {
      if (selectedFlavours.length > 1) {
        setSelectedFlavours(selectedFlavours.filter((f) => f !== id));
      }
    } else {
      if (selectedFlavours.length < selectedSize.maxFlavours) {
        setSelectedFlavours([...selectedFlavours, id]);
      } else {
        setSelectedFlavours([...selectedFlavours.slice(0, selectedSize.maxFlavours - 1), id]);
      }
    }
  };

  const toggleDip = (id: string) => {
    setSelectedDips((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const dipsTotal = selectedDips.length * 60;
  const boxTotal = selectedSize.price + dipsTotal;

  const handleAddToCart = () => {
    const rawCart = readCart();
    const itemId = selectedSize.catalogItemId[cityId];
    const flavourNames = selectedFlavours
      .map((fid) => FLAVOUR_OPTIONS.find((f) => f.id === fid)?.nameEn ?? fid)
      .join(" + ");

    let choiceText = flavourNames;
    if (wantsGiftNote && giftNote.trim()) choiceText += ` (Gift: ${giftNote.trim()})`;
    if (wantsCandle) choiceText += " (With Candle)";

    const lineId = makeLineId(itemId, selectedSize.variantId, choiceText);
    const existingIndex = rawCart.findIndex((l) => l.id === lineId);

    let nextCart: CartLine[];
    if (existingIndex >= 0) {
      nextCart = rawCart.map((line, idx) =>
        idx === existingIndex ? { ...line, quantity: Math.min(20, line.quantity + 1) } : line
      );
    } else {
      nextCart = [
        ...rawCart,
        {
          id: lineId,
          itemId,
          variantId: selectedSize.variantId,
          choice: choiceText,
          quantity: 1,
        },
      ];
    }

    selectedDips.forEach((dipId) => {
      const dipObj = DIPPING_SAUCES.find((d) => d.id === dipId);
      if (dipObj) {
        const dipItemId = cityId === "alexandria" ? dipObj.alexId : dipObj.cairoId;
        const dipLineId = makeLineId(dipItemId, "regular", dipObj.nameEn);
        const dipIdx = nextCart.findIndex((l) => l.id === dipLineId);
        if (dipIdx >= 0) {
          nextCart[dipIdx].quantity += 1;
        } else {
          nextCart.push({
            id: dipLineId,
            itemId: dipItemId,
            variantId: "regular",
            choice: dipObj.nameEn,
            quantity: 1,
          });
        }
      }
    });

    saveCart(nextCart);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3500);
  };

  return (
    <main className="build-box-page">
      <ScrollProgress />
      <DeliveryStrip onOpenBranchModal={() => setBranchModalOpen(true)} />
      <SiteHeader />

      <section className="build-box-hero">
        <div className="build-box-hero-content">
          <p className="eyebrow">{lang === "ar" ? "اصنع تجربتك الخاصة" : "Handcrafted Custom Ordering"}</p>
          <h1>
            {lang === "ar" ? "اصنع صندوق" : "Build your"} <em>{lang === "ar" ? "أحلامك." : "dream box."}</em>
          </h1>
          <p className="build-hero-lead">
            {lang === "ar"
              ? "اختر حجم الصندوق، نسق نكهاتك المفضلة، وأضف لمسات التغميس والهدايا لتصلك طازة من أقرب فرع."
              : "Choose your box size, pick your signature flavours, add warm Belgian dips and gift notes—freshly made from your nearest branch."}
          </p>

          <div className="build-branch-chip-row">
            <button
              type="button"
              className="build-branch-chip"
              onClick={() => setBranchModalOpen(true)}
            >
              <span className="chip-dot" />
              <span>{lang === "ar" ? `فرعك الحالي: ${branch.name} (${branch.city}) ▾` : `Ordering from: ${branch.name} (${branch.city}) ▾`}</span>
            </button>
            <span className="build-delivery-badge">
              ⚡ {lang === "ar" ? "توصيل ٢٥-٣٥ دقيقة • شامل الضريبة" : "25–35 min delivery • VAT included"}
            </span>
          </div>
        </div>
      </section>

      <div className="build-box-layout">
        <section className="build-steps-column">
          <div className="build-step-card">
            <div className="step-badge-row">
              <span className="step-num-badge">01</span>
              <div>
                <h2>{lang === "ar" ? "اختر حجم الصندوق" : "Choose Box Size"}</h2>
                <p>{lang === "ar" ? "كم شخص سيتشارك في هذه الفرحة؟" : "How many people are sharing the joy?"}</p>
              </div>
            </div>

            <div className="size-selector-grid">
              {BOX_SIZES.map((size) => {
                const isSelected = selectedSize.id === size.id;
                return (
                  <button
                    type="button"
                    key={size.id}
                    className={`size-card-btn ${isSelected ? "is-selected" : ""}`}
                    onClick={() => handleSizeChange(size)}
                  >
                    {size.tagEn && (
                      <span className="size-popular-tag">
                        {lang === "ar" ? size.tagAr : size.tagEn}
                      </span>
                    )}
                    <div className="size-card-header">
                      <h3>{lang === "ar" ? size.nameAr : size.nameEn}</h3>
                      <strong className="size-price">{formatPrice(size.price)}</strong>
                    </div>
                    <div className="size-card-meta">
                      <span className="size-pieces-count">{size.pieces} {lang === "ar" ? "قطعة" : "pieces"}</span>
                      <span className="size-serves">{lang === "ar" ? size.servesAr : size.servesEn}</span>
                      <small className="size-flavour-allowance">
                        {lang === "ar" ? `اختر حتى ${size.maxFlavours} نكهات` : `Choose up to ${size.maxFlavours} flavours`}
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="build-step-card">
            <div className="step-badge-row">
              <span className="step-num-badge">02</span>
              <div>
                <h2>{lang === "ar" ? "اختر النكهات" : "Pick Your Flavours"}</h2>
                <p>
                  {lang === "ar"
                    ? `تم اختيار ${selectedFlavours.length} من ${selectedSize.maxFlavours}`
                    : `${selectedFlavours.length} of ${selectedSize.maxFlavours} flavours selected`}
                </p>
              </div>
            </div>

            <div className="flavour-counter-indicator" aria-live="polite">
              <div className="slots-track">
                {Array.from({ length: selectedSize.maxFlavours }).map((_, idx) => {
                  const fid = selectedFlavours[idx];
                  const flavourObj = FLAVOUR_OPTIONS.find((f) => f.id === fid);
                  return (
                    <div
                      key={idx}
                      className={`flavour-slot-bubble ${flavourObj ? "filled" : "empty"}`}
                      style={flavourObj ? { borderColor: flavourObj.color } : {}}
                    >
                      {flavourObj ? (
                        <>
                          <span className="slot-icon">{flavourObj.icon}</span>
                          <span className="slot-name">
                            {lang === "ar" ? flavourObj.nameAr : flavourObj.nameEn}
                          </span>
                        </>
                      ) : (
                        <span className="slot-placeholder">
                          {lang === "ar" ? `+ نكهة ${idx + 1}` : `+ Flavour ${idx + 1}`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flavours-grid-selector">
              {FLAVOUR_OPTIONS.map((f) => {
                const isPicked = selectedFlavours.includes(f.id);
                return (
                  <button
                    type="button"
                    key={f.id}
                    className={`flavour-pill-btn ${isPicked ? "is-active" : ""}`}
                    onClick={() => toggleFlavour(f.id)}
                    style={isPicked ? { backgroundColor: f.color, color: "#fff" } : {}}
                  >
                    <span className="f-icon">{f.icon}</span>
                    <span className="f-title">{lang === "ar" ? f.nameAr : f.nameEn}</span>
                    {isPicked && <span className="f-check">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="build-step-card">
            <div className="step-badge-row">
              <span className="step-num-badge">03</span>
              <div>
                <h2>{lang === "ar" ? "صوصات التغميس والإضافات" : "Dipping Sauces & Add-ons"}</h2>
                <p>{lang === "ar" ? "اجعل كل قضمة أغنى مع صوص دافئ" : "Dip each golden bite into pure indulgence."}</p>
              </div>
            </div>

            <div className="dips-selection-grid">
              {DIPPING_SAUCES.map((dip) => {
                const isSelected = selectedDips.includes(dip.id);
                return (
                  <button
                    type="button"
                    key={dip.id}
                    className={`dip-card-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleDip(dip.id)}
                  >
                    <span className="dip-icon">{dip.icon}</span>
                    <div className="dip-text">
                      <strong>{lang === "ar" ? dip.nameAr : dip.nameEn}</strong>
                      <span className="dip-price">+{formatPrice(dip.price)}</span>
                    </div>
                    <span className={`dip-checkbox ${isSelected ? "checked" : ""}`}>
                      {isSelected ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="gift-candle-section">
              <label className="checkbox-toggle-row">
                <input
                  type="checkbox"
                  checked={wantsGiftNote}
                  onChange={(e) => setWantsGiftNote(e.target.checked)}
                />
                <span className="checkbox-custom" />
                <span>
                  💌 <strong>{lang === "ar" ? "كرت إهداء مكتوب بخط اليد (مجاناً)" : "Free Handwritten Gift Note"}</strong>
                </span>
              </label>

              {wantsGiftNote && (
                <div className="gift-note-field">
                  <textarea
                    rows={2}
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value)}
                    placeholder={
                      lang === "ar"
                        ? "اكتب رسالتك الخاصة لمن تحب (عيد ميلاد، شكر، تهنئة...)"
                        : "Write your custom message (birthday, thank you, sweet note)..."
                    }
                  />
                </div>
              )}

              <label className="checkbox-toggle-row">
                <input
                  type="checkbox"
                  checked={wantsCandle}
                  onChange={(e) => setWantsCandle(e.target.checked)}
                />
                <span className="checkbox-custom" />
                <span>
                  🕯️ <strong>{lang === "ar" ? "إضافة شمعة احتفال (مجاناً)" : "Include Birthday / Celebration Candle (Free)"}</strong>
                </span>
              </label>
            </div>
          </div>
        </section>

        <aside className="build-summary-sticky">
          <div className="build-summary-card">
            <div className="summary-card-header">
              <span className="summary-kicker">{lang === "ar" ? "ملخص طلبك" : "Box Summary"}</span>
              <h2>{lang === "ar" ? selectedSize.nameAr : selectedSize.nameEn}</h2>
              <span className="summary-branch-name">📍 {branch.name}</span>
            </div>

            <div className="summary-box-illustration">
              <div className="box-mockup-frame">
                <img
                  src={talabatImages.assorted}
                  alt="Custom Puffy Pops Box Preview"
                  className="box-mockup-img"
                />
                <span className="box-pieces-badge">{selectedSize.pieces} {lang === "ar" ? "لقمة" : "bites"}</span>
              </div>
            </div>

            <div className="summary-detail-list">
              <div className="summary-line">
                <span>{lang === "ar" ? "الحجم والقطع" : "Size & Pieces"}</span>
                <strong>{selectedSize.pieces} {lang === "ar" ? "قطع" : "pcs"} ({formatPrice(selectedSize.price)})</strong>
              </div>

              <div className="summary-line flavours-summary-line">
                <span>{lang === "ar" ? "النكهات المختارة" : "Selected Flavours"}</span>
                <div className="summary-flavour-tags">
                  {selectedFlavours.map((fid) => {
                    const f = FLAVOUR_OPTIONS.find((item) => item.id === fid);
                    return (
                      <span key={fid} className="sum-f-tag" style={{ borderColor: f?.color }}>
                        {f?.icon} {lang === "ar" ? f?.nameAr : f?.nameEn}
                      </span>
                    );
                  })}
                </div>
              </div>

              {selectedDips.length > 0 && (
                <div className="summary-line">
                  <span>{lang === "ar" ? "الصوصات الإضافية" : "Dipping Sauces"}</span>
                  <strong>+{formatPrice(dipsTotal)}</strong>
                </div>
              )}

              {wantsGiftNote && giftNote.trim() && (
                <div className="summary-line gift-note-preview">
                  <span>{lang === "ar" ? "كرت الإهداء" : "Gift Note"}</span>
                  <em>&ldquo;{giftNote}&rdquo;</em>
                </div>
              )}

              {wantsCandle && (
                <div className="summary-line">
                  <span>{lang === "ar" ? "شمعة الاحتفال" : "Candle"}</span>
                  <strong className="free-tag">{lang === "ar" ? "مجاناً ✓" : "Free ✓"}</strong>
                </div>
              )}

              <div className="summary-total-row">
                <div>
                  <span className="total-title">{lang === "ar" ? "الإجمالي" : "Total"}</span>
                  <small className="vat-note">{lang === "ar" ? "شامل ضريبة القيمة المضافة" : "VAT included"}</small>
                </div>
                <strong className="total-amount">{formatPrice(boxTotal)}</strong>
              </div>
            </div>

            {addedNotice && (
              <div className="build-added-banner" role="status">
                <span>🎉</span>
                <span>{t.addedHappier}</span>
              </div>
            )}

            <button
              type="button"
              className="build-add-to-cart-btn"
              onClick={handleAddToCart}
            >
              <span>{t.addToCartJoy}</span>
              <span className="btn-price-pill">{formatPrice(boxTotal)}</span>
              <span>→</span>
            </button>

            <a href="/cart" className="view-cart-secondary-btn">
              {lang === "ar" ? "عرض السلة وإتمام الطلب" : "View Cart & Checkout"} ↗
            </a>

            <p className="summary-delivery-note">
              {lang === "ar"
                ? "يتم حساب رسوم التوصيل الدقيقة بناءً على الدبوس عند الدفع."
                : "Exact delivery fee calculated from your pin at checkout."}
            </p>
          </div>
        </aside>
      </div>

      <SiteFooter />
      <PersistentOrderBar onOpenCart={() => { window.location.assign("/cart"); }} />
      <BranchModal isOpen={branchModalOpen} onClose={() => setBranchModalOpen(false)} onSelectBranch={(b) => setBranchId(b.id)} />
    </main>
  );
}
