"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDateTime } from "@/lib/utils";
import { markNotificationsReadByIds } from "@/lib/actions/orders";
import { Bell } from "lucide-react";
import type { NotiItem } from "@/components/notification-bell";

export function NotificationList({ items }: { items: NotiItem[] }) {
  const router = useRouter();
  const [list, setList] = useState(items);

  async function handleClick(n: NotiItem) {
    if (!n.isRead) {
      setList((l) =>
        l.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
      );
      await markNotificationsReadByIds([n.id]);
    }
    if (n.orderId) router.push(`/orders/${n.orderId}`);
    router.refresh();
  }

  if (list.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Chưa có thông báo nào.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {list.map((n) => (
        <button
          key={n.id}
          onClick={() => handleClick(n)}
          className="block w-full text-left"
        >
          <Card
            className={cn(
              "transition-colors hover:border-primary/40",
              !n.isRead && "border-primary/40 bg-primary/5"
            )}
          >
            <CardContent className="flex items-start gap-3 py-3">
              <div
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                  n.isRead
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/15 text-primary"
                )}
              >
                <Bell className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{n.title}</span>
                  {!n.isRead && (
                    <span className="size-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDateTime(n.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
