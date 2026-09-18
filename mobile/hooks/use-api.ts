import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "@/lib/api";
export function useApi<T>(path?: string) {
  const [data, setData] = useState<T>(); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { if (!path) { setLoading(false); return; } setLoading(true); setError(""); try { setData(await api<T>(path)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải dữ liệu."); } finally { setLoading(false); } }, [path]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  return { data, error, loading, refresh };
}
