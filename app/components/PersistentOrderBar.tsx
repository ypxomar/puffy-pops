"use client";

import { useEffect, useState } from "react";
import { branches, formatPrice, menus, type Branch } from "../catalog";
import { BRANCH_KEY, hydrateCart, readCart, type CartLine } from "../cart";
import { getStoredLanguage, translations, type Language } from "../i18n";

export default function PersistentOrderBar({ onOpenCart }: { onOpenCart?: () => void }) {
  const [lang, setLang] = useState<Language>("en");
  const [branchId, setBranchId] = useState("kafr-abdo");
  const [cart, setCart] = useState<CartLine[]>([]);

  const refreshCart = () => {
    setCart(readCart());
    const saved = window.localStorage.getItem(BRANCH_KEY);
    if (saved && branches.some((b) => b.id === saved)) setBranchId(saved);
  };

  useEffect(() => {
    setLang(getStoredLanguage());
    refreshCart();
    window.addEventListener("puffy-cart-change", refreshCart);
    window.addEventListener("puffy-language-change", () => setLang(getStoredLanguage()));
    return () => {
      window.removeEventListener("puffy-cart-change", refreshCart);
    };
  }, []);

  const branch = branches.find((b) => b.id === branchId) ?? branches[0];
  const items = hydrateCart(cart, branch.cityId, menus[branch.cityId].items);
  const count = items.reduce((sum, l) => sum + l.quantity, 0);
  const total = items.reduce((sum, l) => sum + l.lineTotal, 0);
  const t = translations[lang];

  return (
    <div className="persistent-order-bar" role="region" aria-label="Quick order bar">
      <div className="persistent-bar-inner">
        <div className="persistent-bar-branch">
          <span className="persistent-pulse-dot" />
          <div className="persistent-branch-text">
            <span className="persistent-branch-title">{branch.name}</span>
            <span className="persistent-delivery-est">
              ⚡ {lang === "ar" ? "توصيل خلال ٢٥-٣٥ د" : "25–35 min delivery"}
            </span>
          </div>
        </div>

        <div className="persistent-bar-actions">
          <a href="/build-your-box" className="persistent-build-btn">
            <span>✨</span>
            <span>{t.buildBoxBtn}</span>
          </a>

          {count > 0 ? (
            onOpenCart ? (
              <button type="button" className="persistent-cart-btn" onClick={onOpenCart}>
                <span className="persistent-cart-count">{count}</span>
                <span>{formatPrice(total)}</span>
                <span>→</span>
              </button>
            ) : (
              <a href="/cart" className="persistent-cart-btn">
                <span className="persistent-cart-count">{count}</span>
                <span>{formatPrice(total)}</span>
                <span>→</span>
              </a>
            )
          ) : (
            <a href="/menu" className="persistent-cart-btn empty-state">
              <span>{t.orderNow}</span>
              <span>→</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
