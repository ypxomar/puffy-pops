import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import { getDb } from "../../../../db";
import { branchProfiles, employees, orders } from "../../../../db/schema";
import { branches, getBranch } from "../../../catalog";
import { verifySession } from "../../../server/admin-session";
import { requireRuntimeDatabase } from "../../../server/runtime-bindings";
import { normalizeUsername, passwordHash, randomToken } from "../../../server/security";
import { ensureAllStaff, ensureBranchStaff } from "../../../server/staff";

const roles = ["manager", "cashier", "team"];
const clean = (value: unknown, max = 80) => typeof value === "string" ? value.trim().slice(0, max) : "";

function employeeWriteError(action: "created" | "changed", stage: string, error: unknown) {
  const details = (error instanceof Error ? error.message : String(error)).replace(/\s+/g, " ").slice(0, 220);
  if (details.includes("D1_BINDING_MISSING")) return Response.json({ error: "Employee database is not connected to this Worker. Redeploy the matching website package with the DB binding." }, { status: 503 });
  if (/UNIQUE constraint failed: employees\.username/i.test(details)) return Response.json({ error: "That username is already in use." }, { status: 409 });
  if (/UNIQUE constraint failed: employees\.employee_key/i.test(details)) return Response.json({ error: "A temporary employee ID collision occurred. Try saving again." }, { status: 409 });
  if (/no such (table|column)|has no column named/i.test(details)) return Response.json({ error: "The employee database needs the latest schema. Redeploy the website package, then try again." }, { status: 503 });
  if (/CHECK constraint failed/i.test(details)) return Response.json({ error: "The old employee-role database constraint rejected this change. Deploy website v0.6.4, which stores manager assignment separately." }, { status: 409 });
  if (/FOREIGN KEY constraint failed/i.test(details)) return Response.json({ error: "The employee was not saved because an old branch-manager reference is invalid. Refresh Team and try again." }, { status: 409 });
  return Response.json({ error: `Employee could not be ${action} (${stage}). ${details || "D1 rejected the operation."}` }, { status: 500 });
}

function assertD1Write(result: D1Result, stage: string) {
  if (!result.success) throw new Error(`D1 write was unsuccessful during ${stage}.`);
}

