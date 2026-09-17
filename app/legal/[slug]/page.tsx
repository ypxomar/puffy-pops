"use client";

import { use, useEffect, useState } from "react";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import ScrollProgress from "../../components/ScrollProgress";
import DeliveryStrip from "../../components/DeliveryStrip";
import BranchModal from "../../components/BranchModal";
import PersistentOrderBar from "../../components/PersistentOrderBar";
import { getStoredLanguage, translations, type Language } from "../../i18n";
import { Check, ShieldCheck } from "lucide-react";

type LegalDoc = {
  titleEn: string;
  titleAr: string;
  categoryEn: string;
  categoryAr: string;
  sectionsEn: Array<{ title: string; body: string }>;
  sectionsAr: Array<{ title: string; body: string }>;
};

const LEGAL_DOCS: Record<string, LegalDoc> = {
  privacy: {
    titleEn: "Privacy Policy",
    titleAr: "سياسة الخصوصية وحماية البيانات",
    categoryEn: "Legal & Compliance",
    categoryAr: "القوانين والامتثال",
    sectionsEn: [
      {
        title: "1. Information We Collect",
        body: "We collect only the essential information needed to fulfill your dessert order: customer name, Egyptian phone number, building doorstep delivery address, and Google Maps pin coordinates.",
      },
      {
        title: "2. How We Use Your Data",
        body: "Your phone number is used exclusively for courier dispatch and WhatsApp order status updates. We never sell, rent, or distribute your personal data to third-party marketing brokers.",
      },
      {
        title: "3. Location Information",
        body: "Delivery pin coordinates are utilized strictly at checkout to calculate the accurate road distance from your nearest Puffy Pops branch. Location tracking is never active in the background.",
      },
      {
        title: "4. Egypt Data Protection",
        body: "Our operations comply with Egyptian Law No. 151 of 2020 on the Protection of Personal Data, maintaining encrypted databases and secure payment gateway integrations.",
      },
    ],
    sectionsAr: [
      {
        title: "١. المعلومات التي نجمعها",
        body: "نجمع فقط البيانات الضرورية لتنفيذ وتوصيل طلبك: اسم العميل، رقم الموبايل المصري، عنوان التوصيل حتى باب العمارة، وإحداثيات الدبوس على الخريطة.",
      },
      {
        title: "٢. كيف نستخدم بياناتك",
        body: "يستخدم رقم هاتفك فقط لإتمام التواصل مع المندوب وإرسال تحديثات حالة الطلب عبر واتساب. لا نقوم إطلاقاً ببيع أو مشاركة بياناتك مع أطراف تسويقية خارجية.",
      },
      {
        title: "٣. بيانات الموقع الجغرافي",
        body: "تستخدم إحداثيات الدبوس فقط عند إتمام الطلب لحساب المسافة الحقيقية من أقرب فرع لـ بوفي بوبس. لا يتم تتبع موقعك في الخلفية بأي شكل.",
      },
      {
        title: "٤. حماية البيانات في مصر",
        body: "نلتزم بأحكام القانون المصري رقم ١٥١ لسنة ٢٠٢٠ بشأن حماية البيانات الشخصية، ونستخدم قواعد بيانات مشفرة وبوابات دفع معتمدة.",
      },
    ],
  },
  terms: {
    titleEn: "Terms of Service",
    titleAr: "الشروط والأحكام",
    categoryEn: "Storefront Agreement",
    categoryAr: "اتفاقية الاستخدام",
    sectionsEn: [
      {
        title: "1. Order Acceptance & Branch Routing",
        body: "All orders placed on puffypops.eg are subject to branch capacity and fresh dough batch availability. Orders are routed automatically to the closest operational branch in Alexandria or Cairo.",
      },
      {
        title: "2. Pricing & Currency",
        body: "All prices on our menu are displayed in Egyptian Pounds (EGP / ج.م.) and include standard 14% Egyptian Value Added Tax (VAT). Delivery fees are calculated dynamically based on Google road distance.",
      },
      {
        title: "3. Payment Terms",
        body: "We accept Cash on Delivery (COD), Card/Meeza, FawryPay, and InstaPay. Fawry reference codes remain valid for 2 hours before reservation expiration.",
      },
    ],
    sectionsAr: [
      {
        title: "١. قبول الطلبات وتوجيه الفروع",
        body: "تخضع جميع الطلبات على الموقع لطاقة الفرع وتوفر دفعات العجين الطازجة. يتم توجيه الطلب تلقائياً لأقرب فرع يعمل في الإسكندرية أو القاهرة.",
      },
      {
        title: "٢. الأسعار والعملة",
        body: "تظهر جميع الأسعار بالجنيه المصري (ج.م / EGP) وتشمل ضريبة القيمة المضافة المصرية بنسبة ١٤٪. تُحسب رسوم التوصيل وفقاً للمسافة الحقيقية بالخرائط.",
      },
      {
        title: "٣. شروط الدفع",
        body: "نقبل الدفع عند الاستلام، البطاقات وبطاقة ميزة، فوري باي، وإنستاباي. يظل كود فوري صالحاً لمدة ساعتين قبل إلغاء الحجز تلقائياً.",
      },
    ],
  },
  "shipping-delivery": {
    titleEn: "Shipping & Delivery Policy",
    titleAr: "سياسة الشحن والتوصيل",
    categoryEn: "Fulfilment Guidance",
    categoryAr: "إرشادات التوصيل",
    sectionsEn: [
      {
        title: "1. Delivery Hours",
        body: "Delivery operates daily from 10:00 AM to 1:00 AM across Alexandria and Cairo branches. Peak hours (such as weekend evenings) may involve an estimated 35-50 minute window.",
      },
      {
        title: "2. Pinpoint Doorstep Delivery",
        body: "To ensure your warm dessert box arrives in prime condition, couriers navigate directly to the entrance pin you place on our map. Please include your floor and apartment number.",
      },
      {
        title: "3. Delivery Radius & Fees",
        body: "Delivery fees start from EGP 35 and follow a transparent distance formula (per extra km). Orders beyond maximum branch coverage will prompt an alert before payment.",
      },
    ],
    sectionsAr: [
      {
        title: "١. ساعات التوصيل",
        body: "يعمل التوصيل يومياً من ١٠:٠٠ صباحاً حتى ١:٠٠ صباحاً في جميع فروع الإسكندرية والقاهرة. في أوقات الذروة تتراوح مدة الوصول بين ٣٥ إلى ٥٠ دقيقة.",
      },
      {
        title: "٢. التوصيل بالدبوس الدقيق",
        body: "لضمان وصول الصندوق ساخناً وبحالة مثالية، يتجه المندوب مباشرة إلى الدبوس المحدد على الخريطة. يرجى تدوين رقم الدور والشقة.",
      },
      {
        title: "٣. نطاق التوصيل والرسوم",
        body: "تبدأ رسوم التوصيل من ٣٥ جنيهاً وتتبع معادلة مسافة شفافة لكل كم إضافي بدون أي رسوم خفية.",
      },
    ],
  },
  "returns-refunds": {
    titleEn: "Returns & Fresh Food Guarantee",
    titleAr: "ضمان الجودة والاسترجاع",
    categoryEn: "Fresh Guarantee",
    categoryAr: "ضمان الطزاجة",
    sectionsEn: [
      {
        title: "1. 100% Handcrafted Joy Guarantee",
        body: "If your Puffy Pops box arrives cold, incorrect, or damaged in transit, contact our WhatsApp support within 45 minutes of delivery. We will immediately replace the box or issue a full refund.",
      },
      {
        title: "2. Order Cancellation Window",
        body: "Orders may be cancelled free of charge through the Track Order page as long as the status remains 'Order received' or 'Accepted', before kitchen preparation begins.",
      },
    ],
    sectionsAr: [
      {
        title: "١. ضمان السعادة والجودة ١٠٠٪",
        body: "إذا وصل صندوقك بارداً، غير مطابق، أو تضرر أثناء النقل، تواصل معنا عبر واتساب خلال ٤٥ دقيقة من الاستلام وسنقوم فوراً بإعادة إرسال صندوق جديد أو رد المبلغ بالكامل.",
      },
      {
        title: "٢. مهلة إلغاء الطلب",
        body: "يمكنك إلغاء الطلب مجاناً عبر صفحة «تتبع طلبك» طالما كانت الحالة «تم استلام الطلب» أو «مقبول»، وذلك قبل بدء التجهيز والخبز في المطبخ.",
      },
    ],
  },
  allergens: {
    titleEn: "Allergen & Dietary Guide",
    titleAr: "دليل مسببات الحساسية والمكونات",
    categoryEn: "Health & Nutrition",
    categoryAr: "الصحة والتغذية",
    sectionsEn: [
      {
        title: "1. Core Ingredients",
        body: "Our signature dough contains premium wheat flour, dairy milk, pasteurized eggs, yeast, and sugar. It does not contain animal lard or alcohol.",
      },
      {
        title: "2. Nut Information",
        body: "Pistachio Puffy Pops, Nutella (hazelnut), and Mordjene contain real tree nuts. While we maintain clean separated prep zones, cross-contact in a shared bakery kitchen may occur.",
      },
      {
        title: "3. Soft Serve Ingredients",
        body: "Our soft serve is made from 100% pasteurized Egyptian cow's milk and dairy cream. Strawberry Kiss contains real fruit puree. Pistachio Dream contains roasted tree nuts.",
      },
    ],
    sectionsAr: [
      {
        title: "١. المكونات الأساسية",
        body: "عجينة بوفي بوبس تحتوي على دقيق القمح الفاخر، حليب طبيعي، بيض مبستر، خميرة، وسكر. خالية تماماً من الدهون الحيوانية غير النقية.",
      },
      {
        title: "٢. معلومات المكسرات",
        body: "بستاشيو بوفي بوبس، النوتيلا (بندق)، والمورجان تحتوي على مكسرات حقيقية. يرجى توخي الحذر عند وجود حساسية مفرطة من المكسرات.",
      },
      {
        title: "٣. مكونات السوفت سيرف",
        body: "يُصنع السوفت سيرف من حليب وقشطة طبيعية مبسترة ١٠٠٪. نكهة ستروبري كيس تحتوي على بيوريه فاكهة طبيعي، ونكهة بستاشيو دريم تحتوي على فستق حلبي محمص.",
      },
    ],
  },
  cookies: {
    titleEn: "Cookie Preferences",
    titleAr: "إعدادات ملفات تعريف الارتباط (Cookies)",
    categoryEn: "Preferences",
    categoryAr: "التفضيلات",
    sectionsEn: [
      {
        title: "1. Essential Cookies",
        body: "Required for shopping cart memory, branch selection, and language preference. These cannot be disabled.",
      },
      {
        title: "2. Analytics & Performance",
        body: "Helps us understand how customers navigate menu categories and checkout without capturing any personal information.",
      },
    ],
    sectionsAr: [
      {
        title: "١. ملفات الارتباط الأساسية",
        body: "ضرورية لحفظ عناصر السلة، الفرع المختار، واللغة المفضلة. لا يمكن تعطيلها لضمان عمل الموقع بشكل صحيح.",
      },
      {
        title: "٢. التحليلات والأداء",
        body: "تساعدنا على فهم كيفية تصفح العملاء للأصناف لتحسين سرعة التوصيل وتجربة الطلب، بدون جمع أي بيانات حساسة.",
      },
    ],
  },
};

