import { Chip } from "@/components/ui";
import { statusLabels } from "@/lib/format";
export function StatusChip({ status }: { status: keyof typeof statusLabels }) { const color = status === "rejected" ? "#fee2e2" : status === "delivered" ? "#dbeafe" : status === "approved" ? "#dcfce7" : "#fef3c7"; return <Chip compact style={({ backgroundColor: color } as any)}>{statusLabels[status]}</Chip>; }
