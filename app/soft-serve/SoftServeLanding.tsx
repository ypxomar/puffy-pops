"use client";

/* eslint-disable @next/next/no-img-element -- The brand mark comes from the CMS media route with a static fallback. */

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Check, Heart, MapPin, Minus, Plus, ShieldCheck, Sparkles, Star, Utensils } from "lucide-react";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import ScrollProgress from "../components/ScrollProgress";
import DeliveryStrip from "../components/DeliveryStrip";
import BranchModal from "../components/BranchModal";
import PersistentOrderBar from "../components/PersistentOrderBar";
import { SITE_LINKS, branches, flavours, getMapUrl, PHONE_HREF } from "./landing-data";
import type { City, Flavour } from "./landing-data";
import FlavourPicker from "./FlavourPicker";
import { LocalProduct, preloadProducts, ProductDisplay } from "./Product";
import OrderDialog from "./OrderDialog";
import { BRANCH_KEY } from "../cart";
import { getStoredLanguage, translations, type Language } from "../i18n";

const FLAVOUR_STORAGE_KEY = "puffy-soft-serve-flavour";
const premiumEase = [0.22, 1, 0.36, 1] as const;

const highlights = [
  { name: "Nutella", label: "The crowd favorite", image: "/api/media?slot=home-favorite-1", tone: "orange", slug: "nutella-puffy-pops", price: "From EGP 180" },
  { name: "White Chocolate", label: "Soft, sweet, unmistakable", image: "/api/media?slot=home-favorite-2", tone: "green", slug: "white-chocolate-puffy-pops", price: "From EGP 180" },
  { name: "Caramel", label: "Golden and generous", image: "/api/media?slot=home-favorite-3", tone: "wine", slug: "nutella-puffy-pops", price: "From EGP 180" },
] as const;

const orderSteps = [
  { no: "01", title: "Choose the bites", copy: "Browse the right city menu, then pick a size and flavours." },
  { no: "02", title: "Drop the pin", copy: "Put the pin at the delivery entrance so distance and fees stay accurate." },
  { no: "03", title: "We route it", copy: "The order goes to the correct Puffy Pops branch with every choice attached." },
] as const;

const ugcReviews = [
  {
    name: "Nouran El-Gendy",
    handle: "@nouran.eats",
    platform: "TikTok",
    rating: 5,
    tag: "Social Sweet-Tooth",
    reviewEn: "Literally the softest Puffy Pops in Cairo. The Belgian chocolate drizzle is unreal!",
    reviewAr: "بجد أطرى بوفي بوبس في القاهرة كلها! صوص الشوكولاتة البلجيكية حكاية تانية خالص.",
    favorite: "Nutella & Pistachio Half-Half",
  },
  {
    name: "Ahmed & Salma",
    handle: "@family.moments.alex",
    platform: "Instagram",
    rating: 5,
    tag: "The Sharer",
    reviewEn: "Ordered the 36-piece Family Box for our Friday gathering. Arrived hot and vanished in minutes.",
    reviewAr: "طلبنا صندوق العائلة ٣٦ قطعة لعزومة الجمعة. وصل ساخن وطازة وخلص في دقائق!",
    favorite: "Family Party Pack",
  },
  {
    name: "Karim Wafik",
    handle: "@karim_alex",
    platform: "Kafr Abdo Regular",
    rating: 5,
    tag: "The Local Regular",
    reviewEn: "Kafr Abdo branch is my daily ritual. Strawberry Kiss soft serve on sunny strolls is pure therapy.",
    reviewAr: "فرع كفر عبده روتيني المفضل. سوفت سيرف ستروبري كيس في التمشية علاج للروح بجد.",
    favorite: "Strawberry Kiss Soft Serve",
  },
];

function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg className={`ss-sparkle ${className}`} viewBox="0 0 80 90" fill="none" aria-hidden="true">
      <path d="M42 6C39 31 32 39 7 45C34 46 40 53 42 83C47 56 52 47 74 43C50 39 45 30 42 6Z" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
    </svg>
  );
}

