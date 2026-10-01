<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataTable from '@/components/table/DataTable.vue'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import SearchInput from '@/components/reusable/SearchInput.vue'
import RelatedDomains from '@/components/reusable/RelatedDomains.vue'
import FindingsBadge from '@/components/reusable/FindingsBadge.vue'
import VulnerabilityDetailModal from '@/components/vulnerabilities/VulnerabilityDetailModal.vue'
import { formatShortDate } from '@/utils/helpers'
import { getDomains, getDomainScans, getDomainEndpoints, getDomainVulns, getDomainReputation, getDomainReputationEngines } from '@/mocks/assets/domain.js'
import ReputationModal from '@/components/reusable/ReputationModal.vue'
import {
  IconEye, IconDownload, IconRefresh, IconChevronDown, IconChevronRight, IconX, IconInfoCircle,
  IconDotsVertical, IconCheck, IconMinus, IconPencil, IconTrash, IconArrowUpRight, IconTag, IconScan, IconFlag,
  IconCalendar, IconClock, IconBuilding, IconLink, IconLoader2, IconUpload, IconShieldSearch, IconWorld,
} from '@tabler/icons-vue'

const route = useRoute()
const router = useRouter()

const domain = computed(() => {
  const id = Number(route.params.id)
  return getDomains().find((n) => n.id === id) ?? getDomains()[0]
})

// Domain targets show the discovered endpoint list; single-host targets show
// the vulnerability findings for that host.
const isDomain = computed(() => domain.value.targetType === 'Domain')

// ── Domain Reputation card (gauge) ─────────────────────────────────────────────
const reputation = computed(() => getDomainReputation(domain.value.id))
// On a single endpoint's findings page the score describes that host's IP.
const repTitle = computed(() => (selectedEndpoint.value ? 'IP Reputation' : 'Domain Reputation'))
// "View details" opens the per-engine breakdown modal.
const showReputationModal = ref(false)
const repEngines = computed(() => getDomainReputationEngines(domain.value.id))
const repSubject = computed(() => (selectedEndpoint.value ? (selectedEndpoint.value.ip ?? selectedEndpoint.value.endpoint) : domain.value.endpoint))
const repScore = computed(() => {
  const { total, passed } = reputation.value
  return total ? Math.round((passed / total) * 100) : 0
})
const repTone = computed(() => {
  if (repScore.value >= 80) return { label: 'Strong', color: '#63C892', bg: '#E8F7EF', fg: '#2F7D57' }
  if (repScore.value >= 50) return { label: 'Fair', color: '#F2B84B', bg: '#FDF3DC', fg: '#A26A00' }
  return { label: 'Weak', color: '#E5645F', bg: '#FDE8E8', fg: '#B42323' }
})
// Half-dial geometry: centre (120,120), 180° sweep from the left to the right.
const GAUGE_C = 120
const gaugeTicks = Array.from({ length: 9 }, (_, i) => {
  const a = Math.PI - (Math.PI * i) / 8
  return {
    x1: GAUGE_C + 52 * Math.cos(a), y1: GAUGE_C - 52 * Math.sin(a),
    x2: GAUGE_C + 64 * Math.cos(a), y2: GAUGE_C - 64 * Math.sin(a),
  }
})
const gaugeNeedle = computed(() => {
  const a = Math.PI - (Math.PI * repScore.value) / 100
  return { x: GAUGE_C + 50 * Math.cos(a), y: GAUGE_C - 50 * Math.sin(a) }
})

const tagColors = [
  { swatch: '#F26D6D', bg: '#FDE8E8', fg: '#E03131' }, { swatch: '#F2994A', bg: '#FDEEE0', fg: '#E8590C' },
  { swatch: '#F2C94C', bg: '#FCF3D6', fg: '#A67C00' }, { swatch: '#A8BD3A', bg: '#F1F5D6', fg: '#6B8E00' },
  { swatch: '#4CAF6D', bg: '#E3F5E8', fg: '#2F9E52' }, { swatch: '#3DBFA8', bg: '#DEF7F0', fg: '#12967D' },
  { swatch: '#3DC6F2', bg: '#DFF3FC', fg: '#1197C2' }, { swatch: '#7C93F0', bg: '#E6E9FC', fg: '#5C6BC0' },
  { swatch: '#E896BB', bg: '#FBE6F0', fg: '#C2255C' }, { swatch: '#B69AE8', bg: '#F0E6FB', fg: '#7C3FC4' },
  { swatch: '#9AA5B1', bg: '#ECEEF0', fg: '#5C6470' },
]

const scanStatusPill = {
  Completed: { bg: '#E3F5E8', color: '#2F9E52' },
  Queue: { bg: '#e0f2fe', color: '#0c4a6e' },
  Scanning: { bg: '#fef3c7', color: '#F79009' },
  Failed: { bg: '#fee2e2', color: '#dc2626' },
  Waiting: { bg: '#f3e8ff', color: '#6b21a8' },
  NotStarted: { bg: '#ECEEF0', color: '#5C6470' },
}

// ── Scan timeline ──────────────────────────────────────────────────────────
const scans = ref(getDomainScans(domain.value.id))
const selectedScan = ref(0)

// Same dotted-timeline approach as WebAppDetailView.
const scanDot = {
  Completed: '#16a34a',
  Queue: '#0284c7',
  Waiting: '#9aa5b1',
  Scanning: '#F79009',
  Failed: '#dc2626',
}

function to24Hour(dateStr) {
  const m = dateStr.match(/^(.*)\s(\d{1,2}):(\d{2})\s?(AM|PM)$/i)
  if (!m) return dateStr
  const [, datePart, hStr, min, ampm] = m
  let h = parseInt(hStr, 10)
  if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12
  if (ampm.toUpperCase() === 'AM' && h === 12) h = 0
  return `${datePart} ${String(h).padStart(2, '0')}:${min}`
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
    scans.value[index] = { ...scans.value[index], status: 'Queue' }
    selectedScan.value = index
    return
  }
  const now = new Date().toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
  scans.value.unshift({ id: `s-${Date.now()}`, date: now, status: 'Queue' })
  selectedScan.value += 1
}

// ── Re-scan confirmation (same inline pattern as WebAppDetailView) ────────
const pendingRescanType = ref(null) // 'main' | 'retry' | 'stop'
const pendingRescanIndex = ref(null)
const rescanLoading = ref(false)
const scanInProgress = ref(false)
const retryLoadingIndex = ref(null)
const retryDoneIndex = ref(null)
const stopLoading = ref(false)
const timelineStopped = ref(false)

const hasActiveScan = computed(() => scans.value.some((s) => s.status === 'Scanning'))

// The scan timeline's action button depends on the target's scan type:
// manual/singular = user-triggered one-off scans (Re-scan button); continuous
// = ongoing scans that can be stopped; scheduled/specified run on their own
// schedule and show no manual control, same as WebAppDetailView.
const scanActionKind = computed(() => {
  const t = domain.value.scanType
  if (t === 'manual_scan' || t === 'manual' || t === 'singular') return 'manual_scan'
  if (t === 'continuous_scan' || t === 'continuous') return 'continuous_scan'
  return 'none'
})

const scanTypeLabels = { manual_scan: 'Manual Scan', manual: 'Manual Scan', singular: 'Manual Scan', scheduled_scan: 'Scheduled Scan', scheduled: 'Scheduled Scan', specified: 'Scheduled Scan', continuous_scan: 'Continuous Scan', continuous: 'Continuous Scan' }
const scanTypeLabel = computed(() => scanTypeLabels[domain.value.scanType] ?? domain.value.scanType)

// Shown under the timeline heading for continuous targets.
const recurrenceLabels = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every Two Weeks', monthly: 'Monthly' }
const recurrenceLabel = computed(() =>
  domain.value.scanType === 'continuous_scan' ? (recurrenceLabels[domain.value.recurrence] ?? null) : null,
)

