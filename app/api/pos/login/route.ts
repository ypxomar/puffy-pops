import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { employees } from "../../../../db/schema";
import { cashierSessionCookie, createCashierSession } from "../../../server/cashier-session";
import { normalizeUsername, verifyPassword } from "../../../server/security";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { username?: string; password?: string };
  try {
    const db = await getDb();
    const [employee] = await db.select().from(employees).where(and(eq(employees.username, normalizeUsername(body.username ?? "")), eq(employees.role, "cashier"), eq(employees.active, true))).limit(1);
    if (!employee?.passwordHash || !await verifyPassword(body.password ?? "", employee.passwordSalt, employee.passwordHash)) {
      return Response.json({ error: "Incorrect username or password." }, { status: 401 });
    }
    const token = await createCashierSession(employee);
    const secure = new URL(request.url).protocol === "https:";
    return new Response(JSON.stringify({ ok: true, destination: "/pos/register" }), { headers: { "content-type": "application/json", "set-cookie": `${cashierSessionCookie.name}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${cashierSessionCookie.maxAge}${secure ? "; Secure" : ""}` } });
  } catch {
    return Response.json({ error: "Cashier sign-in is unavailable." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "set-cookie": `${cashierSessionCookie.name}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}` } });
}
