"use client";

/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { readCart } from "../cart";

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

  useEffect(() => {
    const refresh = () => setCount(cartCount ?? readCart().reduce((sum, line) => sum + line.quantity, 0));
    const onScroll = () => setScrolled(window.scrollY > 20);
    refresh();
    onScroll();
    window.addEventListener("puffy-cart-change", refresh);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("puffy-cart-change", refresh);
      window.removeEventListener("scroll", onScroll);
    };
  }, [cartCount]);

  return <header className={`site-header ${scrolled ? "is-scrolled" : ""} ${menuOpen ? "menu-open" : ""}`}>
    <a className="brand" href="/" aria-label="Puffy Pops home"><img src="/api/media?slot=site-logo" alt="Puffy Pops" /></a>
    <nav className="desktop-navigation" aria-label="Main navigation">{links.map(([href, label]) => <a href={href} key={href}>{label}</a>)}</nav>
    <div className="site-header-actions">
      <button className="mobile-nav-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /></button>
      {onCart ? <button className="cart-button" type="button" onClick={onCart} aria-label={`Open cart with ${count} items`}><span className="bag-icon" aria-hidden="true" /><span>My order</span><strong>{count}</strong></button> : <a className="cart-button" href="/menu"><span className="bag-icon" aria-hidden="true" /><span>Order now</span><strong>{count}</strong></a>}
    </div>
    <AnimatePresence>
      {menuOpen && <motion.nav className="mobile-navigation" aria-label="Mobile navigation" initial={reduceMotion ? false : { opacity: 0, y: -12, clipPath: "inset(0 0 100% 0 round 0 0 28px 28px)" }} animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0 round 0 0 28px 28px)" }} exit={reduceMotion ? undefined : { opacity: 0, y: -8, clipPath: "inset(0 0 100% 0 round 0 0 28px 28px)" }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>{links.map(([href, label], index) => <motion.a href={href} key={href} initial={reduceMotion ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.045 }}>{label}<span>↗</span></motion.a>)}</motion.nav>}
    </AnimatePresence>
  </header>;
}
