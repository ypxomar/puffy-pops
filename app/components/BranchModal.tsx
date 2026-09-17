"use client";

import { useEffect, useState } from "react";
import { branches, type Branch, type CityId } from "../catalog";
import { BRANCH_KEY, CART_KEY, readCart, saveCart } from "../cart";
import { distanceKm, nearestBranch } from "../location";
import { getStoredLanguage, translations, type Language } from "../i18n";

export default function BranchModal({
  isOpen,
  onClose,
  onSelectBranch,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectBranch?: (branch: Branch) => void;
}) {
  const [lang, setLang] = useState<Language>("en");
  const [selectedId, setSelectedId] = useState("kafr-abdo");
  const [activeCity, setActiveCity] = useState<"Alexandria" | "Cairo">("Alexandria");
  const [locating, setLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState("");

  useEffect(() => {
    setLang(getStoredLanguage());
    const saved = window.localStorage.getItem(BRANCH_KEY);
    if (saved && branches.some((b) => b.id === saved)) {
      setSelectedId(saved);
      const b = branches.find((entry) => entry.id === saved);
      if (b) setActiveCity(b.city);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const t = translations[lang];

  const handleSelect = (branch: Branch) => {
    const currentBranch = branches.find((b) => b.id === selectedId);
    if (currentBranch && currentBranch.cityId !== branch.cityId) {
      const cart = readCart();
      if (cart.length) {
        const msg = lang === "ar"
          ? "القاهرة والإسكندرية لهما منيو وأسعار مختلفة. هل تريد تغيير المدينة وتفريغ السلة الحالية؟"
          : "Cairo and Alexandria have different menus and prices. Switch city and reset current cart?";
        if (!window.confirm(msg)) return;
        saveCart([]);
      }
    }
    setSelectedId(branch.id);
    window.localStorage.setItem(BRANCH_KEY, branch.id);
    window.dispatchEvent(new CustomEvent("puffy-branch-change", { detail: { branch } }));
    onSelectBranch?.(branch);
    onClose();
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice(lang === "ar" ? "الموقع الجغرافي غير مدعوم في متصفحك." : "Geolocation is not supported in this browser.");
      return;
    }
    setLocating(true);
    setGeoNotice(lang === "ar" ? "جاري تحديد موقعك..." : "Detecting your location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        const closest = nearestBranch(coords);
        const dist = distanceKm(coords, closest);
        setLocating(false);
        setActiveCity(closest.city);
        setGeoNotice(lang === "ar" ? `أقرب فرع هو ${closest.name} (حوالي ${dist.toFixed(1)} كم)` : `Closest branch is ${closest.name} (~${dist.toFixed(1)} km)`);
        handleSelect(closest);
      },
      () => {
        setLocating(false);
        setGeoNotice(lang === "ar" ? "تعذر قراءة موقعك. الرجاء اختيار الفرع يدوياً." : "Could not determine location. Please select manually.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="branch-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="branch-modal-title">
      <div className="branch-modal-backdrop" onClick={onClose} />
      <div className="branch-modal-window">
        <div className="branch-modal-header">
          <div>
            <span className="branch-modal-kicker">
              {lang === "ar" ? "اختر فرع بوفي بوبس" : "Select Your Nearest Puffy Branch"}
            </span>
            <h2 id="branch-modal-title">
              {lang === "ar" ? "منيو مدينتك، طازة من أقرب فرع" : "Local Menus & Exact Delivery"}
            </h2>
          </div>
          <button type="button" className="branch-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="branch-modal-geo-bar">
          <button type="button" className="branch-geo-btn" onClick={useMyLocation} disabled={locating}>
            <span aria-hidden="true">📍</span>
            <span>{locating ? (lang === "ar" ? "جاري البحث..." : "Locating...") : (lang === "ar" ? "تحديد أقرب فرع تلقائياً" : "Find nearest branch for me")}</span>
          </button>
          {geoNotice && <p className="branch-geo-notice">{geoNotice}</p>}
        </div>

        <div className="branch-city-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeCity === "Alexandria"}
            className={activeCity === "Alexandria" ? "active" : ""}
            onClick={() => setActiveCity("Alexandria")}
          >
            🌊 {lang === "ar" ? "الإسكندرية (٣ فروع)" : "Alexandria (3 branches)"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCity === "Cairo"}
            className={activeCity === "Cairo" ? "active" : ""}
            onClick={() => setActiveCity("Cairo")}
          >
            🏙️ {lang === "ar" ? "القاهرة (فرعان)" : "Cairo (2 branches)"}
          </button>
        </div>

        <div className="branch-list-grid">
          {branches
            .filter((b) => b.city === activeCity)
            .map((b) => {
              const isSelected = b.id === selectedId;
              return (
                <div
                  key={b.id}
                  className={`branch-choice-card ${isSelected ? "is-selected" : ""}`}
                  onClick={() => handleSelect(b)}
                >
                  <div className="branch-choice-top">
                    <div>
                      <span className="branch-status-tag">
                        <span className="status-dot-green" />
                        {lang === "ar" ? "مفتوح الآن • حتى ١:٠٠ ص" : "Open Now • Until 1:00 AM"}
                      </span>
                      <h3>{b.name}</h3>
                      <p className="branch-choice-address">{b.address}</p>
                    </div>
                    {isSelected && <span className="branch-choice-badge">✓ {lang === "ar" ? "محدد" : "Selected"}</span>}
                  </div>
                  <div className="branch-choice-footer">
                    <span className="branch-phone-link">{b.phone}</span>
                    <button type="button" className="branch-select-action">
                      {isSelected ? (lang === "ar" ? "تأكيد الفرع" : "Current Branch") : (lang === "ar" ? "اختيار هذا الفرع" : "Order from here →")}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