function monthBounds(value: string | null) {
  const current = new Date();
  const fallback = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, "0")}`;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? "") ? value! : fallback;
  const [year, number] = month.split("-").map(Number);
  // SQLite's CURRENT_TIMESTAMP uses `YYYY-MM-DD HH:MM:SS`, so keep the
  // comparison bounds in that same sortable format.
  const end = new Date(Date.UTC(year, number, 1)).toISOString().replace("T", " ").slice(0, 19);
  return { month, start: `${month}-01 00:00:00`, end };
}

export async function GET(request: Request) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { month, start, end } = monthBounds(new URL(request.url).searchParams.get("month"));
  try {
    const db = await getDb();
    if (session.role === "owner") await ensureAllStaff(db); else await ensureBranchStaff(db, session.branchId);
    const branchId = session.role === "branch" ? session.branchId : null;
    const staff = await db.select().from(employees)
      .where(branchId ? eq(employees.branchId, branchId) : undefined)
      .orderBy(asc(employees.branchId), asc(employees.name));
    const profiles = await db.select().from(branchProfiles).where(branchId ? eq(branchProfiles.branchId, branchId) : undefined);
    const sales = await db.select().from(orders).where(and(gte(orders.createdAt, start), lt(orders.createdAt, end), eq(orders.source, "pos")));
    return Response.json({
      role: session.role,
      month,
      branches: (branchId ? [getBranch(branchId)].filter(Boolean) : branches).map((branch) => ({
        ...branch,
        managerEmployeeId: profiles.find((profile) => profile.branchId === branch!.id)?.managerEmployeeId ?? null,
      })),
      employees: staff.map((employee) => {
        const employeeSales = sales.filter((order) => order.cashierEmployeeId === employee.id && order.status !== "cancelled");
        const isManager = profiles.some((profile) => profile.managerEmployeeId === employee.id);
        return {
          id: employee.id,
          branchId: employee.branchId,
          name: employee.name,
          role: isManager ? "manager" : employee.role,
          active: employee.active,
          username: employee.username,
          accountReady: Boolean(employee.username && employee.passwordHash),
          setupPending: Boolean(employee.setupTokenHash && employee.setupExpiresAt > new Date().toISOString()),
          salesCount: employeeSales.length,
          salesTotal: employeeSales.reduce((sum, order) => sum + order.subtotal, 0),
        };
      }),
    });
  } catch {
    return Response.json({ error: "Staff records could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await verifySession(request);
  if (!session || session.role !== "owner") return Response.json({ error: "Owner access required." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { branchId?: string; name?: string; role?: string; username?: string; password?: string };
  const name = clean(body.name);
  const role = clean(body.role, 20);
  const branch = getBranch(body.branchId);
  if (!branch || name.length < 2 || !roles.includes(role)) return Response.json({ error: "Choose a branch, name and valid role." }, { status: 400 });
  const username = role === "cashier" ? normalizeUsername(body.username ?? "") : null;
  const password = body.password ?? "";
  if (role === "cashier" && !/^[a-z0-9._-]{3,32}$/.test(username ?? "")) return Response.json({ error: "Cashier username must be 3–32 letters, numbers, dots, underscores or dashes." }, { status: 400 });
  if (role === "cashier" && (password.length < 8 || password.length > 100)) return Response.json({ error: "Cashier password must be 8–100 characters." }, { status: 400 });
  let stage = "database initialization";
  try {
    const db = await getDb();
    const database = requireRuntimeDatabase();
    if (username) {
      stage = "username availability check";
      const [existing] = await db.select({ id: employees.id }).from(employees).where(eq(employees.username, username)).limit(1);
      if (existing) return Response.json({ error: "That cashier username is already in use." }, { status: 409 });
    }
    const salt = role === "cashier" ? randomToken(18) : "";
    const employeeKey = `staff-${randomToken(18)}`;
    stage = role === "cashier" ? "cashier password hashing" : "employee preparation";
    const hash = role === "cashier" ? await passwordHash(password, salt) : "";
    // Manager identity belongs to branch_profiles. Keeping the employee row as
    // `team` remains compatible with databases created by the earliest app.
    const storedRole = role === "manager" ? "team" : role;
    stage = "employee insert";
    assertD1Write(await database.prepare(`INSERT INTO employees (
      employee_key, branch_id, name, role, active, username, password_salt,
      password_hash, setup_token_hash, setup_expires_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`)
      .bind(employeeKey, branch.id, name, storedRole, username, salt, hash).run(), stage);
    stage = "employee read-back";
    const [employee] = await db.select().from(employees).where(eq(employees.employeeKey, employeeKey)).limit(1);
    if (!employee) return Response.json({ error: "The employee was saved but could not be read back. Refresh Team and try again." }, { status: 503 });
    if (role === "manager") {
      stage = "manager assignment";
      assertD1Write(await database.prepare(`INSERT INTO branch_profiles (branch_id, manager_employee_id, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(branch_id) DO UPDATE SET manager_employee_id = excluded.manager_employee_id, updated_at = CURRENT_TIMESTAMP`)
        .bind(branch.id, employee.id).run(), stage);
    }
    return Response.json({ employee }, { status: 201 });
  } catch (error) {
    console.error("Employee creation failed", error);
    return employeeWriteError("created", stage, error);
  }
}

export async function PATCH(request: Request) {
  const session = await verifySession(request);
  if (!session || session.role !== "owner") return Response.json({ error: "Owner access required." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { action?: string; id?: number; ids?: number[]; branchId?: string; employeeId?: number; name?: string; role?: string; active?: boolean; username?: string; password?: string };
  let stage = "database initialization";
  try {
    const db = await getDb();
    const database = requireRuntimeDatabase();
    if (body.action === "set-manager") {
      const branch = getBranch(body.branchId);
      const employeeId = Number(body.employeeId);
      stage = "manager eligibility check";
      const [employee] = await db.select().from(employees).where(and(eq(employees.id, employeeId), eq(employees.branchId, branch?.id ?? ""), eq(employees.active, true))).limit(1);
      if (!branch || !employee) return Response.json({ error: "Choose an active employee from that branch." }, { status: 400 });
      stage = "manager assignment";
      assertD1Write(await database.prepare(`INSERT INTO branch_profiles (branch_id, manager_employee_id, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(branch_id) DO UPDATE SET manager_employee_id = excluded.manager_employee_id, updated_at = CURRENT_TIMESTAMP`)
        .bind(branch.id, employee.id).run(), stage);
      return Response.json({ ok: true });
    }
    if (body.action === "set-cashier-credentials") {
      const id = Number(body.id);
      const username = normalizeUsername(body.username ?? "");
      const password = body.password ?? "";
      if (!/^[a-z0-9._-]{3,32}$/.test(username)) return Response.json({ error: "Username must be 3–32 letters, numbers, dots, underscores or dashes." }, { status: 400 });
      if (password.length < 8 || password.length > 100) return Response.json({ error: "Password must be 8–100 characters." }, { status: 400 });
      stage = "employee lookup";
      const [employee] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
      if (!employee) return Response.json({ error: "Worker not found." }, { status: 404 });
      stage = "username availability check";
      const [existing] = await db.select({ id: employees.id }).from(employees).where(eq(employees.username, username)).limit(1);
      if (existing && existing.id !== id) return Response.json({ error: "That username is already in use." }, { status: 409 });
      const salt = randomToken(18);
      stage = "cashier password hashing";
      const hash = await passwordHash(password, salt);
      stage = "cashier credential update";
      assertD1Write(await database.prepare(`UPDATE employees SET
        role = 'cashier', active = 1, username = ?, password_salt = ?, password_hash = ?,
        setup_token_hash = '', setup_expires_at = '', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`).bind(username, salt, hash, id).run(), stage);
      return Response.json({ ok: true, username, role: "cashier" });
    }
    if (body.action === "bulk-active") {
      const ids = [...new Set((body.ids ?? []).map(Number).filter(Number.isInteger))].slice(0, 200);
      if (!ids.length || typeof body.active !== "boolean") return Response.json({ error: "Choose one or more employees." }, { status: 400 });
      await db.update(employees).set({ active: body.active, updatedAt: new Date().toISOString() }).where(inArray(employees.id, ids));
      return Response.json({ ok: true, count: ids.length });
    }
    const id = Number(body.id);
    const branch = getBranch(body.branchId);
    const name = clean(body.name);
    const role = clean(body.role, 20);
    if (!id || !branch || name.length < 2 || !roles.includes(role)) return Response.json({ error: "Invalid employee update." }, { status: 400 });
    stage = "employee lookup";
    const [existingEmployee] = await db.select({ id: employees.id }).from(employees).where(eq(employees.id, id)).limit(1);
    if (!existingEmployee) return Response.json({ error: "Employee not found." }, { status: 404 });
    const storedRole = role === "manager" ? "team" : role;
    stage = "employee update";
    const update = storedRole === "cashier"
      ? database.prepare(`UPDATE employees SET branch_id = ?, name = ?, role = 'cashier', active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(branch.id, name, body.active === false ? 0 : 1, id)
      : database.prepare(`UPDATE employees SET branch_id = ?, name = ?, role = 'team', active = ?, username = NULL,
          password_salt = '', password_hash = '', setup_token_hash = '', setup_expires_at = '', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(branch.id, name, body.active === false ? 0 : 1, id);
    assertD1Write(await update.run(), stage);
    stage = "manager assignment cleanup";
    assertD1Write(await database.prepare("UPDATE branch_profiles SET manager_employee_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE manager_employee_id = ?")
      .bind(id).run(), stage);
    if (role === "manager") {
      stage = "manager assignment";
      assertD1Write(await database.prepare(`INSERT INTO branch_profiles (branch_id, manager_employee_id, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(branch_id) DO UPDATE SET manager_employee_id = excluded.manager_employee_id, updated_at = CURRENT_TIMESTAMP`)
        .bind(branch.id, id).run(), stage);
    }
    stage = "employee read-back";
    const [updated] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
    if (!updated) return Response.json({ error: "The employee was changed but could not be read back. Refresh Team and try again." }, { status: 503 });
    return Response.json({ employee: updated });
  } catch (error) {
    console.error("Employee update failed", error);
    return employeeWriteError("changed", stage, error);
  }
}

export async function DELETE(request: Request) {
  const session = await verifySession(request);
  if (!session || session.role !== "owner") return Response.json({ error: "Owner access required." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { id?: number; ids?: number[]; confirm?: boolean; confirmName?: string };
  try {
    const db = await getDb();
    if (Array.isArray(body.ids)) {
      const ids = [...new Set(body.ids.map(Number).filter(Number.isInteger))].slice(0, 200);
      if (!body.confirm || !ids.length) return Response.json({ error: "Bulk employee deletion was not confirmed." }, { status: 400 });
      const matched = await db.select({ id: employees.id }).from(employees).where(inArray(employees.id, ids));
      const matchedIds = matched.map((employee) => employee.id);
      if (!matchedIds.length) return Response.json({ error: "No employees were found." }, { status: 404 });
      await db.batch([
        db.update(branchProfiles).set({ managerEmployeeId: null, updatedAt: new Date().toISOString() }).where(inArray(branchProfiles.managerEmployeeId, matchedIds)),
        db.delete(employees).where(inArray(employees.id, matchedIds)),
      ]);
      return Response.json({ ok: true, count: matchedIds.length });
    }
    const id = Number(body.id);
    if (!id) return Response.json({ error: "Choose a valid employee." }, { status: 400 });
    const [employee] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
    if (!employee) return Response.json({ error: "Employee not found." }, { status: 404 });
    if (body.confirmName !== employee.name) return Response.json({ error: "Employee deletion was not confirmed." }, { status: 400 });
    await db.batch([
      db.update(branchProfiles).set({ managerEmployeeId: null, updatedAt: new Date().toISOString() }).where(eq(branchProfiles.managerEmployeeId, employee.id)),
      db.delete(employees).where(eq(employees.id, employee.id)),
    ]);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Employee deletion failed", error);
    return Response.json({ error: "Employee could not be removed." }, { status: 500 });
  }
}
