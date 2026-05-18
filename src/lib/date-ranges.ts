export type RevenuePeriod = "today" | "week" | "month" | "quarter" | "year" | "custom";

export const REVENUE_PERIOD_LABELS: Record<RevenuePeriod, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  quarter: "This Quarter",
  year: "This Year",
  custom: "Custom Range",
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getDateRange(
  period: RevenuePeriod,
  customFrom?: string,
  customTo?: string,
): { start: Date; end: Date } {
  const now = new Date();
  const end = endOfDay(now);

  switch (period) {
    case "today":
      return { start: startOfDay(now), end };
    case "week": {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 6);
      return { start, end };
    }
    case "month": {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      return { start, end };
    }
    case "quarter": {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = startOfDay(new Date(now.getFullYear(), quarterMonth, 1));
      return { start, end };
    }
    case "year": {
      const start = startOfDay(new Date(now.getFullYear(), 0, 1));
      return { start, end };
    }
    case "custom": {
      const start = customFrom ? startOfDay(new Date(customFrom)) : startOfDay(now);
      const customEnd = customTo ? endOfDay(new Date(customTo)) : end;
      return { start, end: customEnd };
    }
    default:
      return { start: startOfDay(now), end };
  }
}

export function isWithinRange(iso: string, start: Date, end: Date) {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}
