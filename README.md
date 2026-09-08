# Quản lý đặt vật tư công trình (MVP)

Nền tảng web giúp đội thi công đặt vật tư, giám đốc duyệt đơn, cửa hàng giao hàng;
số liệu tự phân bổ vào bảng tổng hợp theo công trình, đối chiếu dự toán vs thực tế
và thống kê chi phí + công nợ cuối tháng. Thay thế quy trình thủ công
(nhắn kế toán → gọi cửa hàng → nhập tay → dò công nợ).

## Tech stack

- **Next.js 16** (App Router, TypeScript) + **Server Actions**
- **shadcn/ui** (Base UI) + **Tailwind CSS v4**
- **Neon** (Postgres serverless) qua driver `@neondatabase/serverless`
- **Drizzle ORM** cho schema, migration, query
- **Better Auth** cho xác thực + phân quyền 4 role
- Giao diện tiếng Việt, tiền tệ VND

## 4 vai trò (role)

| Role       | Chức năng chính                                                       |
| ---------- | -------------------------------------------------------------------- |
| `admin`    | Quản lý công trình / vật tư / dự toán; xem toàn bộ                    |
| `director` | Duyệt / từ chối đơn; xem đối chiếu, thống kê, công nợ; ghi nhận trả nợ |
| `site`     | Đặt vật tư (tạo đơn nhiều dòng); theo dõi đơn của mình                |
| `supplier` | Xem đơn đã duyệt cần giao; đánh dấu đã giao; xem công nợ              |

## Yêu cầu

- Node.js ≥ 20 (khuyến nghị 22)
- pnpm ≥ 10
- Một Neon Postgres database (https://console.neon.tech)

## 1. Cấu hình môi trường

Sao chép file mẫu và điền giá trị thật:

```bash
cp .env.example .env
```

| Biến                  | Mô tả                                               |
| --------------------- | --------------------------------------------------- |
| `DATABASE_URL`        | Chuỗi kết nối **Pooled** của Neon (`...-pooler...`)  |
| `BETTER_AUTH_SECRET`  | Chuỗi ngẫu nhiên: `openssl rand -hex 32`            |
| `BETTER_AUTH_URL`     | URL app, mặc định `http://localhost:3000`           |
| `NEXT_PUBLIC_APP_URL` | URL app cho client, mặc định `http://localhost:3000`|

> Không hardcode secret trong code — tất cả đọc từ `.env`.

## 2. Cài đặt & khởi tạo database

```bash
pnpm install          # cài dependency
pnpm db:generate      # sinh migration từ schema (đã có sẵn trong /drizzle)
pnpm db:migrate       # áp migration lên Neon
pnpm db:seed          # nạp dữ liệu demo (⚠ xóa & tạo lại toàn bộ dữ liệu)
```

## 3. Chạy dev

```bash
pnpm dev
```

Mở http://localhost:3000 → đăng nhập bằng tài khoản demo (mật khẩu chung `123456`):

| Email              | Vai trò       |
| ------------------ | ------------- |
| `admin@demo.vn`    | Quản trị      |
| `director@demo.vn` | Giám đốc      |
| `site@demo.vn`     | Đội thi công  |
| `supplier@demo.vn` | Cửa hàng      |

## Kịch bản demo end-to-end

1. **site** → *Đặt vật tư*: chọn công trình, thêm dòng vật tư → **Gửi đơn**
   (tự sinh thông báo cho giám đốc + cửa hàng).
2. **director** → chuông thông báo / *Duyệt đơn* → **Duyệt**
   (số lượng & tiền **tự phân bổ** vào bảng tổng hợp thực tế của công trình).
3. **supplier** → *Đơn cần giao* → **Đánh dấu đã giao** (công nợ cập nhật).
4. **Đối chiếu**: bảng dự toán vs thực tế theo công trình — tô đỏ khi vượt dự toán
   (đơn seed cố ý đặt Xi măng vượt dự toán để minh họa).
5. **Thống kê & công nợ**: lọc theo tháng / công trình, tổng chi phí thực tế,
   công nợ theo cửa hàng, **Xuất CSV**. Giám đốc có thể *Ghi nhận thanh toán*.

## Scripts

| Lệnh               | Tác dụng                                   |
| ------------------ | ------------------------------------------ |
| `pnpm dev`         | Chạy dev server                            |
| `pnpm build`       | Build production                           |
| `pnpm start`       | Chạy bản build                             |
| `pnpm db:generate` | Sinh migration từ schema Drizzle           |
| `pnpm db:migrate`  | Áp migration lên database                  |
| `pnpm db:push`     | Đẩy schema trực tiếp (không qua migration) |
| `pnpm db:seed`     | Nạp dữ liệu demo                           |

## Cấu trúc chính

```
src/
├─ app/
│  ├─ (app)/              # khu vực đã đăng nhập (topbar + sidebar theo role)
│  │  ├─ page.tsx         # dashboard theo role
│  │  ├─ orders/          # danh sách + tạo + chi tiết đơn
│  │  ├─ approvals/       # duyệt đơn (director)
│  │  ├─ delivery/        # đơn cần giao (supplier)
│  │  ├─ reconcile/       # đối chiếu dự toán vs thực tế
│  │  ├─ reports/         # thống kê tháng + công nợ + CSV
│  │  ├─ notifications/   # hộp thư thông báo in-app
│  │  └─ admin/           # CRUD công trình / vật tư / dự toán
│  ├─ login/              # trang đăng nhập
│  └─ api/
│     ├─ auth/[...all]/   # Better Auth handler
│     └─ export/report/   # xuất CSV
├─ lib/
│  ├─ db/                 # schema Drizzle + kết nối Neon
│  ├─ actions/            # server actions (orders, admin, payments)
│  ├─ auth.ts, session.ts # Better Auth + helper phân quyền
│  ├─ data.ts, reports.ts # truy vấn dùng chung
│  └─ constants.ts, utils.ts
├─ components/            # sidebar, user-menu, page-header, ui/ (shadcn)
├─ db/seed.ts             # script seed dữ liệu demo
└─ proxy.ts               # bảo vệ route (Next 16 proxy/middleware)
```

## Ghi chú thiết kế

- **Auto phân bổ**: khi director duyệt đơn, trong 1 transaction số lượng/tiền của
  từng dòng được cộng dồn vào bảng `project_material_actual` (bảng tổng hợp thực tế).
- **Công nợ** = tổng tiền đơn `delivered` của cửa hàng − tổng `payments` đã ghi nhận.
- Dùng driver **neon-serverless (WebSocket Pool)** để hỗ trợ transaction
  (driver neon-http không hỗ trợ transaction mà Better Auth cần).
- Đây là MVP demo: thông báo chỉ **in-app** (không email/SMS thật),
  không thanh toán online, không realtime.
