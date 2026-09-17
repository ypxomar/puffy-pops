"use client";

/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */

import { FormEvent, useEffect, useState } from "react";
import { branches, formatPrice, getBranch, menus, type CityId } from "../catalog";
import { BRANCH_KEY, CART_KEY, hydrateCart, readCart, saveCart, type CartLine } from "../cart";
import { deliveryConfig, type Coordinates } from "../location";
import { normalizeCatalogResponse } from "../catalog-runtime";
import DeliveryMap from "../components/DeliveryMap";
import { getStoredLanguage, setStoredLanguage, translations, type Language } from "../i18n";
import { Check, CreditCard, HelpCircle, MapPin, QrCode, ShieldCheck, Smartphone, Truck, Wallet } from "lucide-react";

export default function CheckoutPage() {
  const [lang, setLang] = useState<Language>("en");
  const [runtimeMenus, setRuntimeMenus] = useState(menus);
  const [catalogReady, setCatalogReady] = useState(false);
  const [branchId, setBranchId] = useState("kafr-abdo");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [quotedDistance, setQuotedDistance] = useState<number | null>(null);
  const [quotedFee, setQuotedFee] = useState<number | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState("");

  // Egypt First-Class Address Fields
  const [district, setDistrict] = useState("");
  const [street, setStreet] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [landmark, setLandmark] = useState("");
  const [deliveryDetails, setDeliveryDetails] = useState("");

  // Contact & Validation
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "fawry" | "instapay">("cash");
  const [locationStatus, setLocationStatus] = useState("Search, use your location, or drop the pin exactly where the courier should arrive.");
  const [locationBusy, setLocationBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLang(getStoredLanguage());
    fetch("/api/catalog", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => setRuntimeMenus(normalizeCatalogResponse(data)))
      .catch(() => undefined)
      .finally(() => setCatalogReady(true));

    const savedBranch = window.localStorage.getItem(BRANCH_KEY) ?? "kafr-abdo";
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

  const toggleLanguage = () => {
    const next: Language = lang === "en" ? "ar" : "en";
    setLang(next);
    setStoredLanguage(next);
  };

  // Validate Egyptian Phone (+20 or 01x format)
  const validatePhone = (val: string) => {
    setCustomerPhone(val);
    const cleaned = val.replace(/[\s\-]/g, "");
    if (!cleaned) {
      setPhoneError("");
      return;
    }
    const isValid = /^(?:(?:\+?20)|0)?1[0125][0-9]{8}$/.test(cleaned);
    if (!isValid) {
      setPhoneError(
        lang === "ar"
          ? "رقم الموبايل يجب أن يكون مصرياً (مثال: 010xxxxxxxx أو 011 أو 012 أو 015)"
          : "Please enter a valid Egyptian mobile (010, 011, 012, or 015 followed by 8 digits)"
      );
    } else {
      setPhoneError("");
    }
  };

  const updateBranchFromCoordinates = async (nextCoordinates: Coordinates) => {
    setQuotedDistance(null);
    setQuotedFee(null);
    const response = await fetch(
      `/api/delivery-quote?latitude=${encodeURIComponent(nextCoordinates.latitude)}&longitude=${encodeURIComponent(nextCoordinates.longitude)}&cityId=${encodeURIComponent(branch.cityId)}`,
      { cache: "no-store" }
    );
    const data = (await response.json()) as {
      branch?: typeof branch;
      distanceKm?: number;
      deliveryFee?: number;
      durationSeconds?: number | null;
      provider?: string;
      error?: string;
    };
    if (!response.ok || !data.branch || !Number.isFinite(data.distanceKm) || !Number.isFinite(data.deliveryFee)) {
      throw new Error(data.error ?? "The delivery distance could not be calculated.");
    }
    setBranchId(data.branch.id);
    setQuotedDistance(Number(data.distanceKm));
    setQuotedFee(Number(data.deliveryFee));
    window.localStorage.setItem(BRANCH_KEY, data.branch.id);
    const minutes = Number.isFinite(data.durationSeconds)
      ? ` · about ${Math.max(1, Math.round(Number(data.durationSeconds) / 60))} min drive`
      : "";
    setLocationStatus(
      `${data.branch.name} selected · ${Number(data.distanceKm).toFixed(1)} km by Google Maps${minutes} · ${formatPrice(Number(data.deliveryFee))} delivery.`
    );
  };

  const resolveSelectedCoordinates = async (next: Coordinates, knownAddress = "") => {
    setCoordinates(next);
    setLocationBusy(true);
    setError("");
    setLocationStatus("Checking your pin with Google Maps…");
    try {
      const reverseRequest = knownAddress
        ? Promise.resolve({ displayName: knownAddress })
        : fetch(
            `/api/reverse-geocode?latitude=${encodeURIComponent(next.latitude)}&longitude=${encodeURIComponent(next.longitude)}`,
            { cache: "no-store" }
          ).then(async (response) => {
            const data = (await response.json()) as { displayName?: string; error?: string };
            if (!response.ok || !data.displayName) throw new Error(data.error ?? "Google Maps could not identify that pin.");
            return data;
          });
      const [addressResult] = await Promise.all([reverseRequest, updateBranchFromCoordinates(next)]);
      const nextAddress = addressResult.displayName || knownAddress;
      setResolvedAddress(nextAddress);
      setAddressQuery(nextAddress);
      if (!district) {
        const parts = nextAddress.split(",");
        if (parts.length > 1) setDistrict(parts[0].trim());
      }
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
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const calculateFromAddress = async () => {
    if (addressQuery.trim().length < 4) {
      setLocationStatus("Enter a more complete delivery address first.");
      return;
    }
    setLocationBusy(true);
    setError("");
    setLocationStatus("Finding that address on Google Maps…");
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(addressQuery)}&city=${encodeURIComponent(branch.city)}`);
      const data = (await response.json()) as { coordinates?: Coordinates; displayName?: string; error?: string };
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
    const next = cart
      .map((line) => (line.id === id ? { ...line, quantity: line.quantity + change } : line))
      .filter((line) => line.quantity > 0);
    setCart(next);
    saveCart(next);
  };

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!catalogReady) return setError("The latest branch menu is still loading. Try again in a moment.");
    if (!cartItems.length) return setError("Your order is empty.");

    if (fulfilment === "delivery") {
      if (!coordinates || fee == null) {
        return setError(
          distance != null && distance > deliveryConfig.maximumKm
            ? "This address is outside the current delivery radius."
            : "Calculate your delivery location before ordering."
        );
      }
      const structuredAddress = [
        district ? `District: ${district}` : "",
        street ? `Street: ${street}` : "",
        building ? `Bldg: ${building}` : "",
        floor ? `Floor: ${floor}` : "",
        apartment ? `Apt: ${apartment}` : "",
        landmark ? `Landmark: ${landmark}` : "",
        deliveryDetails ? `Notes: ${deliveryDetails}` : "",
      ]
        .filter(Boolean)
        .join(", ");

      if (!resolvedAddress || (!structuredAddress && deliveryDetails.trim().length < 3)) {
        return setError("Confirm the Google Maps pin and add the building, floor or nearest landmark for the courier.");
      }
    }

    const form = new FormData(event.currentTarget);
    const validLines = cartItems.map(({ id, itemId, variantId, choice, quantity }) => ({
      id,
      itemId,
      variantId,
      choice,
      quantity,
    }));
    if (validLines.length !== cart.length) {
      setCart(validLines);
      saveCart(validLines);
    }
    setBusy(true);

    const fullStructuredAddress = fulfilment === "delivery"
      ? [
          resolvedAddress,
          district && `District: ${district}`,
          street && `Street: ${street}`,
          building && `Building: ${building}`,
          floor && `Floor: ${floor}`,
          apartment && `Apt: ${apartment}`,
          landmark && `Landmark: ${landmark}`,
          deliveryDetails && `Details: ${deliveryDetails}`,
        ].filter(Boolean).join(" — ")
      : "Pickup";

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          branchId,
          fulfilment,
          paymentMethod,
          customer: {
            name: customerName || form.get("name"),
            phone: customerPhone || form.get("phone"),
            address: fullStructuredAddress,
            notes: form.get("notes"),
          },
          coordinates: fulfilment === "delivery" ? coordinates : { latitude: branch.latitude, longitude: branch.longitude },
          lines: validLines.map(({ itemId, variantId, choice, quantity }) => ({ itemId, variantId, choice, quantity })),
        }),
      });
      const data = (await response.json()) as {
        orderNumber?: string;
        receiptToken?: string;
        receiptUrl?: string;
        redirectUrl?: string;
        fawryCode?: string;
        instapayIpa?: string;
        error?: string;
      };
      if (!response.ok || !data.orderNumber) throw new Error(data.error ?? "The order could not be placed.");

      window.localStorage.setItem(
        "puffy_last_order",
        JSON.stringify({ orderNumber: data.orderNumber, phone: customerPhone || String(form.get("phone") ?? "") })
      );
      window.localStorage.removeItem(CART_KEY);

      if (data.redirectUrl) {
        window.location.assign(data.redirectUrl);
      } else if (data.receiptUrl) {
        window.location.assign(data.receiptUrl);
      } else {
        window.location.assign(
          `/order/${encodeURIComponent(data.orderNumber)}/confirmed?token=${encodeURIComponent(data.receiptToken ?? "")}&method=${paymentMethod}`
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The order could not be placed.");
    } finally {
      setBusy(false);
    }
  };

  const t = translations[lang];

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <a href="/" className="brand">
          <img src="/api/media?slot=site-logo" alt="Puffy Pops" />
        </a>
        <div className="checkout-header-right">
          <button type="button" className="checkout-lang-toggle" onClick={toggleLanguage}>
            {lang === "en" ? "عربي" : "English"}
          </button>
          <span>{lang === "ar" ? "إتمام الطلب بأمان" : "Secure order checkout"}</span>
          <a href="/menu">← {lang === "ar" ? "العودة للمنيو" : "Back to menu"}</a>
        </div>
      </header>

      <div className="checkout-shell">
        <section className="checkout-main">
          <div className="checkout-heading">
            <p className="eyebrow">{lang === "ar" ? "خطوات بسيطة" : "Almost there"}</p>
            <h1>
              {lang === "ar" ? "تأكيد واستلام" : "Checkout your"} <em>{lang === "ar" ? "فرحتك." : "joy."}</em>
            </h1>
            <p>
              {lang === "ar"
                ? `طلبك موجه لأقرب فرع (${branch.name}، ${branch.city}) لضمان أقصى سرعة وطزاجة.`
                : `Your order is routed to the nearest branch (${branch.name}, ${branch.city}) with the matching city menu.`}
            </p>
          </div>

          <form id="order-form" onSubmit={placeOrder}>
            {/* Step 1: Contact Details */}
            <section className="checkout-panel">
              <div className="step-title">
                <span>01</span>
                <div>
                  <h2>{lang === "ar" ? "بيانات التواصل" : "Contact details"}</h2>
                  <p>{lang === "ar" ? "لتأكيد الطلب والتواصل مع المندوب" : "So the branch can confirm your order."}</p>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  <span>{lang === "ar" ? "الاسم بالكامل" : "Name"}</span>
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={lang === "ar" ? "اسم المستلم" : "Your name"}
                  />
                </label>

                <label>
                  <span>{lang === "ar" ? "رقم الموبايل المصري (+20)" : "Phone number"}</span>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => validatePhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    pattern="[0-9+ ]{8,18}"
                  />
                  {phoneError ? (
                    <small className="field-error-text">{phoneError}</small>
                  ) : (
                    <small className="field-hint-text">
                      {lang === "ar" ? "يدعم شبكات فودافون، أورانج، اتصالات، ووي" : "Egypt mobile: 010, 011, 012, or 015"}
                    </small>
                  )}
                </label>
              </div>
            </section>

            {/* Step 2: Fulfilment and Pin */}
            <section className="checkout-panel">
              <div className="step-title">
                <span>02</span>
                <div>
                  <h2>{lang === "ar" ? "التوصيل أو الاستلام" : "Delivery or pickup"}</h2>
                  <p>{lang === "ar" ? "حساب المسافة بدقة عبر خرائط جوجل" : "Delivery uses a real map distance to the branch."}</p>
                </div>
              </div>

              <div className="choice-cards">
                <label className={fulfilment === "delivery" ? "active" : ""}>
                  <input
                    type="radio"
                    name="fulfilment"
                    checked={fulfilment === "delivery"}
                    onChange={() => setFulfilment("delivery")}
                  />
                  <strong>{lang === "ar" ? "توصيل للعنوان" : "Delivery"}</strong>
                  <small>{lang === "ar" ? "رسوم محسوبة بالدبوس الدقيق" : "Fee calculated by distance"}</small>
                </label>

                <label className={fulfilment === "pickup" ? "active" : ""}>
                  <input
                    type="radio"
                    name="fulfilment"
                    checked={fulfilment === "pickup"}
                    onChange={() => setFulfilment("pickup")}
                  />
                  <strong>{lang === "ar" ? "استلام من الكاونتر" : "Pickup"}</strong>
                  <small>{lang === "ar" ? "بدون رسوم توصيل" : "No delivery fee"}</small>
                </label>
              </div>

              {fulfilment === "delivery" && (
                <div className="address-block">
                  <label>
                    <span>{lang === "ar" ? "البحث في خرائط جوجل" : "Search Google Maps"}</span>
                    <input
                      type="text"
                      value={addressQuery}
                      onChange={(event) => setAddressQuery(event.target.value)}
                      placeholder={lang === "ar" ? "المنطقة، الشارع، أو اسم المكان..." : "Area, street or place name"}
                    />
                  </label>

                  <div className="address-actions">
                    <button type="button" onClick={calculateFromAddress} disabled={locationBusy}>
                      {locationBusy ? (lang === "ar" ? "جاري التحقق…" : "Checking…") : (lang === "ar" ? "بحث عن العنوان" : "Search address")}
                    </button>
                    <button type="button" className="light" onClick={useCurrentLocation} disabled={locationBusy}>
                      {lang === "ar" ? "استخدام موقعي الحالي" : "Use current location"}
                    </button>
                  </div>

                  <DeliveryMap
                    value={coordinates}
                    center={{ latitude: branch.latitude, longitude: branch.longitude }}
                    disabled={locationBusy}
                    onPick={(next) => {
                      void resolveSelectedCoordinates(next);
                    }}
                  />

                  <p className="location-result" aria-live="polite">
                    {locationStatus}
                  </p>

                  {resolvedAddress && (
                    <div className="confirmed-map-address">
                      <span>Confirmed Google Maps address</span>
                      <strong>{resolvedAddress}</strong>
                      <small>
                        {coordinates?.latitude.toFixed(6)}, {coordinates?.longitude.toFixed(6)}
                      </small>
                    </div>
                  )}

                  {/* Egypt First-Class Address Fields */}
                  <div className="egypt-address-fields">
                    <h4>{lang === "ar" ? "تفاصيل العنوان في مصر" : "Doorstep Address Details"}</h4>
                    <div className="fields-row-2">
                      <label>
                        <span>{lang === "ar" ? "الحي / المنطقة" : "District / Area"} *</span>
                        <input
                          type="text"
                          required
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder={lang === "ar" ? "مثال: كفر عبده / الشيخ زايد" : "e.g. Kafr Abdo, Sheikh Zayed"}
                        />
                      </label>
                      <label>
                        <span>{lang === "ar" ? "اسم الشارع" : "Street Name"} *</span>
                        <input
                          type="text"
                          required
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder={lang === "ar" ? "مثال: شارع عبد المنعم رياض" : "Street name"}
                        />
                      </label>
                    </div>

                    <div className="fields-row-3">
                      <label>
                        <span>{lang === "ar" ? "رقم / اسم العمارة" : "Building"} *</span>
                        <input
                          type="text"
                          required
                          value={building}
                          onChange={(e) => setBuilding(e.target.value)}
                          placeholder="Bldg 12"
                        />
                      </label>
                      <label>
                        <span>{lang === "ar" ? "الدور" : "Floor"}</span>
                        <input
                          type="text"
                          value={floor}
                          onChange={(e) => setFloor(e.target.value)}
                          placeholder="3"
                        />
                      </label>
                      <label>
                        <span>{lang === "ar" ? "رقم الشقة" : "Apt / Suite"}</span>
                        <input
                          type="text"
                          value={apartment}
                          onChange={(e) => setApartment(e.target.value)}
                          placeholder="Apt 302"
                        />
                      </label>
                    </div>

                    <label className="delivery-details">
                      <span>{lang === "ar" ? "علامة مميزة وإرشادات التوصيل" : "Building, floor and nearest landmark"}</span>
                      <textarea
                        value={deliveryDetails}
                        onChange={(event) => {
                          setDeliveryDetails(event.target.value);
                          setLandmark(event.target.value);
                        }}
                        rows={2}
                        required
                        placeholder={
                          lang === "ar"
                            ? "مثال: بجوار صيدلية... المدخل من الشارع الجانبي"
                            : "Building 12, 3rd floor, next to…"
                        }
                      />
                    </label>
                  </div>

                  <small>
                    {lang === "ar"
                      ? "يتم حساب الرسوم النهائية والفرع الأقرب بدقة من خلال السيرفر بناءً على الدبوس المحدد."
                      : "The final fee and nearest branch are calculated again on the server from the saved pin before the order is accepted."}
                  </small>
                </div>
              )}

              <div className="routed-branch">
                <span>{lang === "ar" ? "توجيه الطلب لفرع" : "Order routes to"}</span>
                <strong>{branch.name} · {branch.city}</strong>
                <small>{branch.address}</small>
              </div>
            </section>

            {/* Step 3: Egypt Payment Methods */}
            <section className="checkout-panel">
              <div className="step-title">
                <span>03</span>
                <div>
                  <h2>{lang === "ar" ? "طريقة الدفع" : "Payment method"}</h2>
                  <p>{lang === "ar" ? "طرق دفع مصرية معتمدة وآمنة" : "Choose how you want to pay."}</p>
                </div>
              </div>

              <div className="payment-cards-grid-native">
                {/* 1. COD */}
                <label className={`native-pay-card ${paymentMethod === "cash" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                  />
                  <span className="pay-symbol">₤</span>
                  <div className="pay-info">
                    <strong>{lang === "ar" ? "الدفع عند الاستلام (كاش)" : "Cash on delivery"}</strong>
                    <small>{lang === "ar" ? "الدفع للمندوب بالجنيه المصري" : "Pay the branch courier in cash"}</small>
                  </div>
                </label>

                {/* 2. Card / Meeza */}
                <label className={`native-pay-card ${paymentMethod === "card" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                  />
                  <span className="pay-symbol">💳</span>
                  <div className="pay-info">
                    <strong>{lang === "ar" ? "بطاقة بنكية / بطاقة ميزة" : "Debit / credit / Meeza card"}</strong>
                    <small>{lang === "ar" ? "فيزا، ماستركارد، وميزة الوطنية" : "Visa, Mastercard & Meeza"}</small>
                  </div>
                </label>

                {/* 3. FawryPay */}
                <label className={`native-pay-card ${paymentMethod === "fawry" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "fawry"}
                    onChange={() => setPaymentMethod("fawry")}
                  />
                  <span className="pay-symbol">🟡</span>
                  <div className="pay-info">
                    <strong>{lang === "ar" ? "فوري باي (FawryPay)" : "FawryPay Reference Code"}</strong>
                    <small>{lang === "ar" ? "كود دفع بأي كشك فوري أو التطبيق" : "Pay at any Fawry kiosk or app"}</small>
                  </div>
                </label>

                {/* 4. InstaPay */}
                <label className={`native-pay-card ${paymentMethod === "instapay" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "instapay"}
                    onChange={() => setPaymentMethod("instapay")}
                  />
                  <span className="pay-symbol">⚡</span>
                  <div className="pay-info">
                    <strong>{lang === "ar" ? "إنستاباي (InstaPay IPN)" : "InstaPay QR / IPA"}</strong>
                    <small>{lang === "ar" ? "تحويل لحظي ٢٤/٧ للبنك المركزي" : "Instant bank & wallet transfer"}</small>
                  </div>
                </label>
              </div>

              {/* Dynamic Instructions per payment method */}
              {paymentMethod === "fawry" && (
                <div className="fawry-instruction-box">
                  <h4>🟡 {lang === "ar" ? "تعليمات الدفع عبر فوري باي" : "How FawryPay Works"}</h4>
                  <ol>
                    <li>
                      {lang === "ar"
                        ? "فور تأكيد الطلب، سيظهر لك كود دفع فوري فريد مكون من ٨ أرقام."
                        : "You will receive an 8-digit unique Fawry reference code."}
                    </li>
                    <li>
                      {lang === "ar"
                        ? "توجه لأي كشك فوري أو ادفع عبر تطبيق myFawry خلال ساعتين."
                        : "Pay at any Fawry POS kiosk or via myFawry mobile app within 2 hours."}
                    </li>
                    <li>
                      {lang === "ar"
                        ? "يبدأ الفرع في تجهيز طلبك طازة فور إتمام الدفع."
                        : "The kitchen starts baking fresh immediately upon payment."}
                    </li>
                  </ol>
                </div>
              )}

              {paymentMethod === "instapay" && (
                <div className="instapay-instruction-box">
                  <h4>⚡ {lang === "ar" ? "تعليمات الدفع عبر شبكة إنستاباي (IPN)" : "InstaPay Payment Details"}</h4>
                  <div className="instapay-ipa-display">
                    <span>{lang === "ar" ? "عنوان الدفع اللحظي (IPA):" : "InstaPay Payment Address (IPA):"}</span>
                    <code>puffypops@instapay</code>
                  </div>
                  <p>
                    {lang === "ar"
                      ? "افتح تطبيق InstaPay ← تحويل أموال ← أدخل العنوان puffypops@instapay ← اكتب رقم الطلب في الملاحظات."
                      : "Open your InstaPay app, transfer to puffypops@instapay and mention your order number in the reference notes."}
                  </p>
                </div>
              )}

              {paymentMethod === "card" && (
                <div className="provider-notice">
                  <strong>Card checkout is ready for the provider adapter.</strong>
                  <p>
                    Add Puffy Pops’ payment gateway credentials and implementation before enabling live card orders. No
                    card details are collected by this starter.
                  </p>
                </div>
              )}

              <label className="notes-field">
                <span>{lang === "ar" ? "ملاحظات إضافية على الطلب (اختياري)" : "Order notes"} <small>(optional)</small></span>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder={lang === "ar" ? "ملاحظات النكهات، تعليمات المندوب..." : "Flavor notes, delivery instructions…"}
                />
              </label>
            </section>
          </form>
        </section>

        {/* Order Review Sidebar */}
        <aside className="order-review">
          <p className="eyebrow">{lang === "ar" ? "ملخص طلبك" : "Your order"}</p>
          <h2>{branch.name}</h2>

          {!cartItems.length ? (
            <div className="checkout-empty">
              <p>Your cart is empty or belongs to a different city menu.</p>
              <a href="/menu">Return to menu</a>
            </div>
          ) : (
            <div className="review-lines">
              {cartItems.map((line) => (
                <div className="review-line" key={line.id}>
                  <div>
                    <strong>{line.item.name}</strong>
                    <small>
                      {line.variant.label}
                      {line.choice ? ` · ${line.choice}` : ""}
                    </small>
                    <div className="mini-quantity">
                      <button type="button" onClick={() => changeQuantity(line.id, -1)}>
                        −
                      </button>
                      <span>{line.quantity}</span>
                      <button type="button" onClick={() => changeQuantity(line.id, 1)}>
                        +
                      </button>
                    </div>
                  </div>
                  <span>{formatPrice(line.lineTotal)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="review-totals">
            <div>
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <div>
              <span>Delivery</span>
              <strong>{fee == null ? "Calculate location" : fee === 0 ? "Free" : formatPrice(fee)}</strong>
            </div>
            {distance != null && fulfilment === "delivery" && (
              <small>
                {distance.toFixed(1)} km from {branch.name}
              </small>
            )}
            <div className="grand-total">
              <div>
                <span>Total</span>
                <small className="vat-tag">14% VAT included</small>
              </div>
              <strong>{formatPrice(total)}</strong>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            form="order-form"
            className="place-order"
            type="submit"
            disabled={busy || locationBusy || !catalogReady || !cartItems.length}
          >
            {busy || locationBusy || !catalogReady
              ? "Please wait…"
              : paymentMethod === "card"
              ? "Continue to card payment"
              : paymentMethod === "fawry"
              ? (lang === "ar" ? "تأكيد واستخراج كود فوري" : "Place FawryPay order")
              : paymentMethod === "instapay"
              ? (lang === "ar" ? "تأكيد وتحويل إنستاباي" : "Place InstaPay order")
              : "Place cash order"}
            <span>→</span>
          </button>
          <p className="checkout-terms">Submitting sends this order to the selected branch dashboard.</p>
        </aside>
      </div>
    </main>
  );
}
