// Login lockout (PRD 2.2): 5 consecutive failed logins lock the account for 30
// minutes. A successful login resets the counter. There is no notification email
// and no admin override: the user waits out the full 30 minutes, and even the
// correct password is refused while the lock is active.
//
// The real rule lives on the backend; this tracker backs the mock login so the
// behaviour can be demonstrated and tested in static mode. It is pure: storage and
// clock are injected.

export const MAX_FAILED_ATTEMPTS = 5
export const LOCKOUT_MS = 30 * 60 * 1000
const KEY = 'sentra_login_attempts'

const norm = (email) => String(email ?? '').trim().toLowerCase()

export function createLockoutTracker(storage, now = Date.now) {
  function read() {
    try { return JSON.parse(storage.getItem(KEY) ?? '{}') ?? {} } catch { return {} }
  }
  function write(all) {
    try { storage.setItem(KEY, JSON.stringify(all)) } catch { /* storage unavailable */ }
  }

  // { locked, retryAfterMs }
  function status(email) {
    const rec = read()[norm(email)]
    const left = (rec?.lockedUntil ?? 0) - now()
    return left > 0 ? { locked: true, retryAfterMs: left } : { locked: false, retryAfterMs: 0 }
  }

  function recordFailure(email) {
    const all = read(); const k = norm(email)
    let rec = all[k] ?? { count: 0, lockedUntil: 0 }
    // A lock that has run out starts a fresh count.
    if (rec.lockedUntil && rec.lockedUntil <= now()) rec = { count: 0, lockedUntil: 0 }
    rec.count += 1
    if (rec.count >= MAX_FAILED_ATTEMPTS) rec.lockedUntil = now() + LOCKOUT_MS
    all[k] = rec
    write(all)
    return status(email)
  }

  function recordSuccess(email) {
    const all = read()
    delete all[norm(email)]
    write(all)
  }

  return { status, recordFailure, recordSuccess }
}

export function lockedMessage(retryAfterMs) {
  const mins = Math.max(1, Math.ceil(retryAfterMs / 60000))
  return `Too many failed attempts. This account is locked for another ${mins} minute${mins === 1 ? '' : 's'}.`
}
