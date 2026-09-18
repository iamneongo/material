import { Stack } from "expo-router";
import { Screen } from "@/components/screen";
import { AdminForm } from "@/components/admin-form";

const units = ["m³", "kg", "tấn", "viên", "bao", "cây", "m²", "m"].map((value) => ({ value, label: value }));
const groups = ["Cát", "Đá", "Xi măng", "Bê tông", "Gạch", "Thép", "Khác"].map((value) => ({ value, label: value }));
export default function NewMaterial() { return <Screen><Stack.Screen options={{ title: "Thêm vật tư" }} /><AdminForm endpoint="/api/materials" backHref="/admin/materials" initial={{ code: "", name: "", unit: "m³", group: "Cát" }} fields={[{ key: "code", label: "Mã vật tư" }, { key: "name", label: "Tên vật tư" }, { key: "unit", label: "Đơn vị", options: units }, { key: "group", label: "Nhóm", options: groups }]} /></Screen>; }
