"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { branches, formatPrice, menus, talabatImages, type Branch } from "../catalog";
import { BRANCH_KEY, makeLineId, readCart, saveCart, type CartLine } from "../cart";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import ScrollProgress from "../components/ScrollProgress";
import DeliveryStrip from "../components/DeliveryStrip";
import BranchModal from "../components/BranchModal";
import PersistentOrderBar from "../components/PersistentOrderBar";
import { getStoredLanguage, setStoredLanguage, translations, type Language } from "../i18n";
import { Clock, Heart, MapPin, Package, RefreshCw, Settings, Trash2, User } from "lucide-react";

type SavedAddress = {
  id: string;
  label: string;
  district: string;
  street: string;
  building: string;
  floor: string;
  apt: string;
  landmark: string;
};

export default function AccountPage() {
  const [lang, setLang] = useState<Language>("en");
  const [activeTab, setActiveTab] = useState<"orders" | "favourites" | "addresses" | "profile">("orders");
  const [lastOrder, setLastOrder] = useState<{ orderNumber?: string; phone?: string } | null>(null);
  const [branchModalOpen, setBranchModalOpen] = useState(false);

  // Saved Addresses State
  const [addresses, setAddresses] = useState<SavedAddress[]>([
    {
      id: "addr-home",
      label: "Home",
      district: "Kafr Abdo",
      street: "Abd El-Moneim Riad St.",
      building: "Building 35",
      floor: "4th Floor",
      apt: "Apt 402",
      landmark: "Near Kafr Abdo Square",
    },
    {
      id: "addr-work",
      label: "Office / Zayed",
      district: "Sheikh Zayed",
      street: "Arkan Plaza, 26th July Corridor",
      building: "Building 4",
      floor: "2nd Floor",
      apt: "Office 21",
      landmark: "Arkan Market Street entrance",
    },
  ]);

  // Profile preferences
  const [userName, setUserName] = useState("Sweet Tooth Lover");
  const [userPhone, setUserPhone] = useState("01002018510");
  const [waNotifications, setWaNotifications] = useState(true);

  useEffect(() => {
    setLang(getStoredLanguage());
    try {
      const saved = JSON.parse(window.localStorage.getItem("puffy_last_order") ?? "null");
      if (saved) setLastOrder(saved);
      const savedAddrs = JSON.parse(window.localStorage.getItem("puffy_saved_addresses") ?? "null");
      if (Array.isArray(savedAddrs) && savedAddrs.length) setAddresses(savedAddrs);
    } catch {
      /* ignore */
    }

    const handleLang = (e: Event) => {
      const custom = e as CustomEvent<{ lang: Language }>;
      if (custom.detail?.lang) setLang(custom.detail.lang);
    };
    window.addEventListener("puffy-language-change", handleLang);
    return () => window.removeEventListener("puffy-language-change", handleLang);
  }, []);

  const reorderLast = () => {
    const rawCart = readCart();
    const lineId = makeLineId("cairo-nutella", "m-8");
    const next: CartLine[] = [...rawCart, { id: lineId, itemId: "cairo-nutella", variantId: "m-8", quantity: 1 }];
    saveCart(next);
    window.location.assign("/cart");
  };

  const deleteAddress = (id: string) => {
    const next = addresses.filter((a) => a.id !== id);
    setAddresses(next);
    window.localStorage.setItem("puffy_saved_addresses", JSON.stringify(next));
  };

  const t = translations[lang];

  return (
    <main className="account-dashboard-page">
      <ScrollProgress />
      <DeliveryStrip onOpenBranchModal={() => setBranchModalOpen(true)} />
      <SiteHeader />

      <section className="account-hero">
        <div className="account-hero-inner">
          <p className="eyebrow">{lang === "ar" ? "حسابك الشخصي" : "Your Sweet Space"}</p>
          <h1>
            {lang === "ar" ? "أهلاً بك في" : "Welcome to"} <em>{lang === "ar" ? "بوفي بوبس." : "Puffy Pops."}</em>
          </h1>
          <p>
            {lang === "ar"
              ? "تابع طلباتك السابقة، أعِد طلب صندوقك المفضل بضغطة واحدة، وأدِر عناوين التوصيل في مصر."
              : "Review past orders, reorder your favorite box with one tap, and manage your saved Egyptian doorstep addresses."}
          </p>
        </div>
      </section>

      {/* Account Tabs */}
      <div className="account-tabs-wrapper">
        <nav className="account-nav-tabs" role="tablist">
          <button
            type="button"
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            <Package size={17} />
            <span>{lang === "ar" ? "الطلبات السابقة" : "Orders & History"}</span>
          </button>
          <button
            type="button"
            className={activeTab === "favourites" ? "active" : ""}
            onClick={() => setActiveTab("favourites")}
          >
            <Heart size={17} />
            <span>{lang === "ar" ? "المفضلات" : "Favourites"}</span>
          </button>
          <button
            type="button"
            className={activeTab === "addresses" ? "active" : ""}
            onClick={() => setActiveTab("addresses")}
          >
            <MapPin size={17} />
            <span>{lang === "ar" ? "العناوين المحفوظة" : "Saved Addresses"}</span>
          </button>
          <button
            type="button"
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            <User size={17} />
            <span>{lang === "ar" ? "الملف الشخصي" : "Profile & Preferences"}</span>
          </button>
        </nav>

        {/* Tab 1: Orders */}
        {activeTab === "orders" && (
          <section className="account-tab-panel">
            <div className="panel-header">
              <h2>{lang === "ar" ? "سجل طلباتك" : "Recent Orders"}</h2>
              <p>{lang === "ar" ? "إعادة الطلب بنقرة واحدة سريعة" : "One-tap repeat ordering from your last branch"}</p>
            </div>

            {lastOrder?.orderNumber ? (
              <div className="recent-order-card">
                <div className="order-card-meta">
                  <span className="order-status-badge">✓ {lang === "ar" ? "مكتمل ومسلم" : "Fulfilled"}</span>
                  <h3>{lastOrder.orderNumber}</h3>
                  <p>{lang === "ar" ? "صندوق بوفي بوبس مشكل • نوتيلا وبستاشيو" : "Puffy Pops Nutella & Pistachio Box"}</p>
                  <small>Registered phone: {lastOrder.phone || userPhone}</small>
                </div>
                <div className="order-card-actions">
                  <a href={`/track-order`} className="track-link-btn">
                    {lang === "ar" ? "عرض الحالة" : "Track / Receipt"} →
                  </a>
                  <button type="button" className="reorder-btn" onClick={reorderLast}>
                    <RefreshCw size={15} />
                    <span>{lang === "ar" ? "إعادة الطلب فوراً" : "Order Again"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-panel-state">
                <p>{lang === "ar" ? "لم تقم بطلب أي صندوق بعد على هذا الجهاز." : "No orders found on this device yet."}</p>
                <a href="/build-your-box" className="start-box-btn">
                  ✨ {lang === "ar" ? "اصنع أول صندوق لك الآن" : "Build your first box"}
                </a>
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Favourites */}
        {activeTab === "favourites" && (
          <section className="account-tab-panel">
            <div className="panel-header">
              <h2>{lang === "ar" ? "أصنافك المفضلة" : "Your Favourites"}</h2>
              <p>{lang === "ar" ? "أسرع طريق للتحلية التي تعشقها" : "Saved swirls and boxes you love most"}</p>
            </div>

            <div className="favourites-grid">
              <div className="fav-item-card">
                <img src={talabatImages.nutella} alt="Nutella Puffy Pops" />
                <div className="fav-details">
                  <h4>Nutella Puffy Pops</h4>
                  <span>Medium · 8 pieces (EGP 195)</span>
                  <a href="/products/nutella-puffy-pops" className="fav-add-btn">
                    + {lang === "ar" ? "طلب سريع" : "Order"}
                  </a>
                </div>
              </div>

              <div className="fav-item-card">
                <img src="/images/soft-serve-strawberry.png" alt="Strawberry Kiss" />
                <div className="fav-details">
                  <h4>Strawberry Kiss Soft Serve</h4>
                  <span>Waffle Cone (EGP 105)</span>
                  <a href="/products/strawberry-kiss-soft-serve" className="fav-add-btn">
                    + {lang === "ar" ? "طلب سريع" : "Order"}
                  </a>
                </div>
              </div>

              <div className="fav-item-card">
                <img src={talabatImages.assorted} alt="Family Pack" />
                <div className="fav-details">
                  <h4>Family Party Pack (36 pcs)</h4>
                  <span>Party Gathering (EGP 700)</span>
                  <a href="/products/family-pack" className="fav-add-btn">
                    + {lang === "ar" ? "طلب سريع" : "Order"}
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 3: Saved Addresses */}
        {activeTab === "addresses" && (
          <section className="account-tab-panel">
            <div className="panel-header">
              <h2>{lang === "ar" ? "عناوين التوصيل في مصر" : "Saved Doorstep Addresses"}</h2>
              <p>{lang === "ar" ? "تفاصيل دقيقة لوصول المندوب حتى باب العمارة" : "Exact district, building, floor & landmark fields"}</p>
            </div>

            <div className="addresses-list-grid">
              {addresses.map((addr) => (
                <article className="address-entry-card" key={addr.id}>
                  <div className="addr-top-row">
                    <span className="addr-tag-chip">📍 {addr.label}</span>
                    <button
                      type="button"
                      className="delete-addr-btn"
                      onClick={() => deleteAddress(addr.id)}
                      title="Delete Address"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3>{addr.district}</h3>
                  <p>{addr.street}</p>
                  <p className="addr-floor-text">
                    {addr.building} • {addr.floor} • {addr.apt}
                  </p>
                  <small className="addr-landmark">🚩 {addr.landmark}</small>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Tab 4: Profile */}
        {activeTab === "profile" && (
          <section className="account-tab-panel">
            <div className="panel-header">
              <h2>{lang === "ar" ? "بياناتك وتفضيلاتك" : "Profile & Preferences"}</h2>
              <p>{lang === "ar" ? "إعدادات اللغة وإشعارات الواتساب" : "Manage communications and language"}</p>
            </div>

            <div className="profile-form-grid">
              <label>
                <span>{lang === "ar" ? "الاسم" : "Display Name"}</span>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </label>

              <label>
                <span>{lang === "ar" ? "رقم الموبايل المصري (+20)" : "Mobile Number"}</span>
                <input
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                />
              </label>

              <div className="pref-checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={waNotifications}
                    onChange={(e) => setWaNotifications(e.target.checked)}
                  />
                  <span>
                    💬 <strong>{lang === "ar" ? "تفعيل إشعارات حالة الطلب عبر واتساب" : "Enable order status updates via WhatsApp"}</strong>
                  </span>
                </label>
              </div>

              <div className="pref-lang-select-row">
                <span>{lang === "ar" ? "اللغة المفضلة للموقع:" : "Preferred Language:"}</span>
                <div className="lang-btn-group">
                  <button
                    type="button"
                    className={lang === "en" ? "active" : ""}
                    onClick={() => {
                      setLang("en");
                      setStoredLanguage("en");
                    }}
                  >
                    English (LTR)
                  </button>
                  <button
                    type="button"
                    className={lang === "ar" ? "active" : ""}
                    onClick={() => {
                      setLang("ar");
                      setStoredLanguage("ar");
                    }}
                  >
                    العربية (RTL)
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <SiteFooter />
      <PersistentOrderBar onOpenCart={() => { window.location.assign("/cart"); }} />
      <BranchModal isOpen={branchModalOpen} onClose={() => setBranchModalOpen(false)} />
    </main>
  );
}