function BrandMark() {
  const [source, setSource] = useState<"cms" | "static" | "text">("cms");
  return (
    <>
      {source === "cms" && <img className="ss-hero-logo" src="/api/media?slot=site-logo" alt="Puffy Pops · spreading joy" onError={() => setSource("static")} />}
      {source === "static" && <img className="ss-hero-logo" src="/puffy-pops-logo.png" alt="Puffy Pops · spreading joy" onError={() => setSource("text")} />}
      {source === "text" && <span className="ss-hero-wordmark">Puffy Pops<span className="ss-signoff-registered">&reg;</span></span>}
    </>
  );
}

function Hero({
  flavour,
  onSelect,
  onOrder,
  onOpenBranchModal,
  currentBranchName,
}: {
  flavour: Flavour;
  onSelect: (id: string) => void;
  onOrder: () => void;
  onOpenBranchModal: () => void;
  currentBranchName: string;
}) {
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

  const t = translations[lang];

  return (
    <section id="soft-serve" className="ss-hero" aria-labelledby="hero-title">
      <svg className="ss-hero-waves" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-100 807C173 615 327 859 675 756C992 662 1171 651 1550 760V1000H-100Z" fill="var(--ss-tone)" fillOpacity=".23" />
        <path d="M-120 807C143 620 320 855 660 760C1009 662 1178 649 1570 769" />
        <path d="M-120 838C141 650 323 885 667 790C1016 692 1184 679 1570 799" />
        <path d="M-120 869C141 682 325 915 674 820C1023 722 1190 709 1570 829" />
      </svg>

      <motion.div className="ss-hero-brand" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, ease: premiumEase }}>
        <p className="ss-eyebrow">
          <span>{lang === "ar" ? "طازة بالقرب منك • " : "Freshly made near you • "}</span>
          INTRODUCING OUR ALL-NEW SOFT SERVE
        </p>
        <h1 id="hero-title" className="ss-hero-title">
          <BrandMark />
        </h1>

        {/* 3-second Commercial Value Proposition */}
        <div className="hero-commercial-promise">
          <p className="hero-h1-sub">
            {lang === "ar" ? "لقمة صغيرة. فرحة كبيرة." : "Small bites. Big joy."}
          </p>
          <p className="hero-promise-lead">
            {lang === "ar"
              ? "بوفي بوبس طازة على مزاجك، من أقرب فرع لحد بابك في الإسكندرية والقاهرة."
              : "Freshly made Puffy Pops, picked your way and delivered from your nearest branch."}
          </p>
          <button
            type="button"
            className="hero-location-chip"
            onClick={onOpenBranchModal}
            aria-label="Change current branch"
          >
            <span className="dot-pulse" aria-hidden="true" />
            <span>
              {lang === "ar" ? `التوصيل من ${currentBranchName} ▾` : `Delivering from ${currentBranchName} ▾`}
            </span>
          </button>
        </div>
      </motion.div>

      <Sparkle className="ss-hero-sparkle-left" />
      <Sparkle className="ss-hero-sparkle-right" />
      <LocalProduct flavour={flavour} className="ss-hero-local-product" />

      <motion.div className="ss-hero-intro" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.75 }}>
        <h2>Your new<br className="ss-desktop-break" /> soft spot.</h2>
        <p>Meet our all-new soft serve.<br />A little swirl. A whole lot of joy.</p>
        <div className="ss-hero-actions">
          <a className="ss-button ss-button-primary" href="/build-your-box">
            ✨ {t.buildBoxBtn} <ArrowUpRight size={19} />
          </a>
          <a className="ss-button ss-button-outline" href="#flavours">
            {t.findYourFlavour} <ArrowDownRight size={19} />
          </a>
          <button type="button" className="ss-button ss-button-outline" onClick={onOrder}>
            {t.startAnOrder} <ArrowUpRight size={17} />
          </button>
        </div>
      </motion.div>

      <motion.div className="ss-hero-flavours" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.75 }}>
        <p className="ss-eyebrow">WHAT&apos;S YOUR SWIRL?</p>
        <FlavourPicker selected={flavour.id} onSelect={onSelect} />
      </motion.div>

      <a href="#our-story" className="ss-scroll-cue">
        <span className="ss-scroll-cue-icon"><ArrowDown size={16} /></span>
        <span>GOOD THINGS THIS WAY</span>
      </a>
      <span className="ss-hero-bottom-note">Made of happy.</span>
    </section>
  );
}

