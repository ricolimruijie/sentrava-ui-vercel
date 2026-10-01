<script setup>
import HoldToDeleteModal from '@/components/common/HoldToDeleteModal.vue'
import FindingsReportModal from '@/components/common/FindingsReportModal.vue'
import { useRole } from '@/composables/useRole'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataTable from '@/components/common/DataTable.vue'
import FilterDropdown from '@/components/common/FilterDropdown.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import VulnerabilityDetailModal from '@/components/common/VulnerabilityDetailModal.vue'
import { formatShortDate, severityLabel } from '@/utils/helpers'
import { getWebApps, getWebAppScans, getWebAppVulns, preloadWebAppDetail } from '@/modules/web-application/services/webAppService'
import {
  IconDotsVertical, IconArrowUpRight, IconCheck, IconInfoCircle,
  IconDownload, IconPencil, IconRefresh, IconChevronDown, IconChevronRight, IconMinus, IconTag, IconFlag, IconUpload,
  IconX, IconLink, IconCalendar, IconBuilding, IconClock, IconTrash, IconShieldSearch,
} from '@tabler/icons-vue'

// Load this page's data before it renders (the page is shown inside <Suspense>).
await preloadWebAppDetail()

const { can } = useRole()

const route = useRoute()
const router = useRouter()

const app = computed(() => {
  const id = Number(route.params.id)
  return getWebApps().find((a) => a.id === id) ?? getWebApps()[0]
})

// Same scan-type wording as the other asset detail views (also used by the
// Target Details pill below).
const scanTypeLabels = { manual_scan: 'Manual Scan', manual: 'Manual Scan', singular: 'Manual Scan', scheduled_scan: 'Scheduled Scan', scheduled: 'Scheduled Scan', specified: 'Scheduled Scan', continuous_scan: 'Continuous Scan', continuous: 'Continuous Scan' }

// Same palette as WebAppView/SourceCodeView so tags render identically.
const tagColors = [
  { swatch: '#F26D6D', bg: '#FDE8E8', fg: '#E03131' }, { swatch: '#F2994A', bg: '#FDEEE0', fg: '#E8590C' },
  { swatch: '#F2C94C', bg: '#FCF3D6', fg: '#A67C00' }, { swatch: '#A8BD3A', bg: '#F1F5D6', fg: '#6B8E00' },
  { swatch: '#4CAF6D', bg: '#E3F5E8', fg: '#2F9E52' }, { swatch: '#3DBFA8', bg: '#DEF7F0', fg: '#12967D' },
  { swatch: '#3DC6F2', bg: '#DFF3FC', fg: '#1197C2' }, { swatch: '#7C93F0', bg: '#E6E9FC', fg: '#5C6BC0' },
  { swatch: '#E896BB', bg: '#FBE6F0', fg: '#C2255C' }, { swatch: '#B69AE8', bg: '#F0E6FB', fg: '#7C3FC4' },
  { swatch: '#9AA5B1', bg: '#ECEEF0', fg: '#5C6470' },
]

// ── Target Details panel (View detail) ───────────────────────────────────────
// Anchored popover under the "View detail" button, not a centered modal.
const showTargetDetailModal = ref(false)
const targetDetailPos = ref({ top: 0, left: 0 })
const targetPanelWidth = 400

function toggleTargetDetailModal(e) {
  if (showTargetDetailModal.value) {
    showTargetDetailModal.value = false
    return
  }
  const rect = e.currentTarget.getBoundingClientRect()
  targetDetailPos.value = {
    top: rect.bottom + 12,
    left: Math.max(16, Math.min(rect.right - targetPanelWidth, window.innerWidth - targetPanelWidth - 16)),
  }
  showTargetDetailModal.value = true
}
function closeTargetDetailModal() { showTargetDetailModal.value = false }

const severityCards = [
  { key: 'critical', label: 'Critical', bg: '#FBE3E3', bar: '#DC2626' },
  { key: 'high', label: 'High', bg: '#FDEEE3', bar: '#EA580C' },
  { key: 'medium', label: 'Medium', bg: '#FEF6DC', bar: '#EAB308' },
  { key: 'low', label: 'Low', bg: '#E7F7ED', bar: '#16A34A' },
  { key: 'info', label: 'Info', bg: '#E5F3FC', bar: '#0EA5E9' },
]
const severityCounts = computed(() => {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
  vulns.value.forEach((v) => { if (v.severity in counts) counts[v.severity]++ })
  return counts
})

