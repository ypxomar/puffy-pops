import { eq } from "drizzle-orm";
import type { getDb } from "../../db";
import { branchProfiles, employees } from "../../db/schema";
import { branches } from "../catalog";

type Database = Awaited<ReturnType<typeof getDb>>;

const placeholderStaff = [
  { suffix: "manager", name: "Manager Placeholder", role: "manager" },
  { suffix: "cashier", name: "Cashier Placeholder", role: "cashier" },
  { suffix: "team", name: "Team Member Placeholder", role: "team" },
];

export async function ensureBranchStaff(db: Database, branchId: string) {
  if (!branches.some((branch) => branch.id === branchId)) return;

  // A branch profile is also the durable "staff seeded" marker. Previously we
  // ran the placeholder inserts on every dashboard load, so deleting a
  // placeholder employee appeared to succeed and then the same employee was
  // recreated immediately. Once this profile exists, the owner has full
  // control of the branch roster—including leaving it empty.
  const [existingProfile] = await db.select({ branchId: branchProfiles.branchId })
    .from(branchProfiles)
    .where(eq(branchProfiles.branchId, branchId))
    .limit(1);
  if (existingProfile) return;

  await db.insert(employees).values(placeholderStaff.map((person) => ({
    employeeKey: `placeholder-${branchId}-${person.suffix}`,
    branchId,
    name: person.name,
    role: person.role,
  }))).onConflictDoNothing();

  const [manager] = await db.select({ id: employees.id }).from(employees)
    .where(eq(employees.employeeKey, `placeholder-${branchId}-manager`)).limit(1);
  await db.insert(branchProfiles).values({ branchId, managerEmployeeId: manager?.id ?? null }).onConflictDoNothing();
}

export async function ensureAllStaff(db: Database) {
  for (const branch of branches) await ensureBranchStaff(db, branch.id);
}
