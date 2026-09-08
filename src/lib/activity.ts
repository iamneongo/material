import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";

export type ActivityEntityType =
  | "order"
  | "payment"
  | "project"
  | "material"
  | "budget";

type Inserter = Pick<typeof db, "insert">;

/**
 * Ghi một dòng nhật ký hoạt động. Nhận `db` hoặc `tx` (cùng API `.insert`)
 * để có thể ghi trong cùng transaction với nghiệp vụ.
 */
export async function logActivity(
  client: Inserter,
  entry: {
    actorId: string | null;
    actorName: string;
    action: string;
    entityType: ActivityEntityType;
    entityId?: number | null;
    summary: string;
  }
) {
  await client.insert(activityLog).values({
    actorId: entry.actorId,
    actorName: entry.actorName,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    summary: entry.summary,
  });
}
