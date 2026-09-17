"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { branches as fallbackBranches, type Branch } from "../catalog";
import { BRANCH_KEY } from "../cart";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import ScrollProgress from "../components/ScrollProgress";
import DeliveryStrip from "../components/DeliveryStrip";
import BranchModal from "../components/BranchModal";
import PersistentOrderBar from "../components/PersistentOrderBar";
import { distanceKm, nearestBranch } from "../location";
import { getStoredLanguage, translations, type Language } from "../i18n";
import { Clock, MapPin, Navigation, Phone, Sparkles } from "lucide-react";

type PublicBranch = Branch & {
  manager: string;
  employeeCount: number;
  hoursEn?: string;
  hoursAr?: string;
};

const BRANCH_HOURS: Record<string, { hoursEn: string; hoursAr: string; image: string }> = {
  "kafr-abdo": {
    hoursEn: "10:00 AM – 1:00 AM daily",
    hoursAr: "يومياً من ١٠:٠٠ صباحاً حتى ١:٠٠ صباحاً",
    image: "/images/puffy-moments.jpg",
  },
  "smouha": {
    hoursEn: "10:00 AM – 1:30 AM daily",
    hoursAr: "يومياً من ١٠:٠٠ صباحاً حتى ١:٣٠ صباحاً",
    image: "/images/puffy-moments.jpg",
  },
  "green-plaza": {
    hoursEn: "11:00 AM – 12:00 AM daily",
    hoursAr: "يومياً من ١١:٠٠ صباحاً حتى ١٢:٠٠ منتصف الليل",
    image: "/images/puffy-moments.jpg",
  },
  "arkan": {
    hoursEn: "10:00 AM – 1:00 AM daily",
    hoursAr: "يومياً من ١٠:٠٠ صباحاً حتى ١:٠٠ صباحاً",
    image: "/images/puffy-moments.jpg",
  },
  "golf-central": {
    hoursEn: "11:00 AM – 12:30 AM daily",
    hoursAr: "يومياً من ١١:٠٠ صباحاً حتى ١٢:٣٠ بعد منتصف الليل",
    image: "/images/puffy-moments.jpg",
  },
};

