export const COLUMN_WIDTH_LIMITS = { min: 80, max: 1200 };

/** Persist IDs rather than positions: temporarily hidden columns retain their widths. */
export function cleanColumnWidths(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([id, width]) => id && id.length <= 160 && typeof width === 'number' && Number.isFinite(width) && width > 0 && width <= 10000));
}
export function columnLimits(id, minWidths = {}, maxWidths = {}) {
  const min = Number.isFinite(minWidths[id]) ? Math.max(1, minWidths[id]) : COLUMN_WIDTH_LIMITS.min;
  const max = Number.isFinite(maxWidths[id]) ? Math.max(min, maxWidths[id]) : Math.max(min, COLUMN_WIDTH_LIMITS.max);
  return { min, max };
}
export function resizeColumnSnapshot(snapshot, id, width, minWidths, maxWidths) {
  const { min, max } = columnLimits(id, minWidths, maxWidths);
  return { ...snapshot, [id]: Math.round(Math.max(min, Math.min(max, width)) * 100) / 100 };
}
export function mergeColumnWidths(previous, visible) { return { ...cleanColumnWidths(previous), ...cleanColumnWidths(visible) }; }
export function readColumnWidths(storageKey) {
  try { const stored = JSON.parse(localStorage.getItem(storageKey)); return stored?.version === 1 ? cleanColumnWidths(stored.widths) : {}; } catch { return {}; }
}
export function writeColumnWidths(storageKey, widths) {
  if (!storageKey) return;
  try { if (Object.keys(widths).length) localStorage.setItem(storageKey, JSON.stringify({ version: 1, widths: cleanColumnWidths(widths) })); else localStorage.removeItem(storageKey); } catch { /* Resizing stays available when browser storage is disabled. */ }
}
