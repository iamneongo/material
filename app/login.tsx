import { useState } from "react";
import { Image, KeyboardAvoidingView, View } from "react-native";
import { Link, router } from "expo-router";
import { Button, Card, Text, TextInput } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { Screen } from "@/components/screen";
import { useNotice } from "@/components/snackbar";

const demos = [
  { label: "Quản trị", email: "admin@demo.vn" },
  { label: "Bộ phận thi công", email: "site@demo.vn" },
  { label: "Cửa hàng", email: "supplier@demo.vn" },
];

export default function Login() {
  const notice = useNotice();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit() {
    if (loading) return;
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      notice("Nhập email và mật khẩu để tiếp tục.");
      return;
    }
    setLoading(true);
    try {
      const result = await authClient.signIn.email({
        email: normalizedEmail,
        password,
      });
      if (result.error) {
        notice(result.error.message || "Email hoặc mật khẩu không đúng.");
        return;
      }
      // expoClient persists the session cookie asynchronously. Hydrate the
      // client store before navigating so the protected layout never sees a
      // transient signed-out state after a successful first login.
      const sessionResult = await authClient.getSession();
      if (!sessionResult.data?.user) {
        notice("Đăng nhập thành công nhưng chưa tải được phiên làm việc. Hãy thử lại.");
        return;
      }
      authClient.hydrateSession(sessionResult.data);
      notice("Đăng nhập thành công");
      router.replace("/");
    } catch {
      notice("Không thể kết nối máy chủ. Kiểm tra Internet rồi thử lại.");
    } finally {
      setLoading(false);
    }
  }
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}><Screen>
    <View style={{ paddingTop: 40, paddingBottom: 12, gap: 14 }}>
      <Image source={require("../assets/images/app-icon.png")} accessibilityLabel="Biểu tượng Quản lý đặt vật tư" style={{ width: 58, height: 58, borderRadius: 18 }} />
      <Text variant="headlineMedium">Vật tư, đúng lúc.</Text>
      <Text style={{ color: "#5F6368", maxWidth: 310 }}>Theo dõi đơn hàng, giao nhận và ngân sách công trình trong một nơi.</Text>
    </View>
    <Card style={{ gap: 18 }}><View style={{ gap: 4 }}><Text variant="titleLarge">Đăng nhập</Text><Text style={{ color: "#5F6368" }}>Sử dụng tài khoản đã được cấp cho bạn.</Text></View><TextInput label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} /><TextInput label="Mật khẩu" secureTextEntry value={password} onChangeText={setPassword} /><Button mode="contained" loading={loading} disabled={loading} onPress={() => { void submit(); }}>Đăng nhập</Button></Card>
    <Card mode="contained" style={{ backgroundColor: "#EEF4FF", borderColor: "#D2E3FC", gap: 10 }}><Text variant="labelMedium" style={{ color: "#174EA6" }}>Tài khoản demo · mật khẩu: 123456</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{demos.map((item) => <Button key={item.email} compact mode="outlined" onPress={() => { setEmail(item.email); setPassword("123456"); }}>{item.label}</Button>)}</View></Card>
    <Link href="/docs" asChild><Button mode="text">Xem tài liệu hệ thống</Button></Link>
  </Screen></KeyboardAvoidingView>;
}
