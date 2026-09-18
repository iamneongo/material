import { useLocalSearchParams, Stack } from "expo-router";
import { Screen } from "@/components/screen";
import { ProjectForm } from "@/components/project-form";

export default function EditProject() { const { id } = useLocalSearchParams<{ id: string }>(); return <Screen><Stack.Screen options={{ title: "Chỉnh sửa công trình" }} /><ProjectForm id={id} /></Screen>; }
