import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { MarkAllReadButton } from "./mark-read-button";
import { NotificationList } from "./notification-list";

export default async function NotificationsPage() {
  const user = await requireUser();

  const list = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  const unreadCount = list.filter((n) => !n.isRead).length;

  return (
    <div>
      <PageHeader
        title="Thông báo"
        description={
          unreadCount > 0
            ? `Bạn có ${unreadCount} thông báo chưa đọc.`
            : "Không có thông báo mới."
        }
        action={<MarkAllReadButton disabled={unreadCount === 0} />}
      />

      <NotificationList
        items={list.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          orderId: n.orderId,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
