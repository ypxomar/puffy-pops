import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { employees } from "../../../../db/schema";
import { getBranch } from "../../../catalog";
import { createSession, resolveAccessFromCode, sessionMaxAge } from "../../../server/admin-session";
import { cashierSessionCookie, createCashierSession } from "../../../server/cashier-session";
import { normalizeUsername, verifyPassword } from "../../../server/security";

type LoginBody = { code?: unknown; username?: unknown; password?: unknown };
const clean = (value: unknown, max = 120) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as LoginBody;
  const code = clean(body.code);
  try {
    if (code) {
      const identity = await resolveAccessFromCode(code);
      if (!identity) return Response.json({ error: "That management code is incorrect." }, { status: 401 });
      const token = await createSession(identity);
      return Response.json({
        token,
        role: identity.role,
        branch: identity.role === "branch" ? getBranch(identity.branchId) : null,
        expiresIn: sessionMaxAge(identity),
      }, { headers: { "cache-control": "no-store" } });
    }

    const username = normalizeUsername(clean(body.username, 32));
    const password = clean(body.password, 100);
    if (!username || !password) return Response.json({ error: "Enter your username and password." }, { status: 400 });
    const db = await getDb();
    const [employee] = await db.select().from(employees).where(and(
      eq(employees.username, username),
      eq(employees.role, "cashier"),
      eq(employees.active, true),
    )).limit(1);
    if (!employee?.passwordHash || !await verifyPassword(password, employee.passwordSalt, employee.passwordHash)) {
      return Response.json({ error: "Incorrect username or password." }, { status: 401 });
    }
    const token = await createCashierSession(employee);
    return Response.json({
      token,
      role: "cashier",
      employee: { id: employee.id, name: employee.name, username: employee.username },
      branch: getBranch(employee.branchId),
      expiresIn: cashierSessionCookie.maxAge,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Sign-in is temporarily unavailable." }, { status: 500 });
  }
}
