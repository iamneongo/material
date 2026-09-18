import { useState } from "react";
import { router } from "expo-router";
import { Button, Card, Dialog, Portal, Text } from "@/components/ui";
import { api } from "@/lib/api";
import { useNotice } from "./snackbar";

type Field = { key: string; label: string };

export function AdminResource({ title, endpoint, fields, rows, refresh, createHref, editHref }: { title: string; endpoint: string; fields: Field[]; rows: Record<string, unknown>[]; refresh: () => void; createHref: string; editHref: (id: string | number) => string }) {
  const notice = useNotice();
  const [target, setTarget] = useState<Record<string, unknown> | null>(null);
  async function remove() {
    if (!target) return;
    try { await api(`${endpoint}/${target.id}`, { method: "DELETE" }); setTarget(null); notice("Đã xóa."); refresh(); }
    catch (error) { notice(error instanceof Error ? error.message : "Không thể xóa."); }
  }
  return <><Button mode="contained" icon="plus" onPress={() => router.push(createHref as never)}>Thêm {title.toLowerCase()}</Button>{rows.map((row) => <Card key={String(row.id)}><Card.Title title={String(row.name)} subtitle={String(row.code)} /><Card.Content><Text>{fields.slice(2).map((field) => `${field.label}: ${row[field.key] ?? "—"}`).join(" · ")}</Text><Button mode="outlined" onPress={() => router.push(editHref(row.id as string | number) as never)}>Chỉnh sửa</Button><Button textColor="#B3261E" onPress={() => setTarget(row)}>Xóa</Button></Card.Content></Card>)}<Portal><Dialog visible={!!target} onDismiss={() => setTarget(null)}><Dialog.Title>Xóa {title.toLowerCase()}?</Dialog.Title><Dialog.Content><Text>Hành động này không thể hoàn tác.</Text></Dialog.Content><Dialog.Actions><Button onPress={() => setTarget(null)}>Hủy</Button><Button textColor="#B3261E" onPress={remove}>Xóa</Button></Dialog.Actions></Dialog></Portal></>;
}
