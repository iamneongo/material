import { cn, formatDateTime } from "@/lib/utils";
import {
  PackagePlus,
  Check,
  X,
  Truck,
  Circle,
  type LucideIcon,
} from "lucide-react";

export type TimelineEvent = {
  id: number;
  action: string;
  actorName: string;
  summary: string;
  createdAt: string;
};

const ICONS: Record<string, LucideIcon> = {
  "order.created": PackagePlus,
  "order.approved": Check,
  "order.rejected": X,
  "order.delivered": Truck,
};

const TONES: Record<string, string> = {
  "order.created": "bg-primary/15 text-primary",
  "order.approved": "bg-emerald-100 text-emerald-700",
  "order.rejected": "bg-red-100 text-red-700",
  "order.delivered": "bg-blue-100 text-blue-700",
};

export function OrderTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Chưa có diễn biến.</p>
    );
  }

  return (
    <ol className="relative space-y-4">
      {events.map((e, i) => {
        const Icon = ICONS[e.action] ?? Circle;
        return (
          <li key={e.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  TONES[e.action] ?? "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
              </div>
              {i < events.length - 1 && (
                <div className="mt-1 w-px flex-1 bg-border" />
              )}
            </div>
            <div className="pb-1">
              <p className="text-sm">{e.summary}</p>
              <p className="text-xs text-muted-foreground">
                {e.actorName} · {formatDateTime(e.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
