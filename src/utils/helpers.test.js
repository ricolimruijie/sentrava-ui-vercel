import { describe, it, expect } from 'vitest'
import {
  formatNumber, formatDate, formatShortDate, severityLabel,
  formatDateLong, formatLongDateTime24, formatDayMonthYear, formatDayMonthTime, timeAgo,
} from './helpers'

describe('helpers', () => {
  it('formatNumber abbreviates thousands and millions', () => {
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(1500)).toBe('1.5K')
    expect(formatNumber(2_000_000)).toBe('2.0M')
  })

  it('formatDate uses a short US date', () => expect(formatDate('2026-03-05T12:00:00')).toBe('Mar 5, 2026'))

  it('formatShortDate handles empty, valid and non-date values', () => {
    expect(formatShortDate('')).toBe('—')
    expect(formatShortDate(null)).toBe('—')
    expect(formatShortDate('2026-03-05T12:00:00')).toBe('Thu, 5 Mar 2026')
    expect(formatShortDate('n/a')).toBe('n/a')
  })

  it('severityLabel capitalises', () => {
    expect(severityLabel('critical')).toBe('Critical')
    expect(severityLabel('info')).toBe('Info')
    expect(severityLabel('')).toBe('')
  })

  it('the named date formats keep their shapes', () => {
    expect(formatDateLong('2026-03-05T12:00:00')).toBe('March 5, 2026')
    expect(formatLongDateTime24('2026-03-05T14:30:00')).toBe('5 March 2026, 14:30')
    expect(formatDayMonthYear('2026-03-05T12:00:00')).toBe('5 Mar 2026')
    expect(formatDayMonthYear('')).toBe('—')
    expect(formatDayMonthTime('2026-03-05T14:30:00')).toBe('5 Mar · 2:30 PM')
    expect(formatDayMonthTime(null)).toBe('—')
  })

  it('timeAgo reads like the PRD example', () => {
    const now = Date.parse('2026-10-02T10:00:00Z')
    const at = (ms) => new Date(now - ms).toISOString()
    expect(timeAgo(at(20_000), now)).toBe('Just now')
    expect(timeAgo(at(2 * 60_000), now)).toBe('2 min ago')
    expect(timeAgo(at(60 * 60_000), now)).toBe('1 hour ago')
    expect(timeAgo(at(3 * 3_600_000), now)).toBe('3 hours ago')
    expect(timeAgo(at(86_400_000), now)).toBe('1 day ago')
    expect(timeAgo(at(5 * 86_400_000), now)).toBe('5 days ago')
    expect(timeAgo(at(30 * 86_400_000), now)).toBe('Sep 2, 2026')
  })
})
