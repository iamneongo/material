import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { notifications } from "../db/schema.js";

export async function recentNotifications(userId: string) {
  const [[unread], recent] = await Promise.all([
    db.select({ value: count() }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))),
    db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(8),
  ]);
  return { unreadCount: unread?.value ?? 0, recent };
}

export async function allNotifications(userId: string) {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(100);
}
