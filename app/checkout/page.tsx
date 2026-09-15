"use client";

/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */

import { FormEvent, useEffect, useState } from "react";
import { branches, formatPrice, getBranch, menus, type CityId } from "../catalog";
import { BRANCH_KEY, CART_KEY, hydrateCart, readCart, saveCart, type CartLine } from "../cart";
import { deliveryConfig, type Coordinates } from "../location";
import { normalizeCatalogResponse } from "../catalog-runtime";
import DeliveryMap from "../components/DeliveryMap";

export default function CheckoutPage() {
  const [runtimeMenus, setRuntimeMenus] = useState(menus);
  const [catalogReady, setCatalogReady] = useState(false);
  const [branchId, setBranchId] = useState("kafr-abdo");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [quotedDistance, setQuotedDistance] = useState<number | null>(null);
  const [quotedFee, setQuotedFee] = useState<number | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [deliveryDetails, setDeliveryDetails] = useState("");
  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [locationStatus, setLocationStatus] = useState("Search, use your location, or drop the pin exactly where the courier should arrive.");
  const [locationBusy, setLocationBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/catalog", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setRuntimeMenus(normalizeCatalogResponse(data)))
      .catch(() => undefined)
      .finally(() => setCatalogReady(true));
    const savedBranch = window.localStorage.getItem(BRANCH_KEY) ?? "kafr-abdo";
    // Restore device-local order details after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBranchId(savedBranch);
    setCart(readCart());
  }, []);

  const branch = getBranch(branchId) ?? branches[0];
  const cityId: CityId = branch.cityId;
  const cartItems = hydrateCart(cart, cityId, runtimeMenus[cityId].items);
  const subtotal = cartItems.reduce((sum, line) => sum + line.lineTotal, 0);
  const distance = fulfilment === "pickup" ? 0 : quotedDistance;
  const fee = fulfilment === "pickup" ? 0 : quotedFee;
  const total = subtotal + (fee ?? 0);

  const updateBranchFromCoordinates = async (nextCoordinates: Coordinates) => {
    setQuotedDistance(null);
    setQuotedFee(null);
    const response = await fetch(`/api/delivery-quote?latitude=${encodeURIComponent(nextCoordinates.latitude)}&longitude=${encodeURIComponent(nextCoordinates.longitude)}&cityId=${encodeURIComponent(branch.cityId)}`, { cache: "no-store" });
    const data = await response.json() as { branch?: typeof branch; distanceKm?: number; deliveryFee?: number; durationSeconds?: number | null; provider?: string; error?: string };
    if (!response.ok || !data.branch || !Number.isFinite(data.distanceKm) || !Number.isFinite(data.deliveryFee)) {
      throw new Error(data.error ?? "The delivery distance could not be calculated.");
    }
    setBranchId(data.branch.id);
    setQuotedDistance(Number(data.distanceKm));
    setQuotedFee(Number(data.deliveryFee));
    window.localStorage.setItem(BRANCH_KEY, data.branch.id);
    const minutes = Number.isFinite(data.durationSeconds) ? ` · about ${Math.max(1, Math.round(Number(data.durationSeconds) / 60))} min drive` : "";
    setLocationStatus(`${data.branch.name} selected · ${Number(data.distanceKm).toFixed(1)} km by Google Maps${minutes} · ${formatPrice(Number(data.deliveryFee))} delivery.`);
  };

  const resolveSelectedCoordinates = async (next: Coordinates, knownAddress = "") => {
    setCoordinates(next);
    setLocationBusy(true);
    setError("");
    setLocationStatus("Checking your pin with Google Maps…");
    try {
      const reverseRequest = knownAddress
        ? Promise.resolve({ displayName: knownAddress })
        : fetch(`/api/reverse-geocode?latitude=${encodeURIComponent(next.latitude)}&longitude=${encodeURIComponent(next.longitude)}`, { cache: "no-store" })
            .then(async (response) => {
              const data = await response.json() as { displayName?: string; error?: string };
              if (!response.ok || !data.displayName) throw new Error(data.error ?? "Google Maps could not identify that pin.");
              return data;
            });
      const [addressResult] = await Promise.all([reverseRequest, updateBranchFromCoordinates(next)]);
      const nextAddress = addressResult.displayName || knownAddress;
      setResolvedAddress(nextAddress);
      setAddressQuery(nextAddress);
    } catch (cause) {
      setCoordinates(null);
      setResolvedAddress("");
      setQuotedDistance(null);
      setQuotedFee(null);
      setLocationStatus(cause instanceof Error ? cause.message : "Google Maps could not calculate this delivery location.");
    } finally {
      setLocationBusy(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location is unavailable in this browser.");
      return;
    }
    setLocationStatus("Reading your location…");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        await resolveSelectedCoordinates(next);
      },
      () => setLocationStatus("Location permission was not available. Search for your address or drop the pin manually."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const calculateFromAddress = async () => {
    if (addressQuery.trim().length < 8) {
      setLocationStatus("Enter a more complete delivery address first.");
      return;
    }
    setLocationBusy(true);
    setError("");
    setLocationStatus("Finding that address on Google Maps…");
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(addressQuery)}&city=${encodeURIComponent(branch.city)}`);
      const data = await response.json() as { coordinates?: Coordinates; displayName?: string; error?: string };
      if (!response.ok || !data.coordinates) throw new Error(data.error ?? "Address not found");
      setLocationBusy(false);
      await resolveSelectedCoordinates(data.coordinates, data.displayName || addressQuery.trim());
    } catch (cause) {
      setLocationStatus(cause instanceof Error ? cause.message : "We could not find that address.");
    } finally {
      setLocationBusy(false);
    }
  };

  const changeQuantity = (id: string, change: number) => {
    const next = cart.map((line) => line.id === id ? { ...line, quantity: line.quantity + change } : line).filter((line) => line.quantity > 0);
    setCart(next);
    saveCart(next);
  };

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!catalogReady) return setError("The latest branch menu is still loading. Try again in a moment.");
    if (!cartItems.length) return setError("Your order is empty.");
    if (fulfilment === "delivery" && (!coordinates || fee == null)) {
      return setError(distance != null && distance > deliveryConfig.maximumKm ? "This address is outside the current delivery radius." : "Calculate your delivery location before ordering.");
    }
    if (fulfilment === "delivery" && (!resolvedAddress || deliveryDetails.trim().length < 3)) {
      return setError("Confirm the Google Maps pin and add the building, floor or nearest landmark for the courier.");
    }
    const form = new FormData(event.currentTarget);
    // `cartItems` contains only entries that still exist in the latest menu.
    // Never submit the raw localStorage cart: it can retain invisible product
    // or variant IDs from an older catalog and cause the whole order to fail.
    const validLines = cartItems.map(({ id, itemId, variantId, choice, quantity }) => ({ id, itemId, variantId, choice, quantity }));
    if (validLines.length !== cart.length) {
      setCart(validLines);
      saveCart(validLines);
    }
    setBusy(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          branchId,
          fulfilment,
          paymentMethod,
          customer: {
            name: form.get("name"),
            phone: form.get("phone"),
            address: fulfilment === "delivery" ? `${resolvedAddress} — ${deliveryDetails.trim()}` : "Pickup",
            notes: form.get("notes"),
          },
          coordinates: fulfilment === "delivery" ? coordinates : { latitude: branch.latitude, longitude: branch.longitude },
          lines: validLines.map(({ itemId, variantId, choice, quantity }) => ({ itemId, variantId, choice, quantity })),
        }),
      });
      const data = await response.json() as { orderNumber?: string; receiptToken?: string; receiptUrl?: string; redirectUrl?: string; error?: string };
      if (!response.ok || !data.orderNumber) throw new Error(data.error ?? "The order could not be placed.");
      window.localStorage.setItem("puffy_last_order", JSON.stringify({ orderNumber: data.orderNumber, phone: String(form.get("phone") ?? "") }));
      window.localStorage.removeItem(CART_KEY);
      if (data.redirectUrl) window.location.assign(data.redirectUrl);
      else window.location.assign(data.receiptUrl ?? `/receipt/${encodeURIComponent(data.orderNumber)}?token=${encodeURIComponent(data.receiptToken ?? "")}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The order could not be placed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="checkout-page">
      <header className="checkout-header"><a href="/" className="brand"><img src="/api/media?slot=site-logo" alt="Puffy Pops" /></a><div><span>Secure order checkout</span><a href="/menu">← Back to menu</a></div></header>
      <div className="checkout-shell">
        <section className="checkout-main">
          <div className="checkout-heading"><p className="eyebrow">Almost there</p><h1>Checkout your <em>joy.</em></h1><p>Your order is routed to the nearest branch with the matching city menu.</p></div>
          <form id="order-form" onSubmit={placeOrder}>
            <section className="checkout-panel">
              <div className="step-title"><span>01</span><div><h2>Contact details</h2><p>So the branch can confirm your order.</p></div></div>
              <div className="form-grid"><label><span>Name</span><input name="name" autoComplete="name" required placeholder="Your name" /></label><label><span>Phone number</span><input name="phone" type="tel" autoComplete="tel" required placeholder="01xxxxxxxxx" pattern="[0-9+ ]{8,18}" /></label></div>
            </section>

            <section className="checkout-panel">
              <div className="step-title"><span>02</span><div><h2>Delivery or pickup</h2><p>Delivery uses a real map distance to the branch.</p></div></div>
              <div className="choice-cards"><label className={fulfilment === "delivery" ? "active" : ""}><input type="radio" name="fulfilment" checked={fulfilment === "delivery"} onChange={() => setFulfilment("delivery")} /><strong>Delivery</strong><small>Fee calculated by distance</small></label><label className={fulfilment === "pickup" ? "active" : ""}><input type="radio" name="fulfilment" checked={fulfilment === "pickup"} onChange={() => setFulfilment("pickup")} /><strong>Pickup</strong><small>No delivery fee</small></label></div>
              {fulfilment === "delivery" && <div className="address-block">
                <label><span>Search Google Maps</span><input type="text" value={addressQuery} onChange={(event) => setAddressQuery(event.target.value)} placeholder="Area, street or place name" /></label>
                <div className="address-actions"><button type="button" onClick={calculateFromAddress} disabled={locationBusy}>{locationBusy ? "Checking…" : "Search address"}</button><button type="button" className="light" onClick={useCurrentLocation} disabled={locationBusy}>Use current location</button></div>
                <DeliveryMap value={coordinates} center={{ latitude: branch.latitude, longitude: branch.longitude }} disabled={locationBusy} onPick={(next) => { void resolveSelectedCoordinates(next); }} />
                <p className="location-result" aria-live="polite">{locationStatus}</p>
                {resolvedAddress && <div className="confirmed-map-address"><span>Confirmed Google Maps address</span><strong>{resolvedAddress}</strong><small>{coordinates?.latitude.toFixed(6)}, {coordinates?.longitude.toFixed(6)}</small></div>}
                <label className="delivery-details"><span>Building, floor and nearest landmark</span><textarea value={deliveryDetails} onChange={(event) => setDeliveryDetails(event.target.value)} rows={2} required placeholder="Building 12, 3rd floor, next to…" /></label>
                <small>The final fee and nearest branch are calculated again on the server from the saved pin before the order is accepted.</small>
              </div>}
              <div className="routed-branch"><span>Order routes to</span><strong>{branch.name} · {branch.city}</strong><small>{branch.address}</small></div>
            </section>

            <section className="checkout-panel">
              <div className="step-title"><span>03</span><div><h2>Payment method</h2><p>Choose how you want to pay.</p></div></div>
              <div className="payment-cards"><label className={paymentMethod === "cash" ? "active" : ""}><input type="radio" name="payment" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} /><span>₤</span><div><strong>Cash on delivery</strong><small>Pay the branch courier in cash</small></div></label><label className={paymentMethod === "card" ? "active" : ""}><input type="radio" name="payment" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} /><span>▰</span><div><strong>Debit / credit card</strong><small>Provider connection required before launch</small></div></label></div>
              {paymentMethod === "card" && <div className="provider-notice"><strong>Card checkout is ready for the provider adapter.</strong><p>Add Puffy Pops’ payment gateway credentials and implementation before enabling live card orders. No card details are collected by this starter.</p></div>}
              <label className="notes-field"><span>Order notes <small>(optional)</small></span><textarea name="notes" rows={3} placeholder="Flavor notes, delivery instructions…" /></label>
            </section>
          </form>
        </section>

        <aside className="order-review">
          <p className="eyebrow">Your order</p><h2>{branch.name}</h2>
          {!cartItems.length ? <div className="checkout-empty"><p>Your cart is empty or belongs to a different city menu.</p><a href="/menu">Return to menu</a></div> : <div className="review-lines">{cartItems.map((line) => <div className="review-line" key={line.id}><div><strong>{line.item.name}</strong><small>{line.variant.label}{line.choice ? ` · ${line.choice}` : ""}</small><div className="mini-quantity"><button type="button" onClick={() => changeQuantity(line.id, -1)}>−</button><span>{line.quantity}</span><button type="button" onClick={() => changeQuantity(line.id, 1)}>+</button></div></div><span>{formatPrice(line.lineTotal)}</span></div>)}</div>}
          <div className="review-totals"><div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><div><span>Delivery</span><strong>{fee == null ? "Calculate location" : fee === 0 ? "Free" : formatPrice(fee)}</strong></div>{distance != null && fulfilment === "delivery" && <small>{distance.toFixed(1)} km from {branch.name}</small>}<div className="grand-total"><span>Total</span><strong>{formatPrice(total)}</strong></div></div>
          {error && <p className="form-error">{error}</p>}
          <button form="order-form" className="place-order" type="submit" disabled={busy || locationBusy || !catalogReady || !cartItems.length}>{busy || locationBusy || !catalogReady ? "Please wait…" : paymentMethod === "card" ? "Continue to card payment" : "Place cash order"}<span>→</span></button>
          <p className="checkout-terms">Submitting sends this order to the selected branch dashboard.</p>
        </aside>
      </div>
    </main>
  );
}
