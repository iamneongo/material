import type { PropsWithChildren, ReactNode } from "react";
import { Modal, Pressable } from "react-native";
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  Download,
  History,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Package,
  Plus,
  PlusSquare,
  Scale,
  Truck,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react-native";
import {
  Button as TamaguiButton,
  Input,
  Separator,
  Spinner,
  Text as TamaguiText,
  XStack,
  YStack,
} from "tamagui";

const iconMap: Record<string, LucideIcon> = {
  "bell-outline": Bell,
  calendar: CalendarDays,
  menu: MenuIcon,
  "view-dashboard-outline": LayoutDashboard,
  "clipboard-list-outline": ClipboardList,
  "plus-box-outline": PlusSquare,
  "office-building": Building2,
  "package-variant": Package,
  "wallet-outline": WalletCards,
  "scale-balance": Scale,
  "chart-bar": BarChart3,
  history: History,
  "check-decagram-outline": BadgeCheck,
  "truck-outline": Truck,
  logout: LogOut,
  download: Download,
  plus: Plus,
};

const BaseButton: any = TamaguiButton;
const BaseInput: any = Input;
const BaseText: any = TamaguiText;
const VStack: any = YStack;
const HStack: any = XStack;

export function AppIcon({ name, size = 19, color = "#3C4043" }: { name?: string; size?: number; color?: string }) {
  const Icon = (name && iconMap[name]) || X;
  return <Icon size={size} color={color} strokeWidth={2.1} />;
}

type ButtonProps = PropsWithChildren<{
  mode?: "contained" | "outlined" | "text";
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  textColor?: string;
  buttonColor?: string;
  onPress?: () => void;
  contentStyle?: object;
  style?: object;
}>;

export function Button({ children, mode = "text", icon, loading, disabled, compact, textColor, buttonColor, onPress, style }: ButtonProps) {
  const contained = mode === "contained";
  const outlined = mode === "outlined";
  const color = textColor ?? (contained ? "#FFFFFF" : "#0B57D0");
  return <BaseButton unstyled={false} disabled={disabled || loading} onPress={onPress} icon={loading ? <Spinner color={color} size="small" /> : icon ? <AppIcon name={icon} color={color} size={compact ? 16 : 18} /> : undefined} backgroundColor={buttonColor ?? (contained ? "#0B57D0" : "transparent")} borderWidth={outlined ? 1 : 0} borderColor={outlined ? "#9AB9F5" : "transparent"} color={color} fontFamily="GoogleSansFlex_500Medium" fontSize={compact ? 13 : 15} height={compact ? 36 : 44} paddingHorizontal={compact ? 12 : 18} borderRadius={22} pressStyle={{ opacity: 0.82, scale: 0.98 }} style={style as any}>{children}</BaseButton>;
}

type TextProps = PropsWithChildren<{ variant?: string; selectable?: boolean; style?: object }>;
export function Text({ children, variant, style, selectable = true }: TextProps) {
  const variants: Record<string, { fontSize: number; lineHeight: number; fontFamily: string }> = {
    headlineSmall: { fontSize: 27, lineHeight: 34, fontFamily: "GoogleSansFlex_600SemiBold" },
    headlineMedium: { fontSize: 31, lineHeight: 38, fontFamily: "GoogleSansFlex_600SemiBold" },
    titleLarge: { fontSize: 22, lineHeight: 29, fontFamily: "GoogleSansFlex_600SemiBold" },
    titleMedium: { fontSize: 17, lineHeight: 23, fontFamily: "GoogleSansFlex_600SemiBold" },
    titleSmall: { fontSize: 15, lineHeight: 21, fontFamily: "GoogleSansFlex_600SemiBold" },
    labelSmall: { fontSize: 12, lineHeight: 16, fontFamily: "GoogleSansFlex_500Medium" },
    labelMedium: { fontSize: 13, lineHeight: 18, fontFamily: "GoogleSansFlex_500Medium" },
  };
  const props = variants[variant ?? ""] ?? { fontSize: 15, lineHeight: 22, fontFamily: "GoogleSansFlex_400Regular" };
  return <BaseText selectable={selectable} color="#2B2F36" {...props} style={style as any}>{children}</BaseText>;
}

type CardProps = PropsWithChildren<{ mode?: string; onPress?: () => void; style?: object }>;
function CardRoot({ children, onPress, style }: CardProps) {
  const body = <VStack gap="$2" padding="$4" borderRadius={16} backgroundColor="#FFFFFF" borderWidth={1} borderColor="#E2E6EC" style={style as any}>{children}</VStack>;
  return onPress ? <BaseButton unstyled onPress={onPress} pressStyle={{ opacity: 0.9, scale: 0.995 }}>{body}</BaseButton> : body;
}
function CardTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: () => ReactNode }) { return <HStack alignItems="flex-start" justifyContent="space-between" gap="$2"><VStack flex={1} gap="$1"><Text variant="titleMedium">{title}</Text>{subtitle ? <Text variant="labelMedium" style={{ color: "#5F6368" }}>{subtitle}</Text> : null}</VStack>{right?.()}</HStack>; }
function CardContent({ children, style }: PropsWithChildren<{ style?: object }>) { return <VStack gap="$2" style={style as any}>{children}</VStack>; }
export const Card = Object.assign(CardRoot, { Title: CardTitle, Content: CardContent });

