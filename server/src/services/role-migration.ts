import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { user } from "../db/schema.js";

/** One-time, idempotent compatibility migration for the retired director role. */
export async function mergeDirectorRoleIntoAdmin() {
  await db.update(user).set({ role: "admin" }).where(eq(user.role, "director"));
}
