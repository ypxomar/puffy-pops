export type Language = "en" | "ar";

export const LANGUAGE_STORAGE_KEY = "puffy-pops-language";

export const translations = {
  en: {
    // Delivery Strip
    deliveringStrip: "Delivering Alexandria + Cairo • Choose your branch",
    branchKafrAbdo: "Kafr Abdo, Alex",
    branchSmouha: "Smouha, Alex",
    branchGreenPlaza: "Green Plaza, Alex",
    branchArkan: "Arkan Plaza, Cairo",
    branchGolfCentral: "Golf Central, Cairo",
    deliveringFrom: "Delivering from",
    changeBranch: "Change",
    switchLanguage: "عربي",

    // Navigation
    menu: "Menu",
    trackOrder: "Track order",
    locations: "Locations",
    ourStory: "Our story",
    buildBox: "Build a Box",
    collections: "Collections",
    cart: "Cart",
    orderNow: "Order now",
    myOrder: "My order",
    help: "Help",
    account: "Account",

    // Hero
    eyebrowFresh: "Freshly made near you",
    heroH1Part1: "Small bites.",
    heroH1Part2: "Big joy.",
    heroSupport: "Freshly made Puffy Pops, picked your way and delivered from your nearest branch.",
    buildBoxBtn: "Build your box",
    findBranchBtn: "Find a branch",
    trustBandBranches: "5 branches",
    trustBandMenus: "Local menus",
    trustBandPayment: "Secure Egypt payment",
    trustBandFresh: "Freshly made batches",

    // How it works
    howItWorksEyebrow: "One box. Three easy moves.",
    howItWorksTitle: "No scroll tricks. Just pick, pin and pop.",
    step1Title: "Choose the bites",
    step1Desc: "Browse the right city menu, then pick a size and flavours.",
    step2Title: "Drop the pin",
    step2Desc: "Put the pin at the delivery entrance so distance and fees stay accurate.",
    step3Title: "We route it",
    step3Desc: "The order goes to the correct Puffy Pops branch with every choice attached.",

    // Soft Serve module
    softServeEyebrow: "INTRODUCING OUR ALL-NEW SOFT SERVE",
    softServeH2: "Your new soft spot.",
    softServeSub: "Meet our all-new soft serve. A little swirl. A whole lot of joy.",
    findYourFlavour: "Find your flavour",
    startAnOrder: "Start an order",
    whatsYourSwirl: "WHAT'S YOUR SWIRL?",
    fourFlavours: "FOUR FLAVOURS. YOUR HAPPY PLACE.",
    sweetDetails: "The sweet details",
    thisOnesForMe: "This one's for me",

    // Favourites
    favouritesEyebrow: "A few favourites",
    favouritesTitle: "Start with a classic. Then make it yours.",
    seeOnMenu: "See it on the menu",

    // Story
    storyEyebrow: "Born in Alexandria",
    storyTitle: "Small bites. A whole mood.",
    storyDesc: "Puffy Pops turns soft dough, generous fillings, and playful flavors into boxes made to pass around.",
    alexRootsCairoEnergy: "Alexandria roots. Cairo energy.",
    meetMeAtPuffy: "Meet me at Puffy.",
    meetMeAtPuffySub: "Bring your people. We'll bring the swirls.",

    // Menu page
    menuTitle: "Find your joy",
    menuSubtitle: "Freshly prepared handcrafted bites, warm boxes and icy swirls in Alexandria & Cairo.",
    allCategories: "All Items",
    catPuffyPops: "Puffy Pops",
    catSoftServe: "Soft Serve",
    catDrinks: "Drinks & Refreshers",
    catDesserts: "Desserts & Bakery",
    catSeasonal: "Seasonal Drops",
    searchPlaceholder: "Search Nutella, Pistachio, Lotus, Matcha...",
    filterAllergenNutFree: "Nut Free",
    filterVegetarian: "Vegetarian",
    filterSharing: "For sharing",
    filterUnder200: "Under 200 EGP",
    vatIncluded: "VAT included",
    estimatedDelivery: "25–40 min",
    quickAdd: "Quick Add",
    customize: "Customize",
    availableHere: "Available here",
    outOfStock: "Out of stock",
    nearbyStock: "Nearby branch stock",

    // Build a Box
    buildBoxHeading: "Build Your Dream Box",
    buildBoxSub: "Pick your branch, select your size, combine your favorite flavours and add dipping bliss.",
    stepSize: "1. Choose Box Size",
    stepFlavours: "2. Pick Your Flavours",
    stepAddons: "3. Dips & Add-ons",
    stepReview: "4. Box Summary",
    selectedCount: "selected",
    of: "of",
    addDippingSauce: "Add Dipping Sauces",
    addDrink: "Pair With a Drink",
    addGiftNote: "Add a Free Handwritten Gift Note",
    giftNotePlaceholder: "Write your special message for friends, family or a sweet celebration...",
    addCandle: "Include Birthday Candle",
    addToCartJoy: "Add Box to Order",
    servesGuidance: "Servings",

    // Checkout
    checkoutTitle: "Secure Checkout",
    contactDetails: "Contact Information",
    fullName: "Full Name",
    egyptPhone: "Egyptian Mobile Number",
    phoneHint: "e.g. 01012345678 or +2010...",
    fulfilmentMethod: "Fulfilment Method",
    delivery: "Delivery to Door",
    pickup: "Counter Pickup",
    deliveryAddress: "Delivery Address",
    districtLabel: "District / Neighborhood",
    streetLabel: "Street Name",
    buildingLabel: "Building Name or Number",
    floorLabel: "Floor",
    aptLabel: "Apartment / Suite",
    landmarkLabel: "Nearest Landmark / Special Directions",
    dropPinPrompt: "Exact Map Pin",
    useMyLocation: "Use my location",
    searchLocation: "Search area or street",
    deliveryFeeLabel: "Delivery Fee",
    subtotalLabel: "Subtotal",
    totalLabel: "Total Amount",
    paymentMethodHeading: "Payment Method",
    payCash: "Cash on Delivery (COD)",
    payCashDesc: "Pay with Egyptian Pounds upon delivery. Exact change appreciated.",
    payCard: "Debit / Credit / Meeza Card",
    payCardDesc: "Pay securely with Visa, Mastercard, or Egyptian Meeza card.",
    payFawry: "FawryPay Reference Code",
    payFawryDesc: "Pay cash at any Fawry kiosk or via myFawry app using a unique reference code.",
    payInstaPay: "InstaPay (IPN Instant Transfer)",
    payInstaPayDesc: "Instant 24/7 bank & wallet transfer via Central Bank of Egypt's InstaPay app.",
    placeOrder: "Place Order",
    placingOrder: "Placing your order...",

    // Microcopy
    addedHappier: "Added. Your box is getting happier.",
    emptyCartTitle: "Your box is empty. Let’s fix that.",
    branchUnavailable: "This item isn’t available at this branch today. Try another nearby branch.",
    pinError: "We need a more exact pin to calculate delivery.",
    paymentIssue: "That payment didn’t go through. Your order is still saved—try another method.",
    noSearchResult: "No luck there. Try “Nutella,” “pistachio,” or browse all flavours.",
    emailCapture: "A little joy in your inbox: new flavours, branch drops, and occasional treats.",
    freeDeliveryThreshold: "Free delivery threshold:",
    currency: "EGP",
  },
  ar: {
    // Delivery Strip
    deliveringStrip: "توصيل الإسكندرية والقاهرة • اختر فرعك",
    branchKafrAbdo: "كفر عبده، الإسكندرية",
    branchSmouha: "سموحة، الإسكندرية",
    branchGreenPlaza: "جرين بلازا، الإسكندرية",
    branchArkan: "أركان بلازا، القاهرة",
    branchGolfCentral: "جولف سنترال، القاهرة",
    deliveringFrom: "التوصيل من",
    changeBranch: "تغيير",
    switchLanguage: "English",

    // Navigation
    menu: "المنيو",
    trackOrder: "تتبع طلبك",
    locations: "فروعنا",
    ourStory: "قصتنا",
    buildBox: "اصنع صندوقك",
    collections: "المجموعات",
    cart: "سلة الطلبات",
    orderNow: "اطلب الآن",
    myOrder: "طلبي",
    help: "المساعدة",
    account: "حسابي",

    // Hero
    eyebrowFresh: "طازة بالقرب منك",
    heroH1Part1: "لقمة صغيرة.",
    heroH1Part2: "فرحة كبيرة.",
    heroSupport: "بوفي بوبس طازة على مزاجك، من أقرب فرع لحد بابك.",
    buildBoxBtn: "اصنع صندوقك",
    findBranchBtn: "فروعنا",
    trustBandBranches: "٥ فروع بمصر",
    trustBandMenus: "منيو لكل مدينة",
    trustBandPayment: "دفع آمن وسهل",
    trustBandFresh: "تحضير فوري طازة",

    // How it works
    howItWorksEyebrow: "صندوق واحد. ٣ خطوات سهلة.",
    howItWorksTitle: "اختر. حدد. بوب!",
    step1Title: "اختر لقماتك",
    step1Desc: "تصفح منيو مدينتك، واختر الحجم والنكهات المفضلة.",
    step2Title: "حدد مكانك بالدقة",
    step2Desc: "ضع الدبوس عند مدخل البناية بالضبط لضمان سرعة الوصول ودقة الرسوم.",
    step3Title: "نوصلها طازة",
    step3Desc: "يصل الطلب لأقرب فرع بوفي بوبس ليجهز طازة من أجلك فوراً.",

    // Soft Serve module
    softServeEyebrow: "نقدم لكم سوفت سيرف بوفي بوبس الجديد كلياً",
    softServeH2: "نقطة ضعفك الجديدة.",
    softServeSub: "سوفت سيرف بوفي بوبس فائق النعومة والانتعاش. دوامة صغيرة وسعادة كبيرة.",
    findYourFlavour: "اختر نكهتك",
    startAnOrder: "ابدأ طلبك",
    whatsYourSwirl: "ما هي نكهتك المفضلة؟",
    fourFlavours: "أربع نكهات لصناعة السعادة",
    sweetDetails: "التفاصيل اللذيذة",
    thisOnesForMe: "هذه لي بالضبط",

    // Favourites
    favouritesEyebrow: "أكثر ما يحبه الجميع",
    favouritesTitle: "ابدأ بالكلاسيكيات. واصنعها على ذوقك.",
    seeOnMenu: "شاهدها في المنيو",

    // Story
    storyEyebrow: "بدايتنا في الإسكندرية",
    storyTitle: "لقمات صغيرة.. ومود كامل.",
    storyDesc: "عجينة خفيفة هشة، حشوات غنية لا تبخل، ونكهات مرحة في صناديق صنعت لتشاركها مع من تحب.",
    alexRootsCairoEnergy: "جذور إسكندرانية.. وطاقة قاهرية.",
    meetMeAtPuffy: "نلتقي في بوفي.",
    meetMeAtPuffySub: "اجمع أحبابك، ودع علينا الدوامات اللذيذة.",

    // Menu page
    menuTitle: "اختر فرحتك اليوم",
    menuSubtitle: "حلويات مخبوزة طازة، صناديق دافئة وسوفت سيرف منعش في الإسكندرية والقاهرة.",
    allCategories: "كل الأصناف",
    catPuffyPops: "بوفي بوبس",
    catSoftServe: "سوفت سيرف",
    catDrinks: "مشروبات وانتعاش",
    catDesserts: "حلويات ومخبوزات",
    catSeasonal: "إصدارات موسمية",
    searchPlaceholder: "ابحث عن نوتيلا، بستاشيو، لوتس، كيندر، ماتشا...",
    filterAllergenNutFree: "بدون مكسرات",
    filterVegetarian: "مناسب للنباتيين",
    filterSharing: "للمشاركة والعائلات",
    filterUnder200: "أقل من ٢٠٠ ج.م",
    vatIncluded: "شامل ضريبة القيمة المضافة",
    estimatedDelivery: "٢٥–٤٠ دقيقة",
    quickAdd: "إضافة سريعة",
    customize: "تخصيص",
    availableHere: "متوفر بالفرع",
    outOfStock: "نفد مؤقتاً",
    nearbyStock: "متوفر بفرع قريب",

    // Build a Box
    buildBoxHeading: "اصنع صندوق أحلامك",
    buildBoxSub: "اختر فرعك، حجم الصندوق، ونسّق نكهاتك المفضلة مع صوصات التغميس اللذيذة.",
    stepSize: "١. اختر حجم الصندوق",
    stepFlavours: "٢. اختر نكهاتك",
    stepAddons: "٣. صوصات وإضافات",
    stepReview: "٤. ملخص الصندوق",
    selectedCount: "تم اختيار",
    of: "من",
    addDippingSauce: "صوصات التغميس الإضافية",
    addDrink: "أضف مشروبك المفضل",
    addGiftNote: "كرت إهداء مكتوب بخط اليد مجاناً",
    giftNotePlaceholder: "اكتب رسالتك الخاصة لأصدقائك أو عائلتك...",
    addCandle: "إضافة شمعة احتفال",
    addToCartJoy: "أضف الصندوق للطلب",
    servesGuidance: "تكفي",

    // Checkout
    checkoutTitle: "إتمام الطلب بأمان",
    contactDetails: "بيانات التواصل",
    fullName: "الاسم بالكامل",
    egyptPhone: "رقم الموبايل المصري",
    phoneHint: "مثال: 01012345678 أو +2010...",
    fulfilmentMethod: "طريقة الاستلام",
    delivery: "توصيل للعنوان",
    pickup: "استلام من الفرع",
    deliveryAddress: "عنوان التوصيل",
    districtLabel: "المنطقة / الحي",
    streetLabel: "اسم الشارع",
    buildingLabel: "رقم أو اسم العمارة",
    floorLabel: "الدور",
    aptLabel: "رقم الشقة",
    landmarkLabel: "علامة مميزة / تفاصيل الوصول",
    dropPinPrompt: "تحديد الموقع الدقيق على الخريطة",
    useMyLocation: "استخدم موقعي الحالي",
    searchLocation: "ابحث عن منطقة أو شارع",
    deliveryFeeLabel: "رسوم التوصيل",
    subtotalLabel: "المجموع الفرعي",
    totalLabel: "الإجمالي النهائي",
    paymentMethodHeading: "طريقة الدفع",
    payCash: "الدفع نقدياً عند الاستلام (COD)",
    payCashDesc: "الدفع بالجنيه المصري عند وصول المندوب. يفضل تجهيز المبلغ بالضبط.",
    payCard: "بطاقة بنكية / بطاقة ميزة",
    payCardDesc: "دفع آمن ببطاقات فيزا، ماستركارد، أو بطاقات ميزة الوطنية المصرية.",
    payFawry: "كود فوري باي (FawryPay)",
    payFawryDesc: "ادفع نقداً في أي كشك أو نقطة فوري أو عبر تطبيق myFawry بكود دفع مخصص.",
    payInstaPay: "إنستاباي (InstaPay IPN)",
    payInstaPayDesc: "تحويل فوري لحظي ٢٤/٧ عبر شبكة المدفوعات اللحظية للبنك المركزي المصري.",
    placeOrder: "تأكيد وإرسال الطلب",
    placingOrder: "جاري إرسال طلبك...",

    // Microcopy
    addedHappier: "تمت الإضافة. صندوقك بقى أسعد.",
    emptyCartTitle: "صندوقك فاضي. يلا نملأه فرحة.",
    branchUnavailable: "هذا الصنف غير متوفر في هذا الفرع اليوم. جرب فرعاً قريباً آخر.",
    pinError: "نحتاج لتحديد الدبوس بدقة لحساب التوصيل.",
    paymentIssue: "تعذر إتمام الدفع. طلبك محفوظ، يرجى اختيار طريقة أخرى.",
    noSearchResult: "لم نعثر على نتائج. جرب البحث عن «نوتيلا» أو «بستاشيو» أو تصفح كل النكهات.",
    emailCapture: "جرعة فرحة في بريدك: نكهات جديدة، أخبار الفروع، وعروض خاصة.",
    freeDeliveryThreshold: "المتبقي على التوصيل المجاني:",
    currency: "ج.م",
  },
} as const;

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const val = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return val === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

export function setStoredLanguage(lang: Language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      window.dispatchEvent(new CustomEvent("puffy-language-change", { detail: { lang } }));
    }
  } catch {
    // Ignore storage issues
  }
}
