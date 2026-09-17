"use client";

/* eslint-disable @next/next/no-img-element */

import { use, useEffect, useState } from "react";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import ScrollProgress from "../../components/ScrollProgress";
import DeliveryStrip from "../../components/DeliveryStrip";
import BranchModal from "../../components/BranchModal";
import PersistentOrderBar from "../../components/PersistentOrderBar";
import { JOURNAL_ARTICLES, type JournalArticle } from "../../journal-data";
import { getStoredLanguage, translations, type Language } from "../../i18n";
import { ArrowLeft, Clock, Share2, Sparkles } from "lucide-react";

export default function JournalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
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

  const article: JournalArticle = JOURNAL_ARTICLES.find((a) => a.slug === slug) ?? JOURNAL_ARTICLES[0];
  const t = translations[lang];

  return (
    <main className="journal-reader-page">
      <ScrollProgress />
      <DeliveryStrip onOpenBranchModal={() => setBranchModalOpen(true)} />
      <SiteHeader />

      <article className="journal-article-container">
        <div className="article-header">
          <div className="article-breadcrumb">
            <a href="/journal">← {lang === "ar" ? "العودة للمجلة" : "Back to Journal"}</a>
            <span>/</span>
            <span>{lang === "ar" ? article.categoryAr : article.categoryEn}</span>
          </div>

          <span className="article-kicker-tag">
            {lang === "ar" ? article.categoryAr : article.categoryEn}
          </span>
          <h1>{lang === "ar" ? article.titleAr : article.titleEn}</h1>

          <div className="article-byline">
            <span className="byline-author">{article.author}</span>
            <span>•</span>
            <span className="byline-date">{article.date}</span>
            <span>•</span>
            <span className="byline-time">
              <Clock size={14} />
              {lang === "ar" ? article.readTimeAr : article.readTimeEn}
            </span>
          </div>
        </div>

        <div className="article-hero-media">
          <img src={article.heroImage} alt={article.titleEn} className="article-main-image" />
        </div>

        <div className="article-body-prose">
          {(lang === "ar" ? article.contentAr : article.contentEn).map((para, idx) => (
            <p key={idx} className={idx === 0 ? "article-lead-paragraph" : ""}>
              {para}
            </p>
          ))}
        </div>

        {article.featuredProductSlug && (
          <aside className="article-product-callout">
            <div className="callout-inner">
              <div className="callout-text">
                <span className="callout-eyebrow">
                  {lang === "ar" ? "جرّب النكهة المذكورة في المقال" : "Taste the Story"}
                </span>
                <h3>{lang === "ar" ? "جاهز لتذوق هذا الصنف طازة؟" : "Order this freshly made from your branch"}</h3>
                <p>
                  {lang === "ar"
                    ? "يتم تحضير الدفعات الطازجة كل ٢٠ دقيقة وتوصيلها فوراً."
                    : "Prepared fresh to order and delivered from your nearest branch."}
                </p>
              </div>
              <a href={`/products/${article.featuredProductSlug}`} className="callout-cta-btn">
                <span>{lang === "ar" ? "اطلب الآن" : "Order this item"}</span>
                <span>→</span>
              </a>
            </div>
          </aside>
        )}
      </article>

      <SiteFooter />
      <PersistentOrderBar onOpenCart={() => { window.location.assign("/cart"); }} />
      <BranchModal isOpen={branchModalOpen} onClose={() => setBranchModalOpen(false)} />
    </main>
  );
}
