import { and, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { employees } from "../../db/schema";
import { base64Url, constantTimeEqual, fromBase64Url, signPayload } from "./security";

const COOKIE_NAME = "puffy_cashier_session";

export async function createCashierSession(employee: { id: number; branchId: string; name: string }) {
  const payload = base64Url(JSON.stringify({ employeeId: employee.id, branchId: employee.branchId, name: employee.name, expires: Date.now() + 10 * 60 * 60 * 1000 }));
  return `${payload}.${await signPayload(payload)}`;
}

export async function verifyCashierSession(request: Request) {
  try {
    const rawCookie = request.headers.get("cookie") ?? "";
    const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    const token = bearer ?? rawCookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
    if (!token) return null;
    const [payload, provided] = token.split(".");
    if (!payload || !provided || !constantTimeEqual(provided, await signPayload(payload))) return null;
    const parsed = JSON.parse(fromBase64Url(payload)) as { employeeId?: number; branchId?: string; expires?: number };
    if (!parsed.employeeId || !parsed.branchId || !parsed.expires || parsed.expires < Date.now()) return null;
    const db = await getDb();
    const [employee] = await db.select().from(employees).where(and(
      eq(employees.id, parsed.employeeId),
      eq(employees.branchId, parsed.branchId),
      eq(employees.role, "cashier"),
      eq(employees.active, true),
    )).limit(1);
    return employee ? { employee, db, expires: parsed.expires } : null;
  } catch {
    return null;
  }
}

export const cashierSessionCookie = {
  name: COOKIE_NAME,
  maxAge: 10 * 60 * 60,
};
