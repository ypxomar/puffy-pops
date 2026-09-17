import { getDb } from "../../../db";
import { getManagedMenus } from "../../server/catalog-store";
import { catalogAvailability } from "../../server/product-inventory";

export async function GET() {
  const menus = await getManagedMenus();
  try {
    const availability = await catalogAvailability(await getDb());
    return Response.json({ menus, availability }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Catalog availability unavailable", error);
    return Response.json({ menus, availability: { byBranch: {}, cityAvailability: { alexandria: {}, cairo: {} } } }, { headers: { "cache-control": "no-store" } });
  }
}
