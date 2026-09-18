import type { Request, Response } from "express";
import { listActivity } from "../services/activity-service.js";
import * as catalog from "../services/catalog-service.js";
import * as orders from "../services/order-service.js";
import * as reports from "../services/report-service.js";
import * as notification from "../services/notification-service.js";

const idParam = (request: Request) => Number(request.params.id);
const me = (request: Request) => request.currentUser!;

export async function session(request: Request, response: Response) { response.json({ user: me(request) }); }
export async function dashboard(_request: Request, response: Response) { response.json(await reports.getDashboard()); }
export async function orderList(request: Request, response: Response) { response.json(await orders.listOrders(me(request))); }
export async function orderDetail(request: Request, response: Response) {
  const value = await orders.getOrder(idParam(request));
  if (!value) { response.status(404).json({ error: "Không tìm thấy đơn." }); return; }
  response.json(value);
}
export async function orderCreate(request: Request, response: Response) { response.status(201).json(await orders.createOrder(me(request), request.body)); }
export async function orderApprove(request: Request, response: Response) { await orders.approveOrder(me(request), idParam(request)); response.json({ ok: true }); }
export async function orderReject(request: Request, response: Response) { await orders.rejectOrder(me(request), idParam(request), String(request.body?.reason ?? "")); response.json({ ok: true }); }
export async function orderDeliver(request: Request, response: Response) { await orders.deliverOrder(me(request), idParam(request)); response.json({ ok: true }); }
export async function approvalList(_request: Request, response: Response) { response.json(await orders.getApprovalOrders()); }
export async function deliveryList(request: Request, response: Response) { response.json(await orders.getDeliveryOrders(me(request))); }
export async function orderOptions(_request: Request, response: Response) { response.json(await catalog.getOrderOptions()); }

export async function projectList(_request: Request, response: Response) { response.json(await catalog.listProjects()); }
export async function projectCreate(request: Request, response: Response) { await catalog.createProject(me(request), request.body); response.status(201).json({ ok: true }); }
export async function projectUpdate(request: Request, response: Response) { await catalog.updateProject(me(request), idParam(request), request.body); response.json({ ok: true }); }
export async function projectDelete(request: Request, response: Response) { await catalog.deleteProject(me(request), idParam(request)); response.json({ ok: true }); }
export async function materialList(_request: Request, response: Response) { response.json(await catalog.listMaterials()); }
export async function materialCreate(request: Request, response: Response) { await catalog.createMaterial(me(request), request.body); response.status(201).json({ ok: true }); }
export async function materialUpdate(request: Request, response: Response) { await catalog.updateMaterial(me(request), idParam(request), request.body); response.json({ ok: true }); }
export async function materialDelete(request: Request, response: Response) { await catalog.deleteMaterial(me(request), idParam(request)); response.json({ ok: true }); }
export async function supplierList(_request: Request, response: Response) { response.json(await catalog.listSuppliers()); }
export async function budgetList(request: Request, response: Response) { response.json(await catalog.listBudgets(Number(request.query.projectId))); }
export async function budgetUpsert(request: Request, response: Response) { await catalog.upsertBudget(me(request), request.body); response.json({ ok: true }); }
export async function budgetDelete(request: Request, response: Response) { await catalog.deleteBudget(me(request), idParam(request)); response.json({ ok: true }); }

export async function reconcile(request: Request, response: Response) { response.json(await reports.getReconcile(request.query.projectId ? Number(request.query.projectId) : undefined)); }
export async function report(request: Request, response: Response) { response.json(await reports.getReport(request.query.month as string | undefined, request.query.projectId ? Number(request.query.projectId) : undefined)); }
export async function reportExport(request: Request, response: Response) {
  const file = await reports.exportReport(request.query.month as string | undefined, request.query.projectId ? Number(request.query.projectId) : undefined);
  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
  response.send(file.csv);
}
export async function paymentCreate(request: Request, response: Response) { await reports.addPayment(me(request), request.body); response.status(201).json({ ok: true }); }
export async function notificationRecent(request: Request, response: Response) { response.json(await notification.recentNotifications(me(request).id)); }
export async function notificationList(request: Request, response: Response) { response.json(await notification.allNotifications(me(request).id)); }
export async function notificationRead(request: Request, response: Response) { await orders.markNotificationsRead(me(request), request.body?.ids); response.json({ ok: true }); }
export async function activityList(_request: Request, response: Response) { response.json(await listActivity()); }