function TrustBand() {
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

  const t = translations[lang];

  return (
    <section className="home-trust-band" aria-label="Puffy Pops Egypt brand guarantees">
      <div className="trust-band-item">
        <MapPin size={22} className="trust-icon" />
        <div>
          <strong>{t.trustBandBranches}</strong>
          <small>{lang === "ar" ? "الإسكندرية والقاهرة" : "Alexandria & Cairo"}</small>
        </div>
      </div>
      <div className="trust-band-divider" />
      <div className="trust-band-item">
        <Utensils size={22} className="trust-icon" />
        <div>
          <strong>{t.trustBandFresh}</strong>
          <small>{lang === "ar" ? "كل ٢٠ دقيقة طازة" : "Baked every 20 min"}</small>
        </div>
      </div>
      <div className="trust-band-divider" />
      <div className="trust-band-item">
        <Sparkles size={22} className="trust-icon" />
        <div>
          <strong>{t.trustBandMenus}</strong>
          <small>{lang === "ar" ? "أصناف تناسب مدينتك" : "City-specific items"}</small>
        </div>
      </div>
      <div className="trust-band-divider" />
      <div className="trust-band-item">
        <ShieldCheck size={22} className="trust-icon" />
        <div>
          <strong>{t.trustBandPayment}</strong>
          <small>{lang === "ar" ? "كاش • كروت وميزة • فوري • إنستاباي" : "COD • Meeza • Fawry • InstaPay"}</small>
        </div>
      </div>
    </section>
  );
}

function Story({ flavour }: { flavour: Flavour }) {
  return (
    <section id="our-story" className="ss-story-section" aria-labelledby="story-title">
      <div className="ss-joy-ribbon" aria-hidden="true">
        <div className="ss-ribbon-track">
          {[0, 1, 2, 3].map((item) => (
            <span key={item}>
              SOFT SERVE. BIG FEELINGS.<Sparkle />THE SAME PUFFY JOY.<Sparkle />
            </span>
          ))}
        </div>
      </div>
      <svg className="ss-story-orbit" viewBox="0 0 700 800" fill="none" aria-hidden="true">
        <ellipse cx="340" cy="390" rx="260" ry="337" transform="rotate(28 340 390)" />
        <ellipse cx="340" cy="390" rx="280" ry="361" transform="rotate(28 340 390)" />
      </svg>
      <LocalProduct flavour={flavour} className="ss-story-local-product" />
      <motion.div className="ss-story-copy" initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.75 }}>
        <p className="ss-eyebrow">SAME PUFFY. A SOFTER SIDE.</p>
        <h2 id="story-title">A little joy.<br />With you.</h2>
        <p className="ss-story-description">
          For sunny strolls, long catch-ups, and just-because moments. Your favourite Puffy feeling, now in a ridiculously creamy swirl.
        </p>
        <a className="ss-text-link ss-light-link" href={SITE_LINKS.story}>
          A little more about us <ArrowUpRight size={19} />
        </a>
      </motion.div>
      <Sparkle className="ss-story-sparkle" />
      <span className="ss-story-handwritten">Go on. Take the sweet way.</span>
    </section>
  );
}

