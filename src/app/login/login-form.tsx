"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "Quản trị", email: "admin@demo.vn" },
  { role: "Giám đốc", email: "director@demo.vn" },
  { role: "Đội thi công", email: "site@demo.vn" },
  { role: "Cửa hàng", email: "supplier@demo.vn" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Đăng nhập thất bại", {
        description: "Email hoặc mật khẩu không đúng.",
      });
      return;
    }
    toast.success("Đăng nhập thành công");
    router.push("/");
    router.refresh();
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("123456");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Quản lý đặt vật tư</CardTitle>
            <CardDescription>Đăng nhập để tiếp tục</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="ban@congty.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Đăng nhập
          </Button>
        </form>

        <div className="mt-6 rounded-lg border bg-muted/40 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Tài khoản demo (mật khẩu: 123456) — bấm để điền nhanh
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemo(acc.email)}
                className="rounded-md border bg-background px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
              >
                <div className="font-medium">{acc.role}</div>
                <div className="text-muted-foreground">{acc.email}</div>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Chưa quen hệ thống?{" "}
          <Link href="/docs" className="text-primary hover:underline">
            Xem tài liệu hướng dẫn
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