// Splits "14 Jul 2026 12:59" into date/time parts for the Target Details modal.
const selectedScanParts = computed(() => {
  // Same 24-hour rendering as the scan timeline.
  const converted = to24Hour(scans.value[selectedScan.value]?.date ?? '')
  const m = converted.match(/^(.*)\s(\d{1,2}:\d{2})$/)
  return m ? { date: m[1], time: m[2] } : { date: converted, time: '' }
})

function deleteScanTimeline() {
  if (!scans.value.length) return
  scans.value.splice(selectedScan.value, 1)
  // Land on the first selectable scan (skip in-progress/queued rows).
  const i = scans.value.findIndex((s) => !['Scanning', 'Queue', 'Waiting'].includes(s.status))
  selectedScan.value = Math.max(0, i)
  closeTargetDetailModal()
}

// ── Scan timeline ──────────────────────────────────────────────────────────
const scans = ref(getWebAppScans(app.value.id))
// Default to the first selectable scan (skip in-progress/queued rows).
const selectedScan = ref(Math.max(0, getWebAppScans(app.value.id).findIndex(
  (s) => !['Scanning', 'Queue', 'Waiting'].includes(s.status),
)))

const scanTypeLabel = computed(() => scanTypeLabels[app.value.scanType] ?? app.value.scanType)

// Timeline entries are stored as "9 Feb 2025 8:30 AM" — rewrite the trailing
// 12-hour time into 24-hour, same as the calendar's time picker.
function to24Hour(dateStr) {
  const m = dateStr.match(/^(.*)\s(\d{1,2}):(\d{2})\s?(AM|PM)$/i)
  if (!m) return dateStr
  const [, datePart, hStr, min, ampm] = m
  let h = parseInt(hStr, 10)
  if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12
  if (ampm.toUpperCase() === 'AM' && h === 12) h = 0
  return `${datePart} ${String(h).padStart(2, '0')}:${min}`
}

const scanDot = {
  Completed: '#16a34a',
  Queue: '#0284c7',
  Waiting: '#9aa5b1',
  Scanning: '#F79009',
  Failed: '#dc2626',
}

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
    scans.value[index] = { ...scans.value[index], status: 'Queue', duration: null }
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
const pendingRescanType = ref(null) // 'main' | 'retry'
const pendingRescanIndex = ref(null)
const rescanLoading = ref(false)
const scanInProgress = ref(false)
const retryLoadingIndex = ref(null)
const retryDoneIndex = ref(null)
const stopLoading = ref(false)
const timelineStopped = ref(false)

// ── Stop scanning (continuous scan types only) ───────────────────────────
const hasActiveScan = computed(() => scans.value.some((s) => s.status === 'Scanning'))

function stopScanning() {
  const i = scans.value.findIndex((s) => s.status === 'Scanning')
  if (i < 0) return
  scans.value[i] = { ...scans.value[i], status: 'Completed', duration: scans.value[i].duration ?? '—' }
  const next = scans.value.findIndex((s) => !['Scanning', 'Queue', 'Waiting'].includes(s.status))
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

// Shown under the timeline heading for continuous apps.
const recurrenceLabels = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every Two Weeks', monthly: 'Monthly' }
const recurrenceLabel = computed(() =>
  app.value.scanType === 'continuous_scan' ? (recurrenceLabels[app.value.recurrence] ?? null) : null,
)

onMounted(() => {
  updateTimelineHint()
  document.addEventListener('mousedown', handleClickOutside)
})
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

// ── Vulnerability cycle tabs ───────────────────────────────────────────────
const cycleTabs = ['Active', 'Fixing', 'Mitigated', 'Tolerated', 'False positive']
const activeCycle = ref('Active')

const vulns = ref(getWebAppVulns())
const cycleCount = (cycle) => {
  // A failed scan produced no findings — every cycle reads 0 there.
  if (scans.value[selectedScan.value]?.status === 'Failed') return 0
  return vulns.value.filter((v) => v.cycle === cycle).length
}

// ── Filters ────────────────────────────────────────────────────────────────
const search = ref('')
const severityFilter = ref(null)
const validationFilter = ref(null)

const validationOptions = [
  { value: 'Unresolved', label: 'Unresolved' },
  { value: 'Queue', label: 'Queue' },
  { value: 'Scanning', label: 'Scanning' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Failed', label: 'Failed' },
]

const severityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'info', label: 'Info' },
]

