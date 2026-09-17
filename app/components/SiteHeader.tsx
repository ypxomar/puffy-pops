"use client";

/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { readCart } from "../cart";
import { branches } from "../catalog";
import { BRANCH_KEY } from "../cart";
import { getStoredLanguage, setStoredLanguage, translations, type Language } from "../i18n";
import BranchModal from "./BranchModal";

const links = [
  ["/menu", "Menu"],
  ["/track-order", "Track order"],
  ["/locations", "Locations"],
  ["/story", "Our story"],
] as const;

export default function SiteHeader({ cartCount, onCart }: { cartCount?: number; onCart?: () => void }) {
  const reduceMotion = useReducedMotion();
  const [count, setCount] = useState(cartCount ?? 0);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [lang, setLang] = useState<Language>("en");
  const [branchId, setBranchId] = useState("kafr-abdo");

  useEffect(() => {
    setLang(getStoredLanguage());
    const saved = window.localStorage.getItem(BRANCH_KEY);
    if (saved && branches.some((b) => b.id === saved)) setBranchId(saved);

    const refresh = () => setCount(cartCount ?? readCart().reduce((sum, line) => sum + line.quantity, 0));
    const onScroll = () => setScrolled(window.scrollY > 20);
    const handleLang = (e: Event) => {
      const custom = e as CustomEvent<{ lang: Language }>;
      if (custom.detail?.lang) setLang(custom.detail.lang);
    };
    const handleBranch = (e: Event) => {
      const custom = e as CustomEvent<{ branch: { id: string } }>;
      if (custom.detail?.branch?.id) setBranchId(custom.detail.branch.id);
    };

    refresh();
    onScroll();
    window.addEventListener("puffy-cart-change", refresh);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("puffy-language-change", handleLang);
    window.addEventListener("puffy-branch-change", handleBranch);
    return () => {
      window.removeEventListener("puffy-cart-change", refresh);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("puffy-language-change", handleLang);
      window.removeEventListener("puffy-branch-change", handleBranch);
    };
  }, [cartCount]);

  const toggleLanguage = () => {
    const next: Language = lang === "en" ? "ar" : "en";
    setLang(next);
    setStoredLanguage(next);
  };

  const branch = branches.find((b) => b.id === branchId) ?? branches[0];
  const t = translations[lang];

  return (
    <>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""} ${menuOpen ? "menu-open" : ""}`}>
        <a className="brand" href="/" aria-label="Puffy Pops home">
          <img src="/api/media?slot=site-logo" alt="Puffy Pops" />
        </a>

        <nav className="desktop-navigation" aria-label="Main navigation">
          {links.map(([href, label]) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="site-header-secondary-nav" aria-label="Secondary links">
          <a href="/build-your-box" className="header-build-box-pill">
            <span className="sparkle-ico" aria-hidden="true">✨</span>
            <span>{t.buildBox}</span>
          </a>
          <button
            type="button"
            className="header-branch-pill"
            onClick={() => setBranchModalOpen(true)}
            aria-label={`Branch: ${branch.name}. Click to change.`}
          >
            <span className="dot-green" aria-hidden="true" />
            <span>{branch.name}</span>
            <small>▾</small>
          </button>
          <button
            type="button"
            className="header-lang-btn"
            onClick={toggleLanguage}
            aria-label="Toggle Arabic / English language"
          >
            {lang === "en" ? "عربي" : "EN"}
          </button>
        </div>

        <div className="site-header-actions">
          <button
            className="mobile-nav-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
          {onCart ? (
            <button className="cart-button" type="button" onClick={onCart} aria-label={`Open cart with ${count} items`}>
              <span className="bag-icon" aria-hidden="true" />
              <span>My order</span>
              <strong>{count}</strong>
            </button>
          ) : (
            <a className="cart-button" href="/menu">
              <span className="bag-icon" aria-hidden="true" />
              <span>Order now</span>
              <strong>{count}</strong>
            </a>
          )}
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              className="mobile-navigation"
              aria-label="Mobile navigation"
              initial={reduceMotion ? false : { opacity: 0, y: -12, clipPath: "inset(0 0 100% 0 round 0 0 28px 28px)" }}
              animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0 round 0 0 28px 28px)" }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8, clipPath: "inset(0 0 100% 0 round 0 0 28px 28px)" }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mobile-nav-top-meta">
                <button type="button" className="mobile-branch-btn" onClick={() => { setMenuOpen(false); setBranchModalOpen(true); }}>
                  <span>📍 {branch.name} ({branch.city})</span>
                  <small>{lang === "ar" ? "تغيير الفرع ▾" : "Change branch ▾"}</small>
                </button>
                <button type="button" className="mobile-lang-btn" onClick={toggleLanguage}>
                  {lang === "en" ? "التحويل للعربية (RTL)" : "Switch to English"}
                </button>
              </div>
              <motion.a href="/build-your-box" onClick={() => setMenuOpen(false)} className="mobile-featured-link">
                <span>✨ {t.buildBox}</span>
                <span>↗</span>
              </motion.a>
              {links.map(([href, label], index) => (
                <motion.a
                  href={href}
                  key={href}
                  onClick={() => setMenuOpen(false)}
                  initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.045 }}
                >
                  {label}
                  <span>↗</span>
                </motion.a>
              ))}
              <motion.a href="/journal" onClick={() => setMenuOpen(false)}>
                Journal
                <span>↗</span>
              </motion.a>
              <motion.a href="/help" onClick={() => setMenuOpen(false)}>
                Help & FAQs
                <span>↗</span>
              </motion.a>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <BranchModal
        isOpen={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
        onSelectBranch={(b) => setBranchId(b.id)}
      />
    </>
  );
}
