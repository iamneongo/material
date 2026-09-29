import { sql } from "drizzle-orm";
import { db } from "../db/index.js";

/** Lightweight idempotent runtime migrations for enum changes not covered by app bootstrapping. */
export async function ensureRuntimeDatabaseCompatibility() {
  await db.execute(sql`
    DO $$
    BEGIN
      IF to_regtype('public.role') IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'accountant'
          AND enumtypid = 'public.role'::regtype
      ) THEN
        ALTER TYPE "role" ADD VALUE 'accountant';
      END IF;
    END $$;
  `);
}
