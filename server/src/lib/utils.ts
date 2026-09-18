export function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function monthRange(month?: string) {
  const now = new Date();
  const valid = month && /^\d{4}-\d{2}$/.test(month);
  const [year, monthNumber] = valid ? month!.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1];
  const start = new Date(year, monthNumber - 1, 1);
  const end = new Date(year, monthNumber, 1);
  return { start, end, label: `${String(monthNumber).padStart(2, "0")}/${year}`, value: `${year}-${String(monthNumber).padStart(2, "0")}` };
}
