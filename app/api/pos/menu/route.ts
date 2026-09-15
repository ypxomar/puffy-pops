import { getBranch } from "../../../catalog";
import { getManagedMenus } from "../../../server/catalog-store";
import { verifyCashierSession } from "../../../server/cashier-session";
import { branchProductRows, productRowCanFulfil } from "../../../server/product-inventory";

export async function GET(request: Request) {
  const session = await verifyCashierSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const branch = getBranch(session.employee.branchId);
  if (!branch) return Response.json({ error: "Branch not found." }, { status: 404 });
  const menus = await getManagedMenus();
  const rows = await branchProductRows(session.db, branch.id);
  const availability = new Map(rows.map((row) => [row.productId, productRowCanFulfil(row, 1)]));
  return Response.json({ branch, employee: { id: session.employee.id, name: session.employee.name }, menu: { ...menus[branch.cityId], items: menus[branch.cityId].items.filter((item) => availability.get(item.id) !== false) } });
}
