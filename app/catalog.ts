export type CityId = "alexandria" | "cairo";

export type PriceVariant = {
  id: string;
  label: string;
  price: number;
  originalPrice?: number;
  salePercent?: number;
};

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  variants: PriceVariant[];
  note?: string;
  choices?: string[];
  image?: string;
  realFavorite?: boolean;
  salePercent?: number;
};

export const talabatImages = {
  nutella: "https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/617020/product/524093069/1bed67df-d413-4a08-9dd5-90b129e48974.jpg",
  assorted: "https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/617020/product/2825972655/a3185917-5302-4c3d-8ade-8e056e244d8a.jpg",
  whiteChocolate: "https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/617020/product/524093081/8eff7250-45cf-43f3-a133-c4396592e21d.jpg",
  caramel: "https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/617020/product/524093079/530ebfa4-5a82-4107-a6dc-2bd7768cdff9.jpg",
} as const;

export type MenuCategory = {
  id: string;
  label: string;
  tagline: string;
};

export type Branch = {
  id: string;
  name: string;
  city: "Alexandria" | "Cairo";
  cityId: CityId;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  map: string;
};

const v = (price: number, label = "Regular"): PriceVariant[] => [
  { id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label, price },
];

const sizes = (small: number, medium: number, large: number): PriceVariant[] => [
  { id: "s-6", label: "S · 6 pieces", price: small },
  { id: "m-8", label: "M · 8 pieces", price: medium },
  { id: "l-10", label: "L · 10 pieces", price: large },
];

const twoSizes = (small: number, large: number): PriceVariant[] => [
  { id: "small", label: "Small", price: small },
  { id: "large", label: "Large", price: large },
];

const alexCategories: MenuCategory[] = [
  { id: "puffy-pops", label: "Puffy Pops", tagline: "The original bite-sized joy" },
  { id: "puffyterole", label: "Puffyterole", tagline: "A shareable profiterole favorite" },
  { id: "matcha", label: "Matcha", tagline: "Iced and hot matcha drinks" },
  { id: "iced-coffee", label: "Iced Coffee", tagline: "Cold coffee, bright mood" },
  { id: "frappe", label: "Frappe", tagline: "Blended, creamy and cold" },
  { id: "fizzies", label: "Fizzies", tagline: "Fresh bubbles and fruit" },
  { id: "shakes", label: "Shakes", tagline: "Thick, smooth and sweet" },
  { id: "iced-tea", label: "Iced Tea", tagline: "Light and refreshing" },
  { id: "smoothies", label: "Smoothies", tagline: "Fruit-forward blends" },
  { id: "hot-drinks", label: "Hot Drinks", tagline: "Coffee, chocolate and tea" },
  { id: "cheesecakes", label: "Cheesecakes", tagline: "By the slice or whole" },
  { id: "cookies", label: "Cookies", tagline: "Soft, chewy and fully loaded" },
  { id: "brownies", label: "Brownies", tagline: "Rich and fudgy" },
  { id: "blondies", label: "Blondies", tagline: "Golden Lotus goodness" },
  { id: "essentials", label: "Essentials", tagline: "Cold drinks and useful extras" },
  { id: "extras", label: "Extras", tagline: "Make it exactly yours" },
];

const cairoCategories: MenuCategory[] = [
  { id: "puffy-pops", label: "Puffy Pops", tagline: "The original bite-sized joy" },
  { id: "puffyterole", label: "Puffyterole", tagline: "A shareable profiterole favorite" },
  { id: "pookies", label: "Pookies", tagline: "Three flavors in one size" },
  { id: "iced-tea", label: "Iced Tea", tagline: "Light and refreshing" },
  { id: "fizzies", label: "Fizzies", tagline: "Fresh bubbles and fruit" },
  { id: "cheesecakes", label: "Cheesecakes", tagline: "By the slice or whole" },
  { id: "cookies", label: "Cookies", tagline: "Soft, chewy and fully loaded" },
  { id: "brownies", label: "Brownies", tagline: "Rich and fudgy" },
  { id: "blondies", label: "Blondies", tagline: "Golden Lotus goodness" },
  { id: "extras", label: "Extras", tagline: "Make it exactly yours" },
];

