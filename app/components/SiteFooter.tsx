"use client";

/* eslint-disable @next/next/no-img-element */

export default function SiteFooter({ onCart }: { onCart?: () => void }) {
  return <footer><div className="footer-brand"><img src="/api/media?slot=site-logo" alt="Puffy Pops" /><p>Spreading joy, one bite at a time.</p></div><div className="footer-links"><div><strong>Explore</strong><a href="/menu">Menu</a><a href="/locations">Locations</a><a href="/story">Our story</a></div><div><strong>Order</strong>{onCart ? <button type="button" onClick={onCart}>My order</button> : <a href="/menu">Start an order</a>}<a href="/track-order">Track an order</a><a href="tel:+201002018510">Call +20 100 201 8510</a></div><div><strong>Social</strong><a href="https://www.instagram.com/puffypopseg/" target="_blank" rel="noreferrer">Instagram ↗</a></div></div><div className="footer-bottom"><span>© 2026 Puffy Pops</span><span>Made for sweet moments in Egypt</span></div></footer>;
}
