"use client";

/* eslint-disable @next/next/no-img-element -- The brand logo comes from the CMS media route. */

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Menu, Minus, Plus, X } from "lucide-react";
import { SITE_LINKS, branches, flavours, getMapUrl, PHONE_HREF } from "./landing-data";
import type { City, Flavour } from "./landing-data";
import FlavourPicker from "./FlavourPicker";
import { LocalProduct, preloadProducts, ProductDisplay } from "./Product";
import OrderDialog from "./OrderDialog";

const FLAVOUR_STORAGE_KEY = "puffy-soft-serve-flavour";

function Instagram({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></svg>;
}

function Sparkle({ className = "" }: { className?: string }) {
  return <svg className={`ss-sparkle ${className}`} viewBox="0 0 80 90" fill="none" aria-hidden="true"><path d="M42 6C39 31 32 39 7 45C34 46 40 53 42 83C47 56 52 47 74 43C50 39 45 30 42 6Z" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" /></svg>;
}

function BrandLogo() {
  const [failed, setFailed] = useState(false);
  return (
    <a className="ss-brand-logo" href="#top" aria-label="Puffy Pops home">
      {failed ? <span>Puffy Pops</span> : <img src="/api/media?slot=site-logo" alt="Puffy Pops, spreading joy" onError={() => setFailed(true)} />}
    </a>
  );
}

const sectionLinks = [
  { href: "#soft-serve", label: "The soft serve" },
  { href: "#our-story", label: "The Puffy feeling" },
  { href: "#find-us", label: "Find your Puffy" },
] as const;

function Header({ onOrder }: { onOrder: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
  return (
    <header className="ss-site-header">
      <div className="ss-header-inner">
        <BrandLogo />
        <nav className="ss-desktop-nav" aria-label="Main navigation">
          {sectionLinks.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}
          <a href={SITE_LINKS.menu}>Full menu</a>
        </nav>
        <div className="ss-header-actions">
          <button className="ss-button ss-button-primary ss-header-cta" onClick={() => { setMenuOpen(false); onOrder(); }}>Get your swirl <ArrowUpRight size={17} /></button>
          <button type="button" className="ss-mobile-menu-button ss-icon-button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X size={23} /> : <Menu size={23} />}</button>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.nav id="mobile-navigation" className="ss-mobile-nav" aria-label="Mobile navigation" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            {sectionLinks.map((link) => <a href={link.href} key={link.href} onClick={() => setMenuOpen(false)}>{link.label}<ArrowUpRight size={20} /></a>)}
            <a href={SITE_LINKS.menu} onClick={() => setMenuOpen(false)}>Full menu<ArrowUpRight size={20} /></a>
            <a href="#flavours" onClick={() => setMenuOpen(false)}>Pick your flavour<ArrowUpRight size={20} /></a>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function Hero({ flavour, onSelect }: { flavour: Flavour; onSelect: (id: string) => void }) {
  return (
    <section id="soft-serve" className="ss-hero" aria-labelledby="hero-title">
      <svg className="ss-hero-waves" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-100 807C173 615 327 859 675 756C992 662 1171 651 1550 760V1000H-100Z" fill="var(--ss-tone)" fillOpacity=".23" />
        <path d="M-120 807C143 620 320 855 660 760C1009 662 1178 649 1570 769" /><path d="M-120 838C141 650 323 885 667 790C1016 692 1184 679 1570 799" /><path d="M-120 869C141 682 325 915 674 820C1023 722 1190 709 1570 829" />
      </svg>
      <motion.div className="ss-hero-brand" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}><p className="ss-eyebrow">INTRODUCING OUR ALL-NEW SOFT SERVE</p><h1 id="hero-title">Puffy Pops<span className="ss-brand-registered">&reg;</span></h1></motion.div>
      <Sparkle className="ss-hero-sparkle-left" /><Sparkle className="ss-hero-sparkle-right" />
      <LocalProduct flavour={flavour} className="ss-hero-local-product" />
      <motion.div className="ss-hero-intro" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.75 }}><h2>Your new<br className="ss-desktop-break" /> soft spot.</h2><p>Meet our all-new soft serve.<br />A little swirl. A whole lot of joy.</p><a className="ss-button ss-button-primary" href="#flavours">Find your flavour <ArrowDownRight size={19} /></a></motion.div>
      <motion.div className="ss-hero-flavours" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.75 }}><p className="ss-eyebrow">WHAT&apos;S YOUR SWIRL?</p><FlavourPicker selected={flavour.id} onSelect={onSelect} /></motion.div>
      <a href="#our-story" className="ss-scroll-cue"><span className="ss-scroll-cue-icon"><ArrowDown size={16} /></span><span>GOOD THINGS THIS WAY</span></a>
      <span className="ss-hero-bottom-note">Made of happy.</span>
    </section>
  );
}

