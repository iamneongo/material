import "react-native-gesture-handler";
import { useFonts } from "@expo-google-fonts/google-sans-flex/useFonts";
import { Stack } from "expo-router";
import { TamaguiProvider } from "tamagui";
import { tamaguiConfig } from "../tamagui.config";
import { SnackbarProvider } from "@/components/snackbar";
export default function RootLayout() {
  const [loaded] = useFonts({
    GoogleSansFlex_400Regular: require("@expo-google-fonts/google-sans-flex/400Regular/GoogleSansFlex_400Regular.ttf"),
    GoogleSansFlex_500Medium: require("@expo-google-fonts/google-sans-flex/500Medium/GoogleSansFlex_500Medium.ttf"),
    GoogleSansFlex_600SemiBold: require("@expo-google-fonts/google-sans-flex/600SemiBold/GoogleSansFlex_600SemiBold.ttf"),
    GoogleSansFlex_700Bold: require("@expo-google-fonts/google-sans-flex/700Bold/GoogleSansFlex_700Bold.ttf"),
  });
  if (!loaded) return null;
  return <TamaguiProvider config={tamaguiConfig} defaultTheme="light"><SnackbarProvider><Stack screenOptions={{ headerBackButtonDisplayMode: "minimal", headerTitleStyle: { fontFamily: "GoogleSansFlex_600SemiBold" }, headerTintColor: "#0B57D0", contentStyle: { backgroundColor: "#F7F8FA" } }}><Stack.Screen name="(protected)" options={{ headerShown: false }} /><Stack.Screen name="login" options={{ title: "Đăng nhập", headerShown: false }} /><Stack.Screen name="docs" options={{ title: "Tài liệu hệ thống" }} /></Stack></SnackbarProvider></TamaguiProvider>;
}
