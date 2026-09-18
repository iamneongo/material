import { Stack } from "expo-router";
import { Screen } from "@/components/screen";
import { ProjectForm } from "@/components/project-form";

export default function NewProject() { return <Screen><Stack.Screen options={{ title: "Thêm công trình" }} /><ProjectForm /></Screen>; }