function FlavourSection({ flavour, onSelect, onOrder }: { flavour: Flavour; onSelect: (id: string) => void; onOrder: () => void }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const index = flavours.findIndex((option) => option.id === flavour.id);
  const changeFlavour = (direction: number) => onSelect(flavours[(index + direction + flavours.length) % flavours.length].id);
  return (
    <section id="flavours" className="ss-flavours-section" aria-labelledby="flavour-title">
      <div className="ss-flavour-section-heading">
        <p className="ss-eyebrow">FOUR FLAVOURS. YOUR HAPPY PLACE.</p>
      </div>
      <div className="ss-flavour-content">
        <FlavourPicker selected={flavour.id} onSelect={onSelect} compact />
        <LocalProduct flavour={flavour} className="ss-flavour-local-product" />
        <div className="ss-flavour-description" aria-live="polite" aria-atomic="true">
          <h2 id="flavour-title" key={flavour.id}>
            {flavour.title[0]}<br /><span>{flavour.title[1]}</span>
          </h2>
          <p>{flavour.description}</p>
        </div>
        <button className="ss-details-toggle" aria-expanded={detailsOpen} aria-controls="flavour-details" onClick={() => setDetailsOpen((value) => !value)}>
          The sweet details {detailsOpen ? <Minus size={15} /> : <Plus size={15} />}
        </button>
        <AnimatePresence initial={false}>
          {detailsOpen && (
            <motion.div id="flavour-details" className="ss-flavour-details" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
              <p>{flavour.details}</p>
              <p>Please ask your branch for exact ingredients and allergen information before ordering.</p>
            </motion.div>
          )}
        </AnimatePresence>
        <button className="ss-button ss-button-primary ss-flavour-order-button" onClick={onOrder}>
          This one&apos;s for me <ArrowUpRight size={19} />
        </button>
        <div className="ss-flavour-pagination">
          <button className="ss-icon-button" onClick={() => changeFlavour(-1)} aria-label="Previous flavour"><ArrowLeft size={19} /></button>
          <span><strong>0{index + 1}</strong><span className="ss-pagination-divider" />04</span>
          <button className="ss-icon-button" onClick={() => changeFlavour(1)} aria-label="Next flavour"><ArrowRight size={19} /></button>
        </div>
      </div>
      <svg className="ss-flavour-loop" viewBox="0 0 680 680" fill="none" aria-hidden="true">
        <path d="M344 42C650 14 705 480 442 588C179 695-25 503 94 248C153 122 386 102 468 258C550 414 371 570 227 450C133 371 195 227 306 258C434 294 365 415 286 360" />
      </svg>
    </section>
  );
}

function ProductJourney({ flavour, onSelect, onOrder, onOpenBranchModal, currentBranchName }: { flavour: Flavour; onSelect: (id: string) => void; onOrder: () => void; onOpenBranchModal: () => void; currentBranchName: string }) {
  const journeyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: journeyRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 0.07, 0.42, 0.55, 0.92, 1], ["0vw", "0vw", "-23vw", "-23vw", "22vw", "22vw"]);
  const y = useTransform(scrollYProgress, [0, 0.1, 0.44, 0.6, 0.92, 1], ["0vh", "0vh", "-9vh", "-9vh", "-7vh", "-7vh"]);
  const rotate = useTransform(scrollYProgress, [0, 0.12, 0.45, 0.6, 0.94, 1], [-9, -9, 9, 9, -8, -8]);
  const scale = useTransform(scrollYProgress, [0, 0.45, 0.6, 1], [1, 1.06, 1.06, 1.06]);
  return (
    <div ref={journeyRef} className="ss-product-journey">
      <div className="ss-product-stage" aria-hidden="true">
        <div className="ss-product-stage-sticky">
          <div className="ss-product-home">
            <motion.div className="ss-travelling-product" style={{ x, y, rotate, scale }}>
              <div className="ss-floating-product"><ProductDisplay flavour={flavour} /></div>
            </motion.div>
          </div>
        </div>
      </div>
      <Hero flavour={flavour} onSelect={onSelect} onOrder={onOrder} onOpenBranchModal={onOpenBranchModal} currentBranchName={currentBranchName} />
      <Story flavour={flavour} />
      <FlavourSection flavour={flavour} onSelect={onSelect} onOrder={onOrder} />
    </div>
  );
}

