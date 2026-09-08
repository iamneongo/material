import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { and, desc, eq, count } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const [[unread], recent] = await Promise.all([
    db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, user.id), eq(notifications.isRead, false))
      ),
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(8),
  ]);

  return (
    <AppShell
      user={{ name: user.name, email: user.email, role: user.role }}
      unreadCount={unread?.value ?? 0}
      recentNotifications={recent.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        orderId: n.orderId,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      }))}
    >
      {children}
    </AppShell>
  );
}
