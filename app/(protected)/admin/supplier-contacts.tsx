import { useState } from "react";
import { Stack } from "expo-router";
import { Button, Card, Text, TextInput } from "@/components/ui";
import { Screen, StateView } from "@/components/screen";
import { useApi } from "@/hooks/use-api";
import { api, jsonBody } from "@/lib/api";
import { useNotice } from "@/components/snackbar";

type Contact = { id: number; name: string; phone: string };
export default function SupplierContacts() {
  const query = useApi<Contact[]>("/api/supplier-contacts");
  const notice = useNotice();
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null); const [saving, setSaving] = useState(false);
  function reset() { setName(""); setPhone(""); setEditingId(null); }
  function edit(contact: Contact) { setEditingId(contact.id); setName(contact.name); setPhone(contact.phone); }
  async function save() {
    setSaving(true);
    try {
      await api(editingId ? `/api/supplier-contacts/${editingId}` : "/api/supplier-contacts", {
        method: editingId ? "PATCH" : "POST", ...jsonBody({ name, phone }),
      });
      reset(); notice(editingId ? "Đã cập nhật đơn vị cung cấp." : "Đã thêm đơn vị cung cấp."); query.refresh();
    } catch (error) { notice(error instanceof Error ? error.message : "Không thể lưu."); }
    finally { setSaving(false); }
  }
  async function remove(id: number) {
    try { await api(`/api/supplier-contacts/${id}`, { method: "DELETE" }); if (editingId === id) reset(); query.refresh(); }
    catch (error) { notice(error instanceof Error ? error.message : "Không thể xóa."); }
  }
  return <Screen><Stack.Screen options={{ title: "Đơn vị cung cấp" }} />
    <Card><Card.Content style={{ gap: 10 }}><Text variant="titleMedium">{editingId ? "Sửa liên hệ Zalo" : "Thêm liên hệ Zalo"}</Text>
      <TextInput label="Tên đơn vị" value={name} onChangeText={setName} />
      <TextInput label="Số Zalo" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <Button mode="contained" loading={saving} disabled={saving || !name.trim() || !phone.trim()} onPress={save}>{editingId ? "Lưu thay đổi" : "Thêm đơn vị"}</Button>
      {editingId && <Button mode="outlined" onPress={reset}>Hủy sửa</Button>}
    </Card.Content></Card>
    <StateView loading={query.loading} error={query.error} retry={query.refresh}>{query.data?.map((contact) => <Card key={contact.id}>
      <Card.Title title={contact.name} subtitle={contact.phone} /><Card.Content style={{ gap: 8 }}>
        <Button mode="outlined" onPress={() => edit(contact)}>Sửa</Button><Button textColor="#B3261E" onPress={() => remove(contact.id)}>Xóa</Button>
      </Card.Content>
    </Card>)}</StateView>
  </Screen>;
}
