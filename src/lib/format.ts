export const dateTime = (value?: string | null) =>
  value && !Number.isNaN(Date.parse(value))
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(new Date(value))
    : "-";
export const number = (value?: number | null) =>
  value == null
    ? "-"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(
        value,
      );
export const money = (value?: number | string | null, currency = "INR") =>
  value == null
    ? "-"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(
        Number(value),
      );
export const label = (value?: string | null) =>
  value
    ? value
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replace(/\b\w/g, (character) => character.toUpperCase())
    : "-";
export function dateQuery(value: string, end = false) {
  return value
    ? new Date(
        `${value}T${end ? "23:59:59.999" : "00:00:00"}+05:30`,
      ).toISOString()
    : undefined;
}