function stopScanning() {
  const i = scans.value.findIndex((s) => s.status === 'Scanning')
  if (i < 0) return
  scans.value[i] = { ...scans.value[i], status: 'Completed' }
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

// ── Endpoints ──────────────────────────────────────────────────────────────
const endpoints = ref(getDomainEndpoints())

const search = ref('')
const multiTagFilter = ref(null)
const statusFilter = ref(null)

const multiTagOptions = computed(() => {
  const vocab = new Map()
  endpoints.value.forEach((e) => (e.tags || []).forEach((t) => vocab.set(t.label, t.colorId)))
  return [...vocab.keys()].sort().map((label) => ({ value: label, label }))
})
const statusOptions = Object.entries(scanStatusPill).map(([value, meta]) => ({
  value: value === 'NotStarted' ? 'NotStarted' : value,
  label: value === 'NotStarted' ? 'Not yet started' : value,
}))

const filtered = computed(() => {
  let list = endpoints.value
  if (multiTagFilter.value) list = list.filter((e) => (e.tags || []).some((t) => t.label === multiTagFilter.value))
  if (statusFilter.value) list = list.filter((e) => e.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((e) => e.ip.includes(q) || e.endpoint.toLowerCase().includes(q) || e.owner.toLowerCase().includes(q))
  return list
})

// ── Table (reusable DataTable) ─────────────────────────────────────────────
const tableRef = ref(null)

const columns = [
  { key: '__index', label: '#', width: '52px', dim: true, mono: true },
  { key: 'ip', label: 'Endpoint', width: '16%', mono: true, truncate: true },
  { key: 'relatedDomain', label: 'Related Domain', width: '22%', truncate: true },
  { key: 'totalSeverity', label: 'Total Findings', width: '140px', align: 'center' },
  { key: 'tags', label: 'Multi-Tags', width: '20%' },
  { key: 'status', label: 'Scanning Status', width: '150px', align: 'center' },
  { key: 'view', label: 'Action', width: '76px', align: 'center' },
]

// ── Endpoint row menu (Domain layout) ────────────────────────────────────────
const epMenuId = ref(null)
const epMenuPos = ref({ top: 0, left: 0 })

function toggleEpMenu(row, event) {
  if (epMenuId.value === row.id) {
    epMenuId.value = null
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  epMenuPos.value = { top: rect.bottom + 6, left: rect.right - 176 }
  epMenuId.value = row.id
}

function closeEpMenu() {
  epMenuId.value = null
}

// Re-scan is only offered for endpoints whose last scan failed.
const epMenuFailed = computed(() => endpoints.value.find((e) => e.id === epMenuId.value)?.status === 'Failed')

function rescanEndpoint(id) {
  const row = endpoints.value.find((e) => e.id === id)
  closeEpMenu()
  if (!row) return
  row.status = 'Scanning'
}

function deleteEndpoint(id) {
  closeEpMenu()
  endpoints.value = endpoints.value.filter((e) => e.id !== id)
}

// ── Endpoint tag popover (Domain layout) ─────────────────────────────────────
const epTagFor = ref(null)
const epTagPos = ref({ top: 0, left: 0 })
const epTagQuery = ref('')
const epTagNewColor = ref(4)
const epCreatedTags = ref([])

const epTagVocab = computed(() => {
  const m = new Map()
  endpoints.value.forEach((e) => (e.tags || []).forEach((t) => m.set(t.label, t.colorId)))
  epCreatedTags.value.forEach((t) => m.set(t.label, t.colorId))
  return [...m.entries()].map(([label, colorId]) => ({ label, colorId, bg: tagColors[colorId].bg, fg: tagColors[colorId].fg }))
})
const epFilteredTagVocab = computed(() => {
  const q = epTagQuery.value.trim().toLowerCase()
  if (!q) return epTagVocab.value
  return epTagVocab.value.filter((t) => t.label.toLowerCase().includes(q))
})
const epTagRow = computed(() => endpoints.value.find((e) => e.id === epTagFor.value) || null)

function manageEpTags(id) {
  const row = endpoints.value.find((e) => e.id === id)
  const pos = { ...epMenuPos.value }
  closeEpMenu()
  if (!row) return
  epTagFor.value = row.id
  epTagQuery.value = ''
  epTagPos.value = { top: pos.top, left: Math.max(8, Math.min(pos.left, window.innerWidth - 288)) }
}

// Same pattern as WebAppView's inline "Add tag" cell button.
function openEpTagPopover(row, e) {
  epTagFor.value = row.id
  epTagQuery.value = ''
  const rect = e.currentTarget.getBoundingClientRect()
  epTagPos.value = { top: rect.bottom + 6, left: Math.max(8, Math.min(rect.left, window.innerWidth - 288)) }
}

function closeEpTagPopover() { epTagFor.value = null }

function pickEpExistingTag(row, tag) {
  if (!row.tags.some((t) => t.label === tag.label)) row.tags.push({ label: tag.label, colorId: tag.colorId })
}

function createEpRowTag(row) {
  const label = epTagQuery.value.trim()
  if (!label || row.tags.some((t) => t.label === label)) return
  const entry = { label, colorId: epTagNewColor.value }
  epCreatedTags.value.push(entry)
  row.tags.push(entry)
  epTagQuery.value = ''
}

function removeEpRowTag(row, label) {
  row.tags = row.tags.filter((t) => t.label !== label)
}

// ── Endpoint findings mode (Domain “See Details” target) ─────────────────────
// The open endpoint is mirrored to ?view=findings&ep=<id> so the navbar
// breadcrumb gains an “Endpoint Findings” level (same tabQuery pattern as
// the Company page) and the view survives refresh.
const selectedEndpoint = ref(null)

function openEndpointFindings(row) {
  closeEpMenu()
  router.push({ query: { view: 'findings', ep: row.id } })
}

watch(() => route.params.id, () => {
  scans.value = getDomainScans(domain.value.id)
  selectedScan.value = 0
  scanInProgress.value = false
  timelineStopped.value = false
  pendingRescanType.value = null
  pendingRescanIndex.value = null
  retryLoadingIndex.value = null
  retryDoneIndex.value = null
  router.replace({ query: {} })
})

watch(() => route.query, (query) => {
  if (query.view === 'findings' && query.ep) {
    const ep = endpoints.value.find((e) => e.id === query.ep) ?? null
    if (ep?.id !== selectedEndpoint.value?.id) {
      selectedEndpoint.value = ep
      epChecked.value = []
      epBulkOpen.value = false
    }
  } else if (selectedEndpoint.value) {
    selectedEndpoint.value = null
    epChecked.value = []
    epBulkOpen.value = false
  }
}, { immediate: true })

// Sum of every endpoint's findings (the Total Findings column); failed scans have none.
const totalFindings = computed(() => endpoints.value.reduce((n, e) => n + (e.status === 'Failed' ? 0 : Number(e.totalSeverity) || 0), 0))

// Target domain first, then any extra subdomains this endpoint also serves.
function relatedFor(row) {
  return [domain.value.endpoint, ...(row.relatedPrefixes ?? []).map((p) => `${p}.${domain.value.endpoint}`)]
}

// ── Domain Reputation detail view (?view=reputation) ─────────────────────
// Full-width endpoint table opened from the reputation card's "View details".
const showReputation = computed(() => route.query.view === 'reputation' && isDomain.value && !selectedEndpoint.value)

// Opened from "See Details" in an endpoint row's action menu.
function openReputationDetail() {
  closeEpMenu()
  router.push({ query: { view: 'reputation' } })
}

const drStatusFilter = ref(null)
const drSearch = ref('')
const drColumns = [
  { key: '__index', label: 'No.', width: '48px', dim: true },
  { key: 'ip', label: 'Endpoint', width: '20%', mono: true, truncate: true },
  { key: 'relatedDomain', label: 'Related Domain', width: '22%', truncate: true },
  { key: 'tags', label: 'Multi-Tags', width: '22%' },
  { key: 'totalSeverity', label: 'Total Findings', width: '140px', align: 'center' },
  { key: 'status', label: 'Scanning Status', width: '150px', align: 'center' },
  { key: 'view', label: 'Action', width: '76px', align: 'center' },
]
// Display copies: the reputation scan is still queued for every endpoint, so
// severity totals aren't ready yet. Tag/menu handlers look rows up by id in
// `endpoints`, so tags added here stay in sync with the main table.
const drRows = computed(() => {
  let list = endpoints.value.map((e) => ({ ...e, relatedDomain: domain.value.endpoint, status: 'Queue' }))
  if (drStatusFilter.value) list = list.filter((e) => e.status === drStatusFilter.value)
  const q = drSearch.value.trim().toLowerCase()
  if (q) list = list.filter((e) => e.ip.includes(q) || e.relatedDomain.toLowerCase().includes(q))
  return list
})

const epSearch = ref('')
const epSeverity = ref(null)

const epFiltered = computed(() => {
  let list = vulns.value.filter((v) => v.cycle === activeCycle.value)
  if (epSeverity.value) list = list.filter((v) => v.severity === epSeverity.value)
  const q = epSearch.value.trim().toLowerCase()
  if (q) list = list.filter((v) => v.name.toLowerCase().includes(q))
  return list
})

const epColumns = [
  { key: 'check', label: '', width: '32px', align: 'center', compact: true },
  { key: '__index', label: '#', width: '24px', dim: true },
  { key: 'name', label: 'Vulnerability Name', width: '36%', truncate: true },
  { key: 'lastModified', label: 'Last Modified', width: '120px', dim: true },
  { key: 'severity', label: 'Severity', width: '96px', align: 'center' },
  { key: 'validation', label: 'Validation Cycle', width: '150px', align: 'center' },
  { key: 'action', label: 'Action', width: '70px', align: 'center' },
]

const epChecked = ref([])

function epIsChecked(id) {
  return epChecked.value.includes(id)
}

function epToggleCheck(id) {
  epChecked.value = epIsChecked(id)
    ? epChecked.value.filter((c) => c !== id)
    : [...epChecked.value, id]
}

const epAllChecked = computed(() => epFiltered.value.length > 0 && epFiltered.value.every((v) => epIsChecked(v.id)))
const epSomeChecked = computed(() => epChecked.value.length > 0 && !epAllChecked.value)

function epToggleCheckAll() {
  epChecked.value = epAllChecked.value ? [] : epFiltered.value.map((v) => v.id)
}

function epRowClass(row) {
  return epIsChecked(row.id) ? 'scan-row--checked' : ''
}

const epBulkOpen = ref(false)

function epBulkSetCycle(cycle) {
  vulns.value.forEach((v) => {
    if (epIsChecked(v.id)) v.cycle = cycle
  })
  epChecked.value = []
  epBulkOpen.value = false
}

// ── Endpoint findings CSV export now goes through the Download Report
// filter modal (same as WebAppDetailView) — see Header actions below.

// ── Endpoint detail modal (read-only, Domain layout) ─────────────────────────

// ── Endpoint detail modal (read-only, Domain layout) ─────────────────────────
const detailRow = ref(null)

function viewEndpoint(row) {
  detailRow.value = row
}

function closeDetail() {
  detailRow.value = null
}

// ── Single-host vulnerabilities (IP Single layout) ─────────────────────────
const vulns = ref(getDomainVulns())
const activeCycle = ref('Active')
const cycleTabs = ['Active', 'Fixing', 'Mitigated', 'Tolerated', 'False Positive']
const cycleCount = (cycle) => vulns.value.filter((v) => v.cycle === cycle).length

const vulnSearch = ref('')
const vulnSeverityFilter = ref(null)

const vulnSeverityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'info', label: 'Info' },
]

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

const sevPill = {
  high: { label: 'High', bg: '#FDE8E8', color: '#C81E1E' },
  medium: { label: 'Medium', bg: '#FEF3C7', color: '#B45309' },
  low: { label: 'Low', bg: '#E3F5E8', color: '#2F9E52' },
  info: { label: 'Info', bg: '#DFF3FC', color: '#1197C2' },
}

// Same validation palette as WebAppDetailView so Queue/Resolved/etc. get
// their color the moment Revalidate (or any cycle action) sets them.
const validationPill = {
  Unresolved: { bg: '#ECEEF0', color: '#5C6470' },
  'Check result': { bg: '#fee2e2', color: '#dc2626' },
  Queue:      { bg: '#DFF3FC', color: '#1197C2' },
  Scanning:   { bg: '#fef3c7', color: '#b45309' },
  Failed:     { bg: '#fee2e2', color: '#dc2626' },
  Resolved:   { bg: '#dcfce7', color: '#16a34a' },
}

const filteredVulns = computed(() => {
  let list = vulns.value.filter((v) => v.cycle === activeCycle.value)
  if (vulnSeverityFilter.value) list = list.filter((v) => v.severity === vulnSeverityFilter.value)
  const q = vulnSearch.value.trim().toLowerCase()
  if (q) list = list.filter((v) => v.name.toLowerCase().includes(q))
  return list
})

const vulnColumns = [
  { key: 'check', label: '', width: '32px', align: 'center', compact: true },
  { key: '__index', label: '#', width: '24px', dim: true },
  { key: 'name', label: 'Vulnerability Name', width: '36%', truncate: true },
  { key: 'lastModified', label: 'Last Modified', width: '120px', dim: true },
  { key: 'severity', label: 'Severity', width: '96px', align: 'center' },
  { key: 'validation', label: 'Validation Cycle', width: '150px', align: 'center' },
  { key: 'action', label: 'Action', width: '70px', align: 'center' },
]

const vulnChecked = ref([])

function vulnIsChecked(id) {
  return vulnChecked.value.includes(id)
}

function vulnToggleCheck(id) {
  vulnChecked.value = vulnIsChecked(id)
    ? vulnChecked.value.filter((c) => c !== id)
    : [...vulnChecked.value, id]
}

const vulnAllChecked = computed(() => filteredVulns.value.length > 0 && filteredVulns.value.every((v) => vulnIsChecked(v.id)))
const vulnSomeChecked = computed(() => vulnChecked.value.length > 0 && !vulnAllChecked.value)

function vulnToggleCheckAll() {
  vulnChecked.value = vulnAllChecked.value ? [] : filteredVulns.value.map((v) => v.id)
}

function vulnRowClass(row) {
  return vulnIsChecked(row.id) ? 'scan-row--checked' : ''
}

// ── Bulk edit (IP Single layout) ───────────────────────────────────────────
const vulnBulkOpen = ref(false)

function vulnBulkSetCycle(cycle) {
  vulns.value.forEach((v) => {
    if (vulnIsChecked(v.id)) v.cycle = cycle
  })
  vulnChecked.value = []
  vulnBulkOpen.value = false
}

// ── Finding action menu + detail modal (IP Single layout) ──────────────────
const vulnMenuId = ref(null)
const vulnMenuPos = ref({ top: 0, left: 0 })
const vulnCycleMenuOpen = ref(false)

const vulnMenuRow = computed(() => vulns.value.find((v) => v.id === vulnMenuId.value) ?? null)

function toggleVulnMenu(row, event) {
  if (vulnMenuId.value === row.id) {
    vulnMenuId.value = null
    vulnCycleMenuOpen.value = false
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  vulnMenuPos.value = { top: rect.bottom + 6, left: rect.right - 176 }
  vulnMenuId.value = row.id
  vulnCycleMenuOpen.value = false
}

function closeVulnMenu() {
  vulnMenuId.value = null
  vulnBulkOpen.value = false
  vulnCycleMenuOpen.value = false
}

function setVulnCycle(id, cycle) {
  const row = vulns.value.find((v) => v.id === id)
  if (row) row.cycle = cycle
  closeVulnMenu()
}

const showFindingModal = ref(false)
const selectedFinding = ref(null)

const findingAutoUpload = ref(false)

function viewFinding(id) {
  closeVulnMenu()
  findingAutoUpload.value = false
  selectedFinding.value = vulns.value.find((v) => v.id === id) ?? null
  showFindingModal.value = true
}

// Opens the finding on its Evidence tab with the Upload Evidence form ready.
function uploadEvidence(id) {
  closeVulnMenu()
  findingAutoUpload.value = true
  selectedFinding.value = vulns.value.find((v) => v.id === id) ?? null
  showFindingModal.value = true
}

function deleteFinding(id) {
  closeVulnMenu()
  vulns.value = vulns.value.filter((v) => v.id !== id)
  vulnChecked.value = vulnChecked.value.filter((c) => c !== id)
}

// Queues the finding for revalidation (same as WebAppDetailView).
function revalidateFinding(id) {
  const row = vulns.value.find((v) => v.id === id)
  closeVulnMenu()
  if (!row) return
  row.validation = 'Queue'
}

// ── Single-host CSV export now goes through the Download Report
// filter modal (same as WebAppDetailView) — see Header actions below.

function handleVulnClickOutside(e) {
  if (!e.target.closest('.action-menu, .action-btn, .bulk-edit')) {
    closeVulnMenu()
    closeEpMenu()
  }
  if (!e.target.closest('.tag-popover')) closeEpTagPopover()
  if (!e.target.closest('.target-modal, .target-detail-trigger')) closeTargetDetailModal()
}

onMounted(() => {
  updateTimelineHint()
  document.addEventListener('mousedown', handleVulnClickOutside)
})
onUnmounted(() => document.removeEventListener('mousedown', handleVulnClickOutside))

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

// Splits "9 Feb 2025 8:30 AM" into date/time parts for the Target Details modal.
const selectedScanParts = computed(() => {
  const raw = scans.value[selectedScan.value]?.date ?? ''
  const m = raw.match(/^(.*)\s(\d{1,2}:\d{2}\s?[AP]M)$/i) ?? raw.match(/^(.*)\s(\d{1,2}:\d{2})$/)
  return m ? { date: m[1], time: m[2] } : { date: raw, time: '' }
})

function deleteScanTimeline() {
  if (!scans.value.length) return
  scans.value.splice(selectedScan.value, 1)
  // Land on the first selectable scan (skip in-progress/queued rows).
  const i = scans.value.findIndex((s) => !['Scanning', 'Queue', 'Waiting'].includes(s.status))
  selectedScan.value = Math.max(0, i)
  closeTargetDetailModal()
}

// ── Download Report filter modal (multi-select, horizontal, same as WebAppDetailView) ──
// All three header buttons (Domain list, endpoint findings, IP Single) open
// this modal; the export covers the vulnerability list filtered by the
// selected severities + cycles.
const showReportModal = ref(false)
const repSev = ref([])
const repCycle = ref([])

const repSeverityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'info', label: 'Info' },
]

