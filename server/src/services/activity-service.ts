import { desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { activityLog } from "../db/schema.js";

export async function logActivity(client: Pick<typeof db, "insert">, entry: {
  actorId: string | null; actorName: string; action: string; entityType: string;
  entityId?: number | null; summary: string;
}) {
  await client.insert(activityLog).values({ ...entry, entityId: entry.entityId ?? null });
}

export async function listActivity() {
  return db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(200);
}