const severityPill = {
  critical: { label: 'Critical', bg: '#F9D0D0', color: '#9B1C1C' },
  high: { label: 'High', bg: '#FDE8E8', color: '#C81E1E' },
  medium: { label: 'Medium', bg: '#FEF3C7', color: '#B45309' },
  low: { label: 'Low', bg: '#E3F5E8', color: '#2F9E52' },
  info: { label: 'Info', bg: '#DFF3FC', color: '#1197C2' },
}

const cyclePill = {
  Active: { bg: '#fee2e2', color: '#dc2626' },
  Fixing: { bg: '#fef3c7', color: '#b45309' },
  Mitigated: { bg: '#dcfce7', color: '#16a34a' },
  Tolerated: { bg: '#DFF3FC', color: '#1197C2' },
  'False positive': { bg: '#ECEEF0', color: '#5C6470' },
}

const validationPill = {
  Unresolved: { bg: '#ECEEF0', color: '#5C6470' },
  Queue:      { bg: '#DFF3FC', color: '#1197C2' },
  Scanning:   { bg: '#fef3c7', color: '#b45309' },
  Failed:     { bg: '#fee2e2', color: '#dc2626' },
  Resolved:   { bg: '#dcfce7', color: '#16a34a' },
}

// Highest severity first, always — independent of whatever order the
// underlying scan data arrives in.
const severityRank = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