export default function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [lang, setLang] = useState<Language>("en");
  const [branchModalOpen, setBranchModalOpen] = useState(false);

  // Cookie manager state if slug === "cookies"
  const [essentialCookies, setEssentialCookies] = useState(true);
  const [analyticsCookies, setAnalyticsCookies] = useState(true);
  const [cookieSaved, setCookieSaved] = useState(false);

  useEffect(() => {
    setLang(getStoredLanguage());
    const handleLang = (e: Event) => {
      const custom = e as CustomEvent<{ lang: Language }>;
      if (custom.detail?.lang) setLang(custom.detail.lang);
    };
    window.addEventListener("puffy-language-change", handleLang);
    return () => window.removeEventListener("puffy-language-change", handleLang);
  }, []);

  const doc = LEGAL_DOCS[slug] ?? LEGAL_DOCS.privacy;
  const sections = lang === "ar" ? doc.sectionsAr : doc.sectionsEn;

  const saveCookiePrefs = () => {
    setCookieSaved(true);
    setTimeout(() => setCookieSaved(false), 3000);
  };

  const t = translations[lang];

  return (
    <main className="legal-doc-page">
      <ScrollProgress />
      <DeliveryStrip onOpenBranchModal={() => setBranchModalOpen(true)} />
      <SiteHeader />

      <article className="legal-container">
        <div className="legal-header">
          <div className="legal-breadcrumbs">
            <a href="/">← {lang === "ar" ? "الرئيسية" : "Home"}</a>
            <span>/</span>
            <span>{lang === "ar" ? doc.categoryAr : doc.categoryEn}</span>
          </div>

          <span className="legal-tag">{lang === "ar" ? doc.categoryAr : doc.categoryEn}</span>
          <h1>{lang === "ar" ? doc.titleAr : doc.titleEn}</h1>
          <p className="legal-last-updated">
            {lang === "ar" ? "آخر تحديث: سبتمبر ٢٠٢٦ • مصر" : "Last updated: September 2026 • Egypt"}
          </p>
        </div>

        {/* Legal Quick Nav Links */}
        <nav className="legal-links-bar" aria-label="Legal Documents">
          {Object.entries(LEGAL_DOCS).map(([sKey, sDoc]) => (
            <a
              key={sKey}
              href={`/legal/${sKey}`}
              className={`legal-nav-link ${sKey === slug ? "active" : ""}`}
            >
              {lang === "ar" ? sDoc.titleAr : sDoc.titleEn}
            </a>
          ))}
        </nav>

        {/* Cookie Manager Component if on /legal/cookies */}
        {slug === "cookies" && (
          <div className="cookie-manager-box">
            <h3>{lang === "ar" ? "إدارة التفضيلات التفاعلية" : "Interactive Preferences"}</h3>
            <div className="cookie-opt-row">
              <div>
                <strong>{lang === "ar" ? "ملفات الارتباط الضرورية" : "Strictly Necessary"}</strong>
                <p>{lang === "ar" ? "لا يمكن إيقافها، تحفظ محتويات صندوقك والفرع." : "Required for cart and location storage."}</p>
              </div>
              <input type="checkbox" checked={essentialCookies} disabled />
            </div>
            <div className="cookie-opt-row">
              <div>
                <strong>{lang === "ar" ? "تحليلات الأداء والتجربة" : "Performance Analytics"}</strong>
                <p>{lang === "ar" ? "تساعدنا على تحسين سرعة التطبيق وجودة الخدمة." : "Helps optimize loading speeds and user experience."}</p>
              </div>
              <input
                type="checkbox"
                checked={analyticsCookies}
                onChange={(e) => setAnalyticsCookies(e.target.checked)}
              />
            </div>
            <button type="button" className="save-cookies-btn" onClick={saveCookiePrefs}>
              {cookieSaved ? (
                <>
                  <Check size={16} /> {lang === "ar" ? "تم الحفظ بنجاح!" : "Preferences Saved!"}
                </>
              ) : (
                <span>{lang === "ar" ? "حفظ التفضيلات" : "Save Preferences"}</span>
              )}
            </button>
          </div>
        )}

        {/* Document Sections */}
        <div className="legal-sections-content">
          {sections.map((sec, idx) => (
            <section className="legal-section-block" key={idx}>
              <h2>{sec.title}</h2>
              <p>{sec.body}</p>
            </section>
          ))}
        </div>

        <div className="legal-footer-note">
          <ShieldCheck size={20} />
          <p>
            {lang === "ar"
              ? "إذا كان لديك أي استفسار قانوني أو يتعلق بسلامة الأغذية والتحسس، لا تتردد في مراسلتنا عبر واتساب أو الاتصال بفروعنا."
              : "For any questions regarding our terms, allergens or delivery policies, please contact our support team directly."}
          </p>
        </div>
      </article>

      <SiteFooter />
      <PersistentOrderBar onOpenCart={() => { window.location.assign("/cart"); }} />
      <BranchModal isOpen={branchModalOpen} onClose={() => setBranchModalOpen(false)} />
    </main>
  );
}