const alexandriaItems: MenuItem[] = [
  { id: "alex-caramel", name: "Caramel", category: "puffy-pops", variants: sizes(115, 130, 145), image: talabatImages.caramel },
  { id: "alex-salted-caramel", name: "Salted Caramel", category: "puffy-pops", variants: sizes(115, 130, 145) },
  { id: "alex-chocopeanut", name: "ChocoPeanut Butter", category: "puffy-pops", variants: sizes(115, 130, 145) },
  { id: "alex-honey-tahina", name: "Honey & Tahina", category: "puffy-pops", variants: sizes(115, 130, 145) },
  { id: "alex-corona", name: "Corona", category: "puffy-pops", variants: sizes(135, 155, 175), note: "Milk chocolate or dark", choices: ["Milk chocolate", "Dark chocolate"] },
  { id: "alex-white-chocolate", name: "White Chocolate", category: "puffy-pops", variants: sizes(135, 155, 175), image: talabatImages.whiteChocolate },
  { id: "alex-swiza", name: "Swiza", category: "puffy-pops", variants: sizes(150, 165, 185), note: "Hazelnut milk or crispy", choices: ["Hazelnut milk", "Crispy"] },
  { id: "alex-healthy-spread", name: "Healthy Spread", category: "puffy-pops", variants: sizes(150, 165, 185) },
  { id: "alex-nutella", name: "Nutella", category: "puffy-pops", variants: sizes(160, 175, 190), image: talabatImages.nutella },
  { id: "alex-lotus", name: "Lotus", category: "puffy-pops", variants: sizes(160, 175, 190) },
  { id: "alex-pistachio", name: "Pistachio", category: "puffy-pops", variants: sizes(160, 175, 190) },
  { id: "alex-dates-cinnamon", name: "Dates & Cinnamon", category: "puffy-pops", variants: sizes(160, 175, 190) },
  { id: "alex-cadbury", name: "Cadbury", category: "puffy-pops", variants: sizes(175, 190, 210) },
  { id: "alex-galaxy", name: "Galaxy", category: "puffy-pops", variants: sizes(175, 190, 210) },
  { id: "alex-kinder", name: "Kinder", category: "puffy-pops", variants: sizes(175, 190, 210) },
  { id: "alex-mordjene", name: "Mordjene", category: "puffy-pops", variants: sizes(175, 190, 210) },
  { id: "alex-belgian", name: "Belgian Chocolate", category: "puffy-pops", variants: sizes(175, 190, 210) },
  { id: "alex-half-half", name: "Half & Half", category: "puffy-pops", variants: sizes(185, 200, 220), note: "Choose two flavors", image: talabatImages.assorted },
  { id: "alex-family", name: "Family Pack", category: "puffy-pops", variants: v(630, "36 pieces"), note: "Up to 4 flavors", image: talabatImages.assorted },

  { id: "alex-puffyterole-original", name: "Original", category: "puffyterole", variants: twoSizes(185, 800) },
  { id: "alex-puffyterole-milky", name: "Milky", category: "puffyterole", variants: twoSizes(200, 950) },
  { id: "alex-puffyterole-pistachio", name: "Pistachio", category: "puffyterole", variants: twoSizes(200, 950) },
  { id: "alex-puffyterole-half", name: "Half & Half", category: "puffyterole", variants: v(855, "Large") },

  { id: "alex-classic-matcha", name: "Classic Matcha", category: "matcha", variants: v(125, "Iced") },
  { id: "alex-white-matcha", name: "White Matcha", category: "matcha", variants: v(130, "Iced") },
  { id: "alex-strawberry-matcha", name: "Strawberry Matcha", category: "matcha", variants: v(140, "Iced") },
  { id: "alex-raspberry-matcha", name: "Raspberry Matcha", category: "matcha", variants: v(140, "Iced") },
  { id: "alex-honey-matcha", name: "Honey Matcha", category: "matcha", variants: v(140, "Iced") },
  { id: "alex-mango-matcha", name: "Mango Matcha", category: "matcha", variants: v(140, "Iced") },
  { id: "alex-matcha-latte", name: "Matcha Latte", category: "matcha", variants: v(125, "Hot") },
  { id: "alex-matcha-spanish", name: "Matcha Spanish Latte", category: "matcha", variants: v(140, "Hot") },

  { id: "alex-iced-american", name: "American Coffee", category: "iced-coffee", variants: v(75, "Iced") },
  { id: "alex-iced-latte", name: "Latte", category: "iced-coffee", variants: v(120, "Iced") },
  { id: "alex-iced-caramel-latte", name: "Caramel Latte", category: "iced-coffee", variants: v(130, "Iced") },
  { id: "alex-iced-vanilla-latte", name: "Vanilla Latte", category: "iced-coffee", variants: v(130, "Iced") },
  { id: "alex-iced-mocha", name: "Mocha", category: "iced-coffee", variants: v(135, "Iced") },
  { id: "alex-iced-white-mocha", name: "White Mocha", category: "iced-coffee", variants: v(135, "Iced") },
  { id: "alex-iced-caramel-macchiato", name: "Caramel Macchiato", category: "iced-coffee", variants: v(135, "Iced") },
  { id: "alex-iced-spanish", name: "Spanish Latte", category: "iced-coffee", variants: v(135, "Iced") },

  { id: "alex-frappe-coffee", name: "Coffee", category: "frappe", variants: v(90) },
  { id: "alex-frappe-creme", name: "Crème Brûlée", category: "frappe", variants: v(100) },
  { id: "alex-frappe-caramel-coffee", name: "Caramel Coffee", category: "frappe", variants: v(100) },
  { id: "alex-frappe-caramel-vanilla", name: "Caramel Vanilla", category: "frappe", variants: v(100) },
  { id: "alex-frappe-salted-coffee", name: "Salted Caramel Coffee", category: "frappe", variants: v(100) },
  { id: "alex-frappe-salted-vanilla", name: "Salted Caramel Vanilla", category: "frappe", variants: v(100) },
  { id: "alex-frappe-mocha", name: "Mocha Coffee", category: "frappe", variants: v(110) },
  { id: "alex-frappe-macchiato", name: "Caramel Macchiato", category: "frappe", variants: v(110) },
  { id: "alex-frappe-lotus-coffee", name: "Lotus Coffee", category: "frappe", variants: v(175) },
  { id: "alex-frappe-lotus-vanilla", name: "Lotus Vanilla", category: "frappe", variants: v(175) },

  { id: "alex-fizzy-original", name: "Original", category: "fizzies", variants: v(100) },
  { id: "alex-fizzy-variations", name: "Variations", category: "fizzies", variants: v(145), choices: ["Strawberry", "Green Apple", "Raspberry", "Peach", "Blueberry", "Passion Fruit"] },

  { id: "alex-shake-vanilla", name: "Vanilla Shake", category: "shakes", variants: v(120) },
  { id: "alex-shake-white", name: "White Chocolate Shake", category: "shakes", variants: v(120) },
  { id: "alex-shake-caramel", name: "Caramel Shake", category: "shakes", variants: v(120) },
  { id: "alex-shake-strawberry", name: "Strawberry Shake", category: "shakes", variants: v(140) },
  { id: "alex-shake-oreo", name: "Oreo Shake", category: "shakes", variants: v(140) },
  { id: "alex-shake-lilly", name: "Lilly's Shake", category: "shakes", variants: v(150) },
  { id: "alex-shake-dates", name: "Dates Shake", category: "shakes", variants: v(165) },
  { id: "alex-shake-nutella", name: "Nutella Shake", category: "shakes", variants: v(175) },
  { id: "alex-shake-lotus", name: "Lotus Shake", category: "shakes", variants: v(200) },
  { id: "alex-shake-pistachio", name: "Pistachio Shake", category: "shakes", variants: v(200) },

  { id: "alex-tea-peach", name: "Peach", category: "iced-tea", variants: v(90) },
  { id: "alex-tea-passion", name: "Passion Fruit", category: "iced-tea", variants: v(90) },
  { id: "alex-tea-raspberry-peach", name: "Raspberry Peach", category: "iced-tea", variants: v(90) },
  { id: "alex-tea-raspberry", name: "Raspberry", category: "iced-tea", variants: v(100) },

  { id: "alex-smoothie-raspberry", name: "Raspberry", category: "smoothies", variants: v(100) },
  { id: "alex-smoothie-peach", name: "Peach", category: "smoothies", variants: v(100) },
  { id: "alex-smoothie-strawberry", name: "Strawberry", category: "smoothies", variants: v(100) },
  { id: "alex-smoothie-green-apple", name: "Green Apple", category: "smoothies", variants: v(100) },
  { id: "alex-smoothie-pineapple", name: "Pineapple", category: "smoothies", variants: v(100) },
  { id: "alex-smoothie-yoghurt", name: "Yoghurt Smoothie", category: "smoothies", variants: v(100), choices: ["Raspberry", "Peach", "Strawberry"] },
  { id: "alex-smoothie-mango-passion", name: "Mango Passion", category: "smoothies", variants: v(105) },
  { id: "alex-smoothie-mango-peach", name: "Mango Peach", category: "smoothies", variants: v(105) },

  { id: "alex-hot-turkish", name: "Turkish Coffee", category: "hot-drinks", variants: twoSizes(40, 60) },
  { id: "alex-hot-hazelnut-turkish", name: "Hazelnut Turkish Coffee", category: "hot-drinks", variants: v(75, "Large") },
  { id: "alex-hot-turkish-milk", name: "Turkish Coffee & Milk", category: "hot-drinks", variants: v(80, "Large") },
  { id: "alex-hot-american", name: "American Coffee", category: "hot-drinks", variants: v(70, "Large") },
  { id: "alex-hot-american-milk", name: "American Coffee & Milk", category: "hot-drinks", variants: v(85, "Large") },
  { id: "alex-hot-espresso", name: "Espresso", category: "hot-drinks", variants: twoSizes(40, 60) },
  { id: "alex-hot-affogato", name: "Affogato", category: "hot-drinks", variants: v(75, "Large") },
  { id: "alex-hot-macchiato", name: "Macchiato", category: "hot-drinks", variants: twoSizes(60, 80) },
  { id: "alex-hot-flat-white", name: "Flat White", category: "hot-drinks", variants: v(90, "Large") },
  { id: "alex-hot-cappuccino", name: "Cappuccino", category: "hot-drinks", variants: v(110, "Large") },
  { id: "alex-hot-flavored-cappuccino", name: "Flavored Cappuccino", category: "hot-drinks", variants: v(115, "Large"), choices: ["Vanilla", "Caramel", "Hazelnut"] },
  { id: "alex-hot-latte", name: "Latte", category: "hot-drinks", variants: v(110, "Large") },
  { id: "alex-hot-flavored-latte", name: "Flavored Latte", category: "hot-drinks", variants: v(115, "Large"), choices: ["Vanilla", "Caramel", "Hazelnut", "Cinnamon"] },
  { id: "alex-hot-spanish", name: "Spanish Latte", category: "hot-drinks", variants: v(125, "Large") },
  { id: "alex-hot-peanut", name: "Peanut Butter Latte", category: "hot-drinks", variants: twoSizes(125, 135) },
  { id: "alex-hot-salted", name: "Salted Caramel Latte", category: "hot-drinks", variants: twoSizes(125, 135) },
  { id: "alex-hot-creme", name: "Crème Brûlée Latte", category: "hot-drinks", variants: v(130, "Large") },
  { id: "alex-hot-caramel-macchiato", name: "Caramel Macchiato", category: "hot-drinks", variants: v(130, "Large") },
  { id: "alex-hot-white-mocha", name: "White Mocha", category: "hot-drinks", variants: v(130, "Large") },
  { id: "alex-hot-mocha", name: "Mocha", category: "hot-drinks", variants: v(130, "Large") },
  { id: "alex-hot-kinder-latte", name: "Kinder Latte", category: "hot-drinks", variants: v(150, "Large") },
  { id: "alex-hot-dates-latte", name: "Dates Latte", category: "hot-drinks", variants: v(170, "Large") },
  { id: "alex-hot-pistachio-latte", name: "Pistachio Latte", category: "hot-drinks", variants: twoSizes(220, 230) },
  { id: "alex-hot-lotus-latte", name: "Lotus Latte", category: "hot-drinks", variants: twoSizes(220, 240) },
  { id: "alex-hot-cadbury-latte", name: "Cadbury Latte", category: "hot-drinks", variants: twoSizes(240, 260) },
  { id: "alex-hot-kinder", name: "Hot Kinder", category: "hot-drinks", variants: v(120, "Large") },
  { id: "alex-hot-lotus", name: "Hot Lotus", category: "hot-drinks", variants: v(175, "Large") },
  { id: "alex-hot-chocolate", name: "Classic Hot Chocolate", category: "hot-drinks", variants: v(160, "Large") },
  { id: "alex-hot-chocolate-variations", name: "Hot Chocolate Variations", category: "hot-drinks", variants: v(180, "Large"), choices: ["KitKat", "Salted Caramel", "Nutella"] },
  { id: "alex-hot-brownie-hug", name: "Brownie Hug Hot Chocolate", category: "hot-drinks", variants: v(185, "Large") },
  { id: "alex-hot-late-breakfast", name: "Late Breakfast Hot Chocolate", category: "hot-drinks", variants: v(185, "Large") },
  { id: "alex-hot-tea", name: "Tea", category: "hot-drinks", variants: v(30, "Large") },
  { id: "alex-hot-green-tea", name: "Green Tea", category: "hot-drinks", variants: v(35, "Large") },
  { id: "alex-hot-herbal-tea", name: "Herbal Tea", category: "hot-drinks", variants: v(35, "Large"), choices: ["Hibiscus", "Mint", "Anise"] },
  { id: "alex-hot-karak", name: "Karak Tea", category: "hot-drinks", variants: v(35, "Large") },
  { id: "alex-hot-tea-latte", name: "Tea Latte", category: "hot-drinks", variants: v(55, "Large") },

  { id: "alex-cheesecake-lotus", name: "Lotus", category: "cheesecakes", variants: [{ id: "slice", label: "Slice", price: 150 }, { id: "whole", label: "Whole", price: 800 }] },
  { id: "alex-cheesecake-kinder", name: "Kinder", category: "cheesecakes", variants: [{ id: "slice", label: "Slice", price: 160 }, { id: "whole", label: "Whole", price: 800 }] },
  { id: "alex-cheesecake-half", name: "Half & Half", category: "cheesecakes", variants: v(850, "Whole") },

  { id: "alex-cookie-white", name: "White Chocolate", category: "cookies", variants: v(100) },
  { id: "alex-cookie-chocopeanut", name: "ChocoPeanut Butter", category: "cookies", variants: v(100) },
  { id: "alex-cookie-dates-almonds", name: "Dates & Almonds", category: "cookies", variants: v(110) },
  { id: "alex-cookie-pistachio", name: "Pistachio", category: "cookies", variants: v(130) },
  { id: "alex-cookie-pico", name: "Pico Special", category: "cookies", variants: v(130) },
  { id: "alex-cookie-lotus", name: "Lotus", category: "cookies", variants: v(130) },
  { id: "alex-cookie-nutella", name: "Nutella", category: "cookies", variants: v(130) },
  { id: "alex-cookie-nutella-mms", name: "Nutella M&M's", category: "cookies", variants: v(140) },
  { id: "alex-cookie-kinder", name: "Kinder", category: "cookies", variants: v(170) },
  { id: "alex-cookie-chips", name: "Chocolate Chips", category: "cookies", variants: v(170) },

  { id: "alex-brownie-salted", name: "Salted Caramel", category: "brownies", variants: v(135) },
  { id: "alex-brownie-chips", name: "Chocolate Chips", category: "brownies", variants: v(165) },
  { id: "alex-brownie-nutella", name: "Nutella", category: "brownies", variants: v(165) },
  { id: "alex-brownie-kinder", name: "Kinder", category: "brownies", variants: v(185) },
  { id: "alex-blondie-one", name: "The One of a Kind", category: "blondies", variants: v(185), note: "Lotus-based brownie" },

  { id: "alex-water", name: "Water", category: "essentials", variants: v(25) },
  { id: "alex-soft-drink", name: "Soft Drinks V7", category: "essentials", variants: v(50) },
  { id: "alex-redbull", name: "Red Bull", category: "essentials", variants: v(135) },
  { id: "alex-topping", name: "Puffy Pops Topping", category: "extras", variants: v(40), note: "Choose a Puffy Pops flavor" },
  { id: "alex-crushes", name: "Crushes", category: "extras", variants: v(30), choices: ["Oreo", "Lotus", "Nuts"] },
  { id: "alex-ice-cream", name: "Ice Cream Add-on", category: "extras", variants: v(40) },
  { id: "alex-shot", name: "Shot", category: "extras", variants: v(30) },
  { id: "alex-flavor-pump", name: "Flavor Pump", category: "extras", variants: v(25) },
  { id: "alex-marshmallows", name: "Marshmallows", category: "extras", variants: v(25) },
  { id: "alex-coconut-milk", name: "Coconut Milk", category: "extras", variants: v(35) },
  { id: "alex-almond-milk", name: "Almond Milk", category: "extras", variants: v(35) },
];