export default function LocationsPage() {
  const [lang, setLang] = useState<Language>("en");
  const [branches, setBranches] = useState<PublicBranch[]>(
    fallbackBranches.map((branch) => ({
      ...branch,
      manager: branch.city === "Alexandria" ? "Alexandria Operations" : "Cairo Operations",
      employeeCount: 4,
    }))
  );
  const [selectedId, setSelectedId] = useState("kafr-abdo");
  const [message, setMessage] = useState("Choose a branch or let us find the nearest one.");
  const [locating, setLocating] = useState(false);
  const [activeTab, setActiveTab] = useState<"delivery" | "visit">("delivery");
  const [activeCity, setActiveCity] = useState<"All" | "Alexandria" | "Cairo">("All");
  const [branchModalOpen, setBranchModalOpen] = useState(false);

  useEffect(() => {
    setLang(getStoredLanguage());
    const saved = window.localStorage.getItem(BRANCH_KEY);
    if (saved) setSelectedId(saved);

    fetch("/api/branches", { cache: "no-store" })
      .then(async (response) => (await response.json()) as { branches?: PublicBranch[] })
      .then((data) => {
        if (data.branches?.length) setBranches(data.branches);
      })
      .catch(() => undefined);

    const handleLang = (e: Event) => {
      const custom = e as CustomEvent<{ lang: Language }>;
      if (custom.detail?.lang) setLang(custom.detail.lang);
    };
    window.addEventListener("puffy-language-change", handleLang);
    return () => window.removeEventListener("puffy-language-change", handleLang);
  }, []);

  const select = (branch: PublicBranch) => {
    setSelectedId(branch.id);
    window.localStorage.setItem(BRANCH_KEY, branch.id);
    setMessage(
      lang === "ar"
        ? `تم اختيار فرع ${branch.name}. سيتم فتح منيو هذا الفرع عند الطلب.`
        : `${branch.name} selected. Its local menu will open when you order.`
    );
  };

  const locate = () => {
    if (!navigator.geolocation) {
      return setMessage(lang === "ar" ? "الموقع غير متاح في هذا المتصفح." : "Location is unavailable in this browser.");
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        const nearest = nearestBranch(point);
        const branch = branches.find((entry) => entry.id === nearest.id) ?? branches[0];
        select(branch);
        setMessage(
          lang === "ar"
            ? `فرع ${branch.name} يبعد حوالي ${distanceKm(point, branch).toFixed(1)} كم عنك.`
            : `${branch.name} is about ${distanceKm(point, branch).toFixed(1)} km from you.`
        );
        setLocating(false);
      },
      () => {
        setMessage(
          lang === "ar"
            ? "تعذر قراءة موقعك. يرجى اختيار الفرع من القائمة أدناه."
            : "We could not read your location. Choose a branch below."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filteredBranches = branches.filter((b) => (activeCity === "All" ? true : b.city === activeCity));

  return (
    <main>
      <ScrollProgress />
      <DeliveryStrip onOpenBranchModal={() => setBranchModalOpen(true)} />
      <SiteHeader />

      <section className="subpage-hero locations-hero">
        <p className="eyebrow">{lang === "ar" ? "فروعنا بالقرب منك" : "Good vibes nearby"}</p>
        <h1>
          {lang === "ar" ? "اعثر على" : "Find your"} <em>{lang === "ar" ? "فرع بوفي بوبس." : "Puffy place."}</em>
        </h1>
        <p>
          {lang === "ar"
            ? "لكل فرع فريق عمل حرفي، قائمة طازجة، وخيارات استلام وتوصيل دقيق. اختر فرعك أو دعنا نحدده لك."
            : "Every branch has its own team, local menu, and counter. Pick one manually or use your location."}
        </p>

        <div className="locations-hero-actions">
          <button type="button" onClick={locate} disabled={locating} className="hero-locate-btn">
            {locating ? (lang === "ar" ? "جاري التحديد…" : "Finding you…") : (lang === "ar" ? "تحديد أقرب فرع لي" : "Use my location")}
          </button>
          <span className="location-feedback-msg">{message}</span>
        </div>

        {/* Tab switch: Delivery vs Dine-in / Pickup */}
        <div className="location-purpose-tabs" role="tablist">
          <button
            type="button"
            className={activeTab === "delivery" ? "active" : ""}
            onClick={() => setActiveTab("delivery")}
          >
            🛵 {lang === "ar" ? "توصيل للعنوان (Exact Pin)" : "Order Delivery (Exact Pin)"}
          </button>
          <button
            type="button"
            className={activeTab === "visit" ? "active" : ""}
            onClick={() => setActiveTab("visit")}
          >
            ☕ {lang === "ar" ? "زيارة الفرع والاستلام" : "Visit Us & Counter Pickup"}
          </button>
        </div>
      </section>

      {/* City Filter Pills */}
      <section className="location-city-pills-bar">
        <button
          type="button"
          className={activeCity === "All" ? "pill-active" : ""}
          onClick={() => setActiveCity("All")}
        >
          {lang === "ar" ? "جميع الفروع (٥)" : "All Branches (5)"}
        </button>
        <button
          type="button"
          className={activeCity === "Alexandria" ? "pill-active" : ""}
          onClick={() => setActiveCity("Alexandria")}
        >
          🌊 {lang === "ar" ? "الإسكندرية (٣)" : "Alexandria (3)"}
        </button>
        <button
          type="button"
          className={activeCity === "Cairo" ? "pill-active" : ""}
          onClick={() => setActiveCity("Cairo")}
        >
          🏙️ {lang === "ar" ? "القاهرة والشيخ زايد (٢)" : "Cairo & Sheikh Zayed (2)"}
        </button>
      </section>

      {/* Branches List */}
      <section className="locations-page-list">
        {(["Alexandria", "Cairo"] as const).map((city, cityIndex) => {
          const cityBranches = filteredBranches.filter((branch) => branch.city === city);
          if (!cityBranches.length) return null;
          return (
            <div className="location-city" key={city}>
              <div className="city-label">
                <span>0{cityIndex + 1}</span>
                <h2>{lang === "ar" ? (city === "Alexandria" ? "الإسكندرية" : "القاهرة") : city}</h2>
                <i />
              </div>
              <div className={`location-grid ${city === "Cairo" ? "cairo-grid" : ""}`}>
                {cityBranches.map((branch) => {
                  const hours = BRANCH_HOURS[branch.id] ?? {
                    hoursEn: "10:00 AM – 1:00 AM",
                    hoursAr: "١٠:٠٠ ص – ١:٠٠ ص",
                  };
                  const isSelected = selectedId === branch.id;
                  const waMsg = encodeURIComponent(
                    `Hi Puffy Pops! I'd like to check branch availability for ${branch.name}.`
                  );
                  return (
                    <article
                      className={`location-card expanded ${isSelected ? "selected" : ""}`}
                      key={branch.id}
                    >
                      <div className="location-pin" aria-hidden="true">
                        <i />
                      </div>
                      <div className="branch-content-area">
                        <div className="branch-status-row">
                          <small>{branch.city}</small>
                          <span className="open-now-chip">
                            <span className="dot" />
                            {lang === "ar" ? "مفتوح الآن" : "Open now"}
                          </span>
                        </div>
                        <h3>{branch.name}</h3>
                        <p className="branch-address-text">{branch.address}</p>

                        <div className="branch-hours-row">
                          <Clock size={14} />
                          <span>{lang === "ar" ? hours.hoursAr : hours.hoursEn}</span>
                        </div>

                        <div className="branch-contact-links">
                          <a href={`tel:${branch.phone}`} className="phone-link">
                            <Phone size={14} />
                            <span>{branch.phone}</span>
                          </a>
                          <a
                            href={`https://wa.me/201002018510?text=${waMsg}`}
                            target="_blank"
                            rel="noreferrer"
                            className="wa-link"
                          >
                            <span>WhatsApp ↗</span>
                          </a>
                        </div>

                        <div className="branch-manager">
                          <span>{lang === "ar" ? "إدارة الفرع" : "Branch manager"}</span>
                          <strong>{branch.manager}</strong>
                          <small>{branch.employeeCount || 3} listed team members</small>
                        </div>

                        <div className="branch-subpage-link">
                          <a href={`/locations/${branch.id}`}>
                            {lang === "ar" ? "عرض تفاصيل الفرع والمنيو المحلي ←" : "Branch details & local menu →"}
                          </a>
                        </div>
                      </div>

                      <div className="branch-action-column">
                        <button
                          type="button"
                          className="branch-pick-btn"
                          onClick={() => select(branch)}
                        >
                          {isSelected ? (lang === "ar" ? "الفرع المحدد ✓" : "Selected ✓") : (lang === "ar" ? "اختيار الفرع" : "Choose branch")}
                        </button>
                        <a
                          href={branch.map}
                          target="_blank"
                          rel="noreferrer"
                          className="maps-link-btn"
                          aria-label={`Open ${branch.name} in Google Maps`}
                        >
                          <Navigation size={14} />
                          <span>{lang === "ar" ? "الاتجاهات ↗" : "Map ↗"}</span>
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      <section className="order-banner">
        <div>
          <p className="eyebrow light">{lang === "ar" ? "اخترت فرعك المفضل؟" : "Found your branch?"}</p>
          <h2>{lang === "ar" ? "يلا نطلب حاجة" : "Let’s order something"} <em>{lang === "ar" ? "حلوة ولذيذة." : "puffy."}</em></h2>
        </div>
        <a href="/menu">
          {lang === "ar" ? "افتح منيو الفرع" : "Open its menu"} <span>↗</span>
        </a>
      </section>

      <SiteFooter />
      <PersistentOrderBar onOpenCart={() => { window.location.assign("/cart"); }} />
      <BranchModal isOpen={branchModalOpen} onClose={() => setBranchModalOpen(false)} onSelectBranch={(b) => setSelectedId(b.id)} />
    </main>
  );
}