const repSeverityPill = {
  critical: { label: 'Critical', bg: '#F9D0D0', color: '#9B1C1C' },
  high: { label: 'High', bg: '#FDE8E8', color: '#C81E1E' },
  medium: { label: 'Medium', bg: '#FEF3C7', color: '#B45309' },
  low: { label: 'Low', bg: '#E3F5E8', color: '#2F9E52' },
  info: { label: 'Info', bg: '#DFF3FC', color: '#1197C2' },
}

const repSeverityRank = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

function toggleRepSev(v) {
  repSev.value = repSev.value.includes(v)
    ? repSev.value.filter((x) => x !== v)
    : [...repSev.value, v]
}
function toggleRepCycle(v) {
  repCycle.value = repCycle.value.includes(v)
    ? repCycle.value.filter((x) => x !== v)
    : [...repCycle.value, v]
}
function selectAllRepSev() {
  repSev.value = repSeverityOptions.map((o) => o.value)
}
function selectAllRepCycle() {
  repCycle.value = [...cycleTabs]
}

// Each option's own count (across all findings, not the current filter) and
// a mini bar sized relative to the busiest option in its own column.
const repSevCounts = computed(() =>
  Object.fromEntries(repSeverityOptions.map((o) => [o.value, vulns.value.filter((v) => v.severity === o.value).length])),
)
const repCycleCounts = computed(() =>
  Object.fromEntries(cycleTabs.map((t) => [t, vulns.value.filter((v) => v.cycle === t).length])),
)
const repSevMax = computed(() => Math.max(1, ...Object.values(repSevCounts.value)))
const repCycleMax = computed(() => Math.max(1, ...Object.values(repCycleCounts.value)))
const repRows = computed(() => {
  // A failed scan produced no findings.
  if (scans.value[selectedScan.value]?.status === 'Failed') return []
  return vulns.value
    .filter((v) =>
      repSev.value.includes(v.severity) &&
      repCycle.value.includes(v.cycle),
    )
    .sort((a, b) => (repSeverityRank[a.severity] ?? 99) - (repSeverityRank[b.severity] ?? 99))
})
function openReportModal() {
  repSev.value = []
  repCycle.value = []
  repEndpoints.value = []
  reportDownloadState.value = 'idle'
  showReportModal.value = true
}
const reportDownloadState = ref('idle') // 'idle' | 'loading'

// Endpoint picker — only the Domain endpoint-list view offers it (the other
// views already show a single endpoint/host, so they export just that one).
const showEndpointPicker = computed(() => isDomain.value && !selectedEndpoint.value)
const repEndpoints = ref([])

function toggleRepEndpoint(id) {
  repEndpoints.value = repEndpoints.value.includes(id)
    ? repEndpoints.value.filter((x) => x !== id)
    : [...repEndpoints.value, id]
}
function selectAllRepEndpoints() {
  repEndpoints.value = endpoints.value.map((e) => e.id)
}

// Endpoints covered by the export: the picked ones in the Domain list view,
// otherwise the single endpoint/host currently on screen.
const reportEndpointList = computed(() => {
  if (showEndpointPicker.value) {
    const sel = new Set(repEndpoints.value)
    return endpoints.value.filter((e) => sel.has(e.id))
  }
  const ep = selectedEndpoint.value?.endpoint ?? domain.value.endpoint
  return [{ id: 'single', endpoint: ep }]
})

