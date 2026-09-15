import { eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { branchProfiles, employees } from "../../../db/schema";
import { branches } from "../../catalog";
import { ensureAllStaff } from "../../server/staff";

export async function GET() {
  try {
    const db = await getDb();
    await ensureAllStaff(db);
    const profiles = await db.select().from(branchProfiles);
    const managerIds = profiles.flatMap((profile) => profile.managerEmployeeId ? [profile.managerEmployeeId] : []);
    const managers = managerIds.length ? await db.select().from(employees).where(inArray(employees.id, managerIds)) : [];
    const activeStaff = await db.select({ id: employees.id, branchId: employees.branchId }).from(employees).where(eq(employees.active, true));
    return Response.json({
      branches: branches.map((branch) => {
        const profile = profiles.find((entry) => entry.branchId === branch.id);
        const manager = managers.find((entry) => entry.id === profile?.managerEmployeeId);
        return { ...branch, manager: manager?.name ?? "Manager Placeholder", employeeCount: activeStaff.filter((entry) => entry.branchId === branch.id).length };
      }),
    });
  } catch {
    return Response.json({ branches: branches.map((branch) => ({ ...branch, manager: "Manager Placeholder", employeeCount: 0 })) });
  }
}
