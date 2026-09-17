import { talabatImages } from "./catalog";

export type CollectionInfo = {
  slug: string;
  id: string;
  titleEn: string;
  titleAr: string;
  taglineEn: string;
  taglineAr: string;
  descriptionEn: string;
  descriptionAr: string;
  heroImage: string;
  categoryIds: string[];
};

export const COLLECTIONS: CollectionInfo[] = [
  {
    slug: "puffy-pops",
    id: "puffy-pops",
    titleEn: "Puffy Pops Boxes",
    titleAr: "صناديق بوفي بوبس",
    taglineEn: "The handcrafted bite-sized Egyptian joy",
    taglineAr: "لقمات السعادة الهشة المحشوة بسخاء",
    descriptionEn: "Golden, bite-sized handcrafted dough spheres, generously filled and topped with warm Belgian chocolate, rich Nutella, velvety pistachio cream, and signature drizzles.",
    descriptionAr: "كرات عجين ذهبية هشة مخبوزة طازة، محشوة ومغطاة بسخاء بالشوكولاتة البلجيكية، النوتيلا، كريمة البستاشيو، وألذ الصوصات الدافئة.",
    heroImage: talabatImages.nutella,
    categoryIds: ["puffy-pops"],
  },
  {
    slug: "soft-serve",
    id: "soft-serve",
    titleEn: "All-New Soft Serve",
    titleAr: "سوفت سيرف بوفي الجديد",
    taglineEn: "A little swirl. A whole lot of joy.",
    taglineAr: "دوامة صغيرة وسعادة منعشة فائقة النعومة",
    descriptionEn: "Ridiculously creamy, slow-churned vanilla soft serve laced with strawberry ribbons, dark chocolate crunch, Sicilian pistachio cream, or pure vanilla clouds.",
    descriptionAr: "سوفت سيرف كريمي فائق النعومة، بنكهات الفراولة المنعشة، صوص الشوكولاتة الداكنة، بستاشيو صقلي أصلي، أو سحابة الفانيليا النقية.",
    heroImage: "/images/soft-serve-strawberry.png",
    categoryIds: ["soft-serve"],
  },
  {
    slug: "drinks",
    id: "drinks",
    titleEn: "Drinks & Refreshers",
    titleAr: "مشروبات وانتعاش",
    taglineEn: "Iced coffees, matcha blends, fizzies & frappes",
    taglineAr: "قهوة مثلجة، ماتشا منعشة، وفيزيات فوارة بالفواكه",
    descriptionEn: "Cold brews, ceremonial grade matcha lattes, fruit fizzies with real botanical purees, and thick creamy milkshakes crafted to pair with your dessert box.",
    descriptionAr: "قهوة مثلجة مميزة، مشروبات ماتشا فاخرة، فيزيات فوارة بنكهات الفواكه الطبيعية، وميلك شيك غني يكمل متعة صندوق التحلية.",
    heroImage: "/images/puffy-moments.jpg",
    categoryIds: ["matcha", "iced-coffee", "frappe", "fizzies", "shakes", "iced-tea", "smoothies", "hot-drinks"],
  },
  {
    slug: "desserts-bakery",
    id: "desserts-bakery",
    titleEn: "Desserts & Bakery",
    titleAr: "حلويات ومخبوزات",
    taglineEn: "Puffyteroles, stuffed cookies & molten brownies",
    taglineAr: "بوفيترول، كوكيز محشو، وبراونيز فادج غني",
    descriptionEn: "Our bakery lab favorites: the shareable Puffyterole, loaded New York style stuffed cookies, rich fudge brownies, and velvety Lotus cheesecakes.",
    descriptionAr: "أطباق مخبزنا الحرفي: بوفيترول للمشاركة، كوكيز محشو بالنوتيلا والمكسرات، براونيز فادج بالشوكولاتة، وتشيز كيك اللوتس الناعم.",
    heroImage: talabatImages.assorted,
    categoryIds: ["puffyterole", "cheesecakes", "cookies", "brownies", "blondies", "pookies"],
  },
  {
    slug: "seasonal",
    id: "seasonal",
    titleEn: "Seasonal & Limited Drops",
    titleAr: "إصدارات موسمية محدودة",
    taglineEn: "Exclusive small-batch creations while today's batch lasts",
    taglineAr: "إبداعات خاصة بدفعات طازجة يومية حتى نفاد الكمية",
    descriptionEn: "Special seasonal creations including Dates & Cinnamon warm boxes, Mediterranean holiday specials, and limited-edition dipping pairings.",
    descriptionAr: "إصدارات خاصة تشمل صندوق التمر والقرفة الدافئ، خلطات الأعياد والمواسم، وتغميسات فريدة متوفرة لفترة محدودة.",
    heroImage: talabatImages.caramel,
    categoryIds: ["puffy-pops", "puffyterole"],
  },
];

