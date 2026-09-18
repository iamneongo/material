import { Stack, useLocalSearchParams } from "expo-router";
import { Card, Text } from "@/components/ui";
import { Screen, StateView } from "@/components/screen";
import { useApi } from "@/hooks/use-api";
import { formatNumber, formatVND, statusLabels } from "@/lib/format";

type Data = {
  project: { code: string; name: string; address?: string };
  totalBudget: number; totalActual: number; totalDiff: number;
  statusRows: { status: keyof typeof statusLabels; value: number }[];
  suppliers: { id: number; name: string; phone: string }[];
  defaultSupplier?: { id: number; name: string; phone: string } | null;
  neededMaterials: { materialId: number; name: string; unit: string; remainingQty: number }[];
  recentOrders: { id: number; code: string; status: keyof typeof statusLabels; total: number }[];
};
export default function ProjectSummary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useApi<Data>(`/api/projects/${id}/summary`);
  const data = query.data;
  return <Screen><Stack.Screen options={{ title: "Tổng hợp công trình" }} />
    <StateView loading={query.loading} error={query.error} retry={query.refresh}>{data && <>
      <Card><Card.Title title={data.project.name} subtitle={`${data.project.code}${data.project.address ? ` · ${data.project.address}` : ""}`} />
        <Card.Content><Text>Dự toán: {formatVND(data.totalBudget)}</Text><Text>Thực tế: {formatVND(data.totalActual)}</Text><Text>Chênh lệch: {formatVND(data.totalDiff)}</Text></Card.Content>
      </Card>
      <Card><Card.Title title="Tình hình đơn" /><Card.Content>{data.statusRows.length ? data.statusRows.map((row) => <Text key={row.status}>{statusLabels[row.status]}: {row.value}</Text>) : <Text>Chưa có đơn đặt.</Text>}</Card.Content></Card>
      <Card><Card.Title title="Đơn gần đây" /><Card.Content>{data.recentOrders.length ? data.recentOrders.map((order) => <Text key={order.id}>{order.code} · {statusLabels[order.status]} · {formatVND(order.total)}</Text>) : <Text>Chưa có đơn đặt.</Text>}</Card.Content></Card>
      <Card><Card.Title title="Vật tư cần đặt" /><Card.Content>{data.neededMaterials.length ? data.neededMaterials.map((row) => <Text key={row.materialId}>{row.name} · còn {formatNumber(row.remainingQty)} {row.unit}</Text>) : <Text>Không còn vật tư cần đặt.</Text>}</Card.Content></Card>
      <Card><Card.Title title="Đơn vị cung cấp" /><Card.Content>{data.suppliers.length ? data.suppliers.map((item) => <Text key={item.id}>{item.name} · {item.phone}{item.id === data.defaultSupplier?.id ? " · Mặc định" : ""}</Text>) : <Text>Chưa liên kết đơn vị cung cấp.</Text>}</Card.Content></Card>
    </>}</StateView>
  </Screen>;
}
