import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next
) => {
  console.error(error);
  const message = error instanceof Error ? error.message : "Lỗi máy chủ.";
  const isConstraint = typeof error === "object" && error !== null && "code" in error;
  const status = isConstraint || message !== "Lỗi máy chủ." ? 400 : 500;
  response.status(status).json({ error: isConstraint ? "Không thể lưu dữ liệu do trùng hoặc đang được sử dụng." : message });
};
