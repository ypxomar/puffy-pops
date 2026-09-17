"use client";

/* eslint-disable @next/next/no-img-element */

import { use, useEffect, useState } from "react";
import { branches, formatPrice, menus, type Branch, type CityId, type MenuItem } from "../../catalog";
import { BRANCH_KEY, makeLineId, readCart, saveCart, type CartLine } from "../../cart";
import { COLLECTIONS, getCollectionBySlug } from "../../collections-data";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import ScrollProgress from "../../components/ScrollProgress";
import DeliveryStrip from "../../components/DeliveryStrip";
import BranchModal from "../../components/BranchModal";
import PersistentOrderBar from "../../components/PersistentOrderBar";
import { getStoredLanguage, translations, type Language } from "../../i18n";
import { ArrowLeft, ArrowUpRight, Search, Sparkles, Star } from "lucide-react";

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [lang, setLang] = useState<Language>("en");
  const [branchId, setBranchId] = useState("kafr-abdo");
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  useEffect(() => {
    setLang(getStoredLanguage());
    const saved = window.localStorage.getItem(BRANCH_KEY);
    if (saved && branches.some((b) => b.id === saved)) setBranchId(saved);
    setCart(readCart());

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

  const collection = getCollectionBySlug(slug) ?? COLLECTIONS[0];
  const branch = branches.find((b) => b.id === branchId) ?? branches[0];
  const cityId: CityId = branch.cityId;
  const allCityItems = menus[cityId].items;

  // Filter items in this collection
  const collectionItems = allCityItems.filter((item) => {
    if (slug === "soft-serve") {
      return item.id.includes("soft-serve") || item.category === "puffy-pops";
    }
    return collection.categoryIds.includes(item.category);
  });

  const filteredItems = collectionItems.filter((item) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.note ?? "").toLowerCase().includes(q)
    );
  });

  const handleQuickAdd = (item: MenuItem) => {
    const rawCart = readCart();
    const variant = item.variants[0];
    const choice = item.choices?.[0];
    const lineId = makeLineId(item.id, variant.id, choice);
    const existing = rawCart.find((l) => l.id === lineId);

    const next = existing
      ? rawCart.map((l) => (l.id === lineId ? { ...l, quantity: l.quantity + 1 } : l))
      : [...rawCart, { id: lineId, itemId: item.id, variantId: variant.id, choice, quantity: 1 }];

    saveCart(next);
    setCart(next);
    setAddedNotice(item.name);
    setTimeout(() => setAddedNotice(null), 2500);
  };

  const t = translations[lang];

  return (
    <main className="collection-page">
      <ScrollProgress />
      <DeliveryStrip onOpenBranchModal={() => setBranchModalOpen(true)} />
      <SiteHeader />

      <header className="collection-hero-section">
        <div className="collection-hero-wrapper">
          <div className="collection-breadcrumb">
            <a href="/menu">← {lang === "ar" ? "العودة للمنيو" : "Back to all menu"}</a>
            <span>/</span>
            <span>{lang === "ar" ? collection.titleAr : collection.titleEn}</span>
          </div>

          <div className="collection-hero-grid">
            <div className="collection-hero-copy">
              <span className="collection-tag">
                {lang === "ar" ? collection.taglineAr : collection.taglineEn}
              </span>
              <h1>{lang === "ar" ? collection.titleAr : collection.titleEn}</h1>
              <p>{lang === "ar" ? collection.descriptionAr : collection.descriptionEn}</p>

              <div className="collection-meta-bar">
                <button
                  type="button"
                  className="collection-branch-btn"
                  onClick={() => setBranchModalOpen(true)}
                >
                  <span className="green-dot" />
                  <span>{lang === "ar" ? `الفرع: ${branch.name} (${branch.city}) ▾` : `Branch: ${branch.name} (${branch.city}) ▾`}</span>
                </button>
                <span className="collection-vat-badge">
                  {lang === "ar" ? "الأسعار شاملة الضريبة • توصيل سريع" : "VAT included • Fast delivery"}
                </span>
              </div>
            </div>

            <div className="collection-hero-visual">
              <img src={collection.heroImage} alt={collection.titleEn} className="collection-hero-img" />
            </div>
          </div>
        </div>
      </header>

      {/* Collection Navigation Tabs */}
      <nav className="collection-quick-tabs" aria-label="Collections">
        {COLLECTIONS.map((c) => (
          <a
            key={c.slug}
            href={`/collections/${c.slug}`}
            className={`coll-tab-link ${c.slug === slug ? "active" : ""}`}
          >
            {lang === "ar" ? c.titleAr : c.titleEn}
          </a>
        ))}
      </nav>

      {/* Filter and Search Bar */}
      <section className="collection-filter-strip">
        <div className="collection-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "ar" ? "ابحث داخل هذه المجموعة..." : "Search within this collection..."}
          />
        </div>
        <span className="items-count-badge">
          {filteredItems.length} {lang === "ar" ? "صنف متوفر" : "items available"}
        </span>
      </section>

      {addedNotice && (
        <div className="collection-toast-notice" role="status">
          <span>✓</span>
          <span>
            {lang === "ar" ? `تمت إضافة ${addedNotice} للسلة!` : `Added ${addedNotice} to your box!`}
          </span>
        </div>
      )}

      {/* Product Grid */}
      <section className="collection-items-grid">
        {filteredItems.map((item, index) => {
          const startingPrice = item.variants[0]?.price ?? 0;
          return (
            <article className="collection-item-card" key={item.id}>
              <div className={`item-card-image tone-${index % 5}`}>
                {item.image ? (
                  <img src={item.image} alt={item.name} loading="lazy" />
                ) : (
                  <span className="item-text-mark">
                    {item.category === "puffy-pops" ? "PP" : item.name.charAt(0)}
                  </span>
                )}
                {item.realFavorite && (
                  <span className="badge-favorite">
                    {lang === "ar" ? "الأكثر حباً ★" : "Top Pick ★"}
                  </span>
                )}
              </div>

              <div className="item-card-details">
                <div className="item-title-row">
                  <h3>{item.name}</h3>
                  <div className="item-rating">
                    <Star size={14} fill="#e6532d" color="#e6532d" />
                    <span>4.9</span>
                  </div>
                </div>

                {item.note && <p className="item-note">{item.note}</p>}

                <div className="item-variants-summary">
                  {item.variants.length > 1 ? (
                    <span className="variants-count">
                      {item.variants.length} {lang === "ar" ? "أحجام متاحة" : "sizes available"}
                    </span>
                  ) : (
                    <span className="variants-count">{item.variants[0]?.label}</span>
                  )}
                </div>

                <div className="item-action-row">
                  <div className="item-price-block">
                    <small>{lang === "ar" ? "يبدأ من" : "from"}</small>
                    <strong>{formatPrice(startingPrice)}</strong>
                  </div>

                  <div className="item-buttons">
                    <button
                      type="button"
                      className="quick-add-btn"
                      onClick={() => handleQuickAdd(item)}
                      aria-label={`Add ${item.name}`}
                    >
                      <span>+ {lang === "ar" ? "إضافة" : "Add"}</span>
                    </button>
                    <a
                      href={`/products/${item.id.replace("cairo-", "").replace("alex-", "")}-puffy-pops`}
                      className="details-link-btn"
                      title="View details and customize"
                    >
                      <ArrowUpRight size={17} />
                    </a>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Bottom CTA Banner */}
      <section className="collection-bottom-cta">
        <div className="cta-box-card">
          <div>
            <p className="eyebrow light">{lang === "ar" ? "تريد توليفة خاصة؟" : "Want a custom mix?"}</p>
            <h2>{lang === "ar" ? "اصنع صندوقك الخاص خطوة بخطوة" : "Build your own custom dessert box"}</h2>
            <p>{lang === "ar" ? "اختر الحجم ونسق بين النكهات المفضلة والصوصات" : "Choose piece count, combine multiple flavours, and add dipping sauces."}</p>
          </div>
          <a href="/build-your-box" className="cta-build-btn">
            ✨ {lang === "ar" ? "اصنع صندوقك الآن" : "Build a Box"} ↗
          </a>
        </div>
      </section>

      <SiteFooter />
      <PersistentOrderBar onOpenCart={() => { window.location.assign("/cart"); }} />
      <BranchModal isOpen={branchModalOpen} onClose={() => setBranchModalOpen(false)} onSelectBranch={(b) => setBranchId(b.id)} />
    </main>
  );
}