function submitReportDownload() {
  if (!repRows.value.length || !reportEndpointList.value.length || reportDownloadState.value !== 'idle') return
  reportDownloadState.value = 'loading'
  setTimeout(() => {
    const rows = [['No', 'Endpoint', 'Vulnerability Name', 'Component', 'Line', 'Severity', 'Last Modified', 'Modified By']]
    let n = 0
    reportEndpointList.value.forEach((ep) => {
      repRows.value.forEach((v) => {
        n += 1
        rows.push([n, ep.endpoint, `"${v.name.replace(/"/g, '""')}"`, v.component, v.line, repSeverityPill[v.severity]?.label ?? v.severity, formatShortDate(v.lastModified), v.modifiedBy])
      })
    })
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scan-report-${domain.value.endpoint.replace(/[^0-9a-z.]/gi, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    reportDownloadState.value = 'idle'
    showReportModal.value = false
  }, 600)
}

// ── Delete timeline modal (hold-to-delete, like SourceCodeDetailView) ──────
const showDelTlModal = ref(false)
const delTlState = ref('idle') // 'idle' | 'loading' | 'saved'
const delTlAck = ref(false)
const delTlHolding = ref(false)
let delTlHoldTimer = null
let delTlDoneTimer = null

const delTlScanLabel = computed(() => {
  const s = scans.value[selectedScan.value]
  return s ? to24Hour(s.date) : ''
})
const delTlReady = computed(() => delTlAck.value && delTlState.value === 'idle')
const delTlButtonLabel = computed(() => {
  if (delTlState.value === 'loading') return 'Deleting…'
  if (!delTlAck.value) return 'Delete'
  return delTlHolding.value ? 'Keep holding…' : 'Hold to delete'
})
const delTlHint = computed(() => {
  if (!delTlAck.value && delTlState.value === 'idle') return 'Tick the box above to enable Delete'
  if (delTlReady.value && !delTlHolding.value) return 'Press and hold, or hold Enter'
  return ''
})

function openDelTlModal() {
  delTlState.value = 'idle'
  delTlAck.value = false
  delTlHolding.value = false
  showDelTlModal.value = true
}
function closeDelTlModal() {
  if (delTlState.value === 'loading') return
  clearTimeout(delTlHoldTimer)
  delTlHolding.value = false
  showDelTlModal.value = false
  delTlState.value = 'idle'
  delTlAck.value = false
}
function toggleDelTlAck() {
  if (delTlState.value !== 'idle') return
  delTlAck.value = !delTlAck.value
  delTlHolding.value = false
}
function doDelTl() {
  clearTimeout(delTlHoldTimer)
  delTlHolding.value = false
  delTlState.value = 'loading'
  delTlDoneTimer = setTimeout(() => {
    deleteScanTimeline()
    delTlState.value = 'saved'
  }, 1200)
}
function delTlHoldStart() {
  if (!delTlReady.value) return
  delTlHolding.value = true
  clearTimeout(delTlHoldTimer)
  delTlHoldTimer = setTimeout(doDelTl, 1000)
}
function delTlHoldEnd() {
  if (delTlHolding.value) {
    clearTimeout(delTlHoldTimer)
    delTlHolding.value = false
  }
}
function delTlKeyDown(e) {
  if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
    e.preventDefault()
    delTlHoldStart()
  }
}
function delTlKeyUp(e) {
  if (e.key === 'Enter' || e.key === ' ') delTlHoldEnd()
}
onUnmounted(() => {
  clearTimeout(delTlHoldTimer)
  clearTimeout(delTlDoneTimer)
})
</script>

<template>
  <div class="scan-detail" :class="{ 'scan-detail--wide': showReputation }">
    <!-- ── Sidebar ──────────────────────────────────────────────────── -->
    <aside v-if="!showReputation" class="scan-timeline">
      <section v-if="!selectedEndpoint" class="side-card">
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
            v-else-if="scanActionKind === 'continuous_scan' && hasActiveScan"
            key="stop"
            type="button"
            class="btn-register btn-register--block"
            @click="openStopConfirm"
          >
            Stop scanning
          </button>
          <button
            v-else-if="scanActionKind === 'manual_scan'"
            key="rescan"
            type="button"
            class="btn-register btn-register--block"
            @click="() => openRescanConfirm()"
          >
            <IconRefresh :size="14" /> Re-scan
          </button>
        </Transition>
      </section>

      <section v-if="!isDomain || selectedEndpoint" class="side-card">
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

      <section v-if="isDomain" class="side-card rep-card">
        <div class="rep-card__head">
          <h2 class="scan-timeline__section">{{ repTitle }}</h2>
          <button type="button" class="rep-card__more" @click="showReputationModal = true">View details</button>
        </div>

        <svg class="rep-gauge" viewBox="0 0 240 140" role="img" :aria-label="`${repTitle} ${repScore} percent, ${repTone.label}`">
          <path d="M 30 120 A 90 90 0 0 1 210 120" pathLength="100" class="rep-gauge__track" />
          <path
            d="M 30 120 A 90 90 0 0 1 210 120"
            pathLength="100"
            class="rep-gauge__value"
            :style="{ stroke: repTone.color }"
            :stroke-dasharray="`${repScore} 100`"
          />
          <line
            v-for="(t, i) in gaugeTicks"
            :key="i"
            :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2"
            class="rep-gauge__tick"
          />
          <line :x1="GAUGE_C" :y1="GAUGE_C" :x2="gaugeNeedle.x" :y2="gaugeNeedle.y" class="rep-gauge__needle" />
          <circle :cx="GAUGE_C" :cy="GAUGE_C" r="9" class="rep-gauge__pivot" />
        </svg>

        <div class="rep-card__score">
          <span class="rep-card__pct">{{ repScore }}%</span>
          <span class="rep-card__tone" :style="{ background: repTone.bg, color: repTone.fg }">{{ repTone.label }}</span>
        </div>

        <div class="rep-card__stats">
          <div class="rep-stat">
            <span class="rep-stat__label"><i class="rep-stat__dot" style="background:#B4C0C8" />Total Engine</span>
            <span class="rep-stat__value">{{ reputation.total }}</span>
          </div>
          <div class="rep-stat">
            <span class="rep-stat__label"><i class="rep-stat__dot" style="background:#63C892" />Passed Test</span>
            <span class="rep-stat__value">{{ reputation.passed }}</span>
          </div>
          <div class="rep-stat">
            <span class="rep-stat__label"><i class="rep-stat__dot" style="background:#C0392B" />Failed Test</span>
            <span class="rep-stat__value">{{ reputation.failed }}</span>
          </div>
        </div>
      </section>
    </aside>

    <!-- ── Main: Domain endpoint list ─────────────────────────────────── -->
    <div v-if="isDomain && !selectedEndpoint && !showReputation" class="scan-main">
      <section class="scan-main__head">
        <div>
          <div class="scan-main__target">
            <span class="scan-main__target-label">Target</span>
            <h1 class="scan-main__title">{{ domain.endpoint }}</h1>
          </div>
          <div class="scan-main__meta">
            <span>Date Scanned: <b class="mono">{{ to24Hour(scans[selectedScan]?.date ?? '') }}</b></span>
            <span>Total scan time taken: <b class="mono">{{ scans[selectedScan]?.duration ?? '—' }}</b></span>
            <span>Scan Type: <b class="mono">{{ scanTypeLabel }}</b></span>
            <span v-if="recurrenceLabel">Recurrence: <b class="mono">{{ recurrenceLabel }}</b></span>
            <span>Total Endpoint: <b class="mono">{{ endpoints.length }}</b></span>
            <span>Total Findings: <b class="mono">{{ totalFindings.toLocaleString() }}</b></span>
          </div>
        </div>
        <div class="scan-main__actions">
          <button type="button" class="btn-register" @click="openReportModal">
            <IconDownload :size="15" /> Download full report
          </button>
        </div>
      </section>

      <div class="scan-main__controls">
        <FilterDropdown v-model="multiTagFilter" :options="multiTagOptions" placeholder="Multi-Tags" />
        <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scanning Status" />
        <div class="scan-main__spacer" />
        <SearchInput v-model="search" placeholder="Search" />
      </div>

      <DataTable
        ref="tableRef"
        :columns="columns"
        :items="filtered"
        empty-text="No endpoints found." :empty-icon="IconWorld"
      >
        <template #cell-totalSeverity="{ row }">
          <FindingsBadge
            :total="row.status === 'Failed' ? '-' : row.totalSeverity"
            :counts="row.severityCounts"
            :no-tip="row.status === 'Failed'"
          />
        </template>
        <template #cell-relatedDomain="{ row }">
          <RelatedDomains :domains="relatedFor(row)" />
        </template>
        <template #cell-tags="{ row }">
          <div class="cell-tags">
            <span
              v-for="t in row.tags.slice(0, 2)"
              :key="t.label"
              class="dv-tag"
              :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }"
            >{{ t.label }}</span>
            <span v-if="row.tags.length > 2" class="tag-more">+{{ row.tags.length - 2 }}</span>
            <button v-if="!row.tags.length" type="button" class="tag-add" @click.stop="openEpTagPopover(row, $event)">Add tag</button>
          </div>
        </template>
        <template #cell-status="{ row }">
          <span
            class="status-pill"
            :style="{ background: scanStatusPill[row.status]?.bg, color: scanStatusPill[row.status]?.color }"
          >{{ row.status === 'NotStarted' ? 'Not yet started' : row.status }}</span>
        </template>
        <template #cell-view="{ row }">
          <button type="button" class="action-btn" aria-label="Actions" @click.stop="toggleEpMenu(row, $event)">
            <IconDotsVertical :size="16" />
          </button>
        </template>
      </DataTable>
    </div>

    <!-- ── Main: Domain Reputation detail (endpoint table) ─────────────── -->
    <div v-else-if="showReputation" class="scan-main">
      <section class="scan-main__head">
        <div>
          <div class="scan-main__target">
            <span class="scan-main__target-label">Target</span>
            <h1 class="scan-main__title">{{ domain.endpoint }}</h1>
          </div>
          <div class="scan-main__meta">
            <span>Timeline Scan <b class="mono">{{ to24Hour(scans[selectedScan]?.date ?? '') }}</b></span>
            <span>Scan Type <b class="mono">{{ scanTypeLabel }}</b></span>
            <span>Total Endpoint <b class="mono">{{ endpoints.length }}</b></span>
            <span>Scan Duration <b class="mono">{{ scans[selectedScan]?.duration ?? '—' }}</b></span>
          </div>
        </div>
        <div class="scan-main__actions">
          <button type="button" class="btn-register" @click="openReportModal">
            <IconDownload :size="15" /> Download Full Report
          </button>
        </div>
      </section>

      <div class="scan-main__controls">
        <FilterDropdown v-model="drStatusFilter" :options="statusOptions" placeholder="Scanning Status" />
        <div class="scan-main__spacer" />
        <SearchInput v-model="drSearch" placeholder="Search" />
      </div>

      <DataTable :columns="drColumns" :items="drRows" empty-text="No endpoints found." :empty-icon="IconWorld">
        <template #cell-relatedDomain="{ row }">
          <RelatedDomains :domains="relatedFor(row)" />
        </template>
        <template #cell-tags="{ row }">
          <div class="cell-tags">
            <span
              v-for="t in row.tags.slice(0, 2)"
              :key="t.label"
              class="dv-tag"
              :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }"
            >{{ t.label }}</span>
            <span v-if="row.tags.length > 2" class="tag-more">+{{ row.tags.length - 2 }}</span>
            <button v-if="!row.tags.length" type="button" class="tag-add" @click.stop="openEpTagPopover(row, $event)">Add tag</button>
          </div>
        </template>
        <template #cell-totalSeverity="{ row }">
          <span v-if="['Queue', 'Scanning', 'Waiting', 'NotStarted'].includes(row.status)" class="sev-pending" title="Findings are counted once the scan finishes">
            <IconLoader2 :size="16" />
          </span>
          <FindingsBadge v-else :total="row.totalSeverity" :counts="row.severityCounts" />
        </template>
        <template #cell-status="{ row }">
          <span
            class="status-pill"
            :style="{ background: scanStatusPill[row.status]?.bg, color: scanStatusPill[row.status]?.color }"
          >{{ row.status === 'NotStarted' ? 'Not yet started' : row.status }}</span>
        </template>
        <template #cell-view="{ row }">
          <button type="button" class="action-btn" aria-label="Actions" @click.stop="toggleEpMenu(row, $event)">
            <IconDotsVertical :size="16" />
          </button>
        </template>
      </DataTable>
    </div>

    <!-- ── Main: endpoint findings (Domain “See Details” target) ──────────── -->
    <div v-else-if="selectedEndpoint" class="scan-main">
      <section class="scan-main__head">
        <div>
          <div class="scan-main__target">
            <span class="scan-main__target-label">Endpoint</span>
            <h1 class="scan-main__title">{{ selectedEndpoint.ip ?? selectedEndpoint.endpoint }}</h1>
          </div>
          <div class="scan-main__meta">
            <span>Date Scanned: <b class="mono">{{ to24Hour(scans[selectedScan]?.date ?? '') }}</b></span>
            <span>Total scan time taken: <b class="mono">{{ scans[selectedScan]?.duration ?? '—' }}</b></span>
            <span>Total Vulnerabilities: <b class="mono">{{ vulns.length }}</b></span>
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
        <SearchInput v-model="epSearch" placeholder="Search vulnerabilities" />
        <FilterDropdown v-model="epSeverity" :options="vulnSeverityOptions" placeholder="Severity" />
        <div class="scan-main__spacer" />
        <div class="bulk-edit">
          <button
            type="button"
            class="btn-glass"
            :disabled="!epChecked.length"
            @click.stop="epBulkOpen = !epBulkOpen"
          >
            <IconPencil :size="15" /> Bulk edit
          </button>
          <div v-if="epBulkOpen && epChecked.length" class="bulk-edit__menu">
            <button
              v-for="tab in cycleTabs"
              :key="tab"
              type="button"
              class="bulk-edit__item"
              @click="epBulkSetCycle(tab)"
            >
              Move to {{ tab }}
            </button>
          </div>
        </div>
      </div>

      <DataTable
        :columns="epColumns"
        :items="epFiltered"
        :row-class="epRowClass"
        empty-text="No vulnerabilities found." :empty-icon="IconShieldSearch"
      >
        <template #pagination-info>{{ epChecked.length }} of {{ epFiltered.length }} rows selected</template>
        <template #header-check>
          <button
            type="button"
            class="check"
            :class="{ 'check--on': epAllChecked, 'check--indeterminate': epSomeChecked }"
            aria-label="Select all"
            @click.stop="epToggleCheckAll"
          >
            <IconCheck v-if="epAllChecked" :size="13" />
            <IconMinus v-else-if="epSomeChecked" :size="13" />
          </button>
        </template>
        <template #cell-check="{ row }">
          <button
            type="button"
            class="check"
            :class="{ 'check--on': epIsChecked(row.id) }"
            :aria-label="`Select ${row.name}`"
            @click.stop="epToggleCheck(row.id)"
          >
            <IconCheck v-if="epIsChecked(row.id)" :size="13" />
          </button>
        </template>
        <template #cell-severity="{ row }">
          <span
            class="sev-pill"
            :style="{ background: sevPill[row.severity]?.bg, color: sevPill[row.severity]?.color }"
          >{{ sevPill[row.severity]?.label ?? row.severity }}</span>
        </template>
        <template #cell-validation="{ row }">
          <span
            class="validation-pill"
            :style="{ background: validationPill[row.validation]?.bg, color: validationPill[row.validation]?.color }"
          >{{ row.validation }}</span>
        </template>
        <template #cell-lastModified="{ row }">{{ formatShortDate(row.lastModified) }}</template>
        <template #cell-action="{ row }">
          <button type="button" class="action-btn" aria-label="Actions" @click.stop="toggleVulnMenu(row, $event)">
            <IconDotsVertical :size="16" />
          </button>
        </template>
      </DataTable>
    </div>

    <!-- ── Main: IP Single vulnerabilities ────────────────────────────── -->
    <div v-else-if="!isDomain" class="scan-main">
      <section class="scan-main__head">
        <div>
          <div class="scan-main__target">
            <span class="scan-main__target-label">Endpoint</span>
            <h1 class="scan-main__title">{{ domain.endpoint }}</h1>
          </div>
          <div class="scan-main__meta">
            <span>Date Scanned: <b class="mono">{{ to24Hour(scans[selectedScan]?.date ?? '') }}</b></span>
            <span>Total scan time taken: <b class="mono">{{ scans[selectedScan]?.duration ?? '—' }}</b></span>
            <span>Scan Type: <b class="mono">{{ scanTypeLabel }}</b></span>
            <span v-if="recurrenceLabel">Recurrence: <b class="mono">{{ recurrenceLabel }}</b></span>
            <span>Total Vulnerabilities: <b class="mono">{{ vulns.length }}</b></span>
          </div>
        </div>
        <div class="scan-main__actions">
          <button type="button" class="btn-register" @click="openReportModal">
            <IconDownload :size="15" /> Download full report
          </button>
        </div>
      </section>

      <div class="scan-main__controls">
        <FilterDropdown v-model="vulnSeverityFilter" :options="vulnSeverityOptions" placeholder="Severity" />
        <div class="scan-main__spacer" />
        <SearchInput v-model="vulnSearch" placeholder="Search" />
        <div class="bulk-edit">
          <button
            type="button"
            class="btn-register"
            :disabled="!vulnChecked.length"
            @click.stop="vulnBulkOpen = !vulnBulkOpen"
          >
            Bulk Edit <IconChevronDown :size="14" />
          </button>
          <div v-if="vulnBulkOpen && vulnChecked.length" class="bulk-edit__menu">
            <button
              v-for="tab in cycleTabs"
              :key="tab"
              type="button"
              class="bulk-edit__item"
              @click="vulnBulkSetCycle(tab)"
            >
              Move to {{ tab }}
            </button>
          </div>
        </div>
      </div>

      <DataTable
        :columns="vulnColumns"
        :items="filteredVulns"
        :row-class="vulnRowClass"
        empty-text="No vulnerabilities in this status." :empty-icon="IconShieldSearch"
      >
        <template #pagination-info>{{ vulnChecked.length }} of {{ filteredVulns.length }} rows selected</template>
        <template #header-check>
          <button
            type="button"
            class="check"
            :class="{ 'check--on': vulnAllChecked, 'check--indeterminate': vulnSomeChecked }"
            aria-label="Select all"
            @click.stop="vulnToggleCheckAll"
          >
            <IconCheck v-if="vulnAllChecked" :size="13" />
            <IconMinus v-else-if="vulnSomeChecked" :size="13" />
          </button>
        </template>
        <template #cell-check="{ row }">
          <button
            type="button"
            class="check"
            :class="{ 'check--on': vulnIsChecked(row.id) }"
            :aria-label="`Select ${row.name}`"
            @click.stop="vulnToggleCheck(row.id)"
          >
            <IconCheck v-if="vulnIsChecked(row.id)" :size="13" />
          </button>
        </template>
        <template #cell-severity="{ row }">
          <span
            class="sev-pill"
            :style="{ background: sevPill[row.severity]?.bg, color: sevPill[row.severity]?.color }"
          >{{ sevPill[row.severity]?.label ?? row.severity }}</span>
        </template>
        <template #cell-modifiedBy="{ row }">
          <span class="vuln-by">
            <span class="vuln-by__name">{{ row.modifiedBy }}</span>
            <span v-if="row.modifiedEmail" class="vuln-by__email">{{ row.modifiedEmail }}</span>
          </span>
        </template>
        <template #cell-validation="{ row }">
          <span
            class="validation-pill"
            :style="{ background: validationPill[row.validation]?.bg, color: validationPill[row.validation]?.color }"
          >{{ row.validation }}</span>
        </template>
        <template #cell-lastModified="{ row }">{{ formatShortDate(row.lastModified) }}</template>
        <template #cell-action="{ row }">
          <button type="button" class="action-btn" aria-label="Actions" @click.stop="toggleVulnMenu(row, $event)">
            <IconDotsVertical :size="16" />
          </button>
        </template>
      </DataTable>
    </div>

    <Teleport to="body">
      <div v-if="epMenuId" class="action-menu" :style="{ top: `${epMenuPos.top}px`, left: `${epMenuPos.left}px` }">
        <button
          type="button"
          class="action-menu__item"
          :class="{ 'action-menu__item--disabled': epMenuFailed }"
          :disabled="epMenuFailed"
          :title="epMenuFailed ? 'Not available — this endpoint\'s scan failed' : null"
          @click="openEndpointFindings(endpoints.find((e) => e.id === epMenuId))"
        >
          <IconArrowUpRight :size="15" />
          See Details
        </button>
        <button type="button" class="action-menu__item" @click="manageEpTags(epMenuId)">
          <IconTag :size="15" />
          Manage tag
        </button>
        <button v-if="epMenuFailed" type="button" class="action-menu__item" @click="rescanEndpoint(epMenuId)">
          <IconScan :size="15" />
          Re-scan
        </button>
        <button
          type="button"
          class="action-menu__item action-menu__item--danger"
          @click="deleteEndpoint(epMenuId)"
        >
          <IconTrash :size="15" />
          Delete
        </button>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="epTagFor && epTagRow" class="tag-popover" :style="{ top: `${epTagPos.top}px`, left: `${epTagPos.left}px` }">
        <div class="tag-popover__title">Manage Multi Tags</div>
        <div class="tag-popover__current">
          <span v-for="t in epTagRow.tags" :key="t.label" class="dv-tag" :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }">
            {{ t.label }}
            <button type="button" class="dv-tag__x" @click="removeEpRowTag(epTagRow, t.label)">×</button>
          </span>
          <span v-if="!epTagRow.tags.length" class="tag-popover__empty">No tags yet.</span>
        </div>
        <input v-model="epTagQuery" type="text" class="tag-popover__search" placeholder="Find or create tag..." />
        <div class="tag-popover__list">
          <button
            v-for="t in epFilteredTagVocab"
            :key="t.label"
            type="button"
            class="tag-popover__item"
            :class="{ 'tag-popover__item--added': epTagRow.tags.some((x) => x.label === t.label) }"
            @click="pickEpExistingTag(epTagRow, t)"
          >
            <span class="dv-dot" :style="{ background: t.fg }"></span>{{ t.label }}
            <span v-if="epTagRow.tags.some((x) => x.label === t.label)" class="tag-popover__check">✓</span>
          </button>
          <div v-if="!epFilteredTagVocab.length" class="tag-popover__empty">No matches — create it below.</div>
        </div>
        <div class="tag-popover__create">
          <div class="tag-popover__colors">
            <button
              v-for="(c, i) in tagColors"
              :key="c.swatch"
              type="button"
              class="tag-popover__swatch"
              :class="{ 'tag-popover__swatch--active': epTagNewColor === i }"
              :style="{ background: c.swatch }"
              @click="epTagNewColor = i"
            ></button>
          </div>
          <button type="button" class="tag-popover__add" :disabled="!epTagQuery.trim()" @click="createEpRowTag(epTagRow)">Add</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="detailRow" class="modal-backdrop" @mousedown.self="closeDetail">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Endpoint Detail</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeDetail">
                <IconX :size="20" />
              </button>
            </div>
            <div class="create-modal__body">
              <div class="detail-field">
                <span class="detail-field__label">Endpoint</span>
                <span class="detail-field__value detail-field__value--mono">{{ detailRow.endpoint }}</span>
              </div>
              <div class="detail-field">
                <span class="detail-field__label">Asset Owner</span>
                <span class="detail-field__value">{{ detailRow.owner }}</span>
              </div>
              <div class="detail-field">
                <span class="detail-field__label">Total Findings</span>
                <span class="detail-field__value">{{ detailRow.totalSeverity }}</span>
              </div>
              <div class="detail-field">
                <span class="detail-field__label">Scanning Status</span>
                <span
                  class="status-pill"
                  :style="{ background: scanStatusPill[detailRow.status]?.bg, color: scanStatusPill[detailRow.status]?.color }"
                >{{ detailRow.status }}</span>
              </div>
              <div class="detail-field">
                <span class="detail-field__label">Multi-Tags</span>
                <div class="cell-tags cell-tags--left">
                  <span
                    v-for="t in detailRow.tags"
                    :key="t.label"
                    class="dv-tag"
                    :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }"
                  >{{ t.label }}</span>
                </div>
              </div>
              <div class="detail-field">
                <span class="detail-field__label">Vulnerability Cycle</span>
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
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <Teleport to="body">
      <div v-if="vulnMenuId" class="action-menu" :style="{ top: `${vulnMenuPos.top}px`, left: `${vulnMenuPos.left}px` }">
        <button type="button" class="action-menu__item" @click="viewFinding(vulnMenuId)">
          <IconArrowUpRight :size="15" />
          See Detail
        </button>
        <div class="action-menu__row">
          <button type="button" class="action-menu__item" @click.stop="vulnCycleMenuOpen = !vulnCycleMenuOpen">
            <IconFlag :size="15" />
            Change cycle
            <IconChevronRight :size="14" class="action-menu__chevron" />
          </button>
          <div v-if="vulnCycleMenuOpen" class="action-menu__submenu">
            <button
              v-for="tab in cycleTabs"
              :key="tab"
              type="button"
              class="action-menu__subitem"
              :class="{ 'action-menu__subitem--active': tab === vulnMenuRow?.cycle }"
              @click="setVulnCycle(vulnMenuId, tab)"
            >
              {{ tab }}
              <IconCheck v-if="tab === vulnMenuRow?.cycle" :size="14" />
            </button>
          </div>
        </div>
        <button type="button" class="action-menu__item" @click="revalidateFinding(vulnMenuId)">
          <IconRefresh :size="15" />
          Revalidate
        </button>
        <button type="button" class="action-menu__item" @click="uploadEvidence(vulnMenuId)">
          <IconUpload :size="15" />
          Upload evidence
        </button>
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showReportModal" class="modal-backdrop" @mousedown.self="showReportModal = false">
          <div class="rep-modal">
            <div class="rep-modal__head">
              <div>
                <h2 class="rep-modal__title">Download Report</h2>
                <p class="rep-modal__desc">Choose which findings to include in the PDF export.</p>
              </div>
              <button type="button" class="rep-modal__close" aria-label="Close" @click="showReportModal = false">
                <IconX :size="18" />
              </button>
            </div>

            <div v-if="showEndpointPicker" class="rep-modal__endpoints">
              <div class="rep-modal__col-head">
                <p class="rep-modal__label">Endpoints</p>
                <button type="button" class="rep-modal__selectall" @click="selectAllRepEndpoints">Select all</button>
              </div>
              <div class="rep-modal__end-list">
                <label v-for="e in endpoints" :key="e.id" class="rep-check rep-check--endpoint">
                  <input
                    type="checkbox"
                    class="rep-check__input"
                    :checked="repEndpoints.includes(e.id)"
                    @change="toggleRepEndpoint(e.id)"
                  />
                  <span class="rep-check__box" aria-hidden="true"><IconCheck :size="12" class="rep-check__icon" /></span>
                  <span class="rep-check__end">
                    <span class="rep-check__end-ip">{{ e.endpoint }}</span>
                  </span>
                  <span class="rep-check__vuln">Vulnerability: {{ vulns.length }}</span>
                </label>
              </div>
              <p class="rep-modal__end-count"><b>{{ repEndpoints.length }}</b> of {{ endpoints.length }} endpoints selected</p>
            </div>

            <div class="rep-modal__grid">
              <div class="rep-modal__col">
                <div class="rep-modal__col-head">
                  <p class="rep-modal__label">Severity</p>
                  <button type="button" class="rep-modal__selectall" @click="selectAllRepSev">Select all</button>
                </div>
                <div class="rep-modal__opts">
                  <label v-for="o in repSeverityOptions" :key="o.value" class="rep-check">
                    <input
                      type="checkbox"
                      class="rep-check__input"
                      :checked="repSev.includes(o.value)"
                      @change="toggleRepSev(o.value)"
                    />
                    <span class="rep-check__box" aria-hidden="true"><IconCheck :size="12" class="rep-check__icon" /></span>
                    <span
                      class="rep-radio__tag"
                      :style="{ background: repSeverityPill[o.value].bg, color: repSeverityPill[o.value].color }"
                    >{{ o.label }}</span>
                    <span class="rep-check__bar">
                      <span
                        class="rep-check__bar-fill"
                        :class="{ 'rep-check__bar-fill--on': repSev.includes(o.value) }"
                        :style="{ width: (repSevCounts[o.value] / repSevMax * 100) + '%' }"
                      />
                    </span>
                    <span class="rep-check__count">{{ repSevCounts[o.value] }}</span>
                  </label>
                </div>
              </div>

              <div class="rep-modal__divider" aria-hidden="true" />

              <div class="rep-modal__col">
                <div class="rep-modal__col-head">
                  <p class="rep-modal__label">Vulnerability status</p>
                  <button type="button" class="rep-modal__selectall" @click="selectAllRepCycle">Select all</button>
                </div>
                <div class="rep-modal__opts">
                  <label v-for="tab in cycleTabs" :key="tab" class="rep-check">
                    <input
                      type="checkbox"
                      class="rep-check__input"
                      :checked="repCycle.includes(tab)"
                      @change="toggleRepCycle(tab)"
                    />
                    <span class="rep-check__box" aria-hidden="true"><IconCheck :size="12" class="rep-check__icon" /></span>
                    <span class="rep-check__text">{{ tab }}</span>
                    <span class="rep-check__bar">
                      <span
                        class="rep-check__bar-fill"
                        :class="{ 'rep-check__bar-fill--on': repCycle.includes(tab) }"
                        :style="{ width: (repCycleCounts[tab] / repCycleMax * 100) + '%' }"
                      />
                    </span>
                    <span class="rep-check__count">{{ repCycleCounts[tab] }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="rep-modal__footer">
              <p class="rep-modal__count"><b>{{ repRows.length }}</b> of {{ vulns.length }} vulnerabilities selected</p>
              <div class="rep-modal__progress">
                <span
                  class="rep-modal__progress-fill"
                  :style="{ width: (vulns.length ? repRows.length / vulns.length * 100 : 0) + '%' }"
                />
              </div>

              <div class="rep-modal__actions">
                <button type="button" class="rep-btn rep-btn--cancel" @click="showReportModal = false">Cancel</button>
                <button
                  type="button"
                  class="rep-btn rep-btn--download"
                  :class="{ 'rep-btn--busy': reportDownloadState === 'loading' }"
                  :disabled="!repRows.length || (showEndpointPicker && !repEndpoints.length) || reportDownloadState !== 'idle'"
                  @click="submitReportDownload"
                >
                  <span v-if="reportDownloadState === 'loading'" class="rep-btn__spinner" />
                  <span v-else>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ReputationModal v-model="showReputationModal" :title="repTitle" :subject="repSubject" :engines="repEngines" />
    <VulnerabilityDetailModal v-model="showFindingModal" :item="selectedFinding" summary-strip :auto-upload="findingAutoUpload" :upload-only="findingAutoUpload" raw-badge hide-likelihood show-qod hide-line-of-code hide-finding-type show-validation-cycle show-solution-type hide-port-ref />
    <Teleport to="body">
      <Transition name="target-panel-fade">
        <div v-if="showTargetDetailModal" class="target-modal" :style="{ top: `${targetDetailPos.top}px`, left: `${targetDetailPos.left}px` }">
            <div class="target-modal__head">
              <div class="target-modal__heading">
                <p class="target-modal__eyebrow">Target Details</p>
                <div class="target-modal__pills">
                  <span class="target-pill">{{ domain.targetType }}</span>
                  <span class="target-pill">{{ scanTypeLabel }}</span>
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
                    <p class="target-stat-row__label">Endpoint</p>
                    <p class="target-stat-row__value">{{ selectedEndpoint ? (selectedEndpoint.ip ?? selectedEndpoint.endpoint) : domain.endpoint }}</p>
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
                    <p class="target-stat-row__label">Total Vulnerabilities</p>
                    <p class="target-stat-row__value">
                      {{ selectedEndpoint ? vulns.length : totalFindings.toLocaleString() }}
                      <span class="target-stat-row__unit">vulnerabilities</span>
                    </p>
                  </div>
                </div>
              </div>

              <div class="target-modal__section">
                <p class="target-modal__section-label">Multi-Tags</p>
                <div class="target-modal__tag-list">
                  <span
                    v-for="(t, i) in (selectedEndpoint ?? domain).tags"
                    :key="`${t.label}-${i}`"
                    class="dv-tag"
                    :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }"
                  >{{ t.label }}</span>
                  <span v-if="!((selectedEndpoint ?? domain).tags || []).length" class="tag-popover__empty">No tags yet.</span>
                </div>
              </div>

              <div v-if="selectedEndpoint" class="target-modal__section">
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

            <div v-if="!selectedEndpoint" class="target-modal__divider" />

            <div v-if="!selectedEndpoint" class="target-modal__footer">
              <p class="target-modal__footer-desc">Removes this scan and its results from the timeline.</p>
              <button type="button" class="target-modal__delete" @click="openDelTlModal">
                <IconTrash :size="13" /> Delete Timeline
              </button>
            </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDelTlModal" class="modal-backdrop modal-backdrop--above" @mousedown.self="closeDelTlModal">
          <div class="del-modal" role="dialog" aria-modal="true" aria-labelledby="del-tl-title">
            <div class="del-stack">
              <div class="del-panel" :class="{ 'del-hidden': delTlState === 'saved' }">
                <div class="del-head">
                  <span class="del-tile" :class="{ 'del-tile--acked': delTlAck }">
                    <IconTrash :size="22" />
                  </span>
                  <div class="del-titles">
                    <span id="del-tl-title" class="del-title">Delete timeline</span>
                    <span class="del-repo">
                      <IconCalendar :size="14" class="del-repo__icon" /><span class="del-ellip">{{ delTlScanLabel }}</span>
                    </span>
                  </div>
                  <button type="button" class="del-close" aria-label="Close" @click="closeDelTlModal">
                    <IconX :size="18" />
                  </button>
                </div>

                <p class="del-body">
                  <strong>{{ delTlScanLabel }}</strong> and its results will be removed from the timeline immediately.
                  Once deleted, you won't be able to view or restore this scan.
                </p>

                <button
                  type="button"
                  class="del-ack"
                  :class="{ 'del-ack--on': delTlAck }"
                  role="checkbox"
                  :aria-checked="delTlAck"
                  @click="toggleDelTlAck"
                >
                  <span class="del-box"><IconCheck :size="16" class="del-tick" /></span>
                  <span class="del-ack__text">This action is permanent and cannot be undone.</span>
                </button>

                <div class="del-actions">
                  <button type="button" class="del-btn del-btn--cancel" @click="closeDelTlModal">Cancel</button>
                  <button
                    type="button"
                    class="del-btn del-btn--delete"
                    :class="{ 'is-ready': delTlReady, 'is-holding': delTlHolding, 'is-deleting': delTlState === 'loading' }"
                    :aria-disabled="!delTlReady"
                    @pointerdown="delTlHoldStart"
                    @pointerup="delTlHoldEnd"
                    @pointerleave="delTlHoldEnd"
                    @keydown="delTlKeyDown"
                    @keyup="delTlKeyUp"
                  >
                    <span class="del-fill" aria-hidden="true" />
                    <span class="del-label"><span v-if="delTlState === 'loading'" class="del-spinner" aria-hidden="true" />{{ delTlButtonLabel }}</span>
                  </button>
                </div>
                <span class="del-hint">{{ delTlHint }}</span>
              </div>

              <div class="del-panel del-done" :class="{ 'is-shown': delTlState === 'saved' }">
                <span class="del-done__icon"><IconCheck :size="28" /></span>
                <span class="del-done__title">Timeline deleted</span>
                <span class="del-done__body"><span class="del-mono">{{ delTlScanLabel }}</span> has been removed.</span>
                <button type="button" class="del-btn del-btn--cancel del-done__btn" @click="closeDelTlModal">Done</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.scan-detail--wide {
  grid-template-columns: minmax(0, 1fr);
  > .scan-main > * { grid-column: 1; }
}

