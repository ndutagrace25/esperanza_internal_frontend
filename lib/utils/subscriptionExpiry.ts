import moment from "moment";

export type ExpiryUrgency = "expired" | "warning" | "ok";

/** Past/today = expired; within 10 days ahead = warning; otherwise ok. */
export function getExpiryUrgency(expiryDate: string): ExpiryUrgency {
  const expiry = moment(expiryDate).startOf("day");
  const today = moment().startOf("day");
  const daysUntil = expiry.diff(today, "days");

  if (daysUntil <= 0) return "expired";
  if (daysUntil <= 10) return "warning";
  return "ok";
}

export function expiryDateClassName(urgency: ExpiryUrgency): string {
  switch (urgency) {
    case "expired":
      return "font-semibold text-red-600";
    case "warning":
      return "font-semibold text-amber-600";
    default:
      return "font-medium text-foreground";
  }
}

export function isExpiryInRange(
  expiryDate: string,
  from?: string,
  to?: string
): boolean {
  const expiry = moment(expiryDate).startOf("day");
  if (from) {
    const start = moment(from).startOf("day");
    if (expiry.isBefore(start)) return false;
  }
  if (to) {
    const end = moment(to).startOf("day");
    if (expiry.isAfter(end)) return false;
  }
  return true;
}
