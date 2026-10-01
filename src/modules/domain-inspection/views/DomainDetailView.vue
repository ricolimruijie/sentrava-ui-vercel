<script setup>
import ScanTimelineCard from '@/components/common/ScanTimelineCard.vue'
import { useScanTimeline, to24Hour } from '@/composables/useScanTimeline'
import HoldToDeleteModal from '@/components/common/HoldToDeleteModal.vue'
import FindingsReportModal from '@/components/common/FindingsReportModal.vue'
import { useRole } from '@/composables/useRole'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataTable from '@/components/common/DataTable.vue'
import FilterDropdown from '@/components/common/FilterDropdown.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import RelatedDomains from '@/components/common/RelatedDomains.vue'
import FindingsBadge from '@/components/common/FindingsBadge.vue'
import VulnerabilityDetailModal from '@/components/common/VulnerabilityDetailModal.vue'
import { formatShortDate, severityLabel } from '@/utils/helpers'
import { getDomains, getDomainScans, getDomainEndpoints, getDomainVulns, getDomainReputation, getDomainReputationEngines, preloadDomainDetail } from '@/modules/domain-inspection/services/domainService'
import ReputationModal from '@/components/common/ReputationModal.vue'
import {
  IconDownload,
  IconRefresh,
  IconChevronDown,
  IconChevronRight,
  IconX,
  IconInfoCircle,
  IconDotsVertical,
  IconCheck,
  IconMinus,
  IconPencil,
  IconTrash,
  IconArrowUpRight,
  IconTag,
  IconScan,
  IconFlag,
  IconCalendar,
  IconClock,
  IconBuilding,
  IconLink,
  IconLoader2,
  IconUpload,
  IconShieldSearch,
  IconWorld,
} from '@tabler/icons-vue'

// Load this page's data before it renders (the page is shown inside <Suspense>).
await preloadDomainDetail()

const { can } = useRole()

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

// ── Scan timeline (shared: useScanTimeline + <ScanTimelineCard>) ──
const timeline = useScanTimeline({
  target: domain,
  initialScans: getDomainScans(domain.value.id),
  selectFirstFinished: false,
  trackDuration: false,
})
const {
  scans, selectedScan, scanTypeLabel, recurrenceLabel, updateTimelineHint, pendingRescanType,
  pendingRescanIndex, scanInProgress, retryLoadingIndex, retryDoneIndex, timelineStopped,
} = timeline
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

// ── Download Report modal (shared FindingsReportModal; this builds the file) ──
const showReportModal = ref(false)
function openReportModal() { showReportModal.value = true }

function downloadReport({ rows: findings, endpoints: eps }) {
  const rows = [['No', 'Endpoint', 'Vulnerability Name', 'Component', 'Line', 'Severity', 'Last Modified', 'Modified By']]
  let n = 0
  eps.forEach((ep) => {
    findings.forEach((v) => {
      n += 1
      rows.push([n, ep.endpoint, `"${v.name.replace(/"/g, '""')}"`, v.component, v.line, severityLabel(v.severity), formatShortDate(v.lastModified), v.modifiedBy])
    })
  })
  const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `scan-report-${domain.value.endpoint.replace(/[^0-9a-z.]/gi, '-')}.csv`
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
  <div class="scan-detail" :class="{ 'scan-detail--wide': showReputation }">
    <!-- ── Sidebar ──────────────────────────────────────────────────── -->
    <aside v-if="!showReputation" class="scan-timeline">
      <ScanTimelineCard v-if="!selectedEndpoint" :timeline="timeline" :can-rescan="scanActionKind === 'manual_scan'" :can-stop="scanActionKind === 'continuous_scan'" compact />

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
          v-if="can('delete_asset')"
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

    <FindingsReportModal
      v-model="showReportModal"
      :findings="vulns"
      :cycles="cycleTabs"
      :no-findings="scans[selectedScan]?.status === 'Failed'"
      :pick-endpoints="isDomain && !selectedEndpoint"
      :endpoints="endpoints"
      :single-endpoint="selectedEndpoint?.endpoint ?? domain.endpoint"
      @download="downloadReport"
    />

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

            <div v-if="!selectedEndpoint && can('delete_scan')" class="target-modal__divider" />

            <div v-if="!selectedEndpoint && can('delete_scan')" class="target-modal__footer">
              <p class="target-modal__footer-desc">Removes this scan and its results from the timeline.</p>
              <button type="button" class="target-modal__delete" @click="openDelTlModal">
                <IconTrash :size="13" /> Delete Timeline
              </button>
            </div>
        </div>
      </Transition>
    </Teleport>

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
  </div>
</template>

<style scoped lang="scss" src="./DomainDetailView.scss"></style>