type InputProps = Record<string, any> & { label?: string; onChangeText?: (value: string) => void; style?: object };
export function Searchbar({ placeholder, value, onChangeText }: { placeholder?: string; value?: string; onChangeText?: (value: string) => void }) { return <BaseInput placeholder={placeholder} value={value} onChangeText={onChangeText} minHeight={48} paddingHorizontal="$3" borderRadius={12} borderWidth={1} borderColor="#C9D1DC" background="#FFFFFF" color="#202124" fontFamily="GoogleSansFlex_400Regular" />; }
export function TextInput({ label, onChangeText, style, multiline, ...props }: InputProps) { return <VStack gap="$1"><Text variant="labelMedium" style={{ color: "#3C4043" }}>{label}</Text><BaseInput {...props} multiline={multiline} onChangeText={onChangeText} minHeight={multiline ? 104 : 48} paddingHorizontal="$3" paddingVertical="$2" borderRadius={12} borderWidth={1} borderColor="#C9D1DC" background="#FFFFFF" color="#202124" fontFamily="GoogleSansFlex_400Regular" fontSize={16} focusStyle={{ borderColor: "#0B57D0", borderWidth: 2 }} style={style as any} /></VStack>; }

export function Divider() { return <Separator borderColor="#E4E8EE" />; }
export function ActivityIndicator() { return <Spinner color="#0B57D0" size="large" />; }
export function Badge({ children, style }: PropsWithChildren<{ style?: object }>) { return <VStack backgroundColor="#D93025" borderRadius={10} minWidth={20} alignItems="center" paddingHorizontal="$1" style={style as any}><Text variant="labelSmall" selectable={false} style={{ color: "#FFFFFF" }}>{children}</Text></VStack>; }
export function IconButton({ icon, onPress }: { icon: string; onPress?: () => void }) { return <BaseButton unstyled onPress={onPress} width={42} height={42} alignItems="center" justifyContent="center" borderRadius={21} pressStyle={{ backgroundColor: "#E8F0FE" }}><AppIcon name={icon} /></BaseButton>; }

function ListItem({ title, left, onPress }: { title: string; left?: () => ReactNode; onPress?: () => void }) { return <BaseButton unstyled onPress={onPress} minHeight={54} paddingHorizontal="$2" borderRadius={12} pressStyle={{ backgroundColor: "#E8F0FE" }}><HStack alignItems="center" gap="$3">{left?.()}<Text variant="titleSmall">{title}</Text></HStack></BaseButton>; }
function ListIcon({ icon }: { icon: string }) { return <AppIcon name={icon} />; }
export const List = { Item: ListItem, Icon: ListIcon };

export function Chip({ children, style, compact }: PropsWithChildren<{ style?: object; compact?: boolean }>) { return <VStack alignSelf="flex-start" backgroundColor="#E8F0FE" paddingHorizontal={compact ? "$2" : "$3"} paddingVertical="$1" borderRadius={99} style={style as any}><Text variant="labelMedium">{children}</Text></VStack>; }

export function Portal({ children }: PropsWithChildren) { return <>{children}</>; }
export function Snackbar({ visible, onDismiss, children }: PropsWithChildren<{ visible: boolean; onDismiss: () => void; duration?: number }>) {
  if (!visible) return null;
  return <VStack position="absolute" bottom={28} left={20} right={20} zIndex={100}><BaseButton unstyled onPress={onDismiss} backgroundColor="#2B2F36" padding="$3" borderRadius={14}><Text selectable={false} style={{ color: "#FFFFFF" }}>{children}</Text></BaseButton></VStack>;
}
function DialogRoot({ visible, onDismiss, children }: PropsWithChildren<{ visible: boolean; onDismiss?: () => void }>) { return <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}><Pressable onPress={onDismiss} style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(32,33,36,0.38)" }}><Pressable onPress={(event) => event.stopPropagation()}><VStack gap="$3" padding="$4" borderRadius={20} backgroundColor="#FFFFFF">{children}</VStack></Pressable></Pressable></Modal>; }
function DialogTitle({ children }: PropsWithChildren) { return <Text variant="titleLarge">{children}</Text>; }
function DialogContent({ children, style }: PropsWithChildren<{ style?: object }>) { return <VStack gap="$2" style={style as any}>{children}</VStack>; }
function DialogActions({ children }: PropsWithChildren) { return <HStack justifyContent="flex-end" gap="$2" flexWrap="wrap">{children}</HStack>; }
function DialogScrollArea({ children }: PropsWithChildren) { return <VStack>{children}</VStack>; }
export const Dialog = Object.assign(DialogRoot, { Title: DialogTitle, Content: DialogContent, Actions: DialogActions, ScrollArea: DialogScrollArea });

function MenuRoot({ visible, onDismiss, anchor, children }: PropsWithChildren<{ visible: boolean; onDismiss: () => void; anchor: ReactNode }>) { return <>{anchor}<Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}><Pressable onPress={onDismiss} style={{ flex: 1, backgroundColor: "rgba(32,33,36,0.18)", justifyContent: "center", padding: 24 }}><Pressable onPress={(event) => event.stopPropagation()}><VStack maxHeight="70%" overflow="hidden" backgroundColor="#FFFFFF" borderRadius={16} padding="$2">{children}</VStack></Pressable></Pressable></Modal></>; }
function MenuItem({ title, onPress }: { title: string; onPress: () => void }) { return <BaseButton unstyled onPress={onPress} minHeight={48} paddingHorizontal="$3" borderRadius={10} pressStyle={{ backgroundColor: "#E8F0FE" }}><Text>{title}</Text></BaseButton>; }
export const Menu = Object.assign(MenuRoot, { Item: MenuItem });
