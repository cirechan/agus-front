import type { MatchEvent } from "@/types/match";

export type EventPeriod = "first" | "second" | "extra";

export const HALF_DURATION_MINUTES = 40;
export const DEFAULT_EVENT_PERIOD: EventPeriod = "first";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function coerceEventPeriod(value: unknown): EventPeriod {
  if (value === "second" || value === "extra") {
    return value;
  }
  return "first";
}

export function clampRelativeMinute(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(130, Math.round(value)));
}

export function toAbsoluteMinute(period: EventPeriod, relativeMinute: number): number {
  const minute = clampRelativeMinute(relativeMinute);
  switch (period) {
    case "second":
      return HALF_DURATION_MINUTES + minute;
    case "extra":
      return HALF_DURATION_MINUTES * 2 + minute;
    default:
      return minute;
  }
}

export function toRelativeMinute(period: EventPeriod, absoluteMinute: number): number {
  const minute = clampRelativeMinute(absoluteMinute);
  switch (period) {
    case "second":
      return Math.max(0, minute - HALF_DURATION_MINUTES);
    case "extra":
      return Math.max(0, minute - HALF_DURATION_MINUTES * 2);
    default:
      return minute;
  }
}

function getEventData(event: MatchEvent): Record<string, unknown> {
  if (!isRecord(event.data)) {
    return {};
  }
  return event.data as Record<string, unknown>;
}

export function getStoredRelativeMinute(event: MatchEvent): number | null {
  const data = getEventData(event);
  const value = data.relativeMinute;
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampRelativeMinute(value);
  }
  return null;
}

export function getEventPeriod(event: MatchEvent): EventPeriod {
  const data = getEventData(event);
  const raw = data.period;
  if (raw === "second" || raw === "extra") {
    return raw;
  }
  if (event.minute > HALF_DURATION_MINUTES * 2) {
    return "extra";
  }
  if (event.minute > HALF_DURATION_MINUTES) {
    return "second";
  }
  return "first";
}

export function getEventRelativeMinute(event: MatchEvent): number {
  const stored = getStoredRelativeMinute(event);
  if (stored != null) {
    return stored;
  }
  const period = getEventPeriod(event);
  return toRelativeMinute(period, event.minute);
}

export function getEventAbsoluteMinute(event: MatchEvent): number {
  const period = getEventPeriod(event);
  const relative = getEventRelativeMinute(event);
  return toAbsoluteMinute(period, relative);
}

export function buildEventMetadata(
  period: EventPeriod,
  relativeMinute: number,
  base: Record<string, unknown> | null = null
): Record<string, unknown> {
  const metadata: Record<string, unknown> = base ? { ...base } : {};
  metadata.period = period;
  metadata.relativeMinute = clampRelativeMinute(relativeMinute);
  return metadata;
}

export function formatPeriodLabel(period: EventPeriod): string {
  switch (period) {
    case "second":
      return "2ª parte";
    case "extra":
      return "Prórroga";
    default:
      return "1ª parte";
  }
}

export function formatEventMinute(period: EventPeriod, relativeMinute: number): string {
  const absolute = toAbsoluteMinute(period, relativeMinute);
  const suffix = formatPeriodLabel(period);
  return period === "first"
    ? `${absolute}'`
    : `${absolute}' · ${suffix}`;
}