.scan-detail {
  // Header spans the full width; the table sits right and the scan timeline
  // sits at the left, top-aligned with the table toolbar.
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  column-gap: 20px;
  row-gap: 14px;
  align-items: start;

  > .scan-main { display: contents; }
  > .scan-main > * { grid-column: 2; min-width: 0; }
  > .scan-main > .scan-main__head { grid-column: 1 / -1; grid-row: 1; }
  > .scan-timeline { grid-column: 1; grid-row: 2 / span 20; }
}

// ── Sidebar ────────────────────────────────────────────────────────────────
// ── Domain Reputation detail table ─────────────────────────────────────────
.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 28px;
  padding: 0 9px;
  border-radius: 8px;
  background: var(--surface-3);
  border: 1px solid #d8dee4;
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.sev-pending {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--surface-3);
  color: var(--ink-3);

  svg { animation: sev-spin 1.1s linear infinite; }
}
@keyframes sev-spin { to { transform: rotate(360deg); } }

// ── Domain Reputation card ─────────────────────────────────────────────────────
.rep-card {
  gap: 0;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  // Same text link as Ticket Feed's "View all": red, underline slides in on hover.
  &__more {
    border: none;
    background-color: transparent;
    background-image: linear-gradient(currentColor, currentColor);
    background-size: 0% 2px;
    background-repeat: no-repeat;
    background-position: left calc(100% - 2px);
    padding: 4px 2px 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--glacia-red);
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background-size 0.25s ease, color 0.15s ease;

    &:hover {
      background-size: 100% 2px;
      color: #e01e22;
    }
  }

  &__score {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: -2px;
  }

  &__pct {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--glacia-ink);
  }

  &__tone {
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--glacia-glass-border);
  }
}

