import { View } from "react-native";
import { Text } from "@/components/ui";
import { formatVND } from "@/lib/format";

const colors = ["#0B57D0", "#188038", "#C26401", "#7B1FA2", "#C5221F", "#007B83"];

export function BarChart({ data, money = false }: { data: { name: string; value: number }[]; money?: boolean }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return <View style={{ gap: 14 }}>
    {data.map((item, index) => {
      const width = `${Math.max(3, Math.round(item.value / max * 100))}%` as const;
      return <View key={item.name} style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}><Text variant="labelMedium">{item.name}</Text><Text variant="labelMedium">{money ? formatVND(item.value) : item.value}</Text></View>
        <View style={{ height: 10, borderRadius: 99, backgroundColor: "#E7ECF3", overflow: "hidden" }}><View style={{ width, height: "100%", borderRadius: 99, backgroundColor: colors[index % colors.length] }} /></View>
      </View>;
    })}
  </View>;
}

export function LegendChart({ data }: { data: { name: string; value: number }[] }) {
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));
  return <View style={{ gap: 12 }}>
    {data.map((item, index) => <View key={item.name} style={{ gap: 5 }}><View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors[index % colors.length] }} /><Text style={{ flex: 1 }}>{item.name}</Text><Text variant="labelMedium">{formatVND(item.value)}</Text></View><View style={{ marginLeft: 18, height: 5, borderRadius: 99, backgroundColor: "#E7ECF3", overflow: "hidden" }}><View style={{ width: `${Math.max(2, Math.round(item.value / total * 100))}%`, height: "100%", backgroundColor: colors[index % colors.length] }} /></View></View>)}
  </View>;
}
