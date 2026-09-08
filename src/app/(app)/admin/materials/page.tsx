import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { materials } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { MaterialManager } from "./material-manager";

export default async function AdminMaterialsPage() {
  await requireRole(["admin"]);
  const list = await db
    .select()
    .from(materials)
    .orderBy(asc(materials.group), asc(materials.name));

  return (
    <div>
      <PageHeader
        title="Quản lý vật tư"
        description="Danh mục vật tư, đơn vị tính và nhóm."
      />
      <MaterialManager materials={list} />
    </div>
  );
}
