"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell, type NotiItem } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/db/schema";
import { Building2, PanelLeft, Menu, X } from "lucide-react";

export function AppShell({
  user,
  unreadCount,
  recentNotifications,
  children,
}: {
  user: { name: string; email: string; role: UserRole };
  unreadCount: number;
  recentNotifications: NotiItem[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (localStorage.getItem("sidebar-collapsed") === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-3 backdrop-blur-md md:px-4">
        <div className="flex items-center gap-2">
          {/* Mobile: mở drawer */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
          >
            <Menu className="size-5" />
          </Button>
          {/* Desktop: thu gọn sidebar */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={toggleCollapsed}
            aria-label="Thu gọn menu"
          >
            <PanelLeft className="size-5" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-4.5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight">
                Quản lý đặt vật tư
              </div>
              <div className="text-[11px] text-muted-foreground">
                {ROLE_LABELS[user.role]}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell
            initialUnread={unreadCount}
            initialRecent={recentNotifications}
          />
          <UserMenu name={user.name} email={user.email} role={user.role} />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside
          className={cn(
            "hidden shrink-0 border-r bg-sidebar transition-[width] duration-200 md:block",
            collapsed ? "w-[68px]" : "w-60"
          )}
        >
          <div className="sticky top-14">
            <AppSidebar role={user.role} collapsed={collapsed} />
          </div>
        </aside>

        {/* Sidebar mobile (drawer) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-64 border-r bg-sidebar shadow-xl">
              <div className="flex h-14 items-center justify-between border-b px-4">
                <span className="text-sm font-bold">Menu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Đóng menu"
                >
                  <X className="size-5" />
                </Button>
              </div>
              <AppSidebar
                role={user.role}
                onNavigate={() => setMobileOpen(false)}
              />
            </aside>
          </div>
        )}

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