.rep-gauge {
  display: block;
  width: 100%;
  max-width: 230px;
  margin: 8px auto 0;

  &__track,
  &__value {
    fill: none;
    stroke-width: 16;
    stroke-linecap: round;
  }
  &__track { stroke: #ECEFF1; }
  &__tick { stroke: #B4C0C8; stroke-width: 2; stroke-linecap: round; }
  &__needle { stroke: #101820; stroke-width: 4; stroke-linecap: round; }
  &__pivot { fill: #101820; }
}

.rep-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;

  &__label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    color: var(--glacia-ink-dim);
    white-space: nowrap;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__value {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 16px;
    font-weight: 800;
    color: var(--glacia-ink);
  }
}

.scan-timeline {
  width: 300px;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.side-card {
  background: var(--surface);
  border: 1px solid var(--glacia-glass-border);
  border-radius: 16px;
  box-shadow: inset 0 1px 0 var(--glacia-glass-highlight), 0 4px 24px rgba(0, 0, 0, 0.07), 0 1px 6px rgba(0, 0, 0, 0.04);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scan-timeline {
  &__scrollwrap {
    position: relative;

    // Fades the last visible item into the card background so the "more"
    // pill reads as an overlay cue rather than clipping list content.
    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 44px;
      background: linear-gradient(to bottom, rgba(var(--glass-rgb), 0), var(--surface) 78%);
      pointer-events: none;
    }
  }

  &__scroll {
    height: 324px;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    display: flex;
    flex-direction: column;
    gap: 2px;
    position: relative;
    padding-bottom: 12px;
  }

  &__rail {
    position: absolute;
    left: 19px;
    top: 28px;
    bottom: 40px;
    width: 2px;
    background: var(--glacia-glass-border);
  }

  &__item {
    flex: none;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border: 0;
    border-radius: 12px;
    background: transparent;
    text-align: left;
    cursor: pointer;
    font-family: 'Manrope', 'Inter', sans-serif;
    transition: background 0.15s ease;

    &:hover:not(&--active) {
      background: rgba(var(--tint), 0.04);
    }

    &--active {
      background: var(--surface-3);
      box-shadow: 0 4px 16px -4px rgba(16, 24, 32, 0.12);
    }
  }

  &__dot {
    width: 18px;
    height: 18px;
    box-sizing: border-box;
    border-radius: 50%;
    border: 3px solid #fff;
    box-shadow: 0 0 0 1px var(--glacia-glass-border);
    flex: none;
    position: relative;
    z-index: 1;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__date {
    font-size: 13px;
    font-weight: 600;
    color: var(--glacia-ink);
    white-space: nowrap;
  }

  &__item--active &__date {
    font-weight: 700;
  }

  &__status {
    font-size: 11.5px;
    color: var(--glacia-ink-dim);
  }

  &__more {
    position: absolute;
    z-index: 1;
    left: 50%;
    bottom: 6px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 4px;
    height: 26px;
    padding: 0 10px 0 12px;
    border-radius: 999px;
    border: none;
    background: var(--glacia-red);
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 11.5px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 4px 12px -2px rgba(255, 37, 41, 0.45);
    animation: scan-timeline-more-pulse 2.2s ease-in-out infinite;
    transition: background 0.15s;

    &:hover {
      background: #e01e22;
      animation-play-state: paused;
    }
  }

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  &__count {
    font-size: 11.5px;
    color: var(--glacia-ink-dim);
    margin: 0;
  }

  &__divider {
    height: 1px;
    background: var(--glacia-glass-border);
  }

  &__section {
    font-size: 11px;
    font-weight: 700;
    color: var(--glacia-ink-dim);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0;
  }
}

@keyframes scan-timeline-more-pulse {
  0%, 100% { box-shadow: 0 4px 12px -2px rgba(255, 37, 41, 0.45), 0 0 0 0 rgba(255, 37, 41, 0.35); }
  50% { box-shadow: 0 4px 12px -2px rgba(255, 37, 41, 0.45), 0 0 0 5px rgba(255, 37, 41, 0); }
}

.btn-register {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px; padding: 0 14px;
  border-radius: var(--glacia-radius-pill); border: none;
  background: var(--glacia-red); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(255, 37, 41, 0.4); transition: background 0.15s, box-shadow 0.15s;
  &:hover:not(:disabled) { background: #e01e22; box-shadow: 0 8px 24px rgba(255, 37, 41, 0.5); }
  &:disabled { opacity: 0.45; cursor: default; }

  &--block {
    width: 100%;
  }

  &--cancel {
    background: transparent;
    color: var(--glacia-ink-dim);
    box-shadow: none;
    border: 1px solid var(--glacia-glass-border);

    &:hover {
      background: rgba(var(--tint), 0.06);
      color: var(--glacia-ink);
      box-shadow: none;
    }
  }

  &--proceed {
    background: var(--glacia-red);
    color: #fff;
    box-shadow: 0 6px 20px rgba(255, 37, 41, 0.4);

    &:hover:not(:disabled) {
      background: #e01e22;
      box-shadow: 0 8px 24px rgba(255, 37, 41, 0.5);
    }

    &:disabled {
      opacity: 0.7;
      cursor: default;
    }
  }

  &--scanning {
    background: var(--surface-3);
    color: var(--ink-3);
    box-shadow: none;
    cursor: default;

    &:hover {
      background: var(--surface-3);
      box-shadow: none;
    }
  }

  &__spinner {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(var(--glass-rgb), 0.4);
    border-top-color: #fff;
    animation: btn-register-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
}

@keyframes btn-register-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.scan-timeline__recurrence {
  margin: -6px 0 0;
  font-size: 11.5px;
  color: var(--glacia-ink-dim);
}

.scan-timeline__item--disabled {
  cursor: default;
  background: rgba(var(--tint), 0.05);

  &:hover {
    background: rgba(var(--tint), 0.05);
  }
}

.scan-stopped-note {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: #fef6e4;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.5;
  color: #7c5a12;

  &__icon {
    flex-shrink: 0;
    color: #e8a13d;
    margin-top: 1px;
  }
}

// Re-scan ↔ Cancel/Proceed ↔ Scan-in-progress transform animation
.rescan-swap-enter-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.rescan-swap-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.rescan-swap-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}
.rescan-swap-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

// Inline re-scan confirmation (button transforms into Cancel/Proceed)
.rescan-confirm-inline {
  display: flex;
  gap: 8px;
  width: 100%;

  .btn-register {
    flex: 1;
  }
}

// Failed-scan retry pill — same pattern as WebAppDetailView
.rb-pill {
  position: relative;
  flex: none;
  width: 28px;
  height: 28px;
  margin-left: auto;
  border-radius: 999px;
  background: rgba(220, 38, 38, 0.1);
  transition: width 420ms cubic-bezier(0.65, 0, 0.35, 1), background 300ms ease,
    opacity 260ms ease, transform 320ms cubic-bezier(0.65, 0, 0.35, 1);
}
.rb-pill.is-confirm {
  width: 58px;
  background: var(--gray-100);
}
.rb-pill.is-loading {
  background: transparent;
}
.rb-pill.is-done {
  background: transparent;
  opacity: 0;
  transform: scale(0.4);
}

.rb-pill button {
  position: absolute;
  border: 0;
  padding: 0;
  border-radius: 999px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rb-sync {
  left: 0;
  top: 0;
  width: 28px;
  height: 28px;
  background: transparent;
  color: #dc2626;
  transition: opacity 180ms ease, transform 360ms cubic-bezier(0.65, 0, 0.35, 1);
}
.rb-pill:not(.is-idle) .rb-sync {
  opacity: 0;
  transform: rotate(-180deg) scale(0.4);
  pointer-events: none;
}

.rb-ok {
  left: 2px;
  top: 2px;
  width: 24px;
  height: 24px;
  background: var(--glacia-red);
  color: #fff;
  box-shadow: 0 6px 14px -6px rgba(255, 37, 41, 0.55);
  opacity: 0;
  transform: scale(0.4);
  pointer-events: none;
  transition: opacity 220ms ease, transform 380ms cubic-bezier(0.34, 1.3, 0.64, 1), background 200ms ease;
}
.is-confirm .rb-ok {
  opacity: 1;
  transform: none;
  pointer-events: auto;
  transition-delay: 60ms;
}
.is-confirm .rb-ok:hover {
  filter: brightness(0.92);
}
.is-loading .rb-ok {
  opacity: 1;
  transform: none;
  cursor: default;
}

.rb-tick {
  transition: opacity 180ms ease, transform 260ms cubic-bezier(0.65, 0, 0.35, 1);
}
.is-loading .rb-tick {
  opacity: 0;
  transform: scale(0.4);
}

.rb-spinner {
  position: absolute;
  left: 6px;
  top: 6px;
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border-radius: 50%;
  border: 2px solid rgba(var(--glass-rgb), 0.35);
  border-top-color: #fff;
  animation: rb-spin 700ms linear infinite;
  opacity: 0;
  transition: opacity 200ms ease 120ms;
}
.is-loading .rb-spinner {
  opacity: 1;
}

.rb-no {
  left: 32px;
  top: 2px;
  width: 24px;
  height: 24px;
  background: var(--surface);
  color: #5b6470;
  box-shadow: 0 1px 3px rgba(16, 24, 32, 0.12);
  opacity: 0;
  transform: scale(0.4);
  pointer-events: none;
  transition: opacity 200ms ease, transform 340ms cubic-bezier(0.34, 1.3, 0.64, 1);
}
.is-confirm .rb-no {
  opacity: 1;
  transform: none;
  pointer-events: auto;
  transition-delay: 140ms;
}
.is-confirm .rb-no:hover {
  color: var(--glacia-ink);
}
.is-loading .rb-no {
  transform: translateX(-14px) scale(0.3);
}

@keyframes rb-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .rb-pill, .rb-pill * {
    transition-duration: 1ms !important;
    animation-duration: 1ms !important;
  }
}

.btn-glass {
  display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px;
  border-radius: var(--glacia-radius-pill); border: 1px solid var(--glacia-glass-border);
  background: var(--glacia-glass-fill-strong); color: var(--glacia-ink);
  font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0;
  &:hover:not(:disabled) { border-color: var(--glacia-red); color: var(--glacia-red); }
  &:disabled { opacity: 0.45; cursor: default; }
}

// ── Vertical cycle tabs (same approach as WebAppDetailView) ─────────────────
.cycle-tabs {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 38px;
    padding: 0 12px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--glacia-ink-dim);
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;

    &--active {
      background: var(--surface-3);
      color: var(--glacia-ink);
    }
  }

  &__count {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 10px;
    width: 22px;
    height: 22px;
    padding: 0;
    border-radius: 50%;
    background: rgba(var(--tint), 0.06);
    color: var(--glacia-ink-dim);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-sizing: border-box;

    &--active {
      background: var(--glacia-red);
      color: #fff;
    }
  }
}

.bulk-edit {
  position: relative;

  &__menu {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    z-index: 200;
    min-width: 190px;
    padding: 6px;
    background: var(--surface);
    border: 1px solid var(--glacia-glass-border);
    border-radius: 12px;
    box-shadow: 0 16px 40px -8px rgba(16, 24, 32, 0.28);
  }

  &__item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: 8px;
    background: transparent;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Manrope', 'Inter', sans-serif;
    color: var(--glacia-ink);
    cursor: pointer;
    text-align: left;

    &:hover {
      background: rgba(255, 37, 41, 0.06);
    }
  }
}

// ── Vuln table cells (IP Single layout) ────────────────────────────────────
:deep(.scan-row--checked td) {
  background: var(--red-soft);
}

.check {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1.5px solid var(--hairline-strong);
  background: var(--surface);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  color: #fff;
  flex: none;

  &--on,
  &--indeterminate {
    border-color: var(--glacia-red);
    background: var(--glacia-red);
  }
}

.sev-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.validation-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--surface-3);
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.vuln-by {
  display: flex;
  flex-direction: column;
  min-width: 0;

  &__name {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__email {
    font-size: 11.5px;
    color: var(--glacia-ink-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.action-menu {
  position: fixed;
  z-index: 400;
  min-width: 176px;
  padding: 6px;
  background: var(--surface);
  border: 1px solid var(--glacia-glass-border);
  border-radius: 12px;
  box-shadow: 0 16px 40px -8px rgba(16, 24, 32, 0.28);

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Manrope', 'Inter', sans-serif;
    color: var(--glacia-ink);

    &:hover {
      background: rgba(255, 37, 41, 0.06);
    }

    &--danger {
      color: var(--glacia-sev-critical);
    }

    // Not clickable (e.g. See Details on an endpoint whose scan failed).
    &--disabled,
    &--disabled:hover {
      background: var(--surface-3);
      color: #9AA5B1;
      cursor: not-allowed;
    }
  }

  &__row {
    position: relative;
  }

  &__chevron {
    margin-left: auto;
    flex-shrink: 0;
    color: var(--glacia-ink-dim);
    transition: transform 0.18s ease;

    &--open {
      transform: rotate(180deg);
    }
  }

  // Flies out to the left of the row that opened it, like a nested dropdown,
  // instead of pushing the rest of the menu down.
  &__submenu {
    position: absolute;
    top: 0;
    right: 100%;
    margin-right: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 176px;
    padding: 6px;
    background: var(--surface);
    border: 1px solid var(--glacia-glass-border);
    border-radius: 12px;
    box-shadow: 0 16px 40px -8px rgba(16, 24, 32, 0.28);
  }

  &__subitem {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Manrope', 'Inter', sans-serif;
    color: var(--glacia-ink);

    &:hover {
      background: rgba(255, 37, 41, 0.06);
    }

    &--active {
      color: var(--glacia-red);
      font-weight: 700;

      svg {
        color: var(--glacia-red);
      }
    }
  }
}

.vd-file-input {
  display: none;
}

.status-pill {
  display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; white-space: nowrap;
  flex-shrink: 0;
}

// ── Main ───────────────────────────────────────────────────────────────────
.scan-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    flex-wrap: wrap;
  }

  &__target {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  &__target-label {
    font-size: 13px;
    color: var(--glacia-ink-dim);
    font-weight: 600;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
    overflow-wrap: anywhere;
  }

  &__meta {
    display: flex;
    gap: 18px;
    font-size: 12px;
    color: var(--glacia-ink-dim);
    flex-wrap: wrap;
    margin-top: 6px;

    &--wide {
      gap: 18px;
    }

    b {
      color: var(--glacia-ink);
      font-weight: 600;
    }

    .mono {
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 11.5px;
    }
  }

  &__sep {
    color: var(--glacia-glass-border);
  }

  &__actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
  }

  &__controls {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  &__spacer {
    flex: 1;
  }
}

// ── Table cells ────────────────────────────────────────────────────────────
.cell-tags {
  display: flex; align-items: center; gap: 6px; flex-wrap: nowrap; justify-content: flex-start;
  overflow: hidden; min-width: 0;

  &--left {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

.dv-tag {
  padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700;
  font-family: 'Manrope', 'Inter', sans-serif; white-space: nowrap; flex-shrink: 0;
  display: inline-flex; align-items: center; gap: 4px;
}

.side-card__tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dv-tag__x {
  border: none; background: none; cursor: pointer; color: inherit;
  font-size: 13px; line-height: 1; padding: 0 0 0 2px; opacity: 0.7;
  &:hover { opacity: 1; }
}

.tag-add {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 14px; border-radius: 999px;
  border: 1.5px dashed #8a9ba8; background: transparent; font-size: 13px; font-weight: 500;
  font-family: 'Manrope', 'Inter', sans-serif; color: #64748b; cursor: pointer; white-space: nowrap;
  transition: background 0.15s ease;
  &:hover { background: rgba(100, 116, 139, 0.08); }
}

.dv-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}

.tag-popover {
  position: fixed; width: 280px; background: var(--surface); border-radius: 16px;
  box-shadow: 0 16px 40px -8px rgba(16,24,32,0.28); border: 1px solid var(--glacia-glass-border);
  padding: 14px; z-index: 400; display: flex; flex-direction: column; gap: 10px;

  &__title {
    font-size: 12px; font-weight: 700; font-family: 'Manrope', 'Inter', sans-serif;
    color: var(--glacia-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  &__current { display: flex; flex-wrap: wrap; gap: 6px; }

  &__search {
    width: 100%; height: 38px; padding: 0 12px; border-radius: 10px; box-sizing: border-box;
    border: 1px solid var(--glacia-glass-border); font-size: 13px; font-family: 'Manrope', 'Inter', sans-serif;
    outline: none; color: var(--glacia-ink);
    &::placeholder { color: var(--glacia-ink-dim); }
    &:focus { border-color: #2563EB; }
  }

  &__list { display: flex; flex-direction: column; gap: 2px; max-height: 180px; overflow-y: auto; }

  &__item {
    display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px;
    border-radius: 8px; border: none; background: transparent; font-size: 13px; font-weight: 500;
    font-family: 'Manrope', 'Inter', sans-serif; color: var(--glacia-ink); cursor: pointer; text-align: left;
    &:hover { background: rgba(255,37,41,0.06); }
    &--added { color: var(--glacia-ink-dim); }
  }

  &__check { margin-left: auto; color: #16a34a; font-weight: 700; }

  &__empty { padding: 8px 10px; font-size: 12px; color: var(--glacia-ink-dim); }

  &__create { display: flex; align-items: center; gap: 8px; }

  &__colors { display: flex; gap: 4px; flex-wrap: wrap; flex: 1; }

  &__swatch {
    width: 18px; height: 18px; border-radius: 50%; border: 2px solid transparent;
    cursor: pointer; padding: 0;
    &--active { border-color: var(--glacia-ink); }
  }

  &__add {
    padding: 8px 14px; border-radius: 9px; border: none; background: var(--glacia-red);
    color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; flex-shrink: 0;
    &:disabled { opacity: 0.4; cursor: default; }
  }
}

.tag-more {
  display: inline-flex; align-items: center; padding: 5px 9px; border-radius: 999px;
  border: none; background: var(--glacia-glass-fill-strong); color: var(--glacia-ink-dim);
  font-size: 11px; font-weight: 700; font-family: 'Manrope', 'Inter', sans-serif;
  flex-shrink: 0;
}

.action-btn {
  width: 28px; height: 28px; border-radius: 8px; border: none; background: transparent;
  color: var(--glacia-ink-dim); cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  &:hover { background: rgba(0,0,0,0.05); }
}

.modal-backdrop {
  position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 20px;
}
.modal-backdrop--above { z-index: 500; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.create-modal {
  width: 100%; max-width: 460px; background: var(--surface); border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(16,24,32,0.35); padding: 28px;
  max-height: calc(100vh - 40px);
  display: flex; flex-direction: column;
  overflow: hidden;
  &__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-shrink: 0; }
  &__title { font-family: 'Manrope', 'Inter', sans-serif; font-size: 22px; font-weight: 800; color: var(--glacia-ink); margin: 0; }
  &__close { width: 32px; height: 32px; border-radius: 8px; border: none; background: none; color: var(--glacia-ink); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; &:hover { background: rgba(0,0,0,0.05); } }
  &__body { margin-top: 8px; overflow-y: auto; min-height: 0; flex: 1 1 auto; overscroll-behavior: contain; }
}

.detail-field {
  display: flex; flex-direction: column; gap: 4px; padding: 10px 0;
  border-bottom: 1px solid var(--glacia-glass-border);

  &:last-child { border-bottom: none; }

  &__label {
    font-size: 12px; font-weight: 600; color: var(--glacia-ink-dim);
  }

  &__value {
    font-size: 14px; font-weight: 600; color: var(--glacia-ink);
    overflow-wrap: anywhere;

    &--mono {
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 13px; font-weight: 500;
    }
  }
}

@media (max-width: 1024px) {
  .scan-detail {
    grid-template-columns: minmax(0, 1fr);

    > .scan-main > * { grid-column: 1; }
    > .scan-timeline { grid-column: 1; grid-row: auto; order: 2; }
  }

  .scan-timeline {
    width: 100%;
  }
}
// ── Severity Overview (Target Details panel) ──────────────────────────────
.target-modal__section-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.target-modal__section-title {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--glacia-ink-dim);
  margin: 0;
}
.target-modal__severity-total {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(var(--tint), 0.06);
  color: var(--glacia-ink-dim);
  font-size: 9.5px;
  font-weight: 700;
}
.target-modal__severity-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}
.severity-card {
  padding: 10px 8px 12px;
  border: 1px solid transparent;
  border-radius: 9px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px -6px rgba(16, 24, 32, 0.18);
  }

  &__value {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__label {
    font-size: 10px;
    font-weight: 700;
    margin: 0;
  }
}

// ── Target Details panel (View detail, same as WebAppDetailView) ───────────
// Anchored popover — not a centered modal — so it has no backdrop and fades
// in place near the button that opened it.
.target-panel-fade-enter-active, .target-panel-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.target-panel-fade-enter-from, .target-panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.target-modal {
  position: fixed;
  z-index: 400;
  width: 400px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 40px);
  background: var(--surface);
  border-radius: 14px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  display: flex;
  flex-direction: column;
  font-size: 12px;

  // Small pointer triangle connecting the panel back to the button that
  // opened it, like a popover rather than a floating dialog.
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    right: 28px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid #fff;
    filter: drop-shadow(0 -2px 2px rgba(16, 24, 32, 0.06));
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    padding: 14px 16px 0;
    flex-shrink: 0;
  }

  &__heading {
    min-width: 0;
  }

  &__eyebrow {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--glacia-ink-dim);
    margin: 0 0 6px;
  }

  &__pills {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  &__close {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: none;
    background: none;
    color: var(--glacia-ink);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover { background: rgba(0, 0, 0, 0.05); }
  }

  &__body {
    overflow-y: auto;
    min-height: 0;
    flex: 1 1 auto;
    padding: 12px 16px 16px;
  }

  &__section {
    margin-top: 18px;
  }

  &__section-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--glacia-ink-dim);
    margin: 0 0 8px;
  }

  &__tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__divider {
    height: 1px;
    background: rgba(var(--tint), 0.1);
    margin: 0 16px;
    flex-shrink: 0;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    padding: 12px 16px 14px;
    flex-shrink: 0;
  }

  &__footer-desc {
    font-size: 11px;
    color: var(--glacia-ink-dim);
    margin: 0;
    max-width: 220px;
  }

  &__delete {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 30px;
    padding: 0 13px;
    border-radius: var(--glacia-radius-pill);
    border: 1px solid var(--glacia-sev-critical);
    background: var(--surface);
    color: var(--glacia-sev-critical);
    font-size: 11.5px;
    font-weight: 700;
    font-family: 'Manrope', 'Inter', sans-serif;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background 0.15s;

    &:hover { background: rgba(220, 38, 38, 0.06); }
  }
}

.target-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px;
  border-radius: var(--glacia-radius-pill);
  border: 1px solid rgba(var(--tint), 0.12);
  background: rgba(var(--tint), 0.04);
  color: var(--glacia-ink);
  font-size: 10.5px;
  font-weight: 600;
  white-space: nowrap;
}

.target-stat-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: var(--surface-3);
  border-radius: 16px;
}

.target-stat-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(var(--tint), 0.08);
  border-radius: 11px;
  background: var(--surface);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(var(--tint), 0.16);
    box-shadow: 0 6px 16px -8px rgba(16, 24, 32, 0.18);
  }

  &__icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: var(--blue-soft);
    color: #3B5B8C;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &__text {
    min-width: 0;
    flex: 1;
  }

  &__label {
    font-size: 11px;
    color: var(--glacia-ink-dim);
    margin: 0 0 2px;
  }

  &__value {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--glacia-ink);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__unit {
    font-size: 11px;
    font-weight: 500;
    color: var(--glacia-ink-dim);
  }
}

