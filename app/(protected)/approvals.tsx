import { Stack } from "expo-router";
import { ActionOrderList } from "@/components/action-order-list";
export default function Approvals() { return <><Stack.Screen options={{ title: "Duyệt đơn đặt vật tư" }} /><ActionOrderList path="/api/approvals" mode="approve" /></>; }
