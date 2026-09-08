import {
  pgTable,
  pgEnum,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  numeric,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ---------------------------------------------------------------------------
 * Enums
 * ------------------------------------------------------------------------- */
export const roleEnum = pgEnum("role", ["admin", "director", "site", "supplier"]);
export const projectStatusEnum = pgEnum("project_status", [
  "active",
  "paused",
  "completed",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "approved",
  "rejected",
  "delivered",
]);

/* ---------------------------------------------------------------------------
 * Better Auth core tables (user / session / account / verification)
 * ------------------------------------------------------------------------- */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  // Custom field: phân quyền theo 4 role
  role: roleEnum("role").notNull().default("site"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

/* ---------------------------------------------------------------------------
 * Domain: Công trình (Project)
 * ------------------------------------------------------------------------- */
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  address: text("address"),
  status: projectStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------------------------------------------------------------------------
 * Domain: Vật tư (Material)
 * ------------------------------------------------------------------------- */
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  unit: text("unit").notNull(), // đơn vị tính: m³, kg, viên, bao...
  group: text("group").notNull(), // nhóm: cát, đá, xi măng, bê tông, gạch, thép...
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------------------------------------------------------------------------
 * Domain: Dự toán công trình (Budget / Estimate) — project × material
 * ------------------------------------------------------------------------- */
export const budgets = pgTable(
  "budgets",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    materialId: integer("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    qty: numeric("qty", { precision: 14, scale: 3 }).notNull().default("0"),
    unitPrice: numeric("unit_price", { precision: 18, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("budgets_project_material_uq").on(t.projectId, t.materialId)]
);

/* ---------------------------------------------------------------------------
 * Domain: Đơn đặt vật tư (Order) + dòng đơn (Order Item)
 * ------------------------------------------------------------------------- */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "restrict" }),
  supplierId: text("supplier_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  status: orderStatusEnum("status").notNull().default("pending"),
  note: text("note"),
  total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedById: text("approved_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  rejectedReason: text("rejected_reason"),
  deliveredAt: timestamp("delivered_at"),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  materialId: integer("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "restrict" }),
  qty: numeric("qty", { precision: 14, scale: 3 }).notNull().default("0"),
  unitPrice: numeric("unit_price", { precision: 18, scale: 2 })
    .notNull()
    .default("0"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
});

/* ---------------------------------------------------------------------------
 * Domain: Bảng tổng hợp thực tế theo công trình × vật tư
 * (auto phân bổ khi đơn được duyệt)
 * ------------------------------------------------------------------------- */
export const projectMaterialActual = pgTable(
  "project_material_actual",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    materialId: integer("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    qty: numeric("qty", { precision: 14, scale: 3 }).notNull().default("0"),
    amount: numeric("amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("pma_project_material_uq").on(t.projectId, t.materialId),
  ]
);

/* ---------------------------------------------------------------------------
 * Domain: Thông báo in-app (Notification)
 * ------------------------------------------------------------------------- */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "cascade",
  }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------------------------------------------------------------------------
 * Domain: Thanh toán cho cửa hàng (Payment) — để tính công nợ
 * Công nợ = tổng tiền đã giao − tổng đã thanh toán (theo supplier)
 * ------------------------------------------------------------------------- */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  supplierId: text("supplier_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  note: text("note"),
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------------------------------------------------------------------------
 * Domain: Nhật ký hoạt động (Activity log) — nguồn cho trang lịch sử + timeline
 * ------------------------------------------------------------------------- */
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(), // vd: order.created, payment.added...
  entityType: text("entity_type").notNull(), // order | payment | project | material | budget
  entityId: integer("entity_id"),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------------------------------------------------------------------------
 * Relations
 * ------------------------------------------------------------------------- */
export const projectsRelations = relations(projects, ({ many }) => ({
  budgets: many(budgets),
  orders: many(orders),
  actuals: many(projectMaterialActual),
}));

export const materialsRelations = relations(materials, ({ many }) => ({
  budgets: many(budgets),
  orderItems: many(orderItems),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  project: one(projects, {
    fields: [budgets.projectId],
    references: [projects.id],
  }),
  material: one(materials, {
    fields: [budgets.materialId],
    references: [materials.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  project: one(projects, {
    fields: [orders.projectId],
    references: [projects.id],
  }),
  createdBy: one(user, {
    fields: [orders.createdById],
    references: [user.id],
    relationName: "orderCreatedBy",
  }),
  supplier: one(user, {
    fields: [orders.supplierId],
    references: [user.id],
    relationName: "orderSupplier",
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  material: one(materials, {
    fields: [orderItems.materialId],
    references: [materials.id],
  }),
}));

export const projectMaterialActualRelations = relations(
  projectMaterialActual,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectMaterialActual.projectId],
      references: [projects.id],
    }),
    material: one(materials, {
      fields: [projectMaterialActual.materialId],
      references: [materials.id],
    }),
  })
);

/* ---------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */
export type UserRole = (typeof roleEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];

export type Project = typeof projects.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