function Story({ flavour }: { flavour: Flavour }) {
  return (
    <section id="our-story" className="ss-story-section" aria-labelledby="story-title">
      <div className="ss-joy-ribbon" aria-hidden="true"><div className="ss-ribbon-track">{[0, 1, 2, 3].map((item) => <span key={item}>SOFT SERVE. BIG FEELINGS.<Sparkle />THE SAME PUFFY JOY.<Sparkle /></span>)}</div></div>
      <svg className="ss-story-orbit" viewBox="0 0 700 800" fill="none" aria-hidden="true"><ellipse cx="340" cy="390" rx="260" ry="337" transform="rotate(28 340 390)" /><ellipse cx="340" cy="390" rx="280" ry="361" transform="rotate(28 340 390)" /></svg>
      <LocalProduct flavour={flavour} className="ss-story-local-product" />
      <motion.div className="ss-story-copy" initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.75 }}><p className="ss-eyebrow">SAME PUFFY. A SOFTER SIDE.</p><h2 id="story-title">A little joy.<br />With you.</h2><p className="ss-story-description">For sunny strolls, long catch-ups, and just-because moments. Your favourite Puffy feeling, now in a ridiculously creamy swirl.</p><a className="ss-text-link ss-light-link" href={SITE_LINKS.story}>A little more about us <ArrowUpRight size={19} /></a></motion.div>
      <Sparkle className="ss-story-sparkle" /><span className="ss-story-handwritten">Go on. Take the sweet way.</span>
    </section>
  );
}

function FlavourSection({ flavour, onSelect, onOrder }: { flavour: Flavour; onSelect: (id: string) => void; onOrder: () => void }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const index = flavours.findIndex((option) => option.id === flavour.id);
  const changeFlavour = (direction: number) => onSelect(flavours[(index + direction + flavours.length) % flavours.length].id);
  return (
    <section id="flavours" className="ss-flavours-section" aria-labelledby="flavour-title">
      <div className="ss-flavour-section-heading"><p className="ss-eyebrow">FOUR FLAVOURS. YOUR HAPPY PLACE.</p></div>
      <div className="ss-flavour-content">
        <FlavourPicker selected={flavour.id} onSelect={onSelect} compact />
        <LocalProduct flavour={flavour} className="ss-flavour-local-product" />
        <div className="ss-flavour-description" aria-live="polite" aria-atomic="true"><h2 id="flavour-title" key={flavour.id}>{flavour.title[0]}<br /><span>{flavour.title[1]}</span></h2><p>{flavour.description}</p></div>
        <button className="ss-details-toggle" aria-expanded={detailsOpen} aria-controls="flavour-details" onClick={() => setDetailsOpen((value) => !value)}>The sweet details {detailsOpen ? <Minus size={15} /> : <Plus size={15} />}</button>
        <AnimatePresence initial={false}>
          {detailsOpen && (
            <motion.div id="flavour-details" className="ss-flavour-details" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
              <p>{flavour.details}</p>
              <p>Please ask your branch for exact ingredients and allergen information before ordering.</p>
            </motion.div>
          )}
        </AnimatePresence>
        <button className="ss-button ss-button-primary ss-flavour-order-button" onClick={onOrder}>This one&apos;s for me <ArrowUpRight size={19} /></button>
        <div className="ss-flavour-pagination">
          <button className="ss-icon-button" onClick={() => changeFlavour(-1)} aria-label="Previous flavour"><ArrowLeft size={19} /></button>
          <span><strong>0{index + 1}</strong><span className="ss-pagination-divider" />04</span>
          <button className="ss-icon-button" onClick={() => changeFlavour(1)} aria-label="Next flavour"><ArrowRight size={19} /></button>
        </div>
      </div>
      <svg className="ss-flavour-loop" viewBox="0 0 680 680" fill="none" aria-hidden="true"><path d="M344 42C650 14 705 480 442 588C179 695-25 503 94 248C153 122 386 102 468 258C550 414 371 570 227 450C133 371 195 227 306 258C434 294 365 415 286 360" /></svg>
    </section>
  );
}

function ProductJourney({ flavour, onSelect, onOrder }: { flavour: Flavour; onSelect: (id: string) => void; onOrder: () => void }) {
  const journeyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: journeyRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 0.07, 0.42, 0.55, 0.92, 1], ["0vw", "0vw", "-23vw", "-23vw", "22vw", "22vw"]);
  const y = useTransform(scrollYProgress, [0, 0.1, 0.44, 0.6, 0.92, 1], ["0vh", "0vh", "-9vh", "-9vh", "-7vh", "-7vh"]);
  const rotate = useTransform(scrollYProgress, [0, 0.12, 0.45, 0.6, 0.94, 1], [-9, -9, 9, 9, -8, -8]);
  const scale = useTransform(scrollYProgress, [0, 0.45, 0.6, 1], [1, 1.06, 1.06, 1.06]);
  return (
    <div ref={journeyRef} className="ss-product-journey">
      <div className="ss-product-stage" aria-hidden="true"><div className="ss-product-stage-sticky"><div className="ss-product-home"><motion.div className="ss-travelling-product" style={{ x, y, rotate, scale }}><div className="ss-floating-product"><ProductDisplay flavour={flavour} /></div></motion.div></div></div></div>
      <Hero flavour={flavour} onSelect={onSelect} />
      <Story flavour={flavour} />
      <FlavourSection flavour={flavour} onSelect={onSelect} onOrder={onOrder} />
    </div>
  );
}

