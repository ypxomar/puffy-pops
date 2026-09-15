"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { branches, formatPrice, menus, type Branch, type CityId, type MenuItem } from "../catalog";
import { BRANCH_KEY, makeLineId, readCart, saveCart, type CartLine } from "../cart";
import { distanceKm, nearestBranch } from "../location";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import ScrollProgress from "../components/ScrollProgress";
import { normalizeCatalogResponse } from "../catalog-runtime";

type Selection = { variantId: string; choice?: string };
type Availability = {
  byBranch: Record<string, Record<string, { available: boolean; lowStock: boolean; currentStock: number | null }>>;
  cityAvailability: Record<CityId, Record<string, boolean>>;
};

function ProductCard({
  item,
  index,
  onAdd,
  availableHere,
  availableInCity,
}: {
  item: MenuItem;
  index: number;
  onAdd: (item: MenuItem, selection: Selection) => void;
  availableHere: boolean;
  availableInCity: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [variantId, setVariantId] = useState(item.variants[0].id);
  const [choice, setChoice] = useState(item.choices?.[0]);
  // The managed catalog can replace the built-in item after this card mounts.
  // Resolve the visible selection against the latest item so the initial Small
  // option is valid immediately instead of requiring a size round-trip first.
  const selectedVariantId = item.variants.some((entry) => entry.id === variantId) ? variantId : item.variants[0].id;
  const selectedChoice = item.choices?.includes(choice ?? "") ? choice : item.choices?.[0];
  const variant = item.variants.find((entry) => entry.id === selectedVariantId) ?? item.variants[0];

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
      whileHover={reduceMotion ? undefined : { y: -5 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.52, delay: Math.min(index, 8) * 0.035, ease: [0.22, 1, 0.36, 1] }}
      className={`menu-card ${!availableInCity ? "product-out-of-stock" : ""}`}
    >
      <div className={`menu-visual tone-${index % 5} ${item.image ? "has-photo" : ""}`}>
        {item.image ? <><img src={item.image} alt={`${item.name} from Puffy Pops`} loading="lazy" referrerPolicy="no-referrer" />{item.realFavorite && <span className="photo-label">Real favorite</span>}{item.salePercent ? <span className="sale-label">-{item.salePercent}%</span> : null}</> : <><span>{item.category === "puffy-pops" ? "PP" : item.name.charAt(0)}</span><i />{item.salePercent ? <b className="sale-label">-{item.salePercent}%</b> : null}</>}
      </div>
      <div className="menu-card-copy">
        <div>
          <h3>{item.name}</h3>
          <span className={`stock-badge ${!availableInCity ? "out" : availableHere ? "here" : "nearby"}`}>
            {!availableInCity ? "Out of stock" : availableHere ? "Available here" : "Nearby branch stock"}
          </span>
          {item.note && <p>{item.note}</p>}
          <div className="product-options">
            {item.variants.length > 1 && (
              <label>
                <span className="sr-only">Size for {item.name}</span>
                <select value={selectedVariantId} onChange={(event) => setVariantId(event.target.value)}>
                  {item.variants.map((entry) => (
                    <option value={entry.id} key={entry.id}>
                      {entry.label} · {formatPrice(entry.price)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {item.choices && (
              <label>
                <span className="sr-only">Flavor for {item.name}</span>
                <select value={selectedChoice} onChange={(event) => setChoice(event.target.value)}>
                  {item.choices.map((entry) => <option key={entry}>{entry}</option>)}
                </select>
              </label>
            )}
          </div>
        </div>
        <div className="price-row">
          <div>
            {item.variants.length > 1 && <small>{variant.label}</small>}
            {variant.originalPrice && variant.originalPrice > variant.price ? <del>{formatPrice(variant.originalPrice)}</del> : null}<strong>{formatPrice(variant.price)}</strong>
          </div>
          <button type="button" disabled={!availableInCity} onClick={() => onAdd(item, { variantId: selectedVariantId, choice: selectedChoice })} aria-label={availableInCity ? `Add ${item.name} to order` : `${item.name} is out of stock`}>
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default function MenuPage() {
  const reduceMotion = useReducedMotion();
  const [runtimeMenus, setRuntimeMenus] = useState(menus);
  const [availability, setAvailability] = useState<Availability>({ byBranch: {}, cityAvailability: { alexandria: {}, cairo: {} } });
  const [branchId, setBranchId] = useState("kafr-abdo");
  const [activeCategory, setActiveCategory] = useState("puffy-pops");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("Choose a branch or use your location.");

  const selectedBranch = branches.find((branch) => branch.id === branchId) ?? branches[0];
  const cityId: CityId = selectedBranch.cityId;
  const menu = runtimeMenus[cityId];

  useEffect(() => {
    fetch("/api/catalog", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: unknown) => {
        setRuntimeMenus(normalizeCatalogResponse(data));
        if (data && typeof data === "object" && "availability" in data) {
          const next = (data as { availability?: Availability }).availability;
          if (next?.byBranch && next?.cityAvailability) setAvailability(next);
        }
      })
      .catch(() => undefined);
    const savedBranch = window.localStorage.getItem(BRANCH_KEY);
    if (savedBranch && branches.some((branch) => branch.id === savedBranch)) {
      // Restore the customer's device-local branch after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBranchId(savedBranch);
    } else if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          const closest = nearestBranch(coordinates);
          const km = distanceKm(coordinates, closest);
          setBranchId(closest.id);
          setActiveCategory("puffy-pops");
          setLocationMessage(`${closest.name} is the nearest listed branch · about ${km.toFixed(1)} km away.`);
          window.localStorage.setItem(BRANCH_KEY, closest.id);
          setLocating(false);
        },
        () => {
          setLocationMessage("Choose a branch or allow location access to find the nearest one.");
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
      );
    }
    setCart(readCart());
  }, []);

  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [cartOpen]);

  const cartItems = useMemo(() => cart.flatMap((line) => {
    const item = menu.items.find((entry) => entry.id === line.itemId);
    const variant = item?.variants.find((entry) => entry.id === line.variantId);
    return item && variant ? [{ ...line, item, variant }] : [];
  }), [cart, menu.items]);

  const cartCount = cartItems.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cartItems.reduce((sum, line) => sum + line.variant.price * line.quantity, 0);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return menu.items.filter((item) => query
      ? `${item.name} ${item.note ?? ""} ${item.choices?.join(" ") ?? ""}`.toLowerCase().includes(query)
      : item.category === activeCategory);
  }, [activeCategory, menu.items, search]);

  const currentCategory = menu.categories.find((category) => category.id === activeCategory);

  const chooseBranch = (next: Branch, source = "manual") => {
    if (next.cityId !== cityId && cart.length) {
      const confirmed = window.confirm("Cairo and Alexandria have different menus and prices. Switch city and clear your current order?");
      if (!confirmed) return;
      setCart([]);
      saveCart([]);
    }
    setBranchId(next.id);
    setActiveCategory("puffy-pops");
    setSearch("");
    window.localStorage.setItem(BRANCH_KEY, next.id);
    setLocationMessage(source === "location" ? `${next.name} is the closest listed branch.` : `${next.name} selected.`);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported by this browser. Choose a branch manually.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const closest = nearestBranch({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        const km = distanceKm(
          { latitude: position.coords.latitude, longitude: position.coords.longitude },
          closest,
        );
        chooseBranch(closest, "location");
        setLocationMessage(`${closest.name} is the nearest listed branch · about ${km.toFixed(1)} km away.`);
        setLocating(false);
      },
      () => {
        setLocationMessage("We could not read your location. Choose a branch manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const addItem = (item: MenuItem, selection: Selection) => {
    if (availability.cityAvailability[cityId]?.[item.id] === false) {
      window.alert(`${item.name} is currently out of stock at every ${selectedBranch.city} branch.`);
      return;
    }
    const id = makeLineId(item.id, selection.variantId, selection.choice);
    const next = cart.some((line) => line.id === id)
      ? cart.map((line) => line.id === id ? { ...line, quantity: line.quantity + 1 } : line)
      : [...cart, { id, itemId: item.id, variantId: selection.variantId, choice: selection.choice, quantity: 1 }];
    setCart(next);
    saveCart(next);
  };

  const changeQuantity = (id: string, change: number) => {
    const next = cart
      .map((line) => line.id === id ? { ...line, quantity: line.quantity + change } : line)
      .filter((line) => line.quantity > 0);
    setCart(next);
    saveCart(next);
  };

  return (
    <main>
      <ScrollProgress />
      <SiteHeader cartCount={cartCount} onCart={() => setCartOpen(true)} />

      <motion.section initial={reduceMotion ? false : { opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }} className="branch-finder" aria-label="Choose nearest Puffy Pops branch">
        <div>
          <span className="live-dot" />
          <p><small>Your menu</small><strong>{selectedBranch.name} · {selectedBranch.city}</strong></p>
        </div>
        <p className="branch-message">{locationMessage}</p>
        <div className="branch-actions">
          <label>
            <span className="sr-only">Select branch</span>
            <select value={branchId} onChange={(event) => chooseBranch(branches.find((branch) => branch.id === event.target.value) ?? branches[0])}>
              {branches.map((branch) => <option value={branch.id} key={branch.id}>{branch.name} · {branch.city}</option>)}
            </select>
          </label>
          <button type="button" onClick={useMyLocation} disabled={locating}>{locating ? "Locating…" : "Use my location"}</button>
        </div>
      </motion.section>

      <section className="menu-section" id="menu">
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }} className="section-heading menu-heading">
          <div><p className="eyebrow">{selectedBranch.city} menu · VAT inclusive</p><h2>Find your <em>favorite.</em></h2></div>
          <label className="search-box"><span aria-hidden="true" /><span className="sr-only">Search the menu</span><input type="search" placeholder="Search Nutella, matcha…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </motion.div>
        <div className="menu-city-note"><strong>{selectedBranch.name}</strong><span>Prices and availability follow the {selectedBranch.city} menu you supplied.</span><button type="button" onClick={useMyLocation}>Check nearest branch</button></div>
        <div className="category-row" role="tablist" aria-label="Menu categories">
          {menu.categories.map((category) => <button key={category.id} type="button" role="tab" aria-selected={!search && activeCategory === category.id} className={!search && activeCategory === category.id ? "active" : ""} onClick={() => { setSearch(""); setActiveCategory(category.id); }}>{category.label}</button>)}
        </div>
        <div className="menu-title-row"><div><p>{search ? "Search results" : currentCategory?.label}</p><span>{search ? `${visibleItems.length} matches` : currentCategory?.tagline}</span></div><span>{visibleItems.length} items</span></div>
        {visibleItems.length ? <motion.div layout className="menu-grid"><AnimatePresence mode="popLayout">{visibleItems.map((item, index) => <ProductCard item={item} index={index} onAdd={addItem} availableHere={availability.byBranch[branchId]?.[item.id]?.available !== false} availableInCity={availability.cityAvailability[cityId]?.[item.id] !== false} key={item.id} />)}</AnimatePresence></motion.div> : <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="empty-search"><span>?</span><h3>No sweet match yet</h3><p>Try another flavor, drink, or category.</p></motion.div>}
      </section>

      <motion.section initial={reduceMotion ? false : { opacity: 0, y: 42 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }} className="order-banner"><div><p className="eyebrow light">The sweet part of your day</p><h2>Ready to get <em>puffy?</em></h2></div><button type="button" onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}>Back to categories <span>↑</span></button></motion.section>

      <SiteFooter onCart={() => setCartOpen(true)} />

      <AnimatePresence>{cartOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cart-layer" role="dialog" aria-modal="true" aria-labelledby="cart-title"><motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cart-backdrop" type="button" onClick={() => setCartOpen(false)} aria-label="Close cart" /><motion.aside initial={reduceMotion ? false : { x: "100%" }} animate={{ x: 0 }} exit={reduceMotion ? undefined : { x: "100%" }} transition={{ type: "spring", stiffness: 330, damping: 34 }} className="cart-drawer"><div className="cart-header"><div><p className="eyebrow">{selectedBranch.name}</p><h2 id="cart-title">My order</h2></div><button type="button" onClick={() => setCartOpen(false)} aria-label="Close cart">×</button></div>{!cartItems.length ? <div className="empty-cart"><div className="empty-box"><i /><i /><i /></div><h3>Your box is empty</h3><p>Add something joyful from the {selectedBranch.city} menu.</p><button type="button" onClick={() => setCartOpen(false)}>Explore menu</button></div> : <><div className="cart-items">{cartItems.map((line) => <div className="cart-item" key={line.id}><div className="cart-item-mark">{line.item.name.charAt(0)}</div><div className="cart-item-info"><h3>{line.item.name}</h3><p>{line.variant.label}{line.choice ? ` · ${line.choice}` : ""}</p><strong>{formatPrice(line.variant.price)}</strong></div><div className="quantity-control"><button type="button" onClick={() => changeQuantity(line.id, -1)} aria-label={`Remove one ${line.item.name}`}>−</button><span>{line.quantity}</span><button type="button" onClick={() => changeQuantity(line.id, 1)} aria-label={`Add one ${line.item.name}`}>+</button></div></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{formatPrice(cartTotal)}</strong></div><p>Delivery is calculated from your exact checkout location.</p><a className="checkout-button" href="/checkout">Continue to checkout <span>→</span></a></div></>}</motion.aside></motion.div>}</AnimatePresence>
      <AnimatePresence>{cartCount > 0 && !cartOpen && <motion.button initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} className="mobile-cart" type="button" onClick={() => setCartOpen(true)}><span>{cartCount} {cartCount === 1 ? "item" : "items"}</span><strong>View order · {formatPrice(cartTotal)}</strong></motion.button>}</AnimatePresence>
    </main>
  );
}
