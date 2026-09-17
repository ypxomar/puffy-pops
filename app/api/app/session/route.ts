import { getBranch } from "../../../catalog";
import { verifySession } from "../../../server/admin-session";
import { verifyCashierSession } from "../../../server/cashier-session";
import { verifyCmsSession } from "../../../server/cms-session";

export async function GET(request: Request) {
  const admin = await verifySession(request);
  if (admin?.role === "owner") return Response.json({ role: "owner", expires: admin.expires }, { headers: { "cache-control": "no-store" } });
  if (admin?.role === "branch") return Response.json({ role: "branch", branch: getBranch(admin.branchId), expires: admin.expires }, { headers: { "cache-control": "no-store" } });
  const cashier = await verifyCashierSession(request);
  if (cashier) return Response.json({ role: "cashier", employee: { id: cashier.employee.id, name: cashier.employee.name, username: cashier.employee.username }, branch: getBranch(cashier.employee.branchId), expires: cashier.expires }, { headers: { "cache-control": "no-store" } });
  const developer = await verifyCmsSession(request);
  if (developer) return Response.json({ role: "developer", expires: developer.expires }, { headers: { "cache-control": "no-store" } });
  return Response.json({ error: "Session expired." }, { status: 401, headers: { "cache-control": "no-store" } });
}
