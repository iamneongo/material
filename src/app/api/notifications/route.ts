import { NextResponse } from "next/server";
import { and, desc, eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json(
      { unreadCount: 0, recent: [] },
      { status: 401 }
    );
  }

  const [unread] = await db
    .select({ v: count() })
    .from(notifications)
    .where(
      and(eq(notifications.userId, me.id), eq(notifications.isRead, false))
    );

  const recent = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, me.id))
    .orderBy(desc(notifications.createdAt))
    .limit(8);

  return NextResponse.json({
    unreadCount: unread?.v ?? 0,
    recent: recent.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      orderId: n.orderId,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}
