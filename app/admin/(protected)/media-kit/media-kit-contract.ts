export const MEDIA_FIT_VALUES = ["cover", "contain"] as const;
export const MEDIA_POSITION_VALUES = ["center", "top", "bottom"] as const;

export type MediaFit = (typeof MEDIA_FIT_VALUES)[number];
export type MediaPosition = (typeof MEDIA_POSITION_VALUES)[number];

const UNPUBLISHABLE_VALUES = new Set([
  "",
  "-",
  "—",
  "a integrar",
  "não configurado",
  "nao configurado",
  "a definir",
  "destaque a definir",
]);

export function recordText(record: Record<string, unknown> | undefined, key: string, fallback = "") {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function mediaFit(record: Record<string, unknown> | undefined): MediaFit {
  const value = recordText(record, "mediaFit", "cover");
  return MEDIA_FIT_VALUES.includes(value as MediaFit) ? value as MediaFit : "cover";
}

export function mediaPosition(record: Record<string, unknown> | undefined): MediaPosition {
  const value = recordText(record, "mediaPosition", "center");
  return MEDIA_POSITION_VALUES.includes(value as MediaPosition) ? value as MediaPosition : "center";
}

export function isPublishableValue(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "string") return false;
  return !UNPUBLISHABLE_VALUES.has(value.trim().toLowerCase());
}

export function visibleByPosition<T extends { enabled: boolean; position: number }>(rows: T[]) {
  return rows.filter((row) => row.enabled).sort((a, b) => a.position - b.position);
}
