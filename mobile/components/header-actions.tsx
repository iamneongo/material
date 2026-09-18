import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { router } from "expo-router";
import { Badge, IconButton } from "react-native-paper";
import { api } from "@/lib/api";
export function HeaderActions() { const [unread, setUnread] = useState(0); async function refresh() { try { const value = await api<{ unreadCount: number }>("/api/notifications/recent"); setUnread(value.unreadCount); } catch {} } useEffect(() => { void refresh(); const interval = setInterval(refresh, 30000); const subscription = AppState.addEventListener("change", (state) => state === "active" && void refresh()); return () => { clearInterval(interval); subscription.remove(); }; }, []); return <View style={{ flexDirection: "row" }}><View><IconButton icon="bell-outline" onPress={() => router.push("/notifications")} />{unread > 0 && <Badge style={({ position: "absolute", right: 2, top: 2 } as any)}>{unread > 9 ? "9+" : unread}</Badge>}</View><IconButton icon="menu" onPress={() => router.push("/menu")} /></View>; }
