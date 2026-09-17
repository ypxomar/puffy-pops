"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { getStoredLanguage, type Language } from "../i18n";

export default function SiteFooter({ onCart }: { onCart?: () => void }) {
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    setLang(getStoredLanguage());
    const handleLang = (e: Event) => {
      const custom = e as CustomEvent<{ lang: Language }>;
      if (custom.detail?.lang) setLang(custom.detail.lang);
    };
    window.addEventListener("puffy-language-change", handleLang);
    return () => window.removeEventListener("puffy-language-change", handleLang);
  }, []);

  return (
    <footer>
      <div className="footer-brand">
        <img src="/api/media?slot=site-logo" alt="Puffy Pops" />
        <p>Spreading joy, one bite at a time.</p>
        <small className="footer-tagline-sub">
          {lang === "ar"
            ? "حلويات مخبوزة طازة، سوفت سيرف فائق النعومة، وتوصيل دقيق بالدبوس في الإسكندرية والقاهرة."
            : "Handcrafted dessert boxes, ultra-creamy soft serve, and pinpoint doorstep delivery across Alexandria & Cairo."}
        </small>
      </div>

      <div className="footer-links">
        <div>
          <strong>{lang === "ar" ? "استكشف" : "Explore"}</strong>
          <a href="/menu">{lang === "ar" ? "المنيو" : "Menu"}</a>
          <a href="/build-your-box">{lang === "ar" ? "اصنع صندوقك" : "Build a Box"}</a>
          <a href="/collections/puffy-pops">{lang === "ar" ? "صناديق بوفي" : "Puffy Pops"}</a>
          <a href="/collections/soft-serve">{lang === "ar" ? "سوفت سيرف" : "Soft Serve"}</a>
          <a href="/locations">{lang === "ar" ? "فروعنا" : "Locations"}</a>
          <a href="/story">{lang === "ar" ? "قصتنا" : "Our story"}</a>
          <a href="/journal">{lang === "ar" ? "المجلة" : "Journal"}</a>
        </div>

        <div>
          <strong>{lang === "ar" ? "الطلب والمساعدة" : "Order"}</strong>
          {onCart ? (
            <button type="button" onClick={onCart}>
              {lang === "ar" ? "طلبي الحالي" : "My order"}
            </button>
          ) : (
            <a href="/menu">{lang === "ar" ? "ابدأ طلباً" : "Start an order"}</a>
          )}
          <a href="/track-order">{lang === "ar" ? "تتبع طلبك" : "Track an order"}</a>
          <a href="/help">{lang === "ar" ? "المساعدة والأسئلة" : "Help & Delivery Areas"}</a>
          <a href="https://wa.me/201002018510" target="_blank" rel="noreferrer">
            WhatsApp Support ↗
          </a>
          <a href="tel:+201002018510">Call +20 100 201 8510</a>
        </div>

        <div>
          <strong>{lang === "ar" ? "معلومات هامة" : "Legal & Care"}</strong>
          <a href="/legal/privacy">{lang === "ar" ? "الخصوصية" : "Privacy Policy"}</a>
          <a href="/legal/terms">{lang === "ar" ? "الشروط والأحكام" : "Terms of Service"}</a>
          <a href="/legal/shipping-delivery">{lang === "ar" ? "التوصيل ومناطق الخدمة" : "Shipping & Delivery"}</a>
          <a href="/legal/returns-refunds">{lang === "ar" ? "ضمان الجودة والاسترجاع" : "Refunds Guarantee"}</a>
          <a href="/legal/allergens">{lang === "ar" ? "دليل مسببات الحساسية" : "Allergen Guide"}</a>
          <a href="/legal/cookies">{lang === "ar" ? "إعدادات ملفات الارتباط" : "Cookie Preferences"}</a>
        </div>

        <div>
          <strong>Social</strong>
          <a href="https://www.instagram.com/puffypopseg/" target="_blank" rel="noreferrer">
            Instagram ↗
          </a>
          <a href="https://www.tiktok.com/@puffypopseg" target="_blank" rel="noreferrer">
            TikTok ↗
          </a>
          <div className="footer-payment-badges">
            <span className="badge-tag">Meeza</span>
            <span className="badge-tag">Fawry</span>
            <span className="badge-tag">InstaPay</span>
            <span className="badge-tag">COD</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Puffy Pops</span>
        <span>Made for sweet moments in Egypt • Alexandria & Cairo</span>
      </div>
    </footer>
  );
}
