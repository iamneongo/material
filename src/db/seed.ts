import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  user,
  session,
  account,
  verification,
  projects,
  materials,
  budgets,
  orders,
  orderItems,
  projectMaterialActual,
  notifications,
  payments,
  activityLog,
  type UserRole,
} from "@/lib/db/schema";

/**
 * Seed dữ liệu demo. Script sẽ XÓA toàn bộ dữ liệu domain + tài khoản cũ rồi
 * tạo lại từ đầu để demo luôn ở trạng thái sạch, có thể chạy lại nhiều lần.
 */

async function clearAll() {
  console.log("→ Xóa dữ liệu cũ...");
  await db.delete(activityLog);
  await db.delete(notifications);
  await db.delete(payments);
  await db.delete(projectMaterialActual);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(budgets);
  await db.delete(materials);
  await db.delete(projects);
  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(user);
}

async function createUser(
  name: string,
  email: string,
  role: UserRole
): Promise<string> {
  await auth.api.signUpEmail({
    body: { name, email, password: "123456" },
  });
  await db.update(user).set({ role }).where(eq(user.email, email));
  const [u] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email));
  return u.id;
}

async function main() {
  console.log("=== Seed dữ liệu demo: Quản lý đặt vật tư ===");
  await clearAll();

  // 1) Tài khoản (mật khẩu chung: 123456)
  console.log("→ Tạo tài khoản...");
  const adminId = await createUser("Quản trị viên", "admin@demo.vn", "admin");
  const directorId = await createUser(
    "Trần Văn Giám (Giám đốc)",
    "director@demo.vn",
    "director"
  );
  const siteId = await createUser(
    "Nguyễn Đội (Đội thi công)",
    "site@demo.vn",
    "site"
  );
  const supplierId = await createUser(
    "Cửa hàng VLXD Hòa Phát",
    "supplier@demo.vn",
    "supplier"
  );
  void adminId;

  const SITE_NAME = "Nguyễn Đội (Đội thi công)";
  const DIRECTOR_NAME = "Trần Văn Giám (Giám đốc)";
  const SUPPLIER_NAME = "Cửa hàng VLXD Hòa Phát";

  // 2) Công trình
  console.log("→ Tạo công trình...");
  const [ct1] = await db
    .insert(projects)
    .values({
      code: "CT001",
      name: "Chung cư An Bình",
      address: "12 Nguyễn Văn Cừ, Q.5, TP.HCM",
      status: "active",
    })
    .returning();
  const [ct2] = await db
    .insert(projects)
    .values({
      code: "CT002",
      name: "Nhà xưởng Đồng Nai",
      address: "KCN Amata, Biên Hòa, Đồng Nai",
      status: "active",
    })
    .returning();

  // 3) Vật tư
  console.log("→ Tạo vật tư...");
  const matDefs = [
    { code: "VT001", name: "Cát vàng", unit: "m³", group: "Cát" },
    { code: "VT002", name: "Cát san lấp", unit: "m³", group: "Cát" },
    { code: "VT003", name: "Đá 1x2", unit: "m³", group: "Đá" },
    { code: "VT004", name: "Xi măng PCB40", unit: "bao", group: "Xi măng" },
    { code: "VT005", name: "Bê tông tươi M250", unit: "m³", group: "Bê tông" },
    { code: "VT006", name: "Gạch ống", unit: "viên", group: "Gạch" },
    { code: "VT007", name: "Thép phi 16", unit: "kg", group: "Thép" },
    { code: "VT008", name: "Thép phi 8", unit: "kg", group: "Thép" },
  ];
  const mats = await db.insert(materials).values(matDefs).returning();
  const M = Object.fromEntries(mats.map((m) => [m.code, m])) as Record<
    string,
    (typeof mats)[number]
  >;

  // Đơn giá tham chiếu (VND)
  const PRICE: Record<string, number> = {
    VT001: 350000,
    VT002: 120000,
    VT003: 420000,
    VT004: 92000,
    VT005: 1250000,
    VT006: 1500,
    VT007: 18500,
    VT008: 19000,
  };

  // 4) Dự toán
  console.log("→ Tạo dự toán...");
  const budgetDefs: {
    projectId: number;
    code: string;
    qty: number;
  }[] = [
    // CT001 — cố ý đặt Xi măng thấp để minh họa vượt dự toán
    { projectId: ct1.id, code: "VT001", qty: 50 },
    { projectId: ct1.id, code: "VT003", qty: 40 },
    { projectId: ct1.id, code: "VT004", qty: 150 },
    { projectId: ct1.id, code: "VT005", qty: 30 },
    { projectId: ct1.id, code: "VT007", qty: 2000 },
    // CT002
    { projectId: ct2.id, code: "VT002", qty: 200 },
    { projectId: ct2.id, code: "VT003", qty: 60 },
    { projectId: ct2.id, code: "VT006", qty: 20000 },
  ];
  await db.insert(budgets).values(
    budgetDefs.map((b) => ({
      projectId: b.projectId,
      materialId: M[b.code].id,
      qty: b.qty.toFixed(3),
      unitPrice: PRICE[b.code].toFixed(2),
    }))
  );

  // 5) Đơn đặt vật tư ở nhiều trạng thái
  console.log("→ Tạo đơn đặt vật tư...");
  const now = new Date();
  // Ngày trong tháng hiện tại (và không vượt quá hôm nay) để thống kê tháng
  // luôn có dữ liệu ngay khi mở demo.
  const thisMonth = (day: number, hour = 9) =>
    new Date(
      now.getFullYear(),
      now.getMonth(),
      Math.min(day, now.getDate()),
      hour
    );

  type ItemDef = { code: string; qty: number };
  async function makeOrder(opts: {
    projectId: number;
    items: ItemDef[];
    status: "pending" | "approved" | "rejected" | "delivered";
    createdAt: Date;
    rejectedReason?: string;
    withSupplier?: boolean;
  }) {
    const items = opts.items.map((i) => {
      const price = PRICE[i.code];
      return {
        materialId: M[i.code].id,
        qty: i.qty,
        unitPrice: price,
        amount: i.qty * price,
      };
    });
    const total = items.reduce((s, i) => s + i.amount, 0);

    const [o] = await db
      .insert(orders)
      .values({
        code: "TMP",
        projectId: opts.projectId,
        supplierId: opts.withSupplier === false ? null : supplierId,
        createdById: siteId,
        status: opts.status,
        total: total.toFixed(2),
        createdAt: opts.createdAt,
        approvedAt:
          opts.status === "approved" ||
          opts.status === "delivered" ||
          opts.status === "rejected"
            ? opts.createdAt
            : null,
        approvedById:
          opts.status === "approved" ||
          opts.status === "delivered" ||
          opts.status === "rejected"
            ? directorId
            : null,
        rejectedReason: opts.rejectedReason ?? null,
        deliveredAt: opts.status === "delivered" ? opts.createdAt : null,
      })
      .returning();

    const code = `DH${String(o.id).padStart(5, "0")}`;
    await db.update(orders).set({ code }).where(eq(orders.id, o.id));

    await db.insert(orderItems).values(
      items.map((i) => ({
        orderId: o.id,
        materialId: i.materialId,
        qty: i.qty.toFixed(3),
        unitPrice: i.unitPrice.toFixed(2),
        amount: i.amount.toFixed(2),
      }))
    );

    // Phân bổ vào bảng tổng hợp thực tế nếu đã duyệt/giao
    if (opts.status === "approved" || opts.status === "delivered") {
      for (const i of items) {
        await db
          .insert(projectMaterialActual)
          .values({
            projectId: opts.projectId,
            materialId: i.materialId,
            qty: i.qty.toFixed(3),
            amount: i.amount.toFixed(2),
          })
          .onConflictDoUpdate({
            target: [
              projectMaterialActual.projectId,
              projectMaterialActual.materialId,
            ],
            set: {
              qty: sql`${projectMaterialActual.qty} + ${i.qty.toFixed(3)}`,
              amount: sql`${projectMaterialActual.amount} + ${i.amount.toFixed(2)}`,
            },
          });
      }
    }
    // Ghi nhật ký hoạt động cho đơn (để có timeline + trang lịch sử)
    const projName = opts.projectId === ct1.id ? ct1.name : ct2.name;
    const base = opts.createdAt.getTime();
    const at = (offsetMin: number) => new Date(base + offsetMin * 60_000);
    const events: {
      actorId: string;
      actorName: string;
      action: string;
      summary: string;
      createdAt: Date;
    }[] = [
      {
        actorId: siteId,
        actorName: SITE_NAME,
        action: "order.created",
        summary: `${SITE_NAME} đã tạo đơn ${code} cho công trình "${projName}" (${total.toLocaleString("vi-VN")} ₫).`,
        createdAt: at(0),
      },
    ];
    if (opts.status === "approved" || opts.status === "delivered") {
      events.push({
        actorId: directorId,
        actorName: DIRECTOR_NAME,
        action: "order.approved",
        summary: `${DIRECTOR_NAME} đã duyệt đơn ${code}. Số liệu được phân bổ vào bảng tổng hợp thực tế.`,
        createdAt: at(30),
      });
    }
    if (opts.status === "rejected") {
      events.push({
        actorId: directorId,
        actorName: DIRECTOR_NAME,
        action: "order.rejected",
        summary: `${DIRECTOR_NAME} đã từ chối đơn ${code}${
          opts.rejectedReason ? `: ${opts.rejectedReason}` : "."
        }`,
        createdAt: at(30),
      });
    }
    if (opts.status === "delivered") {
      events.push({
        actorId: supplierId,
        actorName: SUPPLIER_NAME,
        action: "order.delivered",
        summary: `${SUPPLIER_NAME} đã giao đơn ${code}.`,
        createdAt: at(120),
      });
    }
    await db.insert(activityLog).values(
      events.map((e) => ({
        actorId: e.actorId,
        actorName: e.actorName,
        action: e.action,
        entityType: "order",
        entityId: o.id,
        summary: e.summary,
        createdAt: e.createdAt,
      }))
    );

    return { id: o.id, code };
  }

  // Đơn 1: đã giao (đóng góp công nợ) — Xi măng 200 bao > dự toán 150 => vượt
  await makeOrder({
    projectId: ct1.id,
    items: [
      { code: "VT004", qty: 200 },
      { code: "VT001", qty: 15 },
    ],
    status: "delivered",
    createdAt: thisMonth(2),
  });

  // Đơn 2: đã duyệt, chờ giao
  await makeOrder({
    projectId: ct1.id,
    items: [{ code: "VT007", qty: 800 }],
    status: "approved",
    createdAt: thisMonth(4),
  });

  // Đơn 3: chờ duyệt
  const pendingOrder = await makeOrder({
    projectId: ct2.id,
    items: [
      { code: "VT003", qty: 30 },
      { code: "VT006", qty: 5000 },
    ],
    status: "pending",
    createdAt: thisMonth(6),
  });

  // Đơn 4: bị từ chối
  await makeOrder({
    projectId: ct1.id,
    items: [{ code: "VT005", qty: 20 }],
    status: "rejected",
    createdAt: thisMonth(3),
    rejectedReason: "Vượt kế hoạch tháng, tạm hoãn.",
  });

  // 6) Một khoản thanh toán cho cửa hàng (công nợ còn lại một phần)
  console.log("→ Ghi nhận thanh toán...");
  await db.insert(payments).values({
    supplierId,
    amount: (10_000_000).toFixed(2),
    note: "Thanh toán đợt 1",
    createdById: directorId,
  });
  await db.insert(activityLog).values({
    actorId: directorId,
    actorName: DIRECTOR_NAME,
    action: "payment.added",
    entityType: "payment",
    summary: `${DIRECTOR_NAME} ghi nhận thanh toán 10.000.000 ₫ cho ${SUPPLIER_NAME}.`,
    createdAt: thisMonth(7),
  });

  // 7) Thông báo cho đơn đang chờ duyệt (director + supplier)
  await db.insert(notifications).values([
    {
      userId: directorId,
      title: `Đơn đặt vật tư mới ${pendingOrder.code}`,
      message: `Có đơn ${pendingOrder.code} đang chờ bạn duyệt.`,
      orderId: pendingOrder.id,
    },
    {
      userId: supplierId,
      title: `Đơn đặt vật tư mới ${pendingOrder.code}`,
      message: `Đội thi công vừa tạo đơn ${pendingOrder.code}.`,
      orderId: pendingOrder.id,
    },
  ]);

  console.log("\n✅ Seed hoàn tất!");
  console.log("Tài khoản demo (mật khẩu: 123456):");
  console.log("  - admin@demo.vn     (Quản trị)");
  console.log("  - director@demo.vn  (Giám đốc)");
  console.log("  - site@demo.vn      (Đội thi công)");
  console.log("  - supplier@demo.vn  (Cửa hàng)");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Seed lỗi:", e);
    process.exit(1);
  });