function FavouritesRail() {
  const reduceMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const moveRail = (direction: -1 | 1) => {
    railRef.current?.scrollBy({ left: direction * Math.min(window.innerWidth * 0.72, 760), behavior: reduceMotion ? "auto" : "smooth" });
  };
  const updateIndex = () => {
    const rail = railRef.current;
    const firstCard = rail?.querySelector<HTMLElement>(".cinema-highlight-card");
    if (!rail || !firstCard) return;
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap || "0");
    setActive(Math.max(0, Math.min(highlights.length - 1, Math.round(rail.scrollLeft / (firstCard.offsetWidth + gap)))));
  };
  return (
    <section className="cinema-highlights" aria-labelledby="highlight-title">
      <div className="cinema-section-heading">
        <div>
          <p className="cinema-kicker">A few favourites</p>
          <h2 id="highlight-title">Start with a classic.<br /><em>Then make it yours.</em></h2>
        </div>
        <div className="cinema-rail-controls">
          <span aria-live="polite">0{active + 1} / 0{highlights.length}</span>
          <button type="button" onClick={() => moveRail(-1)} aria-label="Previous favourite">&larr;</button>
          <button type="button" onClick={() => moveRail(1)} aria-label="Next favourite">&rarr;</button>
        </div>
      </div>
      <div className="cinema-highlight-rail" ref={railRef} onScroll={updateIndex} role="region" aria-roledescription="carousel" aria-label="Puffy Pops favourites">
        {highlights.map((item, index) => (
          <motion.article
            className={`cinema-highlight-card ${item.tone}`}
            key={item.name}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94, clipPath: "inset(8% 8% 8% 8% round 42px)" }}
            whileInView={{ opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0% round 42px)" }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.85, delay: index * 0.08, ease: premiumEase }}
          >
            <div className="cinema-highlight-image">
              <motion.img src={item.image} alt={`${item.name} Puffy Pops`} loading="lazy" whileHover={reduceMotion ? undefined : { scale: 1.055 }} transition={{ duration: 0.6, ease: premiumEase }} />
            </div>
            <div>
              <span>{item.label}</span>
              <h3>{item.name}</h3>
              <p className="highlight-price-tag">{item.price} • VAT included</p>
              <div className="highlight-card-actions">
                <a href={`/products/${item.slug}`} className="highlight-quick-link">
                  Customize ↗
                </a>
                <a href={SITE_LINKS.menu}>See it on the menu <i>&#8599;</i></a>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function OrderSteps() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="puffy-order-story" aria-label="How a Puffy Pops order comes together">
      <div className="puffy-order-story-heading">
        <p className="cinema-kicker">One box. Three easy moves.</p>
        <h2>No scroll tricks.<br /><em>Just pick, pin and pop.</em></h2>
      </div>
      <div className="puffy-order-story-layout">
        <motion.figure initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.8, ease: premiumEase }}>
          <img src="/api/media?slot=story-main" alt="An assorted Puffy Pops box" loading="lazy" />
        </motion.figure>
        <div className="puffy-order-steps">
          {orderSteps.map((step, index) => (
            <motion.article key={step.no} initial={reduceMotion ? false : { opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.65 }} transition={{ duration: 0.58, delay: index * 0.07, ease: premiumEase }}>
              <span>{step.no}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
              <i>&#8599;</i>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PuffyMoments() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  return (
    <section ref={ref} className="ss-moments-section" aria-labelledby="moments-title">
      <motion.img className="ss-moments-image" src="/images/puffy-moments.jpg" alt="Two friends sharing strawberry Puffy Pops soft serve in the Mediterranean sunshine" loading="lazy" style={{ y: reduceMotion ? 0 : y }} />
      <div className="ss-moments-shade" />
      <motion.div className="ss-moments-copy" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.7 }}>
        <p className="ss-eyebrow">SWEET MOMENTS. EVEN SWEETER COMPANY.</p>
        <h2 id="moments-title">Meet me<br />at Puffy.</h2>
        <p>Bring your people. We&apos;ll bring the swirls.</p>
        <a className="ss-button ss-button-light" href="#find-us">
          Let&apos;s make a date <ArrowUpRight size={19} />
        </a>
      </motion.div>
    </section>
  );
}

function Locations() {
  const [city, setCity] = useState<City>("Alexandria");
  return (
    <section className="ss-locations-section" id="find-us" aria-labelledby="locations-title">
      <div className="ss-locations-copy">
        <p className="ss-eyebrow">ALEXANDRIA ROOTS. CAIRO ENERGY.</p>
        <h2 id="locations-title">Find your<br />Puffy place.</h2>
        <p>Your next happy little moment is closer than you think.</p>
        <svg className="ss-location-doodle" viewBox="0 0 175 75" fill="none" aria-hidden="true">
          <path d="M5 29C45-8 91 12 91 37C91 74 40 76 55 37C71-1 124 21 162 38M150 20L167 41L139 47" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="ss-location-finder">
        <div className="ss-city-tabs" role="group" aria-label="Filter branches by city">
          {(["Alexandria", "Cairo"] as City[]).map((option) => (
            <button type="button" key={option} className={city === option ? "ss-is-active" : ""} aria-pressed={city === option} onClick={() => setCity(option)}>
              {option}
              <span>0{branches.filter((branch) => branch.city === option).length}</span>
            </button>
          ))}
        </div>
        <div className="ss-location-list" aria-live="polite">
          {branches.filter((branch) => branch.city === city).map((branch) => (
            <a className="ss-location-row" key={branch.id} href={getMapUrl(branch)} target="_blank" rel="noopener noreferrer" aria-label={`Get directions to Puffy Pops ${branch.name}`}>
              <div>
                <h3>{branch.name}</h3>
                <p>{branch.address}</p>
              </div>
              <span className="ss-location-arrow"><ArrowUpRight size={21} /></span>
            </a>
          ))}
        </div>
        <p className="ss-location-help">
          Not sure which way? <a href={PHONE_HREF}>Give us a ring <ArrowUpRight size={13} /></a> or <a href={SITE_LINKS.locations}>plan a delivery <ArrowUpRight size={13} /></a>
        </p>
      </div>
    </section>
  );
}

