import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Button, Card, TextInput } from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import { SelectMenu } from "./select-menu";
import { useNotice } from "./snackbar";

export type AdminField = { key: string; label: string; options?: { value: string; label: string }[] };

export function AdminForm({ endpoint, fields, initial, id, backHref }: { endpoint: string; fields: AdminField[]; initial: Record<string, string>; id?: string; backHref: string }) {
  const notice = useNotice();
  const [draft, setDraft] = useState(initial);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!id) return; void (async () => { try { const rows = await api<Record<string, unknown>[]>(endpoint); const row = rows.find((item) => String(item.id) === id); if (row) setDraft(Object.fromEntries(fields.map((field) => [field.key, String(row[field.key] ?? "")] ))); } catch (error) { notice(error instanceof Error ? error.message : "Không thể tải dữ liệu."); } finally { setLoading(false); } })(); }, [endpoint, fields, id, notice]);
  async function save() { setSaving(true); try { await api(id ? `${endpoint}/${id}` : endpoint, { method: id ? "PATCH" : "POST", ...jsonBody(draft) }); notice(id ? "Đã cập nhật." : "Đã thêm mới."); router.replace(backHref as never); } catch (error) { notice(error instanceof Error ? error.message : "Không thể lưu."); } finally { setSaving(false); } }
  return <Card><Card.Content style={{ gap: 14 }}>{fields.map((field) => field.options ? <SelectMenu key={field.key} label={field.label} value={draft[field.key]} onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))} options={field.options} /> : <TextInput key={field.key} label={field.label} value={draft[field.key] ?? ""} onChangeText={(value) => setDraft((current) => ({ ...current, [field.key]: value }))} />)}<Button mode="contained" loading={saving || loading} disabled={saving || loading} onPress={save}>{id ? "Lưu thay đổi" : "Tạo mới"}</Button><Button mode="text" onPress={() => router.back()}>Hủy</Button></Card.Content></Card>;
}
