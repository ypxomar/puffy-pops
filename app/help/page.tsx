"use client";

import { useEffect, useState } from "react";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import ScrollProgress from "../components/ScrollProgress";
import DeliveryStrip from "../components/DeliveryStrip";
import BranchModal from "../components/BranchModal";
import PersistentOrderBar from "../components/PersistentOrderBar";
import { getStoredLanguage, translations, type Language } from "../i18n";
import { ChevronDown, HelpCircle, MapPin, MessageCircle, Phone, Search, ShieldCheck } from "lucide-react";

type FAQ = {
  qEn: string;
  qAr: string;
  aEn: string;
  aAr: string;
  category: "ordering" | "delivery" | "payment" | "catering";
};

const FAQS: FAQ[] = [
  {
    category: "delivery",
    qEn: "How does the exact delivery pin work and why is it important?",
    qAr: "كيف يعمل تحديد الدبوس الدقيق على الخريطة ولماذا هو مهم؟",
    aEn: "Because Egyptian addresses can be tricky, our website asks for an exact map pin at your building entrance. This allows Google Routes to calculate the exact distance to your nearest branch, giving you the real delivery fee with zero hidden surprises.",
    aAr: "نظراً لأن العناوين في مصر قد تحتمل أكثر من مدخل، نطلب منك تحديد الدبوس بدقة عند مدخل عمارة وصولك. هذا يتيح لنظام خرائط جوجل حساب المسافة الدقيقة لأقرب فرع وضمان رسوم توصيل واضحة بلا أي تكاليف خفية.",
  },
  {
    category: "payment",
    qEn: "What payment methods are supported across Alexandria and Cairo?",
    qAr: "ما هي طرق الدفع المدعومة في الإسكندرية والقاهرة؟",
    aEn: "We support: 1. Cash on Delivery (COD) in Egyptian Pounds; 2. Debit / Credit cards and Egyptian national Meeza cards; 3. FawryPay with an 8-digit reference code you can pay at any kiosk or via myFawry; 4. InstaPay 24/7 instant transfer to our IPA (puffypops@instapay).",
    aAr: "ندعم: ١. الدفع نقداً عند الاستلام (COD) بالجنيه المصري؛ ٢. البطاقات البنكية وبطاقات ميزة الوطنية المصرية؛ ٣. فوري باي (FawryPay) بكود دفع من ٨ أرقام للدفع بأي كشك أو تطبيق myFawry؛ ٤. إنستاباي (InstaPay) للتحويل اللحظي على مدار ٢٤ ساعة إلى عنوان puffypops@instapay.",
  },
  {
    category: "ordering",
    qEn: "Can I customize the flavours in my Puffy Pops box?",
    qAr: "هل يمكنني اختيار وتنسيق نكهات معينة في صندوقي؟",
    aEn: "Absolutely! Visit our 'Build a Box' page or choose the 'Half & Half' or 'Family Party Pack' to mix and match Nutella, Pistachio, Lotus, Belgian Chocolate, White Chocolate, and seasonal flavours.",
    aAr: "بالتأكيد! يمكنك زيارة صفحة «اصنع صندوقك» أو اختيار «هاف آند هاف» أو «صندوق العائلة» لاختيار توليفة نكهاتك المفضلة بين النوتيلا، البستاشيو، اللوتس، والشوكولاتة البلجيكية.",
  },
  {
    category: "catering",
    qEn: "Do you cater for birthdays, weddings, or corporate office events?",
    qAr: "هل تقدمون خدمات التحلية والضيافة لأعياد الميلاد والشركات والمناسبات؟",
    aEn: "Yes! We specialize in large gathering party packs (36+ pieces) with custom handwritten gift cards, birthday candles, and live soft serve stations for events. Contact us via WhatsApp at +20 100 201 8510.",
    aAr: "نعم! نوفر صناديق التجمعات الكبيرة (٣٦ قطعة فأكثر)، مع كروت إهداء مجانية، شموع احتفال، وإمكانية حجز محطات سوفت سيرف للفعاليات. تواصل معنا مباشرة عبر واتساب: 01002018510.",
  },
  {
    category: "ordering",
    qEn: "How are Puffy Pops prepared and served?",
    qAr: "كيف يتم تحضير وتقديم بوفي بوبس؟",
    aEn: "Every single dough batch is mixed, proofed, and baked fresh every 20 minutes across all our 5 branches. Your order is finished with warm fillings and toppings the moment your courier is dispatched.",
    aAr: "يتم عجن وخبز الدفعات طازجة كل ٢٠ دقيقة في جميع فروعنا الخمسة. وتوضع الحشوات والصوصات الدافئة فور تأكيد وانطلاق المندوب لتصلك بأعلى طزاجة وجودة.",
  },
];

