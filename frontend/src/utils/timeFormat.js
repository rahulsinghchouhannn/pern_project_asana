/**
 * Parse a user-typed time string into total minutes.
 *
 * Rules:
 *   1-2 digit plain number  → minutes  (e.g. "11" → 11m, "90" → 90m)
 *   3-digit plain number    → H:MM     (e.g. "130" → 1h 30m)
 *   4-digit plain number    → HH:MM    (e.g. "1111" → 11h 11m)
 *   Colon-separated         → H:MM     (e.g. "1:30" → 1h 30m, "11:11" → 11h 11m)
 *
 * Returns null if unparseable or invalid.
 */
export function parseTimeInput(str) {
  if (!str || !str.trim()) return null;
  const s = str.trim();

  if (s.includes(":")) {
    const parts = s.split(":");
    if (parts.length !== 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m) || h < 0 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }

  if (!/^\d+$/.test(s)) return null;

  if (s.length <= 2) {
    return parseInt(s, 10);
  }
  if (s.length === 3) {
    const m = parseInt(s.slice(1), 10);
    if (m > 59) return null;
    return parseInt(s.slice(0, 1), 10) * 60 + m;
  }
  if (s.length === 4) {
    const m = parseInt(s.slice(2), 10);
    if (m > 59) return null;
    return parseInt(s.slice(0, 2), 10) * 60 + m;
  }
  // 5+ digits — treat as pure minutes
  return parseInt(s, 10);
}

/**
 * Format total minutes as a human-readable string.
 * e.g. 44 → "44m", 671 → "11h 11m", 60 → "1h"
 */
export function formatMinutes(totalMinutes) {
  if (totalMinutes == null) return null;
  const mins = Math.round(Number(totalMinutes));
  if (isNaN(mins) || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Describe total minutes in plain language for suggestion text.
 * e.g. 671 → "11 hours 11 minutes", 11 → "11 minutes"
 */
export function describeMinutes(totalMinutes) {
  if (totalMinutes == null || isNaN(totalMinutes)) return null;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const parts = [];
  if (h > 0) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m > 0) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  return parts.join(" ") || "0 minutes";
}
