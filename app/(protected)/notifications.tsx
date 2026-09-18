import { router, Stack } from "expo-router";
import { Button, Card, Text } from "react-native-paper";
import { Screen, StateView, Empty } from "@/components/screen";
import { useApi } from "@/hooks/use-api";
import { api, jsonBody } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
type Item = { id: number; title: string; message: string; orderId?: number; isRead: boolean; createdAt: string };
export default function Notifications() { const query = useApi<Item[]>("/api/notifications"); async function read(item?: Item) { await api("/api/notifications/read", { method: "PATCH", ...jsonBody(item ? { ids: [item.id] } : {}) }); if (item?.orderId) router.push(`/orders/${item.orderId}`); else query.refresh(); } return <Screen><Stack.Screen options={{ title: "Thông báo" }} /><Button mode="outlined" disabled={!query.data?.some((item) => !item.isRead)} onPress={() => read()}>Đánh dấu tất cả đã đọc</Button><StateView loading={query.loading} error={query.error} retry={query.refresh}>{!query.data?.length ? <Empty>Chưa có thông báo nào.</Empty> : query.data.map((item) => <Card key={item.id} onPress={() => read(item)} style={(!item.isRead ? { backgroundColor: "#eff6ff" } : undefined) as any}><Card.Title title={item.title} /><Card.Content><Text selectable>{item.message}</Text><Text selectable variant="labelSmall">{formatDateTime(item.createdAt)}</Text></Card.Content></Card>)}</StateView></Screen>; }