const DELIVERY_AREAS = {
  alexandria: [
    "Kafr Abdo",
    "Smouha",
    "Roushdy",
    "Gleem",
    "Sidi Gaber",
    "Sporting",
    "Cleopatra",
    "Ibrahimia",
    "Stanley",
    "Loran",
    "San Stefano",
    "Green Plaza Mall Area",
  ],
  cairo: [
    "Sheikh Zayed",
    "Arkan Plaza & Market St.",
    "Beverly Hills",
    "Westown",
    "Palm Hills",
    "6th of October City",
    "Golf Central Mall Area",
    "Hadayek El Ahram",
    "Smart Village Area",
  ],
};

export default function HelpPage() {
  const [lang, setLang] = useState<Language>("en");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [districtQuery, setDistrictQuery] = useState("");
  const [areaCheckResult, setAreaCheckResult] = useState<string | null>(null);
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

  const checkArea = () => {
    const q = districtQuery.trim().toLowerCase();
    if (!q) return;

    const inAlex = DELIVERY_AREAS.alexandria.some((a) => a.toLowerCase().includes(q));
    const inCairo = DELIVERY_AREAS.cairo.some((a) => a.toLowerCase().includes(q));

    if (inAlex) {
      setAreaCheckResult(
        lang === "ar"
          ? "✅ هذه المنطقة مغطاة للتوصيل السريع من فروع الإسكندرية (كفر عبده / سموحة / جرين بلازا)!"
          : "✅ Great news! This area is covered by our Alexandria branches (Kafr Abdo, Smouha, Green Plaza)!"
      );
    } else if (inCairo) {
      setAreaCheckResult(
        lang === "ar"
          ? "✅ هذه المنطقة مغطاة للتوصيل السريع من فروع القاهرة (أركان بلازا بالشيخ زايد / جولف سنترال مول بأكتوبر)!"
          : "✅ Great news! This area is covered by our Cairo branches (Arkan Sheikh Zayed & Golf Central Palm Hills)!"
      );
    } else {
      setAreaCheckResult(
        lang === "ar"
          ? "📍 قد نصل إليك! ضع الدبوس الدقيق عند الدفع للتحقق من المسافة المحسوبة، أو تواصل معنا عبر واتساب."
          : "📍 We might still deliver! Drop your exact pin at checkout or chat with us on WhatsApp to check distance."
      );
    }
  };

  const t = translations[lang];

  return (
    <main className="help-page-view">
      <ScrollProgress />
      <DeliveryStrip onOpenBranchModal={() => setBranchModalOpen(true)} />
      <SiteHeader />

      <section className="help-hero">
        <div className="help-hero-inner">
          <p className="eyebrow">{lang === "ar" ? "مركز المساعدة والدعم" : "Customer Care & Support"}</p>
          <h1>
            {lang === "ar" ? "نحن هنا من أجل" : "Here to make your"} <em>{lang === "ar" ? "سعادتك." : "day sweeter."}</em>
          </h1>
          <p>
            {lang === "ar"
              ? "إجابات على جميع استفسارات الطلب، مناطق التوصيل، طرق الدفع المصرية، ومحادثة مباشرة عبر واتساب."
              : "Direct WhatsApp support, delivery area coverage across Alexandria & Cairo, payment guides, and FAQ answers."}
          </p>
        </div>
      </section>

      {/* Direct Contact Cards */}
      <section className="help-contact-cards-section">
        <div className="contact-cards-grid">
          <div className="help-card primary-wa">
            <span className="h-icon">💬</span>
            <h3>{lang === "ar" ? "الدعم السريع عبر واتساب" : "WhatsApp-First Support"}</h3>
            <p>
              {lang === "ar"
                ? "تحدث مباشرة مع فريق الفرع لمتابعة طلبك أو لأي استفسارات خاصة."
                : "Chat directly with our branch team for immediate order updates and custom requests."}
            </p>
            <a
              href="https://wa.me/201002018510?text=Hi%20Puffy%20Pops!%20I%20have%20a%20question%20about%20ordering."
              target="_blank"
              rel="noreferrer"
              className="wa-action-btn"
            >
              <span>+20 100 201 8510 ↗</span>
            </a>
          </div>

          <div className="help-card">
            <span className="h-icon">📞</span>
            <h3>{lang === "ar" ? "الاتصال الهاتفي المباشر" : "Direct Phone Line"}</h3>
            <p>
              {lang === "ar"
                ? "متاح يومياً من ١٠:٠٠ صباحاً حتى ١:٠٠ صباحاً في جميع الفروع."
                : "Available daily from 10:00 AM to 1:00 AM across all branches."}
            </p>
            <a href="tel:+201002018510" className="phone-action-btn">
              <span>Call +20 100 201 8510</span>
            </a>
          </div>

          <div className="help-card">
            <span className="h-icon">⚡</span>
            <h3>{lang === "ar" ? "تتبع طلبك بالدقيقة" : "Live Order Tracking"}</h3>
            <p>
              {lang === "ar"
                ? "تحقق من مرحلة إعداد طلبك، خروج المندوب، والوقت المتوقع."
                : "Check preparation progress, courier dispatch status and estimated arrival."}
            </p>
            <a href="/track-order" className="track-action-btn">
              <span>{lang === "ar" ? "تتبع الطلب الآن" : "Track Order"} →</span>
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Delivery Area Checker */}
      <section className="delivery-area-checker-section">
        <div className="checker-card">
          <div className="checker-copy">
            <span className="checker-tag">📍 {lang === "ar" ? "فحص التغطية" : "Coverage Checker"}</span>
            <h2>{lang === "ar" ? "هل نوصل لمنطقتك في الإسكندرية أو القاهرة؟" : "Check Your Neighborhood Coverage"}</h2>
            <p>
              {lang === "ar"
                ? "أدخل اسم منطقتك (مثل: كفر عبده، سموحة، الشيخ زايد، ٦ أكتوبر...) للتحقق الفوري."
                : "Type your district (e.g. Kafr Abdo, Smouha, Sheikh Zayed, Palm Hills) to verify coverage."}
            </p>
          </div>

          <div className="checker-input-box">
            <div className="input-group">
              <input
                type="text"
                value={districtQuery}
                onChange={(e) => setDistrictQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkArea()}
                placeholder={lang === "ar" ? "اكتب اسم منطقتك هنا..." : "Enter your district name..."}
              />
              <button type="button" onClick={checkArea}>
                {lang === "ar" ? "تحقق الآن" : "Check Coverage"}
              </button>
            </div>
            {areaCheckResult && (
              <div className="check-result-banner" role="status">
                <p>{areaCheckResult}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="help-faqs-section">
        <div className="faq-section-header">
          <p className="eyebrow">{lang === "ar" ? "الأسئلة الشائعة" : "Got Questions?"}</p>
          <h2>{lang === "ar" ? "إجابات على أكثر ما يسأل عنه عملاؤنا" : "Frequently Asked Questions"}</h2>
        </div>

        <div className="faq-accordion-list">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div className={`faq-card-item ${isOpen ? "open" : ""}`} key={idx}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span>{lang === "ar" ? faq.qAr : faq.qEn}</span>
                  <ChevronDown size={18} className={`chevron-ico ${isOpen ? "rotate" : ""}`} />
                </button>
                {isOpen && (
                  <div className="faq-answer-body">
                    <p>{lang === "ar" ? faq.aAr : faq.aEn}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <SiteFooter />
      <PersistentOrderBar onOpenCart={() => { window.location.assign("/cart"); }} />
      <BranchModal isOpen={branchModalOpen} onClose={() => setBranchModalOpen(false)} />
    </main>
  );
}
