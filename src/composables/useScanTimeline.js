import { ref, computed } from 'vue'

// Shared state for the scan timeline on the asset detail pages (Domain, Network,
// Web App, Source Code): the list of scans and which one is selected, the
// scroll hint under the list, the re-scan / retry / stop confirmations and the
// labels shown under the heading. Pair it with <ScanTimelineCard>.

export const scanTypeLabels = {
  manual_scan: 'Manual Scan', manual: 'Manual Scan', singular: 'Manual Scan',
  scheduled_scan: 'Scheduled Scan', scheduled: 'Scheduled Scan', specified: 'Scheduled Scan',
  continuous_scan: 'Continuous Scan', continuous: 'Continuous Scan',
}
const recurrenceLabels = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every Two Weeks', monthly: 'Monthly' }

export const scanDot = {
  Completed: '#16a34a',
  Queue: '#0284c7',
  Waiting: '#9aa5b1',
  Scanning: '#F79009',
  Failed: '#dc2626',
}

const IN_PROGRESS = ['Scanning', 'Queue', 'Waiting']

// Timeline entries are stored as "9 Feb 2025 8:30 AM" — rewrite the trailing
// 12-hour time into 24-hour, same as the calendar's time picker.
export function to24Hour(dateStr) {
  const m = dateStr.match(/^(.*)\s(\d{1,2}):(\d{2})\s?(AM|PM)$/i)
  if (!m) return dateStr
  const [, datePart, hStr, min, ampm] = m
  let h = parseInt(hStr, 10)
  if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12
  if (ampm.toUpperCase() === 'AM' && h === 12) h = 0
  return `${datePart} ${String(h).padStart(2, '0')}:${min}`
}

// target: ref of the asset (needs scanType / recurrence). initialScans: the scans to start from.
// selectFirstFinished: start on the first scan that is not in progress (otherwise the first row).
// trackDuration: clear / fill the duration when a scan is retried or stopped.
export function useScanTimeline({ target, initialScans, selectFirstFinished = false, trackDuration = false }) {
  const scans = ref(initialScans)
  const selectedScan = ref(selectFirstFinished
    ? Math.max(0, initialScans.findIndex((s) => !IN_PROGRESS.includes(s.status)))
    : 0)

  const scanTypeLabel = computed(() => scanTypeLabels[target.value.scanType] ?? target.value.scanType)
  // Shown under the timeline heading for continuous targets.
  const recurrenceLabel = computed(() =>
    target.value.scanType === 'continuous_scan' ? (recurrenceLabels[target.value.recurrence] ?? null) : null,
  )

  // "N more" hint at the bottom of the scrolling list.
  const tlRef = ref(null)
  const tlRemaining = ref(0)
  const tlAtEnd = ref(false)

  function updateTimelineHint() {
    const el = tlRef.value
    if (!el) return
    const left = el.scrollHeight - el.scrollTop - el.clientHeight
    tlRemaining.value = Math.max(0, Math.ceil((left - 6) / 58))
    tlAtEnd.value = left <= 6
  }
  function scrollTimelineMore() {
    tlRef.value?.scrollBy({ top: 174, behavior: 'smooth' })
  }

  function rescan(index) {
    if (index != null && scans.value[index]?.status === 'Failed') {
      scans.value[index] = { ...scans.value[index], status: 'Queue', ...(trackDuration ? { duration: null } : {}) }
      selectedScan.value = index
      return
    }
    const now = new Date().toLocaleString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
    })
    scans.value.unshift({ id: `s-${Date.now()}`, date: now, status: 'Queue' })
    selectedScan.value += 1
  }

  // ── Re-scan confirmation (inline: button transforms into Cancel/Proceed) ──
  const pendingRescanType = ref(null) // 'main' | 'retry' | 'stop'
  const pendingRescanIndex = ref(null)
  const rescanLoading = ref(false)
  const scanInProgress = ref(false)
  const retryLoadingIndex = ref(null)
  const retryDoneIndex = ref(null)
  const stopLoading = ref(false)
  const timelineStopped = ref(false)

  // ── Stop scanning (continuous scan types only) ──
  const hasActiveScan = computed(() => scans.value.some((s) => s.status === 'Scanning'))

  function stopScanning() {
    const i = scans.value.findIndex((s) => s.status === 'Scanning')
    if (i < 0) return
    scans.value[i] = {
      ...scans.value[i], status: 'Completed',
      ...(trackDuration ? { duration: scans.value[i].duration ?? '—' } : {}),
    }
    const next = scans.value.findIndex((s) => !IN_PROGRESS.includes(s.status))
    selectedScan.value = Math.max(0, next)
  }

  function openRescanConfirm(index = null) {
    pendingRescanIndex.value = index
    pendingRescanType.value = index != null ? 'retry' : 'main'
  }
  function openStopConfirm() {
    pendingRescanIndex.value = null
    pendingRescanType.value = 'stop'
  }
  function cancelRescan() {
    pendingRescanType.value = null
    pendingRescanIndex.value = null
  }

  // Retry pill visual state per timeline row.
  function rbState(i) {
    if (retryDoneIndex.value === i) return 'is-done'
    if (retryLoadingIndex.value === i) return 'is-loading'
    if (pendingRescanType.value === 'retry' && pendingRescanIndex.value === i) return 'is-confirm'
    return 'is-idle'
  }
  function rbConfirming(i) {
    const st = rbState(i)
    return st === 'is-confirm' || st === 'is-loading'
  }

  function confirmRescan() {
    // Main button: loading animation, then the scan starts and the button
    // becomes a grey disabled "Scan in progress".
    if (pendingRescanType.value === 'main') {
      if (rescanLoading.value) return
      rescanLoading.value = true
      setTimeout(() => {
        rescan(pendingRescanIndex.value)
        rescanLoading.value = false
        scanInProgress.value = true
        cancelRescan()
      }, 1500)
      return
    }
    // Stop button: loading animation, then the timeline is permanently stopped
    // with an explanatory note in place of the button.
    if (pendingRescanType.value === 'stop') {
      if (stopLoading.value) return
      stopLoading.value = true
      setTimeout(() => {
        stopScanning()
        stopLoading.value = false
        timelineStopped.value = true
        cancelRescan()
      }, 1500)
      return
    }
    // Failed-scan retry pill: confirm pops the pair, loading collapses x
    // toward check and spins, done fades the pill out as the status flips
    // to Queue and unmounts it.
    if (retryLoadingIndex.value != null || retryDoneIndex.value != null) return
    const i = pendingRescanIndex.value
    retryLoadingIndex.value = i
    setTimeout(() => {
      rescan(i)
      retryDoneIndex.value = i
      retryLoadingIndex.value = null
      setTimeout(() => {
        retryDoneIndex.value = null
        cancelRescan()
      }, 350)
    }, 1200)
  }

  return {
    scans, selectedScan, scanTypeLabel, recurrenceLabel,
    tlRef, tlRemaining, tlAtEnd, updateTimelineHint, scrollTimelineMore,
    rescan, pendingRescanType, pendingRescanIndex, rescanLoading, scanInProgress,
    retryLoadingIndex, retryDoneIndex, stopLoading, timelineStopped,
    hasActiveScan, stopScanning, openRescanConfirm, openStopConfirm, cancelRescan,
    rbState, rbConfirming, confirmRescan,
  }
}
