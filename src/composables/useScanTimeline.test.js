import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useScanTimeline, to24Hour } from './useScanTimeline'

const make = (over = {}) => ({ scans: [
  { id: 'a', date: '14 Jul 2026 12:59', status: 'Scanning' },
  { id: 'b', date: '9 Jul 2026 14:25', status: 'Completed', duration: '4m' },
  { id: 'c', date: '3 Jul 2026 14:24', status: 'Failed', duration: '1m' },
], ...over })
const tl = (opts = {}) => {
  const { scans } = make()
  return useScanTimeline({ target: ref({ scanType: 'manual_scan' }), initialScans: scans, ...opts })
}

describe('to24Hour', () => {
  it('rewrites 12-hour times', () => {
    expect(to24Hour('9 Feb 2025 8:30 AM')).toBe('9 Feb 2025 08:30')
    expect(to24Hour('9 Feb 2025 12:05 AM')).toBe('9 Feb 2025 00:05')
    expect(to24Hour('9 Feb 2025 12:05 PM')).toBe('9 Feb 2025 12:05')
    expect(to24Hour('9 Feb 2025 1:00 PM')).toBe('9 Feb 2025 13:00')
  })
  it('leaves other strings alone', () => expect(to24Hour('14 Jul 2026 12:59')).toBe('14 Jul 2026 12:59'))
})

describe('useScanTimeline', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('selects the first row by default, or the first finished scan when asked', () => {
    expect(tl().selectedScan.value).toBe(0)
    expect(tl({ selectFirstFinished: true }).selectedScan.value).toBe(1)
  })

  it('labels the scan type and recurrence', () => {
    const t = useScanTimeline({ target: ref({ scanType: 'continuous_scan', recurrence: 'biweekly' }), initialScans: [] })
    expect(t.scanTypeLabel.value).toBe('Continuous Scan')
    expect(t.recurrenceLabel.value).toBe('Every Two Weeks')
    expect(tl().recurrenceLabel.value).toBeNull()
  })

  it('retrying a failed scan queues it and selects it', () => {
    const t = tl({ trackDuration: true })
    t.rescan(2)
    expect(t.scans.value[2].status).toBe('Queue')
    expect(t.scans.value[2].duration).toBeNull()
    expect(t.selectedScan.value).toBe(2)
  })

  it('does not touch duration unless trackDuration is on', () => {
    const t = tl()
    t.rescan(2)
    expect(t.scans.value[2].duration).toBe('1m')
  })

  it('a new scan is added on top and keeps the same row selected', () => {
    const t = tl({ selectFirstFinished: true })
    t.rescan(null)
    expect(t.scans.value).toHaveLength(4)
    expect(t.scans.value[0].status).toBe('Queue')
    expect(t.selectedScan.value).toBe(2)
  })

  it('main re-scan: confirm, loading, then "scan in progress"', () => {
    const t = tl()
    t.openRescanConfirm()
    expect(t.pendingRescanType.value).toBe('main')
    t.confirmRescan()
    expect(t.rescanLoading.value).toBe(true)
    vi.advanceTimersByTime(1500)
    expect(t.rescanLoading.value).toBe(false)
    expect(t.scanInProgress.value).toBe(true)
    expect(t.pendingRescanType.value).toBeNull()
    expect(t.scans.value).toHaveLength(4)
  })

  it('cancelling a confirmation clears it', () => {
    const t = tl()
    t.openRescanConfirm(2)
    expect(t.rbState(2)).toBe('is-confirm')
    expect(t.rbConfirming(2)).toBe(true)
    t.cancelRescan()
    expect(t.rbState(2)).toBe('is-idle')
  })

  it('retry pill walks confirm -> loading -> done -> idle', () => {
    const t = tl()
    t.openRescanConfirm(2)
    t.confirmRescan()
    expect(t.rbState(2)).toBe('is-loading')
    vi.advanceTimersByTime(1200)
    expect(t.rbState(2)).toBe('is-done')
    expect(t.scans.value[2].status).toBe('Queue')
    vi.advanceTimersByTime(350)
    expect(t.rbState(2)).toBe('is-idle')
  })

  it('stop scanning finishes the running scan and stops the timeline', () => {
    const t = tl({ trackDuration: true })
    expect(t.hasActiveScan.value).toBe(true)
    t.openStopConfirm()
    t.confirmRescan()
    vi.advanceTimersByTime(1500)
    expect(t.scans.value[0].status).toBe('Completed')
    expect(t.scans.value[0].duration).toBe('—')
    expect(t.timelineStopped.value).toBe(true)
    expect(t.hasActiveScan.value).toBe(false)
    expect(t.selectedScan.value).toBe(0)
  })
})
