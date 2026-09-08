import type { OrderStatus, ProjectStatus, UserRole } from "@/lib/db/schema";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Quản trị",
  director: "Giám đốc",
  site: "Đội thi công",
  supplier: "Cửa hàng vật liệu",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  delivered: "Đã giao",
};

export const ORDER_STATUS_VARIANTS: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  delivered: "outline",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Đang thi công",
  paused: "Tạm dừng",
  completed: "Hoàn thành",
};

/** Các nhóm vật tư gợi ý */
export const MATERIAL_GROUPS = [
  "Cát",
  "Đá",
  "Xi măng",
  "Bê tông",
  "Gạch",
  "Thép",
  "Khác",
] as const;

/** Đơn vị tính gợi ý */
export const MATERIAL_UNITS = ["m³", "kg", "tấn", "viên", "bao", "cây", "m²", "m"] as const;

/* --------------------------- Nhật ký hoạt động --------------------------- */
export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  "order.created": "Tạo đơn",
  "order.approved": "Duyệt đơn",
  "order.rejected": "Từ chối đơn",
  "order.delivered": "Giao đơn",
  "payment.added": "Ghi nhận thanh toán",
  "project.created": "Thêm công trình",
  "project.updated": "Sửa công trình",
  "project.deleted": "Xóa công trình",
  "material.created": "Thêm vật tư",
  "material.updated": "Sửa vật tư",
  "material.deleted": "Xóa vật tư",
  "budget.upserted": "Cập nhật dự toán",
  "budget.deleted": "Xóa dự toán",
};

export const ACTIVITY_ENTITY_LABELS: Record<string, string> = {
  order: "Đơn hàng",
  payment: "Thanh toán",
  project: "Công trình",
  material: "Vật tư",
  budget: "Dự toán",
};

export const ACTIVITY_ENTITY_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  order: "default",
  payment: "secondary",
  project: "outline",
  material: "outline",
  budget: "outline",
};
