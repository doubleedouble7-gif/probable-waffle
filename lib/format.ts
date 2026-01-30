import { format } from "date-fns";

export function formatDate(value: Date | string | null) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, "dd/MM/yyyy");
}

export function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2
  }).format(amount);
}

export function parseNumber(value: string | null) {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").trim();
  if (normalized === "") return null;
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}
