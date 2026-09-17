"use client";

/* eslint-disable @next/next/no-img-element */

import { use, useEffect, useState } from "react";
import { branches, formatPrice, menus, talabatImages, type Branch, type CityId, type MenuItem } from "../../catalog";
import { BRANCH_KEY, makeLineId, readCart, saveCart, type CartLine } from "../../cart";
import { getProductBySlug, PRODUCT_DETAILS, type ProductDetail } from "../../collections-data";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import ScrollProgress from "../../components/ScrollProgress";
import DeliveryStrip from "../../components/DeliveryStrip";
import BranchModal from "../../components/BranchModal";
import PersistentOrderBar from "../../components/PersistentOrderBar";
import { getStoredLanguage, translations, type Language } from "../../i18n";
import { ArrowLeft, Check, ChevronDown, Heart, Minus, Plus, Share2, ShieldAlert, Sparkles, Star, Utensils } from "lucide-react";

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [lang, setLang] = useState<Language>("en");
  const [branchId, setBranchId] = useState("kafr-abdo");
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [selectedFlavour, setSelectedFlavour] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [allergenOpen, setAllergenOpen] = useState(false);
  const [nutritionOpen, setNutritionOpen] = useState(false);
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

  // Resolve product detail data or generate fallback from catalog
  const detail: ProductDetail = getProductBySlug(slug) ?? {
    slug,
    catalogItemId: `cairo-${slug.replace(/-puffy-pops$/, "").replace(/-soft-serve$/, "")}`,
    nameEn: slug.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
    nameAr: "بوفي بوبس المميز",
    taglineEn: "Handcrafted dessert joy freshly prepared for you",
    taglineAr: "تحلية حرفية طازجة معدة خصيصاً من أجلك",
    collectionSlug: "puffy-pops",
    priceFrom: 180,
    rating: 4.9,
    reviewCount: 142,
    image: talabatImages.nutella,
    gallery: [talabatImages.nutella, talabatImages.assorted, "/images/puffy-moments.jpg"],
    description: {
      feelingEn: "A warm, comforting burst of artisanal sweetness with every golden bite.",
      feelingAr: "انفجار دافئ من الحلاوة الغنية مع كل لقمة ذهبية هشة.",
      insideEn: "Light dough base, decadent fillings, signature warm drizzles.",
      insideAr: "عجين خفيف هش، حشوات غنية وفيرة، وصوصات دافئة لا تقاوم.",
      makeItYoursEn: "Available in multiple sizes with optional extra dipping sauces.",
      makeItYoursAr: "متوفر بعدة أحجام مع خيارات صوصات التغميس الإضافية.",
      goodToKnowEn: "Freshly made per order. Served hot from your nearest branch.",
      goodToKnowAr: "يخبز طازجاً عند الطلب ويصل ساخناً من أقرب فرع.",
    },
    allergensEn: ["Dairy (Milk)", "Wheat (Gluten)"],
    allergensAr: ["حليب ومنتجات ألبان", "قمح (جلوتين)"],
    servings: "1–3 persons",
    sizes: [
      { id: "s-6", labelEn: "Small · 6 pieces", labelAr: "صغير · ٦ قطع", price: 180, serves: "1 person" },
      { id: "m-8", labelEn: "Medium · 8 pieces", labelAr: "وسط · ٨ قطع", price: 195, serves: "1–2 persons" },
      { id: "l-10", labelEn: "Large · 10 pieces", labelAr: "كبير · ١٠ قطع", price: 210, serves: "2–3 persons" },
    ],
    pairings: [
      { nameEn: "Belgian Chocolate Dipping", nameAr: "صوص شوكولاتة بلجيكية", price: 60, image: talabatImages.caramel },
      { nameEn: "Peach Iced Tea", nameAr: "آيس تي خوخ", price: 120, image: "/images/puffy-moments.jpg" },
      { nameEn: "Vanilla Cloud Soft Serve", nameAr: "سوفت سيرف فانيليا", price: 85, image: "/images/soft-serve-vanilla.png" },
    ],
    reviews: [
      { author: "Yasmine N.", city: "Alexandria", rating: 5, commentEn: "Amazing texture! Arrived warm and beautifully packaged.", commentAr: "قوام ممتاز جداً ووصل ساخن ومغلف بنظافة وشياكة!", date: "3 days ago" },
      { author: "Tarek F.", city: "Cairo", rating: 5, commentEn: "Our favorite weekend order. Always consistent.", commentAr: "طلبنا المفضل في الويك إند. طعم ثابت وجودة عالية دايماً.", date: "1 week ago" },
    ],
  };

  const currentSize = detail.sizes[selectedSizeIndex] || detail.sizes[0];
  const unitPrice = currentSize.price;
  const lineTotal = unitPrice * quantity;

  // Add to Cart
  const handleAddToCart = () => {
    const rawCart = readCart();

    // Map catalog item ID to city-specific prefix
    let resolvedItemId = detail.catalogItemId;
    if (cityId === "alexandria" && resolvedItemId.startsWith("cairo-")) {
      resolvedItemId = resolvedItemId.replace("cairo-", "alex-");
    }

    // Check if city catalog has this item; if not fallback to half-half or first item
    const cityItems = menus[cityId].items;
    const itemExists = cityItems.some((i) => i.id === resolvedItemId);
    const finalItemId = itemExists ? resolvedItemId : (cityId === "alexandria" ? "alex-nutella" : "cairo-nutella");

    const choice = selectedFlavour || undefined;
    const lineId = makeLineId(finalItemId, currentSize.id, choice);
    const existingIndex = rawCart.findIndex((l) => l.id === lineId);

    let nextCart: CartLine[];
    if (existingIndex >= 0) {
      nextCart = rawCart.map((l, i) =>
        i === existingIndex ? { ...l, quantity: Math.min(20, l.quantity + quantity) } : l
      );
    } else {
      nextCart = [
        ...rawCart,
        {
          id: lineId,
          itemId: finalItemId,
          variantId: currentSize.id,
          choice,
          quantity,
        },
      ];
    }

    saveCart(nextCart);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  };

  const t = translations[lang];

  return (
    <main className="product-pdp-page">
      <ScrollProgress />
      <DeliveryStrip onOpenBranchModal={() => setBranchModalOpen(true)} />
      <SiteHeader />

      <div className="pdp-container">
        {/* Breadcrumb Navigation */}
        <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
          <a href="/menu">{lang === "ar" ? "المنيو" : "Menu"}</a>
          <span>/</span>
          <a href={`/collections/${detail.collectionSlug}`}>
            {lang === "ar" ? "المجموعة" : "Collection"}
          </a>
          <span>/</span>
          <span className="current">{lang === "ar" ? detail.nameAr : detail.nameEn}</span>
        </nav>

        <div className="pdp-grid">
          {/* Gallery Column */}
          <div className="pdp-gallery-col">
            <div className="pdp-main-image-wrap">
              <img
                src={detail.gallery[selectedImageIndex] || detail.image}
                alt={detail.nameEn}
                className="pdp-main-image"
              />
              <span className="pdp-fresh-badge">
                <Utensils size={14} />
                <span>{lang === "ar" ? "يخبز طازجاً كل ٢٠ دقيقة" : "Freshly Made To Order"}</span>
              </span>
            </div>

            {/* Thumbnail Strip */}
            {detail.gallery.length > 1 && (
              <div className="pdp-thumbnail-row">
                {detail.gallery.map((img, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className={`pdp-thumb-btn ${idx === selectedImageIndex ? "active" : ""}`}
                    onClick={() => setSelectedImageIndex(idx)}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Configuration Column */}
          <div className="pdp-info-col">
            <div className="pdp-header">
              <span className="pdp-eyebrow-tag">
                {lang === "ar" ? detail.taglineAr : detail.taglineEn}
              </span>
              <h1>{lang === "ar" ? detail.nameAr : detail.nameEn}</h1>

              <div className="pdp-rating-strip">
                <div className="stars-row">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} fill="#e6532d" color="#e6532d" />
                  ))}
                  <strong className="rating-score">{detail.rating}</strong>
                </div>
                <span className="reviews-count">({detail.reviewCount} {lang === "ar" ? "تقييم حقيقي" : "reviews"})</span>
                <span className="divider-dot">•</span>
                <span className="serves-badge">👥 {detail.servings}</span>
              </div>

              <div className="pdp-price-row">
                <strong className="pdp-current-price">{formatPrice(unitPrice)}</strong>
                <span className="pdp-vat-note">{lang === "ar" ? "شامل ضريبة القيمة المضافة" : "VAT included"}</span>
              </div>
            </div>

            {/* Branch Fulfillment Strip */}
            <div className="pdp-fulfillment-box">
              <div className="fulfill-branch-info">
                <span className="dot-pulse-green" />
                <div>
                  <strong>{lang === "ar" ? `يجهز طازة من فرع: ${branch.name}` : `Freshly made at: ${branch.name}`}</strong>
                  <p>{lang === "ar" ? `${branch.address} • توصيل ٢٥–٣٥ دقيقة` : `${branch.address} • 25–35 min delivery`}</p>
                </div>
              </div>
              <button
                type="button"
                className="change-branch-link"
                onClick={() => setBranchModalOpen(true)}
              >
                {lang === "ar" ? "تغيير الفرع ▾" : "Change branch ▾"}
              </button>
            </div>

            {/* Sensory Description Template */}
            <div className="pdp-sensory-block">
              <div className="sensory-item">
                <span className="sensory-label">{lang === "ar" ? "الشعور:" : "The feeling:"}</span>
                <p>{lang === "ar" ? detail.description.feelingAr : detail.description.feelingEn}</p>
              </div>
              <div className="sensory-item">
                <span className="sensory-label">{lang === "ar" ? "في القلب:" : "Inside:"}</span>
                <p>{lang === "ar" ? detail.description.insideAr : detail.description.insideEn}</p>
              </div>
              <div className="sensory-item">
                <span className="sensory-label">{lang === "ar" ? "على ذوقك:" : "Make it yours:"}</span>
                <p>{lang === "ar" ? detail.description.makeItYoursAr : detail.description.makeItYoursEn}</p>
              </div>
              <div className="sensory-item">
                <span className="sensory-label">{lang === "ar" ? "معلومة هامة:" : "Good to know:"}</span>
                <p>{lang === "ar" ? detail.description.goodToKnowAr : detail.description.goodToKnowEn}</p>
              </div>
            </div>

            {/* Size Selector */}
            <div className="pdp-selector-section">
              <div className="section-title-row">
                <h3>{lang === "ar" ? "اختر الحجم" : "Select Size"}</h3>
                <span>{currentSize.serves}</span>
              </div>
              <div className="size-pill-group">
                {detail.sizes.map((sz, idx) => (
                  <button
                    type="button"
                    key={sz.id}
                    className={`size-pill-btn ${idx === selectedSizeIndex ? "active" : ""}`}
                    onClick={() => setSelectedSizeIndex(idx)}
                  >
                    <span className="sz-title">{lang === "ar" ? sz.labelAr : sz.labelEn}</span>
                    <strong className="sz-price">{formatPrice(sz.price)}</strong>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Flavour / Split Selector if available */}
            {detail.flavours && (
              <div className="pdp-selector-section">
                <div className="section-title-row">
                  <h3>{lang === "ar" ? "اختر النكهة المقسمة" : "Select Flavour Combination"}</h3>
                </div>
                <div className="flavour-chips-wrap">
                  {detail.flavours.map((f) => (
                    <button
                      type="button"
                      key={f}
                      className={`flavour-chip-btn ${selectedFlavour === f ? "selected" : ""}`}
                      onClick={() => setSelectedFlavour(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Allergen Accordion */}
            <div className="pdp-accordion-section">
              <button
                type="button"
                className="accordion-toggle-btn"
                onClick={() => setAllergenOpen((prev) => !prev)}
                aria-expanded={allergenOpen}
              >
                <div className="accordion-title-left">
                  <ShieldAlert size={18} />
                  <span>{lang === "ar" ? "مسببات الحساسية والمكونات" : "Allergens & Nutrition"}</span>
                </div>
                <ChevronDown size={18} className={`chevron ${allergenOpen ? "rotate" : ""}`} />
              </button>

              {allergenOpen && (
                <div className="accordion-body">
                  <p className="allergen-intro">
                    {lang === "ar"
                      ? "نحن نستخدم مكونات طبيعية طازجة. يحتوي هذا الصنف على:"
                      : "We craft fresh with honest ingredients. This item contains:"}
                  </p>
                  <ul className="allergen-badges-list">
                    {(lang === "ar" ? detail.allergensAr : detail.allergensEn).map((al, idx) => (
                      <li key={idx} className="allergen-pill">
                        {al}
                      </li>
                    ))}
                  </ul>
                  <small className="allergen-warning">
                    {lang === "ar"
                      ? "يتم إعداد منتجاتنا في مطبخ يتعامل مع المكسرات والألبان ومنتجات القمح. يرجى إبلاغ فريقنا عند وجود حساسية حادة."
                      : "Our kitchen handles tree nuts, dairy, and wheat flour. Please inform our team of any severe allergies before ordering."}
                  </small>
                </div>
              )}
            </div>

            {/* Quantity Stepper and Sticky Add-To-Cart */}
            <div className="pdp-action-bar">
              <div className="quantity-stepper-box">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="qty-number">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                type="button"
                className="pdp-submit-add-btn"
                onClick={handleAddToCart}
              >
                <span>{lang === "ar" ? "أضف للطلب" : "Add to Order"}</span>
                <span className="price-tag">{formatPrice(lineTotal)}</span>
              </button>
            </div>

            {addedNotice && (
              <div className="pdp-added-banner" role="status">
                <Check size={18} />
                <span>{t.addedHappier}</span>
                <a href="/cart" className="view-cart-link">
                  {lang === "ar" ? "عرض السلة ←" : "View Cart →"}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Pairs Well With Section */}
        {detail.pairings && detail.pairings.length > 0 && (
          <section className="pdp-pairings-section">
            <div className="pairings-header">
              <p className="eyebrow">{lang === "ar" ? "تكتمل السعادة معها" : "Complete the Joy"}</p>
              <h2>{lang === "ar" ? "أصناف تناسب طلبك" : "Pairs Well With"}</h2>
            </div>
            <div className="pairings-grid">
              {detail.pairings.map((pair, idx) => (
                <div className="pairing-card" key={idx}>
                  <img src={pair.image} alt={pair.nameEn} className="pair-img" />
                  <div className="pair-details">
                    <h4>{lang === "ar" ? pair.nameAr : pair.nameEn}</h4>
                    <span className="pair-price">+{formatPrice(pair.price)}</span>
                  </div>
                  <a href="/menu" className="pair-add-link">
                    + {lang === "ar" ? "طلب" : "Order"}
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews and UGC Section */}
        <section className="pdp-reviews-section">
          <div className="reviews-section-header">
            <div>
              <p className="eyebrow">{lang === "ar" ? "آراء مجتمع بوفي" : "Real Customer Love"}</p>
              <h2>{lang === "ar" ? "تقييمات مجربة من عشاق بوفي" : "Reviews & Sweet Moments"}</h2>
            </div>
            <div className="reviews-summary-badge">
              <span className="score-big">{detail.rating}</span>
              <div className="stars-block">
                <span>★★★★★</span>
                <small>{detail.reviewCount} {lang === "ar" ? "تقييم مؤكد" : "verified reviews"}</small>
              </div>
            </div>
          </div>

          <div className="reviews-cards-row">
            {detail.reviews.map((rev, idx) => (
              <article className="pdp-review-card" key={idx}>
                <div className="rev-top">
                  <div>
                    <strong>{rev.author}</strong>
                    <span className="rev-city">📍 {rev.city}</span>
                  </div>
                  <span className="rev-date">{rev.date}</span>
                </div>
                <div className="rev-stars">★★★★★</div>
                <p className="rev-comment">
                  &ldquo;{lang === "ar" ? rev.commentAr : rev.commentEn}&rdquo;
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
      <PersistentOrderBar onOpenCart={() => { window.location.assign("/cart"); }} />
      <BranchModal isOpen={branchModalOpen} onClose={() => setBranchModalOpen(false)} onSelectBranch={(b) => setBranchId(b.id)} />
    </main>
  );
}
