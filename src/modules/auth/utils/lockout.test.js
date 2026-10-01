import { describe, it, expect, beforeEach } from 'vitest'
import { createLockoutTracker, MAX_FAILED_ATTEMPTS, LOCKOUT_MS, lockedMessage } from './lockout'

function memoryStorage() {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }
}

describe('login lockout (PRD 2.2)', () => {
  let t, clock, tracker
  beforeEach(() => { t = 1_000_000; clock = () => t; tracker = createLockoutTracker(memoryStorage(), clock) })

  it('is not locked before any failure', () => expect(tracker.status('a@b.co').locked).toBe(false))

  it('locks on the 5th consecutive failure, not before', () => {
    for (let i = 1; i < MAX_FAILED_ATTEMPTS; i++) expect(tracker.recordFailure('a@b.co').locked).toBe(false)
    const s = tracker.recordFailure('a@b.co')
    expect(s.locked).toBe(true)
    expect(s.retryAfterMs).toBe(LOCKOUT_MS)
  })

  it('stays locked for the full 30 minutes, then unlocks', () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) tracker.recordFailure('a@b.co')
    t += LOCKOUT_MS - 1000
    expect(tracker.status('a@b.co').locked).toBe(true)
    t += 1000
    expect(tracker.status('a@b.co').locked).toBe(false)
  })

  it('a successful login resets the counter', () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 1; i++) tracker.recordFailure('a@b.co')
    tracker.recordSuccess('a@b.co')
    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 1; i++) expect(tracker.recordFailure('a@b.co').locked).toBe(false)
  })

  it('starts a fresh count after a lock has run out', () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) tracker.recordFailure('a@b.co')
    t += LOCKOUT_MS + 1
    expect(tracker.recordFailure('a@b.co').locked).toBe(false)
  })

  it('tracks emails independently and ignores case/whitespace', () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) tracker.recordFailure(' A@B.co ')
    expect(tracker.status('a@b.co').locked).toBe(true)
    expect(tracker.status('other@b.co').locked).toBe(false)
  })

  it('words the remaining time', () => {
    expect(lockedMessage(30 * 60 * 1000)).toContain('30 minutes')
    expect(lockedMessage(60 * 1000)).toContain('1 minute.')
    expect(lockedMessage(1)).toContain('1 minute.')
  })
})
