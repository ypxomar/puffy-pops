"use client";

/* eslint-disable @next/next/no-img-element */

import { use, useEffect, useState } from "react";
import { branches, formatPrice, menus, type Branch, type CityId } from "../../catalog";
import { BRANCH_KEY } from "../../cart";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import ScrollProgress from "../../components/ScrollProgress";
import DeliveryStrip from "../../components/DeliveryStrip";
import BranchModal from "../../components/BranchModal";
import PersistentOrderBar from "../../components/PersistentOrderBar";
import { getStoredLanguage, translations, type Language } from "../../i18n";
import { Clock, MapPin, Navigation, Phone, Share2, Sparkles, Utensils } from "lucide-react";

export default function BranchDetailPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch: branchSlug } = use(params);
  const [lang, setLang] = useState<Language>("en");
  const [branchModalOpen, setBranchModalOpen] = useState(false);

  useEffect(() => {
    setLang(getStoredLanguage());
    const handleLang = (e: Event) => {
      const custom = e as CustomEvent<{ lang: Language }>;
      if (custom.detail?.lang) setLang(custom.detail.lang);
    };
    window.addEventListener("puffy-language-change", handleLang);
    return () => window.removeEventListener("puffy-language-change", handleLang);
  }, []);

  const branch = branches.find((b) => b.id === branchSlug) ?? branches[0];
  const cityId: CityId = branch.cityId;
  const cityMenu = menus[cityId];
  const popularItems = cityMenu.items.slice(0, 4);

  const selectThisBranch = () => {
    window.localStorage.setItem(BRANCH_KEY, branch.id);
    window.location.assign("/menu");
  };

  const t = translations[lang];

  return (
    <main className="branch-detail-page">
      <ScrollProgress />
      <DeliveryStrip onOpenBranchModal={() => setBranchModalOpen(true)} />
      <SiteHeader />

      <section className="branch-hero-strip">
        <div className="branch-hero-container">
          <div className="branch-breadcrumb">
            <a href="/locations">← {lang === "ar" ? "كل الفروع" : "All Locations"}</a>
            <span>/</span>
            <span>{branch.name}</span>
          </div>

          <div className="branch-hero-main">
            <div>
              <div className="branch-open-badge">
                <span className="dot-green" />
                <span>{lang === "ar" ? "مفتوح الآن • حتى ١:٠٠ ص" : "Open Now • Closes at 1:00 AM"}</span>
              </div>
              <h1>{branch.name}</h1>
              <p className="branch-city-lead">
                {branch.city === "Alexandria" ? (lang === "ar" ? "الإسكندرية • عروس البحر المتوسط" : "Alexandria • Coastal Joy") : (lang === "ar" ? "القاهرة • طاقة المدينة" : "Cairo • Metropolitan Sweet Spot")}
              </p>
              <p className="branch-exact-address">📍 {branch.address}</p>
            </div>

            <div className="branch-hero-actions">
              <button type="button" className="order-here-primary-btn" onClick={selectThisBranch}>
                <span>{lang === "ar" ? "اطلب من هذا الفرع" : "Order from this branch"}</span>
                <span>→</span>
              </button>
              <a href={branch.map} target="_blank" rel="noreferrer" className="directions-secondary-btn">
                <Navigation size={16} />
                <span>{lang === "ar" ? "الاتجاهات على خرائط جوجل" : "Google Maps Directions"} ↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Branch Details Grid */}
      <section className="branch-info-section">
        <div className="branch-cards-grid">
          <div className="b-info-card">
            <Clock size={24} className="b-icon" />
            <h3>{lang === "ar" ? "ساعات العمل والتوصيل" : "Operating Hours"}</h3>
            <p><strong>{lang === "ar" ? "يومياً:" : "Daily:"}</strong> 10:00 AM – 1:00 AM</p>
            <small>{lang === "ar" ? "تحضير فوري طازة كل ٢٠ دقيقة" : "Fresh batches prepared every 20 minutes"}</small>
          </div>

          <div className="b-info-card">
            <Phone size={24} className="b-icon" />
            <h3>{lang === "ar" ? "التواصل المباشر والواتساب" : "Direct Contact"}</h3>
            <p><a href={`tel:${branch.phone}`}>{branch.phone}</a></p>
            <p>
              <a
                href={`https://wa.me/201002018510?text=Hi%20Puffy%20Pops!%20I'm%20reaching%20out%20to%20the%20${encodeURIComponent(branch.name)}%20branch.`}
                target="_blank"
                rel="noreferrer"
                className="wa-link"
              >
                Chat on WhatsApp ↗
              </a>
            </p>
          </div>

          <div className="b-info-card">
            <MapPin size={24} className="b-icon" />
            <h3>{lang === "ar" ? "التوصيل والاستلام" : "Fulfilment & Delivery"}</h3>
            <p>{lang === "ar" ? "توصيل بالدبوس الدقيق لمحيط الفرع بالكامل" : "Exact map pin delivery to your building"}</p>
            <small>{lang === "ar" ? "استلام فوري من الكاونتر متاح بدون رسوم" : "Counter pickup available with no wait"}</small>
          </div>
        </div>
      </section>

      {/* Local Menu Highlights */}
      <section className="branch-menu-highlights">
        <div className="section-title-wrap">
          <p className="eyebrow">{lang === "ar" ? `منيو فرع ${branch.name}` : `Local ${branch.city} Menu`}</p>
          <h2>{lang === "ar" ? "أكثر الأصناف طلباً في هذا الفرع" : "Most Ordered at This Branch"}</h2>
        </div>

        <div className="branch-items-strip">
          {popularItems.map((item) => (
            <div className="b-popular-card" key={item.id}>
              <div className="b-card-img">
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <span>{item.category === "puffy-pops" ? "PP" : item.name.charAt(0)}</span>
                )}
              </div>
              <div className="b-card-text">
                <h4>{item.name}</h4>
                <strong>{formatPrice(item.variants[0]?.price ?? 180)}</strong>
                <button type="button" onClick={selectThisBranch} className="b-order-btn">
                  {lang === "ar" ? "اطلب الآن" : "Order now"} +
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
      <PersistentOrderBar onOpenCart={() => { window.location.assign("/cart"); }} />
      <BranchModal isOpen={branchModalOpen} onClose={() => setBranchModalOpen(false)} onSelectBranch={() => selectThisBranch()} />
    </main>
  );
}
