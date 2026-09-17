"use client";

import { useEffect, useState } from "react";
import { branches, type Branch } from "../catalog";
import { BRANCH_KEY } from "../cart";
import { getStoredLanguage, setStoredLanguage, translations, type Language } from "../i18n";

export default function DeliveryStrip({ onOpenBranchModal }: { onOpenBranchModal?: () => void }) {
  const [lang, setLang] = useState<Language>("en");
  const [branchId, setBranchId] = useState("kafr-abdo");

  useEffect(() => {
    setLang(getStoredLanguage());
    const saved = window.localStorage.getItem(BRANCH_KEY);
    if (saved && branches.some((b) => b.id === saved)) {
      setBranchId(saved);
    }
    const handleLang = (e: Event) => {
      const custom = e as CustomEvent<{ lang: Language }>;
      if (custom.detail?.lang) setLang(custom.detail.lang);
    };
    window.addEventListener("puffy-language-change", handleLang);
    return () => window.removeEventListener("puffy-language-change", handleLang);
  }, []);

  const toggleLanguage = () => {
    const next: Language = lang === "en" ? "ar" : "en";
    setLang(next);
    setStoredLanguage(next);
  };

  const branch = branches.find((b) => b.id === branchId) ?? branches[0];
  const t = translations[lang];

  return (
    <aside className="delivery-strip-banner" aria-label="Location and delivery notice">
      <div className="delivery-strip-content">
        <div className="strip-left">
          <span className="strip-pulse-dot" aria-hidden="true" />
          <span className="strip-text">
            <strong>{t.deliveringStrip}</strong>
          </span>
        </div>
        <div className="strip-right">
          <button
            type="button"
            className="strip-branch-pill"
            onClick={onOpenBranchModal}
            aria-label={`${t.deliveringFrom} ${branch.name}. Click to change branch.`}
          >
            <span className="strip-pin-icon" aria-hidden="true">📍</span>
            <span>{branch.name}</span>
            <small>({branch.city === "Alexandria" ? (lang === "ar" ? "الإسكندرية" : "Alex") : (lang === "ar" ? "القاهرة" : "Cairo")})</small>
            <span className="strip-dropdown-arrow" aria-hidden="true">▾</span>
          </button>
          <button
            type="button"
            className="strip-lang-switch"
            onClick={toggleLanguage}
            aria-label={lang === "en" ? "Switch to Arabic language and RTL" : "التبديل إلى اللغة الإنجليزية"}
          >
            {t.switchLanguage}
          </button>
        </div>
      </div>
    </aside>
  );
}