.target-time-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 10px;
  border-radius: var(--glacia-radius-pill);
  border: 1px solid rgba(var(--tint), 0.12);
  background: rgba(var(--tint), 0.04);
  color: var(--glacia-ink);
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

// ── Download Report filter modal (same as WebAppDetailView) ─────────────
.rep-modal {
  width: 100%;
  max-width: 640px;
  background: var(--surface);
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  padding: 28px 28px 0;
  overflow: hidden;
  animation: rep-modal-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes rep-modal-bounce {
  0%   { opacity: 0; transform: scale(0.92) translateY(10px); }
  60%  { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
}

.rep-modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 20px;
}

.rep-modal__title {
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: var(--glacia-ink);
  margin: 0;
}

.rep-modal__desc {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--glacia-ink-dim);
}

.rep-modal__close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(var(--tint), 0.06);
  color: var(--glacia-ink-dim);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    background: rgba(var(--tint), 0.1);
    color: var(--glacia-ink);
  }
}

.rep-modal__grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  padding: 20px 0;
  border-top: 1px solid var(--hairline);
}

.rep-modal__divider {
  width: 1px;
  background: var(--surface-3);
}

.rep-modal__col-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.rep-modal__label {
  font-size: 15px;
  font-weight: 800;
  color: var(--glacia-ink);
  margin: 0;
}