const filtered = computed(() => {
  // A failed scan produced no findings.
  if (scans.value[selectedScan.value]?.status === 'Failed') return []
  let list = vulns.value.filter((v) => v.cycle === activeCycle.value)
  if (severityFilter.value) list = list.filter((v) => v.severity === severityFilter.value)
  if (validationFilter.value) list = list.filter((v) => (v.validation ?? 'Unresolved') === validationFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((v) => v.name.toLowerCase().includes(q) || v.component.toLowerCase().includes(q))
  return [...list].sort((a, b) => (severityRank[a.severity] ?? 99) - (severityRank[b.severity] ?? 99))
})

// ── Selection ──────────────────────────────────────────────────────────────
const checked = ref([])

function isChecked(id) {
  return checked.value.includes(id)
}

function toggleCheck(id) {
  checked.value = isChecked(id)
    ? checked.value.filter((c) => c !== id)
    : [...checked.value, id]
}

const allChecked = computed(() => filtered.value.length > 0 && filtered.value.every((v) => isChecked(v.id)))
const someChecked = computed(() => checked.value.length > 0 && !allChecked.value)

function toggleCheckAll() {
  checked.value = allChecked.value ? [] : filtered.value.map((v) => v.id)
}

// ── Table (reusable DataTable) ─────────────────────────────────────────────
const tableRef = ref(null)

const columns = [
  { key: 'check', label: '', width: '48px', align: 'center' },
  { key: '__index', label: '#', width: '24px', dim: true },
  { key: 'name', label: 'Vulnerability Name', width: '30%', truncate: true },
  { key: 'lastModified', label: 'Last Modified', width: '130px', dim: true, truncate: true},
  { key: 'severity', label: 'Severity', width: '100px', align: 'center' },
  { key: 'cycle', label: 'Validation Cycle', width: '150px', align: 'center' },
  { key: 'action', label: 'Actions', width: '70px', align: 'center' },
]

function rowClass(row) {
  return isChecked(row.id) ? 'scan-row--checked' : ''
}

watch([severityFilter, validationFilter, activeCycle], () => tableRef.value?.pagination.goTo(1))
watch(search, () => tableRef.value?.pagination.goTo(1))

// ── Bulk edit ──────────────────────────────────────────────────────────────
const bulkOpen = ref(false)

function bulkSetCycle(cycle) {
  vulns.value.forEach((v) => {
    if (isChecked(v.id)) v.cycle = cycle
  })
  checked.value = []
  bulkOpen.value = false
}

// ── Row action menu ────────────────────────────────────────────────────────
const openMenuId = ref(null)
const menuPos = ref({ top: 0, left: 0 })
const cycleMenuOpen = ref(false)

const openMenuRow = computed(() => vulns.value.find((v) => v.id === openMenuId.value) ?? null)

function toggleMenu(row, event) {
  if (openMenuId.value === row.id) {
    openMenuId.value = null
    cycleMenuOpen.value = false
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  menuPos.value = { top: rect.bottom + 6, left: rect.right - 176 }
  openMenuId.value = row.id
  cycleMenuOpen.value = false
}

function closeMenu() {
  openMenuId.value = null
  bulkOpen.value = false
  cycleMenuOpen.value = false
}

function setRowCycle(id, cycle) {
  const row = vulns.value.find((v) => v.id === id)
  if (row) row.cycle = cycle
  closeMenu()
}

function handleClickOutside(e) {
  if (!e.target.closest('.action-menu, .action-btn, .bulk-edit')) closeMenu()
  if (!e.target.closest('.target-modal, .target-detail-trigger')) closeTargetDetailModal()
}

const showDetailModal = ref(false)
const selectedFinding = ref(null)
const findingAutoUpload = ref(false)

function viewFinding(id) {
  closeMenu()
  findingAutoUpload.value = false
  const found = vulns.value.find((v) => v.id === id) ?? null
  selectedFinding.value = found ? { ...found, line: undefined, codeLine: undefined, url: app.value?.target, verified: true } : null
  showDetailModal.value = true
}

// Opens the finding on its Evidence tab with the Upload Evidence form ready.
function uploadEvidence(id) {
  closeMenu()
  findingAutoUpload.value = true
  const found = vulns.value.find((v) => v.id === id) ?? null
  selectedFinding.value = found ? { ...found, line: undefined, codeLine: undefined, url: app.value?.target, verified: true } : null
  showDetailModal.value = true
}

function revalidateFinding(id) {
  closeMenu()
  const row = vulns.value.find((v) => v.id === id)
  if (row) row.validation = 'Queue'
}

// ── Vulnerability Resolved modal (from the Check result button) ──────────
const showResolvedModal = ref(false)
const resolvedRow = ref(null)

function openResolvedModal(id) {
  closeMenu()
  resolvedRow.value = vulns.value.find((v) => v.id === id) ?? null
  showResolvedModal.value = true
}
function closeResolvedModal() {
  if (resolvedRow.value) {
    resolvedRow.value.validation = isStillDetected.value ? 'Unresolved' : 'Resolved'
  }
  showResolvedModal.value = false
  resolvedRow.value = null
}
function markMitigated() {
  if (resolvedRow.value) resolvedRow.value.cycle = 'Mitigated'
  closeResolvedModal()
}
const isStillDetected = computed(() => resolvedRow.value?.id === 'v1')

// ── Download Report modal (shared FindingsReportModal; this builds the file) ──
const showReportModal = ref(false)
function openReportModal() { showReportModal.value = true }

function downloadReport({ rows: findings, endpoints: eps }) {
  const rows = [['No', 'Vulnerability Name', 'Component', 'Line', 'Severity', 'Last Modified', 'Modified By']]
  findings.forEach((v, i) => {
    rows.push([i + 1, `"${v.name.replace(/"/g, '""')}"`, v.component, v.line, severityLabel(v.severity), formatShortDate(v.lastModified), v.modifiedBy])
  })
  const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `scan-report-${app.value.name.replace(/\s+/g, '-').toLowerCase()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Delete timeline modal (shared DeleteTimelineModal) ──
const showDelTlModal = ref(false)
function openDelTlModal() { showDelTlModal.value = true }
const delTlScanLabel = computed(() => {
  const s = scans.value[selectedScan.value]
  return s ? to24Hour(s.date) : ''
})
</script>

<template>
  <div class="scan-detail">
    <!-- ── Sidebar cards ──────────────────────────────────────────────── -->
    <aside class="scan-timeline">
      <section class="side-card">
        <div class="scan-timeline__head">
          <h2 class="scan-timeline__section">Scan timeline</h2>
          <span class="scan-timeline__count">{{ scans.length }} scans</span>
        </div>
        <p v-if="recurrenceLabel" class="scan-timeline__recurrence">Repeats {{ recurrenceLabel.toLowerCase() }}</p>

        <div class="scan-timeline__scrollwrap">
          <div ref="tlRef" class="scan-timeline__scroll" @scroll="updateTimelineHint">
            <div class="scan-timeline__rail" />
            <button
              v-for="(s, i) in scans"
              :key="s.id"
              type="button"
              class="scan-timeline__item"
              :class="{ 'scan-timeline__item--active': i === selectedScan, 'scan-timeline__item--disabled': s.status === 'Scanning' || s.status === 'Queue' || s.status === 'Waiting' }"
              :disabled="s.status === 'Scanning' || s.status === 'Queue' || s.status === 'Waiting'"
              @click="selectedScan = i"
            >
              <span class="scan-timeline__dot" :style="{ background: scanDot[s.status] ?? '#9aa5b1' }" />
              <span class="scan-timeline__meta">
                <span class="scan-timeline__date">{{ to24Hour(s.date) }}</span>
                <span class="scan-timeline__status">{{ rbConfirming(i) ? 'Retry this scan?' : s.status }}</span>
              </span>
              <template v-if="s.status === 'Failed' || retryDoneIndex === i">
                <div class="rb-pill" :class="rbState(i)">
                  <button
                    type="button"
                    class="rb-sync"
                    title="Retry scan"
                    aria-label="Retry scan"
                    :tabindex="rbState(i) === 'is-idle' ? 0 : -1"
                    @click.stop="openRescanConfirm(i)"
                  >
                    <IconRefresh :size="12" />
                  </button>
                  <button
                    type="button"
                    class="rb-ok"
                    title="Confirm retry"
                    aria-label="Confirm retry"
                    :tabindex="rbState(i) === 'is-confirm' ? 0 : -1"
                    @click.stop="confirmRescan"
                  >
                    <IconCheck :size="12" class="rb-tick" />
                    <span class="rb-spinner" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="rb-no"
                    title="Cancel retry"
                    aria-label="Cancel retry"
                    :tabindex="rbState(i) === 'is-confirm' ? 0 : -1"
                    @click.stop="cancelRescan"
                  >
                    <IconX :size="12" />
                  </button>
                </div>
              </template>
            </button>
          </div>
          <button
            v-show="!tlAtEnd"
            type="button"
            class="scan-timeline__more"
            @click="scrollTimelineMore"
          >
            {{ tlRemaining }} more <IconChevronDown :size="16" />
          </button>
        </div>

        <div class="scan-main__actions">
          <Transition name="rescan-swap" mode="out-in">
            <div v-if="timelineStopped" key="stopped" class="scan-stopped-note">
              <IconInfoCircle :size="16" class="scan-stopped-note__icon" />
              <span>Scanning for this target has been stopped and cannot be restarted.</span>
            </div>
            <button
              v-else-if="scanInProgress"
              key="scanning"
              type="button"
              class="btn-register btn-register--block btn-register--scanning"
              disabled
            >
              Scan in progress
            </button>
            <div v-else-if="pendingRescanType === 'main' || pendingRescanType === 'stop'" key="confirm" class="rescan-confirm-inline">
              <button
                type="button"
                class="btn-register btn-register--block btn-register--cancel"
                :disabled="rescanLoading || stopLoading"
                @click="cancelRescan"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn-register btn-register--block btn-register--proceed"
                :disabled="rescanLoading || stopLoading"
                @click="confirmRescan"
              >
                <span v-if="rescanLoading || stopLoading" class="btn-register__spinner" aria-hidden="true" />
                <span v-else>Proceed</span>
              </button>
            </div>
            <button
              v-else-if="app.scanType === 'continuous_scan' && hasActiveScan"
              key="stop"
              type="button"
              class="btn-register btn-register--block"
              @click="openStopConfirm"
            >
              Stop scanning
            </button>
            <button
              v-else-if="app.scanType === 'manual_scan'"
              key="rescan"
              type="button"
              class="btn-register btn-register--block"
              @click="() => openRescanConfirm()"
            >
              Re-scan
            </button>
          </Transition>
        </div>
      </section>

      <section class="side-card">
        <p class="scan-timeline__section">Vulnerability cycle</p>
      <div class="cycle-tabs">
        <button
          v-for="tab in cycleTabs"
          :key="tab"
          type="button"
          class="cycle-tabs__item"
          :class="{ 'cycle-tabs__item--active': tab === activeCycle }"
          @click="activeCycle = tab"
        >
          {{ tab }}
          <span class="cycle-tabs__count" :class="{ 'cycle-tabs__count--active': tab === activeCycle }">
            {{ cycleCount(tab) }}
          </span>
        </button>
      </div>
      </section>
    </aside>

    <!-- ── Main ─────────────────────────────────────────────────────── -->
    <div class="scan-main">
      <section class="scan-main__head">
      <div>
          <div class="scan-main__target">
            <span class="scan-main__target-label">Target</span>
            <h1 class="scan-main__title">{{ app.name }}</h1>
          </div>
          <div class="scan-main__meta">
            <span>Date Scanned: <b class="mono">{{ to24Hour(scans[selectedScan]?.date ?? '') }}</b></span>
            <span>Total scan time taken: <b class="mono">{{ scans[selectedScan]?.duration ?? '—' }}</b></span>
            <span>Scan Type: <b class="mono">{{ scanTypeLabel }}</b></span>
            <span v-if="recurrenceLabel">Recurrence: <b class="mono">{{ recurrenceLabel }}</b></span>
            <span>URL: <b class="mono">{{ app.target }}</b></span>
            <span>Total Vulnerabilities: <b class="mono">{{ vulns.length.toLocaleString() }}</b></span>
          </div>
        </div>
        <div class="scan-main__actions">
          <button type="button" class="btn-register target-detail-trigger" @click="toggleTargetDetailModal($event)">
            <IconInfoCircle :size="15" /> View detail
          </button>
          <button type="button" class="btn-register" @click="openReportModal">
            <IconDownload :size="15" /> Download report
          </button>
        </div>
      </section>

      <div class="scan-main__controls">
        <SearchInput v-model="search" placeholder="Search vulnerabilities" />
        <FilterDropdown v-model="severityFilter" :options="severityOptions" placeholder="Severity" />
        <FilterDropdown v-model="validationFilter" :options="validationOptions" placeholder="Validation Cycle" />
        <div class="scan-main__spacer" />
        <div class="bulk-edit">
          <button
            type="button"
            class="btn-glass"
            :disabled="!checked.length"
            @click.stop="bulkOpen = !bulkOpen"
          >
            <IconPencil :size="15" /> Bulk edit
          </button>
          <div v-if="bulkOpen && checked.length" class="bulk-edit__menu">
            <button
              v-for="tab in cycleTabs"
              :key="tab"
              type="button"
              class="bulk-edit__item"
              @click="bulkSetCycle(tab)"
            >
              Move to {{ tab }}
            </button>
          </div>
        </div>
      </div>

      <DataTable
        ref="tableRef"
        :columns="columns"
        :items="filtered"
        :row-class="rowClass"
        empty-text="No vulnerabilities in this status." :empty-icon="IconShieldSearch"
      >
        <template #pagination-info>{{ checked.length }} of {{ filtered.length }} rows selected</template>
        <template #header-check>
          <button
            type="button"
            class="check"
            :class="{ 'check--on': allChecked, 'check--indeterminate': someChecked }"
            aria-label="Select all"
            @click.stop="toggleCheckAll"
          >
            <IconCheck v-if="allChecked" :size="13" />
            <IconMinus v-else-if="someChecked" :size="13" />
          </button>
        </template>
        <template #cell-check="{ row }">
          <button
            type="button"
            class="check"
            :class="{ 'check--on': isChecked(row.id) }"
            :aria-label="`Select ${row.name}`"
            @click.stop="toggleCheck(row.id)"
          >
            <IconCheck v-if="isChecked(row.id)" :size="13" />
          </button>
        </template>
        <template #cell-severity="{ row }">
          <span
            class="sev-pill"
            :style="{ background: severityPill[row.severity]?.bg, color: severityPill[row.severity]?.color }"
          >{{ severityPill[row.severity]?.label ?? row.severity }}</span>
        </template>
        <template #cell-cycle="{ row }">
          <button
            v-if="row.validation === 'Check result'"
            type="button"
            class="val-check-btn"
            @click.stop="openResolvedModal(row.id)"
          >Check result</button>
          <span
            v-else
            class="sev-pill"
            :style="{ background: validationPill[row.validation ?? 'Unresolved']?.bg, color: validationPill[row.validation ?? 'Unresolved']?.color }"
          >{{ row.validation ?? 'Unresolved' }}</span>
        </template>
        <template #cell-lastModified="{ row }">{{ formatShortDate(row.lastModified) }}</template>
        <template #cell-action="{ row }">
          <button type="button" class="action-btn" aria-label="Actions" @click.stop="toggleMenu(row, $event)">
            <IconDotsVertical :size="16" />
          </button>
        </template>
      </DataTable>
    </div>

    <Teleport to="body">
      <div v-if="openMenuId" class="action-menu" :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }">
        <button type="button" class="action-menu__item" @click="viewFinding(openMenuId)">
          <IconArrowUpRight :size="15" />
          See Detail
        </button>
        <div class="action-menu__row">
          <button type="button" class="action-menu__item" @click.stop="cycleMenuOpen = !cycleMenuOpen">
            <IconFlag :size="15" />
            Change cycle
            <IconChevronRight :size="14" class="action-menu__chevron" />
          </button>
          <div v-if="cycleMenuOpen" class="action-menu__submenu">
            <button
              v-for="tab in cycleTabs"
              :key="tab"
              type="button"
              class="action-menu__subitem"
              :class="{ 'action-menu__subitem--active': tab === openMenuRow?.cycle }"
              @click="setRowCycle(openMenuId, tab)"
            >
              {{ tab }}
              <IconCheck v-if="tab === openMenuRow?.cycle" :size="14" />
            </button>
          </div>
        </div>
        <button
          type="button"
          class="action-menu__item"
          @click="revalidateFinding(openMenuId)"
        >
          <IconRefresh :size="15" />
          Revalidate
        </button>
        <button
          type="button"
          class="action-menu__item"
          @click="uploadEvidence(openMenuId)"
        >
          <IconUpload :size="15" />
          Upload evidence
        </button>
      </div>
    </Teleport>

    <VulnerabilityDetailModal v-model="showDetailModal" :item="selectedFinding" summary-strip hide-risk-chips hide-code-snippet heading-title="Web Application Vulnerability Details" show-revalidation-status show-validation-cycle :auto-upload="findingAutoUpload" :upload-only="findingAutoUpload" />

    <FindingsReportModal
      v-model="showReportModal"
      :findings="vulns"
      :cycles="cycleTabs"
      :no-findings="scans[selectedScan]?.status === 'Failed'"
      @download="downloadReport"
    />

    <HoldToDeleteModal
      v-model="showDelTlModal"
      above
      title="Delete timeline"
      :subject="delTlScanLabel"
      :icon="IconCalendar"
      message="and its results will be removed from the timeline immediately. Once deleted, you won't be able to view or restore this scan."
      done-title="Timeline deleted"
      @confirm="deleteScanTimeline"
    />

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showResolvedModal && !isStillDetected" class="modal-backdrop" @mousedown.self="closeResolvedModal">
          <div class="res-modal" role="dialog" aria-modal="true" aria-labelledby="res-title">
            <div class="res-modal__icon-wrap">
              <span class="res-modal__icon">
                <IconCheck :size="26" />
              </span>
            </div>

            <h2 id="res-title" class="res-modal__title">Vulnerability Resolved</h2>
            <p class="res-modal__text">This vulnerability was not found during revalidation. Move to Mitigated?</p>

            <button type="button" class="res-modal__cta" @click="markMitigated">
              Mark as Mitigated
            </button>

            <button type="button" class="res-modal__dismiss" @click="closeResolvedModal">
              Not now
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showResolvedModal && isStillDetected" class="modal-backdrop" @mousedown.self="closeResolvedModal">
          <div class="alert-modal" role="dialog" aria-modal="true" aria-labelledby="alert-title">
            <div class="alert-modal__icon-wrap">
              <span class="alert-modal__icon">
                <IconX :size="26" />
              </span>
            </div>

            <h2 id="alert-title" class="alert-modal__title">Vulnerability Still Detected</h2>
            <p class="alert-modal__text">This vulnerability was found again during revalidation. It remains unresolved.</p>

            <button type="button" class="alert-modal__dismiss" @click="closeResolvedModal">
              Close
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="target-panel-fade">
        <div v-if="showTargetDetailModal" class="target-modal" :style="{ top: `${targetDetailPos.top}px`, left: `${targetDetailPos.left}px` }">
            <div class="target-modal__head">
              <div class="target-modal__heading">
                <p class="target-modal__eyebrow">Target Details</p>
                <div class="target-modal__pills">
                  <span class="target-pill">{{ scanTypeLabels[app.scanType] ?? app.scanType }}</span>
                  <span class="target-pill"><IconBuilding :size="12" /> {{ app.owner }}</span>
                </div>
              </div>
              <button type="button" class="target-modal__close" aria-label="Close" @click="closeTargetDetailModal">
                <IconX :size="20" />
              </button>
            </div>

            <div class="target-modal__body">
              <div class="target-stat-list">
                <div class="target-stat-row">
                  <span class="target-stat-row__icon"><IconLink :size="16" /></span>
                  <div class="target-stat-row__text">
                    <p class="target-stat-row__label">Target URL</p>
                    <p class="target-stat-row__value">{{ app.target }}</p>
                  </div>
                </div>
                <div class="target-stat-row">
                  <span class="target-stat-row__icon"><IconCalendar :size="16" /></span>
                  <div class="target-stat-row__text">
                    <p class="target-stat-row__label">Date Scanned</p>
                    <p class="target-stat-row__value">{{ selectedScanParts.date }}</p>
                  </div>
                  <span v-if="selectedScanParts.time" class="target-time-pill">
                    <IconClock :size="12" /> {{ selectedScanParts.time }}
                  </span>
                </div>
                <div class="target-stat-row">
                  <span class="target-stat-row__icon"><IconBuilding :size="16" /></span>
                  <div class="target-stat-row__text">
                    <p class="target-stat-row__label">Asset Owner</p>
                    <p class="target-stat-row__value">{{ app.owner }}</p>
                  </div>
                </div>
              </div>

              <div class="target-modal__section">
                <p class="target-modal__section-label">Multi-Tags</p>
                <div class="target-modal__tag-list">
                  <span v-if="!app.tags.length" class="target-modal__empty">No tags</span>
                  <span
                    v-for="(t, i) in app.tags"
                    :key="`${t.label}-${i}`"
                    class="dv-tag"
                    :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }"
                  >{{ t.label }}</span>
                </div>
              </div>

              <div class="target-modal__section">
                <div class="target-modal__section-head">
                  <h3 class="target-modal__section-title">Severity Overview</h3>
                  <span class="target-modal__severity-total">{{ vulns.length }}</span>
                </div>
                <div class="target-modal__severity-grid">
                  <div
                    v-for="s in severityCards"
                    :key="s.key"
                    class="severity-card"
                    :style="{ background: s.bg, borderColor: s.bar }"
                  >
                    <p class="severity-card__value">{{ severityCounts[s.key] }}</p>
                    <p class="severity-card__label" :style="{ color: s.bar }">{{ s.label }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="can('delete_scan')" class="target-modal__divider" />

            <div v-if="can('delete_scan')" class="target-modal__footer">
              <p class="target-modal__footer-desc">Removes this scan and its results from the timeline.</p>
              <button type="button" class="target-modal__delete" @click="openDelTlModal">
                <IconTrash :size="13" /> Delete Timeline
              </button>
            </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss" src="./WebAppDetailView.scss"></style>
