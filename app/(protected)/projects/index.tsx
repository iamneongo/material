import { router, Stack } from "expo-router";
import { Card, Text } from "@/components/ui";
import { Screen, StateView } from "@/components/screen";
import { useApi } from "@/hooks/use-api";

type Project = { id: number; code: string; name: string; address?: string; status: string };
export default function ProjectsSummaryList() { const query = useApi<Project[]>("/api/projects"); return <Screen><Stack.Screen options={{ title: "Tổng hợp công trình" }} /><StateView loading={query.loading} error={query.error} retry={query.refresh}>{query.data?.map((project) => <Card key={project.id} onPress={() => router.push(`/projects/${project.id}` as never)}><Card.Title title={project.name} subtitle={`${project.code} · ${project.address ?? ""}`} /><Text>{project.status}</Text></Card>)}</StateView></Screen>; }
