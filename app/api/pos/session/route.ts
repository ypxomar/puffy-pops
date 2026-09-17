import { getBranch } from "../../../catalog";
import { verifyCashierSession } from "../../../server/cashier-session";

export async function GET(request: Request) {
  const session = await verifyCashierSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ employee: { id: session.employee.id, name: session.employee.name, username: session.employee.username }, branch: getBranch(session.employee.branchId) });
}
