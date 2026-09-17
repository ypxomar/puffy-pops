import { talabatImages } from "./catalog";

export type JournalArticle = {
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  categoryEn: string;
  categoryAr: string;
  date: string;
  readTimeEn: string;
  readTimeAr: string;
  heroImage: string;
  author: string;
  contentEn: string[];
  contentAr: string[];
  featuredProductSlug?: string;
};

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    slug: "art-of-the-puffy-swirl",
    titleEn: "The Art of the Puffy Swirl: Crafting Egypt's Freshest Soft Serve",
    titleAr: "فن دوامة بوفي: كيف نصنع أطزج سوفت سيرف في مصر؟",
    excerptEn: "Behind the scenes of our slow-churned dairy recipe, natural Sicilian pistachios, and sunny Mediterranean berries.",
    excerptAr: "كواليس وصفة الحليب المخفوق ببطء، فستق صقلية الطبيعي، وفراولة مزارع المتوسط الطازجة.",
    categoryEn: "Craft & Flavor",
    categoryAr: "الحرفة والنكهات",
    date: "September 12, 2026",
    readTimeEn: "4 min read",
    readTimeAr: "٤ دقائق قراءة",
    heroImage: "/images/soft-serve-strawberry.png",
    author: "Omar Osman · Founder & Recipe Lead",
    contentEn: [
      "When we set out to create Puffy Pops Soft Serve, we knew we didn't want typical ice cream. We wanted a swirl that felt like pure cloud: light, velvety, and deeply flavourful without being overly sweet.",
      "Every morning across our five branches in Alexandria and Cairo, our batch churns start with real whole milk and fresh cream. The temperature is calibrated so that each swirl holds its delicate spiral while melting into instant silk the moment it touches your tongue.",
      "Our Strawberry Kiss uses real Mediterranean berry purée with zero artificial coloring. Our Pistachio Dream is folded with pure stone-ground roasted pistachios sourced straight from the Mediterranean basin.",
      "Whether you're taking an evening walk down Kafr Abdo or grabbing a cold swirl at Arkan Plaza after work, this is our little gift of pure daily happiness."
    ],
    contentAr: [
      "عندما بدأنا التفكير في سوفت سيرف بوفي بوبس، كان هدفنا واضحاً: ألا يكون مجرد آيس كريم تقليدي، بل دوامة فائقة الخفة مثل السحاب: ناعمة، مخملية، وغنية بالنكهة الطبيعية بدون سكر زائد.",
      "كل صباح في فروعنا الخمسة بالإسكندرية والقاهرة، نبدأ خفق الدفعات الطازجة بالحليب الكامل والقشطة الطبيعية. نضبط درجات الحرارة بدقة متناهية لتحافظ الدوامة على شكلها الأنيق وتذوب كالحرير في الفم فوراً.",
      "في نكهة «ستروبري كيس»، نستخدم بيوريه فراولة طبيعي بدون أي ألوان صناعية. وفي «بستاشيو دريم»، نعتمد على فستق حلبي محمص ومطحون بحجارة الطحن التقليدية.",
      "سواء كنت تتمشى مساءً في كفر عبده الهادئ أو تلتقي أصدقاءك في أركان بلازا بعد يوم عمل طويل، هذا هو وعدنا البسيط بصناعة البهجة كل يوم."
    ],
    featuredProductSlug: "strawberry-kiss-soft-serve",
  },
  {
    slug: "from-kafr-abdo-to-arkan",
    titleEn: "From Kafr Abdo to Arkan: The Puffy Pops Journey",
    titleAr: "من كفر عبده إلى أركان: رحلة بوفي بوبس في قلوب المصريين",
    excerptEn: "How a tiny hole-in-the-wall in Alexandria turned into Egypt's favorite handcrafted bite-sized dessert brand.",
    excerptAr: "كيف تحول متجر صغير هادئ في الإسكندرية إلى علبة السعادة المفضلة في كل بيت ومناسبة مصرية.",
    categoryEn: "Our Story",
    categoryAr: "قصتنا",
    date: "August 28, 2026",
    readTimeEn: "5 min read",
    readTimeAr: "٥ دقائق قراءة",
    heroImage: "/images/puffy-moments.jpg",
    author: "Puffy Pops Team",
    contentEn: [
      "It started on Abd El-Moneim Riad Street in Kafr Abdo, Sidi Gaber. We had one mission: serve warm, bite-sized dough balls filled to the brim with warm chocolate so that every box felt like opening a warm present.",
      "The smell of fresh golden dough baking every twenty minutes caught the breeze off the Mediterranean. Alexandria locals made it their post-dinner stroll stop, and soon visitors from Cairo were stopping by before taking the Desert Road home.",
      "Today, with branches in Kafr Abdo, Smouha, Green Plaza, Arkan Plaza Sheikh Zayed, and Golf Central Mall Palm Hills 6th of October, that local spirit hasn't changed. Each branch prepares its own dough, fries to order, and dispenses warm sauces on the spot.",
      "We believe that big joy lives in little bites—and that great food brings friends closer together."
    ],
    contentAr: [
      "بدأت الحكاية في شارع عبد المنعم رياض بكفر عبده بالإسكندرية. كان هدفنا بسيطاً وعميقاً: تقديم كرات عجين ذهبية هشة، محشوة لآخرها بالشوكولاتة الدافئة، ليكون فتح الصندوق كأنه هدية مبهجة.",
      "رائحة الخبز الطازج كل عشرين دقيقة مع نسيم البحر كانت كفيلة بجذب أهل إسكندرية، وسرعان ما أصبح بوفي محطة أساسية لزوار الإسكندرية قبل عودتهم إلى القاهرة عبر الطريق الصحراوي.",
      "اليوم، بخمسة فروع في كفر عبده، سموحة، جرين بلازا، أركان بلازا بالشيخ زايد، وجولف سنترال مول بالسادس من أكتوبر، لم تتغير روح البدايات. كل فرع يخبز عجينته بنفسه، ويجهز طلبك طازة فور وصوله.",
      "نؤمن دائماً أن الفرحة الكبيرة تبدأ بلقمة صغيرة—وأن أطيب اللحظات هي التي نتشاركها مع من نحب."
    ],
    featuredProductSlug: "nutella-puffy-pops",
  },
  {
    slug: "ultimate-dessert-box-gatherings",
    titleEn: "How to Build the Ultimate Dessert Box for Egyptian Family Gatherings",
    titleAr: "دليلك لصناعة صندوق الحفلات المثالي للمات العيلة والأصدقاء",
    excerptEn: "Tips on balancing chocolate lovers, pistachio devotees, and fruit fans in one 36-piece feast.",
    excerptAr: "أسرار التوفيق بين عشاق النوتيلا، محبي البستاشيو، وعشاق الفواكه في صندوق الحفلة الكبير.",
    categoryEn: "Gifting & Entertaining",
    categoryAr: "الضيافة والهدايا",
    date: "August 15, 2026",
    readTimeEn: "3 min read",
    readTimeAr: "٣ دقائق قراءة",
    heroImage: talabatImages.assorted,
    author: "Hospitality Team",
    contentEn: [
      "In Egypt, dessert is rarely eaten alone. Whether it is a Friday family lunch, a birthday gathering, or a late-night balcony gossip session, sweet bites are made to be passed around.",
      "When building our 36-piece Family Box, the golden rule is the 4-corner balance: 1 crowd-pleaser (Nutella or Belgian Chocolate), 1 rich luxury (Pistachio or Lotus), 1 sweet contrast (White Chocolate or Caramel), and 1 wildcard (Kinder or Dates & Cinnamon).",
      "Pair with two tubs of warm dipping sauce on the side and a batch of iced teas to refresh the palate between bites.",
      "Best of all: our delivery pin system ensures the box arrives warm and perfectly arranged, right to your building entrance."
    ],
    contentAr: [
      "في بيوتنا المصرية، التحلية متعة لا تكتمل إلا باللمة. سواء كانت عزومة الجمعة العائلية، عيد ميلاد، أو سهرة روقان في البلكونة مع الصحاب، الصندوق معمول ليدور على الكل.",
      "عند اختيار صندوق العائلة المكون من ٣٦ قطعة، القاعدة الذهبية هي التنوع الذكي: نكهة كلاسيكية يحبها الكل (نوتيلا أو شوكولاتة بلجيكية)، نكهة فاخرة مميزة (بستاشيو أو لوتس)، تباين ناعم (وايت شوكليت أو كراميل)، ونكهة مفاجئة خاصة (كيندر أو تمر وقرفة).",
      "ننصح بإضافة علبتي صوص تغميس دافئ على الجانب مع مشروبات مثلجة منعشة لتجديد المذاق بين كل لقمة وأخرى.",
      "والأهم: نظام التوصيل بالدبوس الدقيق يضمن وصول الصندوق دافئاً ومرتباً بعناية فائقة حتى باب بيتك."
    ],
    featuredProductSlug: "family-pack",
  },
];
