// Session limits (PRD 2.2): 15 minutes of inactivity signs the user out, and an
// absolute limit of 8 to 12 hours applies regardless of activity (the lower bound is
// used). No multi-device login and no "remember me" — both are deliberate.

export const IDLE_TIMEOUT_MS = 15 * 60 * 1000
export const SESSION_MAX_MS = 8 * 60 * 60 * 1000

// -> 'ok' | 'idle' | 'expired'. `expired` (absolute limit) wins over `idle`.
export function sessionStatus({ loginAt, lastActivityAt }, now = Date.now()) {
  if (loginAt && now - loginAt >= SESSION_MAX_MS) return 'expired'
  if (lastActivityAt && now - lastActivityAt >= IDLE_TIMEOUT_MS) return 'idle'
  return 'ok'
}

export const SESSION_MESSAGES = {
  idle: 'You were signed out after 15 minutes of inactivity. Please log in again.',
  expired: 'Your session has expired. Please log in again.',
}
