import { menus, type CityId, type MenuItem } from "./catalog";

// v3 intentionally resets carts created before order quantity was separated
// from labels such as "S · 6 pieces". A size describes one plate; it is never
// the number of plates being ordered.
export const CART_KEY = "puffy-pops-cart-v3";
export const BRANCH_KEY = "puffy-pops-branch-v2";

export type CartLine = {
  id: string;
  itemId: string;
  variantId: string;
  choice?: string;
  quantity: number;
};

export function makeLineId(itemId: string, variantId: string, choice?: string) {
  return [itemId, variantId, choice ?? ""].join("::");
}

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const line = entry as Partial<CartLine>;
      const quantity = Math.floor(Number(line.quantity));
      if (typeof line.id !== "string" || typeof line.itemId !== "string" || typeof line.variantId !== "string" || quantity < 1 || quantity > 20) return [];
      return [{ id: line.id, itemId: line.itemId, variantId: line.variantId, choice: typeof line.choice === "string" ? line.choice : undefined, quantity }];
    });
  } catch {
    return [];
  }
}

export function saveCart(lines: CartLine[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("puffy-cart-change"));
}

export function clearCart() {
  saveCart([]);
}

export function hydrateCart(lines: CartLine[], cityId: CityId, items: MenuItem[] = menus[cityId].items) {
  return lines.flatMap((line) => {
    const item = items.find((entry) => entry.id === line.itemId);
    const variant = item?.variants.find((entry) => entry.id === line.variantId);
    if (!item || !variant || line.quantity < 1) return [];
    return [{ ...line, item, variant, lineTotal: variant.price * line.quantity }];
  });
}
