import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { appTheme } from "@/theme";
import { SnackbarProvider } from "@/components/snackbar";
export default function RootLayout() { return <PaperProvider theme={appTheme}><SnackbarProvider><Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}><Stack.Screen name="(protected)" options={{ headerShown: false }} /><Stack.Screen name="login" options={{ title: "Đăng nhập", headerShown: false }} /><Stack.Screen name="docs" options={{ title: "Tài liệu hệ thống" }} /></Stack></SnackbarProvider></PaperProvider>; }