.rep-modal__selectall {
  border: none;
  background: none;
  padding: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--glacia-red);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.rep-modal__opts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rep-check {
  display: grid;
  grid-template-columns: 22px minmax(64px, auto) 1fr 20px;
  align-items: center;
  gap: 10px;
  padding: 6px 4px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.13s;

  &:hover {
    background: rgba(var(--tint), 0.04);
  }

  &__input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  &__box {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 8px;
    border: 2px solid var(--hairline-strong);
    background: var(--surface);
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.13s, background 0.13s;
  }

  &__icon {
    color: #fff;
    opacity: 0;
    transition: opacity 0.13s;
  }

  &__input:checked + &__box {
    border-color: var(--glacia-red);
    background: var(--glacia-red);
  }

  &__input:checked + &__box &__icon {
    opacity: 1;
  }

  &__input:focus-visible + &__box {
    outline: 2px solid var(--glacia-red);
    outline-offset: 2px;
  }

  &__text {
    font-size: 14px;
    font-weight: 600;
    color: var(--glacia-ink);
  }

  &__bar {
    height: 6px;
    border-radius: 999px;
    background: var(--surface-3);
    overflow: hidden;
  }

  &__bar-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--hairline-strong);
    transition: background 0.13s;

    &--on {
      background: var(--glacia-red);
    }
  }

  &__count {
    font-size: 14px;
    font-weight: 700;
    color: var(--glacia-ink-dim);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
}

.rep-radio__tag {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 999px;
  white-space: nowrap;
  justify-self: start;
}

// ── Report modal endpoint picker (Domain list view only) ───────────────────
.rep-modal__endpoints {
  padding: 20px 0;
  border-top: 1px solid var(--hairline);
}

.rep-modal__end-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 188px;
  overflow-y: auto;
  margin-top: 4px;
  padding-right: 4px;
}

.rep-check--endpoint {
  grid-template-columns: 22px minmax(0, 1fr) auto;
}

.rep-check__vuln {
  font-size: 12px;
  font-weight: 500;
  color: var(--glacia-ink-dim);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.rep-check__end {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.rep-check__end-ip {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--glacia-ink);
  white-space: nowrap;
  flex-shrink: 0;
}

.rep-modal__end-count {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--glacia-ink-dim);

  b {
    color: var(--glacia-ink);
    font-weight: 800;
  }
}

.rep-modal__footer {
  margin: 0 -28px;
  padding: 18px 28px 24px;
  background: var(--surface-3);
  border-top: 1px solid var(--hairline);
}

.rep-modal__count {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--glacia-ink-dim);

  b {
    color: var(--glacia-ink);
    font-weight: 800;
  }
}

.rep-modal__progress {
  height: 6px;
  border-radius: 999px;
  background: var(--surface-3);
  overflow: hidden;
}

.rep-modal__progress-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--glacia-red);
  transition: width 0.2s ease;
}

.rep-modal__actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}

.rep-btn {
  flex: 1;
  height: 52px;
  border-radius: 999px;
  border: none;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Manrope', 'Inter', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &--cancel {
    background: var(--surface);
    color: var(--glacia-ink);
    border: 1px solid var(--hairline);

    &:hover {
      background: rgba(var(--tint), 0.04);
    }
  }

  &--download {
    background: #ff2e3a;
    color: #fff;
    box-shadow: 0 8px 20px -6px rgba(255, 46, 58, 0.4);

    &:hover:not(:disabled) {
      background: #e6212c;
    }

    &:disabled {
      background: var(--surface-3);
      color: #9ca3af;
      box-shadow: none;
      cursor: default;
    }

    // Mid-download still reads as "red", not "disabled" — the :disabled
    // attribute here only blocks a second click while it's in flight.
    &.rep-btn--busy:disabled {
      background: #ff2e3a;
      color: #fff;
      box-shadow: 0 8px 20px -6px rgba(255, 46, 58, 0.4);
    }
  }

  &__spinner {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid rgba(var(--glass-rgb), 0.4);
    border-top-color: #fff;
    animation: rep-btn-spin 0.7s linear infinite;
  }
}

@keyframes rep-btn-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

// ── Delete timeline modal (same hold-to-delete as Delete repository) ──────
.del-modal {
  width: min(460px, calc(100% - 40px));
  box-sizing: border-box;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--glacia-glass-border);
  box-shadow: 0 40px 80px -30px rgba(16, 24, 32, 0.5);
  overflow: hidden;
  animation: del-modal-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes del-modal-bounce {
  0%   { opacity: 0; transform: scale(0.92) translateY(10px); }
  60%  { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
}

.del-stack {
  display: grid;
}

.del-panel {
  grid-area: 1 / 1;
}

.del-panel:not(.del-done) {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  transition: opacity 260ms ease, transform 360ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.del-hidden {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
  pointer-events: none;
}

.del-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.del-tile {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: rgba(220, 38, 38, 0.08);
  color: var(--glacia-sev-critical);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 420ms cubic-bezier(0.34, 1.5, 0.64, 1);

  &--acked {
    transform: rotate(-8deg) scale(1.06);
  }
}

.del-titles {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 2px;
}

.del-title {
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 20px;
  line-height: 1.25;
  font-weight: 800;
  color: var(--glacia-ink);
}

.del-repo {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--glacia-ink-dim);

  &__icon {
    flex-shrink: 0;
  }
}

.del-ellip {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.del-close {
  flex: none;
  width: 36px;
  height: 36px;
  border: 0;
  padding: 0;
  border-radius: 999px;
  background: var(--surface-3);
  color: var(--glacia-ink-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 160ms ease;

  &:hover {
    background: var(--surface-3);
  }
}

.del-body {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--glacia-ink-dim);

  strong {
    color: var(--glacia-ink);
    font-weight: 700;
  }
}

.del-ack {
  font: inherit;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--hairline);
  background: var(--surface);
  transition: background 260ms ease, border-color 260ms ease;

  &--on {
    border-color: var(--glacia-sev-critical);
    background: rgba(220, 38, 38, 0.06);
  }

  &__text {
    font-size: 14px;
    font-weight: 600;
    color: var(--glacia-ink);
    transition: color 220ms ease;
  }

  &--on &__text {
    color: var(--glacia-sev-critical);
  }
}

.del-box {
  flex: none;
  position: relative;
  width: 22px;
  height: 22px;
  box-sizing: border-box;
  border-radius: 7px;
  border: 1.5px solid var(--hairline-strong);
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 200ms ease, border-color 200ms ease;
}

.del-ack--on .del-box {
  border-color: var(--glacia-sev-critical);
  background: var(--glacia-sev-critical);
}

.del-tick {
  color: #fff;
  opacity: 0;
  transform: scale(0.3);
  transition: opacity 160ms ease, transform 320ms cubic-bezier(0.34, 1.6, 0.64, 1);
}

.del-ack--on .del-tick {
  opacity: 1;
  transform: scale(1);
}

.del-actions {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 12px;
  padding-top: 4px;
}

.del-btn {
  height: 48px;
  border-radius: 16px;
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &--cancel {
    border: 1px solid var(--hairline);
    background: var(--surface);
    color: var(--glacia-ink);
    transition: background 160ms ease;

    &:hover {
      background: var(--surface-3);
    }
  }

  &--delete {
    position: relative;
    overflow: hidden;
    border: 0;
    background: var(--surface-3);
    color: #94a3b8;
    cursor: not-allowed;
    user-select: none;
    touch-action: none;
    transition: background 260ms ease, color 260ms ease, box-shadow 260ms ease, transform 160ms ease;

    &.is-ready,
    &.is-deleting {
      background: var(--glacia-sev-critical);
      color: #fff;
    }

    &.is-ready {
      cursor: pointer;
      box-shadow: 0 10px 24px -10px rgba(220, 38, 38, 0.6);
    }

    &.is-holding {
      transform: scale(0.98);
    }
  }
}

.del-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: #a8161f;
  transition: width 260ms ease-out;
}

.is-holding .del-fill {
  width: 100%;
  transition: width 1000ms linear;
}

.is-deleting .del-fill {
  width: 100%;
  transition: none;
}

.del-label {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
}

.del-spinner {
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  border-radius: 50%;
  border: 2px solid rgba(var(--glass-rgb), 0.35);
  border-top-color: #fff;
  animation: del-spin 700ms linear infinite;
}

.del-hint {
  font-size: 12.5px;
  color: var(--glacia-ink-dim);
  text-align: right;
  margin-top: -8px;
  min-height: 18px;
}

.del-done {
  padding: 40px 24px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  opacity: 0;
  transform: translateY(12px);
  pointer-events: none;
  transition: opacity 300ms ease 120ms, transform 420ms cubic-bezier(0.2, 0.9, 0.25, 1) 120ms;

  &.is-shown {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(22, 163, 74, 0.12);
    color: #16a34a;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: scale(0.4);
    transition: transform 520ms cubic-bezier(0.34, 1.6, 0.64, 1) 220ms;
  }

  &.is-shown &__icon {
    transform: scale(1);
  }

  &__title {
    font-size: 20px;
    font-weight: 800;
    color: var(--glacia-ink);
  }

  &__body {
    font-size: 14px;
    line-height: 1.6;
    color: var(--glacia-ink-dim);
  }

  &__btn {
    margin-top: 10px;
    height: 44px;
    padding: 0 24px;
  }
}

.del-mono {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-weight: 600;
  color: var(--glacia-ink);
}

@keyframes del-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .del-modal,
  .del-modal * {
    transition-duration: 1ms !important;
    animation-duration: 1ms !important;
  }
}
</style>