const cairoItems: MenuItem[] = [
  { id: "cairo-caramel", name: "Caramel", category: "puffy-pops", variants: sizes(140, 155, 170), image: talabatImages.caramel },
  { id: "cairo-salted-caramel", name: "Salted Caramel", category: "puffy-pops", variants: sizes(140, 155, 170) },
  { id: "cairo-chocopeanut", name: "ChocoPeanut Butter", category: "puffy-pops", variants: sizes(140, 155, 170) },
  { id: "cairo-honey-tahina", name: "Honey & Tahina", category: "puffy-pops", variants: sizes(140, 155, 170) },
  { id: "cairo-corona", name: "Corona", category: "puffy-pops", variants: sizes(150, 165, 180), choices: ["Milk chocolate", "Dark chocolate"] },
  { id: "cairo-white-chocolate", name: "White Chocolate", category: "puffy-pops", variants: sizes(150, 165, 180), image: talabatImages.whiteChocolate },
  { id: "cairo-seasonal-jam", name: "Seasonal Jam", category: "puffy-pops", variants: sizes(150, 165, 180) },
  { id: "cairo-swiza", name: "Swiza", category: "puffy-pops", variants: sizes(180, 195, 210), choices: ["Hazelnut milk", "Crispy"] },
  { id: "cairo-nutella", name: "Nutella", category: "puffy-pops", variants: sizes(180, 195, 210), image: talabatImages.nutella },
  { id: "cairo-cadbury", name: "Cadbury", category: "puffy-pops", variants: sizes(180, 195, 210) },
  { id: "cairo-lotus", name: "Lotus", category: "puffy-pops", variants: sizes(180, 195, 210) },
  { id: "cairo-galaxy", name: "Galaxy", category: "puffy-pops", variants: sizes(190, 205, 220) },
  { id: "cairo-dates-cinnamon", name: "Dates & Cinnamon", category: "puffy-pops", variants: sizes(190, 205, 220) },
  { id: "cairo-pistachio", name: "Pistachio", category: "puffy-pops", variants: sizes(190, 205, 220) },
  { id: "cairo-kinder", name: "Kinder", category: "puffy-pops", variants: sizes(200, 215, 230) },
  { id: "cairo-mordjene", name: "Mordjene", category: "puffy-pops", variants: sizes(200, 215, 230) },
  { id: "cairo-belgian", name: "Belgian Chocolate", category: "puffy-pops", variants: sizes(200, 215, 230) },
  { id: "cairo-half-half", name: "Half & Half", category: "puffy-pops", variants: sizes(220, 235, 250), note: "Choose two flavors", image: talabatImages.assorted },
  { id: "cairo-family", name: "Family Pack", category: "puffy-pops", variants: v(700, "Medium · 36 pieces"), note: "Up to 4 flavors", image: talabatImages.assorted },

  { id: "cairo-puffyterole-original", name: "Original", category: "puffyterole", variants: twoSizes(220, 1000) },
  { id: "cairo-puffyterole-milky", name: "Milky", category: "puffyterole", variants: twoSizes(250, 1260) },
  { id: "cairo-puffyterole-pistachio", name: "Pistachio", category: "puffyterole", variants: twoSizes(260, 1330) },
  { id: "cairo-pookies", name: "3 Flavors", category: "pookies", variants: v(120), choices: ["Belgian Chocolate", "Mordjene", "Pistachio"] },

  { id: "cairo-tea-peach", name: "Peach", category: "iced-tea", variants: v(120) },
  { id: "cairo-tea-passion", name: "Passion Fruit", category: "iced-tea", variants: v(120) },
  { id: "cairo-tea-raspberry", name: "Raspberry", category: "iced-tea", variants: v(120) },
  { id: "cairo-tea-raspberry-peach", name: "Raspberry Peach", category: "iced-tea", variants: v(120) },
  { id: "cairo-fizzy-original", name: "Original", category: "fizzies", variants: v(120) },
  { id: "cairo-fizzy-variations", name: "Variations", category: "fizzies", variants: v(150), choices: ["Strawberry", "Green Apple", "Raspberry", "Peach", "Blueberry", "Passion Fruit"] },

  { id: "cairo-cheesecake-lotus", name: "Lotus", category: "cheesecakes", variants: [{ id: "slice", label: "Slice", price: 230 }, { id: "whole", label: "Whole", price: 1200 }] },
  { id: "cairo-cheesecake-kinder", name: "Kinder", category: "cheesecakes", variants: [{ id: "slice", label: "Slice", price: 250 }, { id: "whole", label: "Whole", price: 1400 }] },

  { id: "cairo-cookie-white", name: "White Chocolate", category: "cookies", variants: v(160) },
  { id: "cairo-cookie-chocopeanut", name: "ChocoPeanut Butter", category: "cookies", variants: v(160) },
  { id: "cairo-cookie-pistachio", name: "Pistachio", category: "cookies", variants: v(165) },
  { id: "cairo-cookie-pico", name: "Pico Special", category: "cookies", variants: v(165) },
  { id: "cairo-cookie-dates", name: "Dates & Cinnamon", category: "cookies", variants: v(165) },
  { id: "cairo-cookie-lotus", name: "Lotus", category: "cookies", variants: v(170) },
  { id: "cairo-cookie-nutella", name: "Nutella", category: "cookies", variants: v(170) },
  { id: "cairo-cookie-mms", name: "Nutella M&M's", category: "cookies", variants: v(195) },
  { id: "cairo-cookie-kinder", name: "Kinder", category: "cookies", variants: v(200) },
  { id: "cairo-cookie-chips", name: "Chocolate Chips", category: "cookies", variants: v(200) },

  { id: "cairo-brownie-salted", name: "Salted Caramel", category: "brownies", variants: v(165) },
  { id: "cairo-brownie-chips", name: "Chocolate Chips", category: "brownies", variants: v(180) },
  { id: "cairo-brownie-nutella", name: "Nutella", category: "brownies", variants: v(180) },
  { id: "cairo-brownie-kinder", name: "Kinder", category: "brownies", variants: v(220) },
  { id: "cairo-blondie-one", name: "The One of a Kind", category: "blondies", variants: v(190), note: "Lotus-based brownie" },

  { id: "cairo-topping", name: "Puffy Pops Topping", category: "extras", variants: v(60), note: "Choose a Puffy Pops flavor" },
  { id: "cairo-crushes", name: "Crushes", category: "extras", variants: v(60), choices: ["Oreo", "Lotus", "Nuts"] },
];

