/**
 * Module-level singleton for managing the currently running timer.
 *
 * The timer lives in localStorage so it survives page reloads.
 * Key format: "running_timer_{userId}"
 * Value: { taskId, customFieldId, startedAt: ISO string }
 *
 * Only one timer per user can be running at any time.
 * Subscribers are notified synchronously whenever timer state changes.
 */

const STORAGE_PREFIX = "running_timer_";
const listeners = new Set();

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`;
}

/** Read current running timer for a user, or null if none. */
export function getRunningTimer(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Write or clear the running timer for a user. Notifies all subscribers. */
export function setRunningTimer(userId, data) {
  if (!userId) return;
  if (data) {
    localStorage.setItem(storageKey(userId), JSON.stringify(data));
  } else {
    localStorage.removeItem(storageKey(userId));
  }
  // Notify all subscribed components to re-read timer state
  listeners.forEach((fn) => fn());
}

/**
 * Subscribe to timer state changes.
 * @returns unsubscribe function
 */
export function subscribeTimer(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Calculate elapsed minutes from a stored start timestamp to now.
 * Always returns a non-negative integer.
 */
export function getElapsedMinutes(startedAt) {
  if (!startedAt) return 0;
  const elapsed = Date.now() - new Date(startedAt).getTime();
  return Math.max(0, Math.floor(elapsed / 60000));
}
