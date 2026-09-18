import type { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, Button, Text } from "@/components/ui";
export function Screen({ children }: PropsWithChildren) { return <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 16 }}>{children}</ScrollView>; }
export function StateView({ loading, error, retry, children }: PropsWithChildren<{ loading: boolean; error?: string; retry?: () => void }>) { if (loading) return <View style={{ padding: 48 }}><ActivityIndicator /></View>; if (error) return <View style={{ padding: 24, gap: 12 }}><Text selectable>{error}</Text>{retry && <Button mode="contained" onPress={retry}>Thử lại</Button>}</View>; return <>{children}</>; }
export function Empty({ children }: PropsWithChildren) { return <Text selectable style={({ textAlign: "center", padding: 32, opacity: 0.65 } as any)}>{children}</Text>; }
