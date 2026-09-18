import { useLocalSearchParams, Stack } from "expo-router";
import { Screen } from "@/components/screen";
import { AdminForm } from "@/components/admin-form";

export default function EditProject() { const { id } = useLocalSearchParams<{ id: string }>(); return <Screen><Stack.Screen options={{ title: "Chỉnh sửa công trình" }} /><AdminForm id={id} endpoint="/api/projects" backHref="/admin/projects" initial={{ code: "", name: "", address: "", status: "active" }} fields={[{ key: "code", label: "Mã công trình" }, { key: "name", label: "Tên công trình" }, { key: "address", label: "Địa chỉ" }, { key: "status", label: "Trạng thái", options: [{ value: "active", label: "Đang thi công" }, { value: "paused", label: "Tạm dừng" }, { value: "completed", label: "Hoàn thành" }] }]} /></Screen>; }
