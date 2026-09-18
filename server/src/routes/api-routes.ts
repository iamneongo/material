import { Router } from "express";
import * as api from "../controllers/api-controller.js";
import { requireRoles, requireUser } from "../middleware/auth.js";

export const apiRouter = Router();
apiRouter.use(requireUser);

apiRouter.get("/session", api.session);
apiRouter.get("/dashboard", api.dashboard);
apiRouter.get("/orders", api.orderList);
apiRouter.post("/orders", api.orderCreate);
apiRouter.get("/orders/:id", api.orderDetail);
apiRouter.post("/orders/:id/approve", requireRoles("admin"), api.orderApprove);
apiRouter.post("/orders/:id/reject", requireRoles("admin"), api.orderReject);
apiRouter.post("/orders/:id/deliver", requireRoles("supplier", "admin"), api.orderDeliver);
apiRouter.get("/approvals", requireRoles("admin"), api.approvalList);
apiRouter.get("/delivery", requireRoles("supplier", "admin"), api.deliveryList);
apiRouter.get("/order-form-options", requireRoles("site", "admin"), api.orderOptions);

apiRouter.get("/projects", api.projectList);
apiRouter.post("/projects", requireRoles("admin"), api.projectCreate);
apiRouter.patch("/projects/:id", requireRoles("admin"), api.projectUpdate);
apiRouter.delete("/projects/:id", requireRoles("admin"), api.projectDelete);
apiRouter.get("/projects/:id/summary", requireRoles("admin", "site"), api.projectSummary);
apiRouter.get("/materials", api.materialList);
apiRouter.post("/materials", requireRoles("admin"), api.materialCreate);
apiRouter.patch("/materials/:id", requireRoles("admin"), api.materialUpdate);
apiRouter.delete("/materials/:id", requireRoles("admin"), api.materialDelete);
apiRouter.get("/suppliers", api.supplierList);
apiRouter.get("/supplier-contacts", requireRoles("admin"), api.supplierContactList);
apiRouter.post("/supplier-contacts", requireRoles("admin"), api.supplierContactCreate);
apiRouter.patch("/supplier-contacts/:id", requireRoles("admin"), api.supplierContactUpdate);
apiRouter.delete("/supplier-contacts/:id", requireRoles("admin"), api.supplierContactDelete);
apiRouter.get("/budgets", requireRoles("admin"), api.budgetList);
apiRouter.put("/budgets", requireRoles("admin"), api.budgetUpsert);
apiRouter.delete("/budgets/:id", requireRoles("admin"), api.budgetDelete);

apiRouter.get("/reconcile", api.reconcile);
apiRouter.get("/reports", api.report);
apiRouter.get("/reports/export", api.reportExport);
apiRouter.post("/payments", requireRoles("admin"), api.paymentCreate);
apiRouter.get("/notifications/recent", api.notificationRecent);
apiRouter.get("/notifications", api.notificationList);
apiRouter.patch("/notifications/read", api.notificationRead);
apiRouter.get("/activity", requireRoles("admin"), api.activityList);
