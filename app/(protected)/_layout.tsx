import { Redirect, Stack } from "expo-router";
import { ActivityIndicator } from "@/components/ui";
import { View } from "react-native";
import { authClient } from "@/lib/auth-client";
import { HeaderActions } from "@/components/header-actions";
export default function ProtectedLayout() { const session = authClient.useSession(); if (session.isPending) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator /></View>; if (!session.data?.user) return <Redirect href="/login" />; return <Stack screenOptions={{ headerRight: () => <HeaderActions />, headerBackButtonDisplayMode: "minimal" }} />; }
