import { Stack } from "expo-router";
import { ActionOrderList } from "@/components/action-order-list";
export default function Delivery() { return <><Stack.Screen options={{ title: "Đơn cần giao" }} /><ActionOrderList path="/api/delivery" mode="deliver" /></>; }
