import { Stack } from "expo-router";
import { Screen, StateView } from "@/components/screen";
import { AdminResource } from "@/components/admin-resource";
import { useApi } from "@/hooks/use-api";
export default function Projects() { const query = useApi<Record<string, unknown>[]>("/api/projects"); return <Screen><Stack.Screen options={{ title: "Quản lý công trình" }} /><StateView loading={query.loading} error={query.error} retry={query.refresh}>{query.data && <AdminResource title="Công trình" endpoint="/api/projects" rows={query.data} refresh={query.refresh} initial={{ code: "", name: "", address: "", status: "active" }} fields={[{ key: "code", label: "Mã" }, { key: "name", label: "Tên công trình" }, { key: "address", label: "Địa chỉ" }, { key: "status", label: "Trạng thái", options: [{ value: "active", label: "Đang thi công" }, { value: "paused", label: "Tạm dừng" }, { value: "completed", label: "Hoàn thành" }] }]} />}</StateView></Screen>; }
