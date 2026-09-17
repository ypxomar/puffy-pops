"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import ScrollProgress from "../components/ScrollProgress";
import DeliveryStrip from "../components/DeliveryStrip";
import BranchModal from "../components/BranchModal";
import PersistentOrderBar from "../components/PersistentOrderBar";
import { JOURNAL_ARTICLES, type JournalArticle } from "../journal-data";
import { getStoredLanguage, translations, type Language } from "../i18n";
import { ArrowUpRight, BookOpen, Clock } from "lucide-react";

export default function JournalPage() {
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

  const t = translations[lang];

  return (
    <main className="journal-listing-page">
      <ScrollProgress />
      <DeliveryStrip onOpenBranchModal={() => setBranchModalOpen(true)} />
      <SiteHeader />

      <section className="journal-hero">
        <div className="journal-hero-inner">
          <p className="eyebrow">{lang === "ar" ? "مجلة بوفي بوبس" : "The Puffy Journal"}</p>
          <h1>
            {lang === "ar" ? "حكايات النكهات" : "Flavours, Craft"} &amp; <em>{lang === "ar" ? "لحظات البهجة." : "Sweet Moments."}</em>
          </h1>
          <p className="journal-lead">
            {lang === "ar"
              ? "قصص من قلب مطبخنا الحرفي، أسرار خفق السوفت سيرف، ونصائح ترتيب صناديق العزومات والمناسبات المصرية."
              : "Behind the scenes of our artisanal kitchen, recipes from Alexandria to Cairo, and guides to hosting the sweetest Egyptian gatherings."}
          </p>
        </div>
      </section>

      <section className="journal-articles-grid">
        {JOURNAL_ARTICLES.map((article, index) => {
          return (
            <article className={`journal-card ${index === 0 ? "featured-card" : ""}`} key={article.slug}>
              <div className="journal-img-wrap">
                <img src={article.heroImage} alt={article.titleEn} loading="lazy" />
                <span className="journal-category-tag">
                  {lang === "ar" ? article.categoryAr : article.categoryEn}
                </span>
              </div>
              <div className="journal-card-body">
                <div className="journal-meta">
                  <span>{article.date}</span>
                  <span>•</span>
                  <span className="read-time">
                    <Clock size={13} />
                    {lang === "ar" ? article.readTimeAr : article.readTimeEn}
                  </span>
                </div>
                <h2>
                  <a href={`/journal/${article.slug}`}>
                    {lang === "ar" ? article.titleAr : article.titleEn}
                  </a>
                </h2>
                <p>{lang === "ar" ? article.excerptAr : article.excerptEn}</p>
                <div className="journal-card-footer">
                  <span className="author-name">{article.author}</span>
                  <a href={`/journal/${article.slug}`} className="read-more-btn">
                    {lang === "ar" ? "اقرأ القصة" : "Read Story"} <ArrowUpRight size={16} />
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <SiteFooter />
      <PersistentOrderBar onOpenCart={() => { window.location.assign("/cart"); }} />
      <BranchModal isOpen={branchModalOpen} onClose={() => setBranchModalOpen(false)} />
    </main>
  );
}
