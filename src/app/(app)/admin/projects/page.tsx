import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { ProjectManager } from "./project-manager";

export default async function AdminProjectsPage() {
  await requireRole(["admin"]);
  const list = await db.select().from(projects).orderBy(asc(projects.name));

  return (
    <div>
      <PageHeader
        title="Quản lý công trình"
        description="Thêm, sửa, xóa công trình."
      />
      <ProjectManager projects={list} />
    </div>
  );
}
