import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { apiBaseUrl } from "./runtime-config";
const baseAuthClient = createAuthClient({ baseURL: apiBaseUrl, plugins: [expoClient({ scheme: "materialapp", storagePrefix: "materialapp", storage: SecureStore })] });
export type AppUser = { id: string; name: string; email: string; role: "admin" | "site" | "supplier" };

/** Keeps existing sessions compatible while the server migrates director users to admin. */
function useCurrentSession() {
  const session = baseAuthClient.useSession();
  const refetch = session.refetch;
  useEffect(() => {
    void refetch();
  }, [refetch]);
  const data = session.data;
  if (!data || (data.user as { role?: string } | undefined)?.role !== "director") return session;
  return {
    ...session,
    data: {
      ...data,
      user: { ...data.user, role: "admin" },
    },
  };
}

export const authClient = {
  ...baseAuthClient,
  useSession: useCurrentSession,
};
