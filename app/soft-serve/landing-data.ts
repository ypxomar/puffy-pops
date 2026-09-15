/**
 * Soft-serve landing data.
 *
 * The landing page lives at "/" inside the Puffy Pops storefront, so its links
 * point at the real storefront routes instead of the standalone site.
 */

export const SITE_LINKS = {
  menu: "/menu",
  story: "/story",
  locations: "/locations",
  trackOrder: "/track-order",
} as const;

export const WHATSAPP_NUMBER = "201002018510";
export const PHONE_HREF = "tel:+201002018510";

export function whatsappHref(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export type Flavour = {
  id: string;
  name: string;
  shortName: string;
  title: [string, string];
  image: string;
  accent: string;
  background: string;
  tone: string;
  swatch: string;
  description: string;
  details: string;
};

export const flavours: Flavour[] = [
  {
    id: "strawberry",
    name: "Strawberry Kiss",
    shortName: "Strawberry",
    title: ["Strawberry", "kiss."],
    image: "/images/soft-serve-strawberry.png",
    accent: "#ad392b",
    background: "#fff8eb",
    tone: "#f3ded2",
    swatch: "#c3473f",
    description: "A dreamy vanilla swirl, ribbons of strawberry sauce, and a berry-happy ending.",
    details: "Creamy vanilla soft serve meets a generous strawberry drizzle. Sweet, fruity, and made for your softer side.",
  },
  {
    id: "chocolate",
    name: "Chocolate Crush",
    shortName: "Chocolate",
    title: ["Chocolate", "crush."],
    image: "/images/soft-serve-chocolate.png",
    accent: "#654030",
    background: "#f7eddf",
    tone: "#e9d5c1",
    swatch: "#76503c",
    description: "Our signature creamy swirl, dressed in a rich chocolate drizzle. A crush worth keeping.",
    details: "Vanilla soft serve, indulgent chocolate sauce, and a little chocolate crunch. For the unapologetic chocolate lover.",
  },
  {
    id: "pistachio",
    name: "Pistachio Dream",
    shortName: "Pistachio",
    title: ["Pistachio", "dream."],
    image: "/images/soft-serve-pistachio.png",
    accent: "#52613b",
    background: "#f4f4e6",
    tone: "#e0e6c9",
    swatch: "#8b9b62",
    description: "Silky vanilla, a generous pistachio drizzle, and a nutty little crunch. Dreamy by nature.",
    details: "A vanilla swirl with pistachio sauce and chopped pistachios. This flavour contains nuts; please check with our team if you have an allergy.",
  },
  {
    id: "vanilla",
    name: "Vanilla Cloud",
    shortName: "Vanilla",
    title: ["Vanilla", "cloud."],
    image: "/images/soft-serve-vanilla.png",
    accent: "#956035",
    background: "#fff9e8",
    tone: "#f2e4c5",
    swatch: "#e4c998",
    description: "Just you and the creamiest vanilla swirl. Sometimes, the simple things are the sweetest.",
    details: "Our classic vanilla soft serve, without the extras. A beautifully simple swirl with a soft, creamy finish.",
  },
];

export type City = "Alexandria" | "Cairo";

export type Branch = {
  id: string;
  name: string;
  city: City;
  address: string;
  mapQuery: string;
};

export const branches: Branch[] = [
  { id: "kafr-abdo", name: "Kafr Abdo", city: "Alexandria", address: "35 Abd El-Moneim Riad, Kafr Abdo, Sidi Gaber", mapQuery: "Puffy Pops Kafr Abdo" },
  { id: "smouha", name: "Smouha", city: "Alexandria", address: "12 Mounir El Sayed El Far, Smouha, Sidi Gaber", mapQuery: "Puffy Pops Smouha Alexandria" },
  { id: "green-plaza", name: "Green Plaza", city: "Alexandria", address: "Green Plaza Mall, 14th May Road, Smouha", mapQuery: "Puffy Pops Green Plaza Alexandria" },
  { id: "arkan", name: "Arkan, Market St.", city: "Cairo", address: "Market Street, Arkan Plaza, Sheikh Zayed", mapQuery: "Puffy Pops Arkan Plaza" },
  { id: "golf-central", name: "Golf Central Mall", city: "Cairo", address: "Golf Central Mall, Palm Hills, 6 October", mapQuery: "Puffy Pops Golf Central Mall" },
];

export function getMapUrl(branch: Branch) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.mapQuery)}`;
}