export const menus: Record<CityId, { categories: MenuCategory[]; items: MenuItem[] }> = {
  alexandria: { categories: alexCategories, items: alexandriaItems },
  cairo: { categories: cairoCategories, items: cairoItems },
};

export const branches: Branch[] = [
  {
    id: "kafr-abdo",
    name: "Kafr Abdo",
    city: "Alexandria",
    cityId: "alexandria",
    address: "35 Abd El-Moneim Riad, Kafr Abdo, Sidi Gaber",
    phone: "+20 100 201 8510",
    latitude: 31.2296,
    longitude: 29.9554,
    map: "https://www.google.com/maps/search/?api=1&query=Puffy+Pops+Kafr+Abdo",
  },
  {
    id: "smouha",
    name: "Smouha",
    city: "Alexandria",
    cityId: "alexandria",
    address: "12 Mounir El Sayed El Far, Smouha, Sidi Gaber",
    phone: "03 4230103",
    latitude: 31.2155,
    longitude: 29.9473,
    map: "https://www.google.com/maps/search/?api=1&query=Puffy+Pops+Smouha+Alexandria",
  },
  {
    id: "green-plaza",
    name: "Green Plaza",
    city: "Alexandria",
    cityId: "alexandria",
    address: "Green Plaza Mall, 14th May Road, Smouha",
    phone: "+20 100 201 8510",
    latitude: 31.2106,
    longitude: 29.9615,
    map: "https://www.google.com/maps/search/?api=1&query=Puffy+Pops+Green+Plaza+Alexandria",
  },
  {
    id: "arkan",
    name: "Arkan · Market St.",
    city: "Cairo",
    cityId: "cairo",
    address: "Market Street, Arkan Plaza, Sheikh Zayed",
    phone: "+20 100 201 8510",
    latitude: 30.0205,
    longitude: 30.9763,
    map: "https://www.google.com/maps/search/?api=1&query=Puffy+Pops+Arkan+Plaza",
  },
  {
    id: "golf-central",
    name: "Golf Central Mall",
    city: "Cairo",
    cityId: "cairo",
    address: "Golf Central Mall, Palm Hills, 6 October",
    phone: "+20 100 201 8510",
    latitude: 29.9895,
    longitude: 30.999,
    map: "https://www.google.com/maps/search/?api=1&query=Puffy+Pops+Golf+Central+Mall",
  },
];

export function getBranch(id: string | null | undefined) {
  return branches.find((branch) => branch.id === id);
}

export function getMenuItem(cityId: CityId, itemId: string) {
  return menus[cityId].items.find((item) => item.id === itemId);
}

export const formatPrice = (price: number) => `EGP ${price.toFixed(0)}`;
