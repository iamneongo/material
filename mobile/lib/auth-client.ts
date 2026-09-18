import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
export const authClient = createAuthClient({ baseURL: process.env.EXPO_PUBLIC_API_URL, plugins: [expoClient({ scheme: "materialapp", storagePrefix: "materialapp", storage: SecureStore })] });
export type AppUser = { id: string; name: string; email: string; role: "admin" | "director" | "site" | "supplier" };