function Proof() {
  const reduceMotion = useReducedMotion();
  const facts = [
    { value: String(branches.length), label: "branches across Egypt" },
    { value: "2", label: "city-specific menus" },
    { value: "1", label: "exact delivery pin" },
  ] as const;
  return (
    <section className="cinema-proof" aria-label="Puffy Pops across Egypt">
      {facts.map((fact, index) => (
        <motion.div key={fact.label} initial={reduceMotion ? false : { opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.8, delay: index * 0.08, ease: premiumEase }}>
          <strong>{fact.value}</strong>
          <span>{fact.label}</span>
        </motion.div>
      ))}
    </section>
  );
}

function UgcGrid() {
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
    <section className="home-ugc-section" aria-label="Customer community love">
      <div className="ugc-section-header">
        <p className="cinema-kicker">{lang === "ar" ? "حب يشارك في كل مكان" : "Shared across Alexandria & Cairo"}</p>
        <h2>{lang === "ar" ? "لحظات حلوة مع ناس أحلى" : "Sweet Moments, Real Love"}</h2>
        <p className="ugc-sub">
          {lang === "ar"
            ? "تقييم ٤.٩ من ٥ من أكثر من ١٢٠٠ لحظة بهجة مسجلة على إنستجرام وتيك توك."
            : "Rated 4.9/5 from 1,200+ documented joy moments on TikTok and Instagram."}
        </p>
      </div>

      <div className="ugc-cards-grid">
        {ugcReviews.map((rev) => (
          <article className="ugc-card" key={rev.name}>
            <div className="ugc-card-top">
              <span className="ugc-persona-badge">{rev.tag}</span>
              <span className="ugc-stars">★★★★★</span>
            </div>
            <p className="ugc-quote">
              &ldquo;{lang === "ar" ? rev.reviewAr : rev.reviewEn}&rdquo;
            </p>
            <div className="ugc-author-row">
              <div>
                <strong>{rev.name}</strong>
                <small>{rev.handle} • {rev.platform}</small>
              </div>
              <span className="ugc-fav-badge">{rev.favorite}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EmailWhatsAppCapture() {
  const [lang, setLang] = useState<Language>("en");
  const [submitted, setSubmitted] = useState(false);
  const [contact, setContact] = useState("");

  useEffect(() => {
    setLang(getStoredLanguage());
    const handleLang = (e: Event) => {
      const custom = e as CustomEvent<{ lang: Language }>;
      if (custom.detail?.lang) setLang(custom.detail.lang);
    };
    window.addEventListener("puffy-language-change", handleLang);
    return () => window.removeEventListener("puffy-language-change", handleLang);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) return;
    setSubmitted(true);
  };

  return (
    <section className="home-optin-section" aria-label="Newsletter & WhatsApp drops">
      <div className="optin-card">
        <div className="optin-copy">
          <span className="optin-tag">✨ Puffy Community</span>
          <h2>{lang === "ar" ? "جرعة بهجة في بريدك وواتسابك" : "A little joy in your inbox"}</h2>
          <p>
            {lang === "ar"
              ? "جرعة فرحة في بريدك: نكهات جديدة، أخبار الفروع، وعروض خاصة."
              : "A little joy in your inbox: new flavours, branch drops, and occasional treats."}
          </p>
        </div>
        <form className="optin-form" onSubmit={handleSubmit}>
          {submitted ? (
            <div className="optin-success">
              <Check size={20} />
              <span>{lang === "ar" ? "أهلاً بك في عائلة بوفي بوبس! ترقب مفاجآت قريباً." : "Welcome to the Puffy family! Sweet surprises headed your way."}</span>
            </div>
          ) : (
            <div className="optin-input-group">
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={lang === "ar" ? "رقم واتساب أو بريدك الإلكتروني" : "WhatsApp number or email address"}
                required
              />
              <button type="submit">
                {lang === "ar" ? "انضم إلينا" : "Join Joy"}
              </button>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

function Closing() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="cinema-closing ss-closing">
      <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.9, ease: premiumEase }}>
        <p className="cinema-kicker">Your next favourite</p>
        <h2>Ready to make<br />the day <em>puffier?</em></h2>
        <div className="cinema-actions">
          <a href="/build-your-box" className="cinema-button light">Build your box <span>✨</span></a>
          <a href={SITE_LINKS.menu} className="cinema-button secondary">Start an order <span>&#8599;</span></a>
          <a href={SITE_LINKS.trackOrder} className="cinema-button ghost">Track an order <span>&rarr;</span></a>
        </div>
      </motion.div>
      <span className="ss-signoff" aria-hidden="true">Puffy Pops<span className="ss-signoff-registered">&reg;</span></span>
    </section>
  );
}

export default function SoftServeLanding() {
  const [selected, setSelected] = useState(flavours[0].id);
  const [orderOpen, setOrderOpen] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchId, setBranchId] = useState("kafr-abdo");
  const reduceMotion = useReducedMotion();
  const flavour = flavours.find((option) => option.id === selected) || flavours[0];

  useEffect(() => {
    preloadProducts(flavours);
    const savedBranch = window.localStorage.getItem(BRANCH_KEY);
    if (savedBranch && branches.some((b) => b.id === savedBranch)) setBranchId(savedBranch);
    const handleBranch = (e: Event) => {
      const custom = e as CustomEvent<{ branch: { id: string } }>;
      if (custom.detail?.branch?.id) setBranchId(custom.detail.branch.id);
    };
    window.addEventListener("puffy-branch-change", handleBranch);
    return () => window.removeEventListener("puffy-branch-change", handleBranch);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FLAVOUR_STORAGE_KEY);
      if (flavours.some((option) => option.id === stored)) setSelected(stored!);
    } catch { /* Selection works without storage */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(FLAVOUR_STORAGE_KEY, selected); } catch { /* Storage fallback */ }
  }, [selected]);

  const currentBranch = branches.find((b) => b.id === branchId) ?? branches[0];
  const theme = { "--ss-accent": flavour.accent, "--ss-page-bg": flavour.background, "--ss-tone": flavour.tone } as CSSProperties;

  return (
    <MotionConfig reducedMotion="user">
      <div id="top" className={`ss-site-shell ${reduceMotion ? "ss-reduced-motion" : ""}`} style={theme}>
        <ScrollProgress />
        <a href="#main-content" className="ss-skip-link">Skip to the good stuff</a>

        <DeliveryStrip onOpenBranchModal={() => setBranchModalOpen(true)} />
        <SiteHeader />

        <main id="main-content" tabIndex={-1}>
          <ProductJourney
            flavour={flavour}
            onSelect={setSelected}
            onOrder={() => setOrderOpen(true)}
            onOpenBranchModal={() => setBranchModalOpen(true)}
            currentBranchName={currentBranch.name}
          />
          <TrustBand />
          <FavouritesRail />
          <OrderSteps />
          <PuffyMoments />
          <Locations />
          <Proof />
          <UgcGrid />
          <EmailWhatsAppCapture />
          <Closing />
        </main>

        <SiteFooter />
        <PersistentOrderBar onOpenCart={() => { window.location.assign("/cart"); }} />

        <OrderDialog open={orderOpen} onClose={() => setOrderOpen(false)} flavour={flavour} onFlavourChange={setSelected} />
        <BranchModal isOpen={branchModalOpen} onClose={() => setBranchModalOpen(false)} onSelectBranch={(b) => setBranchId(b.id)} />
      </div>
    </MotionConfig>
  );
}