export type ProductDetail = {
  slug: string;
  catalogItemId: string;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  collectionSlug: string;
  priceFrom: number;
  rating: number;
  reviewCount: number;
  image: string;
  gallery: string[];
  description: {
    feelingEn: string;
    feelingAr: string;
    insideEn: string;
    insideAr: string;
    makeItYoursEn: string;
    makeItYoursAr: string;
    goodToKnowEn: string;
    goodToKnowAr: string;
  };
  allergensEn: string[];
  allergensAr: string[];
  servings: string;
  sizes: Array<{ id: string; labelEn: string; labelAr: string; price: number; serves: string }>;
  flavours?: string[];
  pairings: Array<{ nameEn: string; nameAr: string; price: number; image: string }>;
  reviews: Array<{ author: string; city: string; rating: number; commentEn: string; commentAr: string; date: string }>;
};

export const PRODUCT_DETAILS: Record<string, ProductDetail> = {
  "nutella-puffy-pops": {
    slug: "nutella-puffy-pops",
    catalogItemId: "cairo-nutella",
    nameEn: "Nutella Puffy Pops",
    nameAr: "بوفي بوبس نوتيلا",
    taglineEn: "The undisputed crowd favorite",
    taglineAr: "الخيار المفضل الأول للجميع بلا منازع",
    collectionSlug: "puffy-pops",
    priceFrom: 180,
    rating: 4.9,
    reviewCount: 342,
    image: talabatImages.nutella,
    gallery: [talabatImages.nutella, talabatImages.assorted, "/images/puffy-moments.jpg"],
    description: {
      feelingEn: "A warm, comforting burst of hazelnut chocolate with every golden bite.",
      feelingAr: "انفجار دافئ من شوكولاتة البندق اللذيذة مع كل لقمة ذهبية هشة.",
      insideEn: "Fluffy artisan dough, melted warm Nutella core, chocolate dust.",
      insideAr: "عجين خفيف هش محضر يدوياً، قلب نوتيلا دافئ ذائب، ورشة كاكاو ناعمة.",
      makeItYoursEn: "Available in 6, 8, 10 or 36 piece party boxes. Add extra dipping sauce.",
      makeItYoursAr: "متوفر بأحجام ٦، ٨، ١٠ أو ٣٦ قطعة للمناسبات. يمكنك إضافة صوص تغميس إضافي.",
      goodToKnowEn: "Serves 1–3, freshly baked every 20 minutes. Contains dairy, hazelnuts, wheat.",
      goodToKnowAr: "تكفي ١-٣ أفراد، تخبز طازجة كل ٢٠ دقيقة. تحتوي على الحليب والبندق والقمح.",
    },
    allergensEn: ["Dairy (Milk)", "Tree Nuts (Hazelnuts)", "Wheat (Gluten)", "Soy"],
    allergensAr: ["حليب ومنتجات ألبان", "مكسرات (بندق)", "قمح (جلوتين)", "صويا"],
    servings: "1–3 persons",
    sizes: [
      { id: "s-6", labelEn: "Small · 6 pieces", labelAr: "صغير · ٦ قطع", price: 180, serves: "1 person" },
      { id: "m-8", labelEn: "Medium · 8 pieces", labelAr: "وسط · ٨ قطع", price: 195, serves: "1–2 persons" },
      { id: "l-10", labelEn: "Large · 10 pieces", labelAr: "كبير · ١٠ قطع", price: 210, serves: "2–3 persons" },
    ],
    pairings: [
      { nameEn: "Iced Peach Tea", nameAr: "آيس تي خوخ", price: 120, image: "/images/puffy-moments.jpg" },
      { nameEn: "Belgian Dipping Sauce", nameAr: "صوص شوكولاتة بلجيكية", price: 60, image: talabatImages.caramel },
      { nameEn: "Vanilla Cloud Soft Serve", nameAr: "سوفت سيرف سحابة الفانيليا", price: 85, image: "/images/soft-serve-vanilla.png" },
    ],
    reviews: [
      { author: "Farida M.", city: "Alexandria", rating: 5, commentEn: "Arrived piping hot at Kafr Abdo. The Nutella filling is so generous!", commentAr: "وصل ساخن جداً من فرع كفر عبده. حشوة النوتيلا مليانة وبتدوب في الفم!", date: "2 days ago" },
      { author: "Youssef T.", city: "Cairo (Sheikh Zayed)", rating: 5, commentEn: "Ordered for movie night. 10/10 box, disappeared in 5 minutes.", commentAr: "طلبناه لسهرة الفيلم، الصندوق خلص في ٥ دقائق! طعم خطير بجد.", date: "1 week ago" },
      { author: "Nadine K.", city: "Cairo", rating: 5, commentEn: "The dough is so light and never oily. Puffy Pops is our family ritual now.", commentAr: "العجينة خفيفة ومش مزيتة أبداً. بقى عادة أساسية عندنا كل أسبوع.", date: "2 weeks ago" },
    ],
  },
  "pistachio-puffy-pops": {
    slug: "pistachio-puffy-pops",
    catalogItemId: "cairo-pistachio",
    nameEn: "Pistachio Puffy Pops",
    nameAr: "بوفي بوبس بستاشيو",
    taglineEn: "Rich, nutty Sicilian pistachio cream",
    taglineAr: "كريمة بستاشيو فاخرة وغنية بالمكسرات المقرمشة",
    collectionSlug: "puffy-pops",
    priceFrom: 190,
    rating: 4.9,
    reviewCount: 218,
    image: talabatImages.assorted,
    gallery: [talabatImages.assorted, talabatImages.nutella, "/images/soft-serve-pistachio.png"],
    description: {
      feelingEn: "Silky, nutty luxury that balances sweetness with toasted pistachio aroma.",
      feelingAr: "مزيج فاخر وحريري يجمع بين الحلاوة ونكهة الفستق المحمص الغنية.",
      insideEn: "Crispy soft dough balls, pure pistachio cream filling, crushed toasted pistachios.",
      insideAr: "كرات عجين مقرمشة هشة، حشوة كريمة فستق طبيعية، ومكسرات فستق محمصة مجروشة.",
      makeItYoursEn: "Choose 6, 8, or 10 pieces. Perfect with Belgian chocolate dipping on the side.",
      makeItYoursAr: "اختر ٦، ٨، أو ١٠ قطع. خرافية عند تغميسها بالشوكولاتة البلجيكية الدافئة.",
      goodToKnowEn: "Contains real pistachios. Handcrafted per order.",
      goodToKnowAr: "تحتوي على فستق حلبي طبيعي. تحضر يدوياً بكل حب فور طلبها.",
    },
    allergensEn: ["Dairy (Milk)", "Tree Nuts (Pistachios)", "Wheat (Gluten)"],
    allergensAr: ["حليب ومنتجات ألبان", "مكسرات (فستق حلبي)", "قمح (جلوتين)"],
    servings: "1–3 persons",
    sizes: [
      { id: "s-6", labelEn: "Small · 6 pieces", labelAr: "صغير · ٦ قطع", price: 190, serves: "1 person" },
      { id: "m-8", labelEn: "Medium · 8 pieces", labelAr: "وسط · ٨ قطع", price: 205, serves: "1–2 persons" },
      { id: "l-10", labelEn: "Large · 10 pieces", labelAr: "كبير · ١٠ قطع", price: 220, serves: "2–3 persons" },
    ],
    pairings: [
      { nameEn: "Iced Ceremonial Matcha", nameAr: "ماتشا مثلجة ممتازة", price: 130, image: "/images/puffy-moments.jpg" },
      { nameEn: "Pistachio Dream Soft Serve", nameAr: "سوفت سيرف بستاشيو دريم", price: 95, image: "/images/soft-serve-pistachio.png" },
    ],
    reviews: [
      { author: "Hassan B.", city: "Cairo", rating: 5, commentEn: "Real pistachio taste, not artificial flavoring. Worth every pound.", commentAr: "طعم فستق حقيقي ومش نكهات صناعية. تستاهل كل قرش بجد.", date: "3 days ago" },
      { author: "Laila S.", city: "Alexandria", rating: 5, commentEn: "My absolute favorite order from Smouha branch!", commentAr: "طلبي المفضل دائماً من فرع سموحة بدون تردد!", date: "1 week ago" },
    ],
  },
  "white-chocolate-puffy-pops": {
    slug: "white-chocolate-puffy-pops",
    catalogItemId: "cairo-lotus",
    nameEn: "White Chocolate Puffy Pops",
    nameAr: "بوفي بوبس وايت شوكليت",
    taglineEn: "Soft, sweet, unmistakable velvet",
    taglineAr: "مذاق مخملي حلو وناعم لا ينسى",
    collectionSlug: "puffy-pops",
    priceFrom: 180,
    rating: 4.8,
    reviewCount: 184,
    image: talabatImages.whiteChocolate,
    gallery: [talabatImages.whiteChocolate, talabatImages.assorted],
    description: {
      feelingEn: "Smooth, velvety white chocolate melts right as you take the first bite.",
      feelingAr: "شوكولاتة بيضاء مخملية تذوب بمجرد أن تأخذ أول قضمة.",
      insideEn: "Light golden dough, premium ivory cocoa butter cream.",
      insideAr: "عجينة ذهبية هشة، كريمة زبدة الكاكاو البيضاء النقية.",
      makeItYoursEn: "Available in 6, 8, 10 or party packs.",
      makeItYoursAr: "متوفرة في علب ٦، ٨، ١٠ قطع أو علبة الحفلات الكبيرة.",
      goodToKnowEn: "Made fresh in small batches. Contains dairy, gluten.",
      goodToKnowAr: "تُصنع طازجة بدفعات صغيرة. تحتوي على الحليب والجلوتين.",
    },
    allergensEn: ["Dairy (Milk)", "Wheat (Gluten)", "Soy"],
    allergensAr: ["حليب ومنتجات ألبان", "قمح (جلوتين)", "صويا"],
    servings: "1–3 persons",
    sizes: [
      { id: "s-6", labelEn: "Small · 6 pieces", labelAr: "صغير · ٦ قطع", price: 180, serves: "1 person" },
      { id: "m-8", labelEn: "Medium · 8 pieces", labelAr: "وسط · ٨ قطع", price: 195, serves: "1–2 persons" },
      { id: "l-10", labelEn: "Large · 10 pieces", labelAr: "كبير · ١٠ قطع", price: 210, serves: "2–3 persons" },
    ],
    pairings: [
      { nameEn: "Strawberry Fizz", nameAr: "فيزي فراولة منعش", price: 120, image: "/images/puffy-moments.jpg" },
      { nameEn: "Strawberry Kiss Soft Serve", nameAr: "سوفت سيرف ستروبري كيس", price: 90, image: "/images/soft-serve-strawberry.png" },
    ],
    reviews: [
      { author: "Salma E.", city: "Alexandria", rating: 5, commentEn: "So velvety and sweet. Perfect comfort dessert.", commentAr: "ملمس ناعم جداً وطعم يروق البال. أحلى تحلية ممكن تطلبها.", date: "4 days ago" },
    ],
  },
  "half-and-half": {
    slug: "half-and-half",
    catalogItemId: "cairo-half-half",
    nameEn: "Half & Half Puffy Box",
    nameAr: "صندوق هاف آند هاف",
    taglineEn: "Why settle for one when you can have two?",
    taglineAr: "ليه تختار نكهة واحدة لما تقدر تجمع بين اتنين؟",
    collectionSlug: "puffy-pops",
    priceFrom: 220,
    rating: 4.9,
    reviewCount: 420,
    image: talabatImages.assorted,
    gallery: [talabatImages.assorted, talabatImages.nutella, talabatImages.caramel],
    description: {
      feelingEn: "The freedom to pair two iconic flavors in one handcrafted box.",
      feelingAr: "حرية الجمع بين أشهر نكهتين مفضلتين في صندوق واحد مُعد بكل عناية.",
      insideEn: "Split evenly with your choice of two signature fillings and toppings.",
      insideAr: "مقسم بالتساوي بين نكهتين من اختيارك مع الصوصات الخاصة بكل صنف.",
      makeItYoursEn: "Combine Nutella + Pistachio, Lotus + Belgian, or White Chocolate + Caramel.",
      makeItYoursAr: "اجمع بين النوتيلا والبستاشيو، أو اللوتس والشوكولاتة البلجيكية، أو الكراميل.",
      goodToKnowEn: "Best choice for sharing with someone who has different cravings.",
      goodToKnowAr: "الخيار الأروع للمشاركة مع شخص يفضل نكهة مختلفة عنك.",
    },
    allergensEn: ["Dairy (Milk)", "Wheat (Gluten)", "May contain nuts depending on flavor choices"],
    allergensAr: ["حليب ومنتجات ألبان", "قمح (جلوتين)", "قد يحتوي على مكسرات حسب النكهات المختارة"],
    servings: "2–3 persons",
    sizes: [
      { id: "s-6", labelEn: "Small · 6 pieces (3 + 3)", labelAr: "صغير · ٦ قطع (٣ + ٣)", price: 220, serves: "1–2 persons" },
      { id: "m-8", labelEn: "Medium · 8 pieces (4 + 4)", labelAr: "وسط · ٨ قطع (٤ + ٤)", price: 235, serves: "2 persons" },
      { id: "l-10", labelEn: "Large · 10 pieces (5 + 5)", labelAr: "كبير · ١٠ قطع (٥ + ٥)", price: 250, serves: "2–3 persons" },
    ],
    flavours: ["Nutella", "Pistachio", "Lotus", "Belgian Chocolate", "White Chocolate", "Caramel", "Kinder", "Mordjene"],
    pairings: [
      { nameEn: "Salted Caramel Brownie", nameAr: "براونيز سولتد كراميل", price: 165, image: talabatImages.assorted },
      { nameEn: "Passion Fruit Iced Tea", nameAr: "آيس تي باشن فروت", price: 120, image: "/images/puffy-moments.jpg" },
    ],
    reviews: [
      { author: "Omar & Rania", city: "Cairo", rating: 5, commentEn: "Ended our argument instantly: half Nutella, half Pistachio. Perfection!", commentAr: "حل الخناقة بيننا فوراً: نص نوتيلا ونص بستاشيو. عظمة على عظمة!", date: "Yesterday" },
    ],
  },
  "family-pack": {
    slug: "family-pack",
    catalogItemId: "cairo-family",
    nameEn: "Family Party Pack (36 pcs)",
    nameAr: "صندوق العيلة واللمة (٣٦ قطعة)",
    taglineEn: "The ultimate centerpiece for gatherings and office joy",
    taglineAr: "الطبق الأجمل للمة العيلة، الأصحاب، واحتفالات العمل",
    collectionSlug: "puffy-pops",
    priceFrom: 700,
    rating: 5.0,
    reviewCount: 156,
    image: talabatImages.assorted,
    gallery: [talabatImages.assorted, talabatImages.nutella, talabatImages.whiteChocolate],
    description: {
      feelingEn: "Pure celebratory energy when the 36-piece box opens at the center of the table.",
      feelingAr: "فرحة وبهجة حقيقية لما الصندوق الكبير بيتفتح في نص السفرة والكل يتجمع.",
      insideEn: "36 fresh Puffy Pops divided across up to 4 distinct gourmet flavors.",
      insideAr: "٣٦ قطعة بوفي بوبس طازة مقسمة على ما يصل إلى ٤ نكهات متنوعة من اختيارك.",
      makeItYoursEn: "Select up to 4 different flavors, add candles, and write a custom gift note.",
      makeItYoursAr: "اختر حتى ٤ نكهات مختلفة، أضف شمعة احتفال، واكتب رسالة إهداء مخصصة.",
      goodToKnowEn: "Serves 6–10 people. Arrives in premium reinforced gift box packaging.",
      goodToKnowAr: "تكفي من ٦ إلى ١٠ أفراد. تصل في علبة هدايا فاخرة ومحمية جيداً.",
    },
    allergensEn: ["Dairy (Milk)", "Wheat (Gluten)", "Tree Nuts (variable)"],
    allergensAr: ["حليب ومنتجات ألبان", "قمح (جلوتين)", "مكسرات (حسب النكهات)"],
    servings: "6–10 persons",
    sizes: [
      { id: "family-36", labelEn: "Party Box · 36 pieces", labelAr: "صندوق الحفلة · ٣٦ قطعة", price: 700, serves: "6–10 persons" },
    ],
    flavours: ["Nutella", "Pistachio", "Lotus", "Belgian Chocolate", "White Chocolate", "Caramel", "Kinder", "Galaxy", "Mordjene"],
    pairings: [
      { nameEn: "Family Drinks Combo (4 iced drinks)", nameAr: "كومبو ٤ مشروبات باردة", price: 440, image: "/images/puffy-moments.jpg" },
      { nameEn: "Cheesecake Slice Duo", nameAr: "قطعتين تشيز كيك لوتس وكيندر", price: 450, image: talabatImages.assorted },
    ],
    reviews: [
      { author: "Tarek H.", city: "Alexandria", rating: 5, commentEn: "Brought this to my in-laws gathering, was the star of the night!", commentAr: "أخذته لعزومة العيلة في إسكندرية، كان نجم الليلة بلا منازع!", date: "5 days ago" },
    ],
  },
  "strawberry-kiss-soft-serve": {
    slug: "strawberry-kiss-soft-serve",
    catalogItemId: "soft-serve-strawberry",
    nameEn: "Strawberry Kiss Soft Serve",
    nameAr: "سوفت سيرف ستروبري كيس",
    taglineEn: "A dreamy swirl with sweet berry ribbons",
    taglineAr: "دوامة حريرية مع خطوط الفراولة الطبيعية المنعشة",
    collectionSlug: "soft-serve",
    priceFrom: 90,
    rating: 4.9,
    reviewCount: 195,
    image: "/images/soft-serve-strawberry.png",
    gallery: ["/images/soft-serve-strawberry.png", "/images/puffy-moments.jpg"],
    description: {
      feelingEn: "Bright, refreshing Mediterranean sunshine captured in a velvety soft swirl.",
      feelingAr: "انتعاش شمس البحر المتوسط في دوامة ناعمة غنية بنكهة التوت والفراولة.",
      insideEn: "Creamy vanilla soft serve, ribbons of ruby strawberry glaze, fresh fruit notes.",
      insideAr: "سوفت سيرف فانيليا فائق النعومة، خطوط صوص فراولة ياقوتية، ونكهات فاكهة طازجة.",
      makeItYoursEn: "Available in waffle cone or dessert cup with crushed biscuit toppings.",
      makeItYoursAr: "متوفر في بسكويت وافل مقرمش أو في كوب التحلية مع بسكويت مطحون.",
      goodToKnowEn: "Fresh dairy base, crafted in-branch. Nut-free.",
      goodToKnowAr: "أساس حليب طازج، يحضر داخل الفرع فوراً. خالي من المكسرات.",
    },
    allergensEn: ["Dairy (Milk)"],
    allergensAr: ["حليب ومنتجات ألبان"],
    servings: "1 person",
    sizes: [
      { id: "cup", labelEn: "Sundae Cup", labelAr: "كوب سانداي", price: 90, serves: "1 person" },
      { id: "waffle-cone", labelEn: "Crispy Waffle Cone", labelAr: "بسكويت وافل مقرمش", price: 105, serves: "1 person" },
    ],
    pairings: [
      { nameEn: "White Chocolate Puffy Pops", nameAr: "بوفي بوبس وايت شوكليت", price: 180, image: talabatImages.whiteChocolate },
      { nameEn: "Original Fizzy Refresher", nameAr: "فيزي منعش أوريجينال", price: 120, image: "/images/puffy-moments.jpg" },
    ],
    reviews: [
      { author: "Mirna A.", city: "Alexandria", rating: 5, commentEn: "Walking along Kafr Abdo with this soft serve was pure bliss.", commentAr: "التمشية في كفر عبده مع الآيس كريم ده سعادة حقيقية!", date: "3 days ago" },
    ],
  },
  "pistachio-dream-soft-serve": {
    slug: "pistachio-dream-soft-serve",
    catalogItemId: "soft-serve-pistachio",
    nameEn: "Pistachio Dream Soft Serve",
    nameAr: "سوفت سيرف بستاشيو دريم",
    taglineEn: "Silky swirl with roasted pistachio crunch",
    taglineAr: "دوامة حريرية مع كرانش الفستق المحمص الغني",
    collectionSlug: "soft-serve",
    priceFrom: 95,
    rating: 5.0,
    reviewCount: 260,
    image: "/images/soft-serve-pistachio.png",
    gallery: ["/images/soft-serve-pistachio.png", "/images/puffy-moments.jpg"],
    description: {
      feelingEn: "Decadent nutty luxury with an irresistible contrasting crunch.",
      feelingAr: "فخامة المكسرات الإيطالية مع قرمشة محببة لا تقاوم.",
      insideEn: "Vanilla soft serve, pure pistachio sauce swirl, chopped roasted pistachios.",
      insideAr: "سوفت سيرف فانيليا كريمي، صوص فستق طبيعي، ومكسرات فستق محمصة مجروشة.",
      makeItYoursEn: "Available in waffle cone or sundae cup.",
      makeItYoursAr: "متوفر في بسكويت وافل أو كوب سانداي فاخر.",
      goodToKnowEn: "Contains tree nuts (pistachios). Real dairy.",
      goodToKnowAr: "يحتوي على فستق حلبي حقيقي وحليب طازج.",
    },
    allergensEn: ["Dairy (Milk)", "Tree Nuts (Pistachios)"],
    allergensAr: ["حليب ومنتجات ألبان", "مكسرات (فستق حلبي)"],
    servings: "1 person",
    sizes: [
      { id: "cup", labelEn: "Sundae Cup", labelAr: "كوب سانداي", price: 95, serves: "1 person" },
      { id: "waffle-cone", labelEn: "Crispy Waffle Cone", labelAr: "بسكويت وافل مقرمش", price: 110, serves: "1 person" },
    ],
    pairings: [
      { nameEn: "Nutella Puffy Pops", nameAr: "بوفي بوبس نوتيلا", price: 180, image: talabatImages.nutella },
      { nameEn: "Iced Ceremonial Matcha", nameAr: "ماتشا مثلجة", price: 130, image: "/images/puffy-moments.jpg" },
    ],
    reviews: [
      { author: "Kareem G.", city: "Cairo (Arkan)", rating: 5, commentEn: "Best soft serve in Sheikh Zayed by a mile.", commentAr: "أحلى سوفت سيرف في زايد كلها بلا مبالغة!", date: "1 week ago" },
    ],
  },
};

export function getProductBySlug(slug: string): ProductDetail | undefined {
  return PRODUCT_DETAILS[slug];
}

export function getCollectionBySlug(slug: string): CollectionInfo | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