function PuffyMoments() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  return (
    <section ref={ref} className="ss-moments-section" aria-labelledby="moments-title">
      <motion.img className="ss-moments-image" src="/images/puffy-moments.jpg" alt="Two friends sharing strawberry Puffy Pops soft serve in the Mediterranean sunshine" loading="lazy" style={{ y: reduceMotion ? 0 : y }} /><div className="ss-moments-shade" />
      <motion.div className="ss-moments-copy" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.7 }}><p className="ss-eyebrow">SWEET MOMENTS. EVEN SWEETER COMPANY.</p><h2 id="moments-title">Meet me<br />at Puffy.</h2><p>Bring your people. We&apos;ll bring the swirls.</p><a className="ss-button ss-button-light" href="#find-us">Let&apos;s make a date <ArrowUpRight size={19} /></a></motion.div>
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
        <svg className="ss-location-doodle" viewBox="0 0 175 75" fill="none" aria-hidden="true"><path d="M5 29C45-8 91 12 91 37C91 74 40 76 55 37C71-1 124 21 162 38M150 20L167 41L139 47" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div className="ss-location-finder">
        <div className="ss-city-tabs" role="group" aria-label="Filter branches by city">{(['Alexandria', 'Cairo'] as City[]).map((option) => <button type="button" key={option} className={city === option ? 'ss-is-active' : ''} aria-pressed={city === option} onClick={() => setCity(option)}>{option}<span>0{branches.filter((branch) => branch.city === option).length}</span></button>)}</div>
        <div className="ss-location-list" aria-live="polite">{branches.filter((branch) => branch.city === city).map((branch) => <a className="ss-location-row" key={branch.id} href={getMapUrl(branch)} target="_blank" rel="noopener noreferrer" aria-label={`Get directions to Puffy Pops ${branch.name}`}><div><h3>{branch.name}</h3><p>{branch.address}</p></div><span className="ss-location-arrow"><ArrowUpRight size={21} /></span></a>)}</div>
        <p className="ss-location-help">Not sure which way? <a href={PHONE_HREF}>Give us a ring <ArrowUpRight size={13} /></a> or <a href={SITE_LINKS.locations}>plan a delivery <ArrowUpRight size={13} /></a></p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="ss-site-footer">
      <div className="ss-footer-top">
        <p>Spreading joy. One swirl at a time.</p>
        <nav aria-label="Footer navigation">
          <a href={SITE_LINKS.menu}>The full menu <ArrowUpRight size={14} /></a>
          <a href={SITE_LINKS.story}>Our story <ArrowUpRight size={14} /></a>
          <a href={SITE_LINKS.locations}>Branches <ArrowUpRight size={14} /></a>
          <a href={SITE_LINKS.trackOrder}>Track an order <ArrowUpRight size={14} /></a>
          <a href="https://www.instagram.com/puffypopseg/" target="_blank" rel="noopener noreferrer"><Instagram size={16} /> Follow the joy</a>
        </nav>
      </div>
      <div className="ss-footer-wordmark" aria-label="Puffy Pops">Puffy Pops<span>&reg;</span></div>
      <div className="ss-footer-bottom"><p>&copy; {new Date().getFullYear()} Puffy Pops Egypt. Made of happy.</p><a href="#top">Back to the sweet top <ArrowUp size={15} /></a></div>
    </footer>
  );
}

export default function SoftServeLanding() {
  // The saved flavour is read after mount so the server-rendered markup and the
  // first client render always match.
  const [selected, setSelected] = useState(flavours[0].id);
  const [orderOpen, setOrderOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const flavour = flavours.find((option) => option.id === selected) || flavours[0];

  useEffect(() => { preloadProducts(flavours); }, []);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FLAVOUR_STORAGE_KEY);
      // Restore the customer's device-local flavour after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (flavours.some((option) => option.id === stored)) setSelected(stored!);
    } catch { /* Selection also works without browser storage. */ }
  }, []);
  useEffect(() => { try { localStorage.setItem(FLAVOUR_STORAGE_KEY, selected); } catch { /* Selection also works without browser storage. */ } }, [selected]);

  const theme = { "--ss-accent": flavour.accent, "--ss-page-bg": flavour.background, "--ss-tone": flavour.tone } as CSSProperties;
  return (
    <MotionConfig reducedMotion="user">
      <div id="top" className={`ss-site-shell ${reduceMotion ? "ss-reduced-motion" : ""}`} style={theme}>
        <a href="#main-content" className="ss-skip-link">Skip to the good stuff</a>
        <Header onOrder={() => setOrderOpen(true)} />
        <main id="main-content" tabIndex={-1}>
          <ProductJourney flavour={flavour} onSelect={setSelected} onOrder={() => setOrderOpen(true)} />
          <PuffyMoments />
          <Locations />
        </main>
        <Footer />
        <OrderDialog open={orderOpen} onClose={() => setOrderOpen(false)} flavour={flavour} onFlavourChange={setSelected} />
      </div>
    </MotionConfig>
  );
}
