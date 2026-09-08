import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import {
  getActiveProjects,
  getMaterials,
  getSuppliers,
  getSuggestedPrices,
} from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { OrderForm } from "./order-form";

export default async function NewOrderPage() {
  const user = await requireUser();
  if (user.role !== "site" && user.role !== "admin") {
    redirect("/");
  }

  const [projects, materials, suppliers, prices] = await Promise.all([
    getActiveProjects(),
    getMaterials(),
    getSuppliers(),
    getSuggestedPrices(),
  ]);

  return (
    <div>
      <PageHeader
        title="Đặt vật tư"
        description="Chọn công trình và thêm các dòng vật tư cần đặt."
      />
      <OrderForm
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          status: p.status,
        }))}
        materials={materials.map((m) => ({
          id: m.id,
          name: m.name,
          unit: m.unit,
          group: m.group,
        }))}
        suppliers={suppliers}
        suggestedPrices={prices}
      />
    </div>
  );
}
