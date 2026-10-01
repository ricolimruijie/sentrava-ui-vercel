import { describe, it, expect } from 'vitest'
import { sessionStatus, IDLE_TIMEOUT_MS, SESSION_MAX_MS } from './session'

const T0 = 10_000_000

describe('sessionStatus (PRD 2.2)', () => {
  it('is ok while active and young', () => {
    expect(sessionStatus({ loginAt: T0, lastActivityAt: T0 + 60_000 }, T0 + 120_000)).toBe('ok')
  })
  it('goes idle after 15 minutes without activity', () => {
    expect(sessionStatus({ loginAt: T0, lastActivityAt: T0 }, T0 + IDLE_TIMEOUT_MS - 1)).toBe('ok')
    expect(sessionStatus({ loginAt: T0, lastActivityAt: T0 }, T0 + IDLE_TIMEOUT_MS)).toBe('idle')
  })
  it('activity keeps it alive but only until the absolute limit', () => {
    const now = T0 + SESSION_MAX_MS
    expect(sessionStatus({ loginAt: T0, lastActivityAt: now - 1000 }, now)).toBe('expired')
    expect(sessionStatus({ loginAt: T0, lastActivityAt: now - 1000 }, now - 1)).toBe('ok')
  })
  it('expired wins over idle', () => {
    expect(sessionStatus({ loginAt: T0, lastActivityAt: T0 }, T0 + SESSION_MAX_MS + 1)).toBe('expired')
  })
  it('treats missing timestamps as ok', () => expect(sessionStatus({}, T0)).toBe('ok'))
})
