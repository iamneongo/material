import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { user } from "../db/schema.js";

/** One-time, idempotent compatibility migration for the retired director role. */
export async function mergeDirectorRoleIntoAdmin() {
  await db.update(user).set({ role: "admin" }).where(eq(user.role, "director"));
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS supplier_contacts (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS project_supplier_contacts (
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      supplier_contact_id INTEGER NOT NULL REFERENCES supplier_contacts(id) ON DELETE CASCADE,
      CONSTRAINT project_supplier_contacts_uq UNIQUE (project_id, supplier_contact_id)
    )
  `);
  await db.execute(sql`
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS default_supplier_contact_id INTEGER REFERENCES supplier_contacts(id) ON DELETE SET NULL
  `);
  await db.execute(sql`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS supplier_contact_id INTEGER REFERENCES supplier_contacts(id) ON DELETE SET NULL
  `);
}
