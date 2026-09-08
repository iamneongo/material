"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { markAllNotificationsRead } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

export function MarkAllReadButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await markAllNotificationsRead();
    setLoading(false);
    toast.success("Đã đánh dấu tất cả là đã đọc");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={loading || disabled}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Check className="size-4" />
      )}
      Đánh dấu đã đọc
    </Button>
  );
}
