import Link from "next/link";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DocsToc, type TocItem } from "./docs-toc";
import {
  Building2,
  PackagePlus,
  CheckSquare,
  Truck,
  Scale,
  BarChart3,
  Bell,
  History,
  Boxes,
  Wallet,
  ArrowRight,
  Database,
  ShieldCheck,
  LogIn,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tài liệu hệ thống — Quản lý đặt vật tư công trình",
  description:
    "Mô tả và hướng dẫn sử dụng nền tảng quản lý đặt vật tư công trình.",
};

const TOC: TocItem[] = [
  { id: "gioi-thieu", label: "Giới thiệu" },
  { id: "cong-nghe", label: "Công nghệ" },
  { id: "vai-tro", label: "Vai trò & phân quyền" },
  { id: "luong", label: "Luồng nghiệp vụ" },
  { id: "tinh-nang", label: "Tính năng chính" },
  { id: "tai-khoan", label: "Tài khoản demo" },
  { id: "faq", label: "Câu hỏi thường gặp" },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-4 text-2xl font-bold tracking-tight">{title}</h2>
      <div className="space-y-4">{children}</div>
      <Separator className="my-10" />
    </section>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/docs" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-4.5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold">Tài liệu hệ thống</div>
              <div className="text-[11px] text-muted-foreground">
                Quản lý đặt vật tư công trình
              </div>
            </div>
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <LogIn className="size-4" /> Vào ứng dụng
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
        {/* TOC */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20">
            <DocsToc items={TOC} />
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          {/* Hero */}
          <div className="mb-10">
            <Badge variant="secondary" className="mb-3">
              Tài liệu · v1.0
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Nền tảng quản lý đặt vật tư công trình
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Thay thế quy trình thủ công (nhắn kế toán → gọi cửa hàng → nhập
              tay → dò công nợ) bằng một luồng số hoá: đội thi công đặt vật tư,
              giám đốc duyệt, cửa hàng giao, số liệu tự phân bổ và đối chiếu dự
              toán — thống kê chi phí, công nợ cuối tháng.
            </p>
          </div>

          {/* Giới thiệu */}
          <Section id="gioi-thieu" title="Giới thiệu">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Hệ thống giúp các bên trong một doanh nghiệp xây dựng phối hợp đặt
              và cung ứng vật tư theo từng công trình. Mỗi vai trò có bảng điều
              khiển và quyền riêng; toàn bộ thao tác được ghi lại làm nhật ký.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: PackagePlus,
                  title: "Đặt vật tư nhanh",
                  desc: "Tạo đơn nhiều dòng, tự gợi ý đơn giá từ dự toán.",
                },
                {
                  icon: Scale,
                  title: "Tự phân bổ & đối chiếu",
                  desc: "Duyệt đơn là số liệu tự cộng vào bảng thực tế, so với dự toán.",
                },
                {
                  icon: Wallet,
                  title: "Công nợ minh bạch",
                  desc: "Tổng đã giao − đã thanh toán theo từng cửa hàng.",
                },
              ].map((f) => (
                <Card key={f.title}>
                  <CardContent className="space-y-2 py-1">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="size-5" />
                    </div>
                    <div className="font-medium">{f.title}</div>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>

          {/* Công nghệ */}
          <Section id="cong-nghe" title="Công nghệ">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Next.js 16 (App Router, TypeScript)", "Khung ứng dụng + Server Actions"],
                ["shadcn/ui + Tailwind CSS v4", "Thư viện giao diện, font Manrope"],
                ["Neon (Postgres serverless)", "Cơ sở dữ liệu"],
                ["Drizzle ORM", "Schema, migration, truy vấn"],
                ["Better Auth", "Đăng nhập + phân quyền 4 vai trò"],
                ["Recharts", "Biểu đồ thống kê"],
              ].map(([t, d]) => (
                <div
                  key={t}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3"
                >
                  <Database className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{t}</div>
                    <div className="text-xs text-muted-foreground">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Vai trò */}
          <Section id="vai-tro" title="Vai trò & phân quyền">
            <p className="text-sm text-muted-foreground">
              Hệ thống có 4 vai trò. Mỗi vai trò đăng nhập sẽ thấy menu và chức
              năng riêng — đây là lý do một tài khoản không nhìn thấy toàn bộ
              tính năng.
            </p>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Chức năng chính</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Badge>Quản trị (admin)</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        Quản lý công trình / vật tư / dự toán (thêm–sửa–xóa);
                        xem nhật ký; xem toàn bộ.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Badge>Giám đốc (director)</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        Duyệt / từ chối đơn; xem đối chiếu, thống kê, công nợ;
                        ghi nhận thanh toán; xem nhật ký.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Badge variant="secondary">Đội thi công (site)</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        Tạo đơn đặt vật tư (nhiều dòng); theo dõi đơn của mình;
                        xem đối chiếu.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Badge variant="secondary">Cửa hàng (supplier)</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        Xem đơn đã duyệt cần giao; đánh dấu đã giao; xem công nợ.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="text-muted-foreground">
                Route được bảo vệ ở tầng proxy (chưa đăng nhập → chuyển về
                trang đăng nhập), và kiểm tra lại quyền theo vai trò trong từng
                trang.
              </span>
            </div>
          </Section>

          {/* Luồng nghiệp vụ */}
          <Section id="luong" title="Luồng nghiệp vụ">
            <p className="text-sm text-muted-foreground">
              Vòng đời một đơn đặt vật tư đi qua 4 vai trò:
            </p>
            <div className="space-y-3">
              {[
                {
                  n: 1,
                  icon: PackagePlus,
                  role: "Đội thi công",
                  title: "Tạo đơn",
                  desc: "Chọn công trình, thêm các dòng vật tư (số lượng, đơn giá). Gửi đơn → tự sinh thông báo cho giám đốc và cửa hàng. Trạng thái: Chờ duyệt.",
                },
                {
                  n: 2,
                  icon: CheckSquare,
                  role: "Giám đốc",
                  title: "Duyệt / Từ chối",
                  desc: "Xem chi tiết đơn và duyệt (hoặc từ chối kèm lý do). Khi duyệt, số lượng & tiền tự cộng dồn vào bảng tổng hợp thực tế của công trình.",
                },
                {
                  n: 3,
                  icon: Truck,
                  role: "Cửa hàng",
                  title: "Giao hàng",
                  desc: "Xem đơn đã duyệt cần giao và đánh dấu Đã giao → công nợ của cửa hàng tăng tương ứng.",
                },
                {
                  n: 4,
                  icon: BarChart3,
                  role: "Giám đốc / Quản trị",
                  title: "Đối chiếu & thống kê",
                  desc: "Đối chiếu dự toán vs thực tế (cảnh báo vượt), thống kê chi phí theo tháng, công nợ theo cửa hàng, xuất CSV.",
                },
              ].map((s) => (
                <div key={s.n} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {s.n}
                    </div>
                    {s.n < 4 && <div className="mt-1 w-px flex-1 bg-border" />}
                  </div>
                  <Card className="mb-1 flex-1">
                    <CardContent className="py-1">
                      <div className="flex items-center gap-2">
                        <s.icon className="size-4 text-primary" />
                        <span className="font-medium">{s.title}</span>
                        <Badge variant="outline">{s.role}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {s.desc}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </Section>

          {/* Tính năng */}
          <Section id="tinh-nang" title="Tính năng chính">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: Boxes,
                  title: "Quản lý danh mục (admin)",
                  desc: "CRUD công trình, vật tư (đơn vị, nhóm) và dự toán theo công trình × vật tư.",
                },
                {
                  icon: Scale,
                  title: "Đối chiếu dự toán / thực tế",
                  desc: "Bảng theo công trình: SL & tiền dự toán vs thực tế, chênh lệch, % vượt — tô đỏ khi vượt hoặc phát sinh ngoài dự toán.",
                },
                {
                  icon: BarChart3,
                  title: "Thống kê & công nợ",
                  desc: "Lọc theo tháng/công trình, chi phí thực tế, cơ cấu theo nhóm (biểu đồ), công nợ từng cửa hàng, xuất CSV.",
                },
                {
                  icon: Bell,
                  title: "Thông báo in-app",
                  desc: "Chuông + popover xem nhanh, badge tự cập nhật, đánh dấu đã đọc từng cái hoặc tất cả.",
                },
                {
                  icon: History,
                  title: "Nhật ký & timeline",
                  desc: "Nhật ký toàn hệ thống (admin/giám đốc) và dòng thời gian diễn biến trên từng đơn.",
                },
                {
                  icon: Wallet,
                  title: "Ghi nhận thanh toán",
                  desc: "Giám đốc/quản trị ghi khoản thanh toán cho cửa hàng để giảm công nợ.",
                },
              ].map((f) => (
                <Card key={f.title}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <f.icon className="size-4 text-primary" />
                      <CardTitle className="text-base">{f.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>

          {/* Tài khoản demo */}
          <Section id="tai-khoan" title="Tài khoản demo">
            <p className="text-sm text-muted-foreground">
              Mật khẩu chung: <code className="rounded bg-muted px-1.5 py-0.5 font-mono">123456</code>. Trang đăng nhập có nút điền nhanh từng tài khoản.
            </p>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Vai trò</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["admin@demo.vn", "Quản trị"],
                      ["director@demo.vn", "Giám đốc"],
                      ["site@demo.vn", "Đội thi công"],
                      ["supplier@demo.vn", "Cửa hàng"],
                    ].map(([email, role]) => (
                      <TableRow key={email}>
                        <TableCell className="font-mono text-sm">
                          {email}
                        </TableCell>
                        <TableCell>{role}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Section>

          {/* FAQ */}
          <Section id="faq" title="Câu hỏi thường gặp">
            <div className="space-y-3">
              {[
                {
                  q: "Vì sao tôi không thấy mục thêm/sửa/xóa dữ liệu?",
                  a: "Quản lý danh mục (công trình, vật tư, dự toán) là quyền của vai trò Quản trị. Hãy đăng nhập admin@demo.vn để thấy các trang này.",
                },
                {
                  q: "“Tự phân bổ” hoạt động thế nào?",
                  a: "Khi giám đốc duyệt đơn, trong cùng một giao dịch, số lượng và tiền của từng dòng được cộng dồn vào bảng tổng hợp thực tế của công trình — không cần nhập tay.",
                },
                {
                  q: "Công nợ được tính ra sao?",
                  a: "Công nợ của một cửa hàng = tổng tiền các đơn đã giao − tổng các khoản đã thanh toán ghi nhận cho cửa hàng đó.",
                },
                {
                  q: "Thông báo có gửi email/SMS không?",
                  a: "Bản demo chỉ dùng thông báo trong ứng dụng (in-app), không tích hợp email/SMS thật.",
                },
              ].map((f) => (
                <Card key={f.q}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{f.q}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {f.a}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>

          <div className="flex items-center justify-between rounded-xl border bg-card p-5">
            <div>
              <div className="font-semibold">Sẵn sàng dùng thử?</div>
              <p className="text-sm text-muted-foreground">
                Đăng nhập bằng tài khoản demo để trải nghiệm toàn bộ luồng.
              </p>
            </div>
            <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
              Vào ứng dụng <ArrowRight className="size-4" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
