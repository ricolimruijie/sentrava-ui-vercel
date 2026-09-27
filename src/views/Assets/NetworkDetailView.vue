<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataTable from '@/components/table/DataTable.vue'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import SearchInput from '@/components/reusable/SearchInput.vue'
import VulnerabilityDetailModal from '@/components/vulnerabilities/VulnerabilityDetailModal.vue'
import { getNetworks, getNetworkScans, getNetworkEndpoints, getNetworkVulns } from '@/mocks/assets/network.js'
import {
  IconEye, IconDownload, IconRefresh, IconChevronDown, IconChevronRight, IconX, IconInfoCircle,
  IconDotsVertical, IconCheck, IconMinus, IconPencil, IconTrash, IconArrowUpRight, IconTag, IconScan,
  IconCalendar, IconClock, IconBuilding, IconLink,
} from '@tabler/icons-vue'

const route = useRoute()
const router = useRouter()

const network = computed(() => {
  const id = Number(route.params.id)
  return getNetworks().find((n) => n.id === id) ?? getNetworks()[0]
})

// CIDR targets show the discovered endpoint list; IP Single targets show
// the vulnerability findings for that host.
const isCidr = computed(() => network.value.targetType === 'CIDR')

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
const scans = ref(getNetworkScans())
const selectedScan = ref(1)

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

function rescan() {
  const now = new Date().toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
  scans.value.unshift({ id: `s-${Date.now()}`, date: now, status: 'Queue' })
  selectedScan.value = 0
}

// ── Endpoints ──────────────────────────────────────────────────────────────
const endpoints = ref(getNetworkEndpoints())

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
  if (q) list = list.filter((e) => e.endpoint.toLowerCase().includes(q) || e.owner.toLowerCase().includes(q))
  return list
})

// ── Table (reusable DataTable) ─────────────────────────────────────────────
const tableRef = ref(null)

const columns = [
  { key: '__index', label: '#', width: '24px', dim: true, mono: true },
  { key: 'endpoint', label: 'Endpoint', width: '17%', mono: true, truncate: true },
  { key: 'owner', label: 'Asset Owner', width: '22%', truncate: true },
  { key: 'totalSeverity', label: 'Total Severity', width: '10%', align: 'center' },
  { key: 'tags', label: 'Multi-Tags', width: '22%' },
  { key: 'status', label: 'Scanner Status', width: '15%', align: 'center' },
  { key: 'view', label: 'Action', width: '48px', align: 'center' },
]

// ── Endpoint row menu (CIDR layout) ────────────────────────────────────────
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

// ── Endpoint tag popover (CIDR layout) ─────────────────────────────────────
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

function closeEpTagPopover() { epTagFor.value = null }

function openEpCardTagPopover(e) {
  if (!selectedEndpoint.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  epTagFor.value = selectedEndpoint.value.id
  epTagQuery.value = ''
  epTagPos.value = { top: rect.bottom + 6, left: Math.max(8, Math.min(rect.left, window.innerWidth - 288)) }
}

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

// ── Endpoint findings mode (CIDR “See Details” target) ─────────────────────
// The open endpoint is mirrored to ?view=findings&ep=<id> so the navbar
// breadcrumb gains an “Endpoint Findings” level (same tabQuery pattern as
// the Company page) and the view survives refresh.
const selectedEndpoint = ref(null)

function openEndpointFindings(row) {
  closeEpMenu()
  router.push({ query: { view: 'findings', ep: row.id } })
}

watch(() => route.params.id, () => {
  selectedScan.value = 0
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

const epSearch = ref('')
const epSeverity = ref(null)

const epFiltered = computed(() => {
  let list = vulns.value
  if (epSeverity.value) list = list.filter((v) => v.severity === epSeverity.value)
  const q = epSearch.value.trim().toLowerCase()
  if (q) list = list.filter((v) => v.name.toLowerCase().includes(q))
  return list
})

const epColumns = [
  { key: 'check', label: '', width: '32px', align: 'center', compact: true },
  { key: '__index', label: '#', width: '24px', dim: true },
  { key: 'name', label: 'Vulnerability Name', width: '36%', truncate: true },
  { key: 'severity', label: 'Severity', width: '96px', align: 'center' },
  { key: 'lastModified', label: 'Last Modified', width: '120px', dim: true },
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

function downloadEpReport() {
  const rows = [['No', 'Vulnerability Name', 'Severity', 'Last Modified', 'Validation Cycle']]
  epFiltered.value.forEach((v, i) => {
    rows.push([i + 1, `"${v.name.replace(/"/g, '""')}"`, v.severity, `"${v.lastModified}"`, v.validation])
  })
  const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `endpoint-report-${(selectedEndpoint.value?.endpoint ?? 'endpoint').replace(/[^0-9a-z.]/gi, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Endpoint detail modal (read-only, CIDR layout) ─────────────────────────

// ── Endpoint detail modal (read-only, CIDR layout) ─────────────────────────
const detailRow = ref(null)

function viewEndpoint(row) {
  detailRow.value = row
}

function closeDetail() {
  detailRow.value = null
}

// ── Single-host vulnerabilities (IP Single layout) ─────────────────────────
const vulns = ref(getNetworkVulns())
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

const sevPill = {
  high: { label: 'High', bg: '#FDE8E8', color: '#C81E1E' },
  medium: { label: 'Medium', bg: '#FEF3C7', color: '#B45309' },
  low: { label: 'Low', bg: '#E3F5E8', color: '#2F9E52' },
  info: { label: 'Info', bg: '#DFF3FC', color: '#1197C2' },
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
  { key: 'severity', label: 'Severity', width: '96px', align: 'center' },
  { key: 'lastModified', label: 'Last Modified', width: '120px', dim: true },
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

function viewFinding(id) {
  closeVulnMenu()
  selectedFinding.value = vulns.value.find((v) => v.id === id) ?? null
  showFindingModal.value = true
}

function deleteFinding(id) {
  closeVulnMenu()
  vulns.value = vulns.value.filter((v) => v.id !== id)
  vulnChecked.value = vulnChecked.value.filter((c) => c !== id)
}

function rescanFinding(id) {
  const row = vulns.value.find((v) => v.id === id)
  closeVulnMenu()
  if (!row) return
  row.validation = 'Unresolved'
}

function downloadVulnReport() {
  const rows = [['No', 'Vulnerability Name', 'Port', 'Protocol', 'Services', 'Severity', 'Last Modified', 'Modified By', 'Validation Cycle']]
  filteredVulns.value.forEach((v, i) => {
    rows.push([i + 1, `"${v.name.replace(/"/g, '""')}"`, v.port, v.protocol, v.service, v.severity, `"${v.lastModified}"`, `"${v.modifiedBy}"`, v.validation])
  })
  const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `endpoint-report-${network.value.endpoint.replace(/[^0-9a-z.]/gi, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

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
  selectedScan.value = 0
  closeTargetDetailModal()
}

// ── Header actions ─────────────────────────────────────────────────────────
function downloadReport() {
  const rows = [['No', 'Endpoint', 'Asset Owner', 'Total Severity', 'Scanner Status']]
  filtered.value.forEach((e, i) => {
    rows.push([i + 1, e.endpoint, `"${e.owner}"`, e.totalSeverity, e.status])
  })
  const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `network-report-${network.value.endpoint.replace(/[^0-9a-z.]/gi, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

</script>

<template>
  <div class="scan-detail">
    <!-- ── Sidebar ──────────────────────────────────────────────────── -->
    <aside class="scan-timeline">
      <section v-if="!selectedEndpoint" class="side-card">
        <h2 class="scan-timeline__section">Scan timeline</h2>

        <div class="scan-timeline__scrollwrap">
          <div ref="tlRef" class="scan-timeline__scroll" @scroll="updateTimelineHint">
            <div class="scan-timeline__rail" />
            <button
              v-for="(s, i) in scans"
              :key="s.id"
              type="button"
              class="scan-timeline__item"
              :class="{ 'scan-timeline__item--active': i === selectedScan }"
              @click="selectedScan = i"
            >
              <span class="scan-timeline__dot" :style="{ background: scanDot[s.status] ?? '#9aa5b1' }" />
              <span class="scan-timeline__meta">
                <span class="scan-timeline__date">{{ to24Hour(s.date) }}</span>
                <span class="scan-timeline__status">{{ s.status }}</span>
              </span>
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

        <p class="scan-timeline__count">{{ scans.length }} scans</p>

        <button type="button" class="btn-register btn-register--block" @click="rescan">
          <IconRefresh :size="14" /> Re-scan
        </button>
      </section>

      <section v-if="!isCidr || selectedEndpoint" class="side-card">
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

      <section v-if="selectedEndpoint" class="side-card">
        <p class="scan-timeline__section">Multi-Tags</p>
        <div class="side-card__tag-list">
          <span
            v-for="t in selectedEndpoint.tags"
            :key="t.label"
            class="dv-tag"
            :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }"
          >{{ t.label }}</span>
          <span v-if="!(selectedEndpoint.tags || []).length" class="tag-popover__empty">No tags yet.</span>
        </div>
        <button type="button" class="tag-add" @click="openEpCardTagPopover($event)">Manage tags</button>
      </section>
    </aside>

    <!-- ── Main: CIDR endpoint list ─────────────────────────────────── -->
    <div v-if="isCidr && !selectedEndpoint" class="scan-main">
      <section class="scan-main__head">
        <div>
          <h1 class="scan-main__title">Endpoint List</h1>
          <div class="scan-main__meta">
            <span>Scan Date: <b>{{ scans[selectedScan]?.date }}</b></span>
            <span class="scan-main__sep">/</span>
            <span>Scan Frequency: <b>{{ { singular: 'Singular Scanning', specified: 'Specified Scanning', continuous: 'Continuous Scanning' }[network.scanType] ?? network.scanType }}</b></span>
            <span class="scan-main__sep">/</span>
            <span>Frequency Type: <b>Weekly</b></span>
          </div>
        </div>
        <div class="scan-main__actions">
          <button type="button" class="btn-glass target-detail-trigger" @click="toggleTargetDetailModal($event)">
            <IconInfoCircle :size="15" /> View Detail
          </button>
          <button type="button" class="btn-register" @click="downloadReport">
            <IconDownload :size="15" /> Download Full Report
          </button>
        </div>
      </section>

      <div class="scan-main__controls">
        <FilterDropdown v-model="multiTagFilter" :options="multiTagOptions" placeholder="Multi-Tags" />
        <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scanner Status" />
        <div class="scan-main__spacer" />
        <SearchInput v-model="search" placeholder="Search" />
      </div>

      <DataTable
        ref="tableRef"
        :columns="columns"
        :items="filtered"
        empty-text="No endpoints found."
      >
        <template #cell-tags="{ row }">
          <div class="cell-tags">
            <span
              v-for="t in row.tags.slice(0, 2)"
              :key="t.label"
              class="dv-tag"
              :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }"
            >{{ t.label }}</span>
            <span v-if="row.tags.length > 2" class="tag-more">+{{ row.tags.length - 2 }}</span>
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

    <!-- ── Main: endpoint findings (CIDR “See Details” target) ──────────── -->
    <div v-else-if="selectedEndpoint" class="scan-main">
      <section class="scan-main__head">
        <div>
          <h1 class="scan-main__title">Endpoint: {{ selectedEndpoint.endpoint }}</h1>
          <div class="scan-main__meta">
            <span>Date Scanned: <b>{{ scans[selectedScan]?.date }}</b></span>
            <span class="scan-main__sep">/</span>
            <span>Total Vulnerabilities: <b>{{ vulns.length }}</b></span>
          </div>
        </div>
        <div class="scan-main__actions">
          <button type="button" class="btn-register" @click="downloadEpReport">
            <IconDownload :size="15" /> Report
          </button>
        </div>
      </section>

      <div class="scan-main__controls">
        <FilterDropdown v-model="epSeverity" :options="vulnSeverityOptions" placeholder="Severity" />
        <div class="scan-main__spacer" />
        <SearchInput v-model="epSearch" placeholder="Search" />
        <div class="bulk-edit">
          <button
            type="button"
            class="btn-register"
            :disabled="!epChecked.length"
            @click.stop="epBulkOpen = !epBulkOpen"
          >
            Bulk Edit <IconChevronDown :size="14" />
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
        empty-text="No vulnerabilities found."
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
          <span class="validation-pill">{{ row.validation }}</span>
        </template>
        <template #cell-action="{ row }">
          <button type="button" class="action-btn" aria-label="Actions" @click.stop="toggleVulnMenu(row, $event)">
            <IconDotsVertical :size="16" />
          </button>
        </template>
      </DataTable>
    </div>

    <!-- ── Main: IP Single vulnerabilities ────────────────────────────── -->
    <div v-else-if="!isCidr" class="scan-main">
      <section class="scan-main__head">
        <div>
          <h1 class="scan-main__title">Endpoint: {{ network.endpoint }}</h1>
          <div class="scan-main__meta">
            <span>Date Scanned: <b>{{ scans[selectedScan]?.date }}</b></span>
            <span class="scan-main__sep">/</span>
            <span>Total Vulnerabilities: <b>{{ vulns.length }}</b></span>
          </div>
        </div>
        <div class="scan-main__actions">
          <button type="button" class="btn-glass" @click="router.push('/assets/networks')">
            <IconInfoCircle :size="15" /> View Detail
          </button>
          <button type="button" class="btn-register" @click="downloadVulnReport">
            <IconDownload :size="15" /> Report
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
        empty-text="No vulnerabilities in this status."
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
          <span class="validation-pill">{{ row.validation }}</span>
        </template>
        <template #cell-action="{ row }">
          <button type="button" class="action-btn" aria-label="Actions" @click.stop="toggleVulnMenu(row, $event)">
            <IconDotsVertical :size="16" />
          </button>
        </template>
      </DataTable>
    </div>

    <Teleport to="body">
      <div v-if="epMenuId" class="action-menu" :style="{ top: `${epMenuPos.top}px`, left: `${epMenuPos.left}px` }">
        <button type="button" class="action-menu__item" @click="openEndpointFindings(endpoints.find((e) => e.id === epMenuId))">
          <IconArrowUpRight :size="15" />
          See Details
        </button>
        <button type="button" class="action-menu__item" @click="manageEpTags(epMenuId)">
          <IconTag :size="15" />
          Manage tag
        </button>
        <button type="button" class="action-menu__item" @click="rescanEndpoint(epMenuId)">
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
                <span class="detail-field__label">Total Severity</span>
                <span class="detail-field__value">{{ detailRow.totalSeverity }}</span>
              </div>
              <div class="detail-field">
                <span class="detail-field__label">Scanner Status</span>
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
            <IconTag :size="15" />
            Change cycle
            <IconChevronRight
              :size="14"
              class="action-menu__chevron"
              :class="{ 'action-menu__chevron--open': vulnCycleMenuOpen }"
            />
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
        <button type="button" class="action-menu__item" @click="rescanFinding(vulnMenuId)">
          <IconScan :size="15" />
          Re-scan
        </button>
        <button
          type="button"
          class="action-menu__item action-menu__item--danger"
          @click="deleteFinding(vulnMenuId)"
        >
          <IconTrash :size="15" />
          Delete
        </button>
      </div>
    </Teleport>

    <VulnerabilityDetailModal v-model="showFindingModal" :item="selectedFinding" />
    <Teleport to="body">
      <Transition name="target-panel-fade">
        <div v-if="showTargetDetailModal" class="target-modal" :style="{ top: `${targetDetailPos.top}px`, left: `${targetDetailPos.left}px` }">
            <div class="target-modal__head">
              <div class="target-modal__heading">
                <p class="target-modal__eyebrow">Target Details</p>
                <div class="target-modal__pills">
                  <span class="target-pill">{{ network.targetType }}</span>
                  <span class="target-pill">{{ { singular: 'Singular Scanning', specified: 'Specified Scanning', continuous: 'Continuous Scanning' }[network.scanType] ?? network.scanType }}</span>
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
                    <p class="target-stat-row__value">{{ network.endpoint }}</p>
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
                    <p class="target-stat-row__label">Total Endpoints</p>
                    <p class="target-stat-row__value">
                      {{ endpoints.length }}
                      <span class="target-stat-row__unit">endpoints</span>
                    </p>
                  </div>
                </div>
              </div>

              <div class="target-modal__section">
                <p class="target-modal__section-label">Multi-Tags</p>
                <div class="target-modal__tag-list">
                  <span
                    v-for="(t, i) in network.tags"
                    :key="`${t.label}-${i}`"
                    class="dv-tag"
                    :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }"
                  >{{ t.label }}</span>
                  <span v-if="!(network.tags || []).length" class="tag-popover__empty">No tags yet.</span>
                </div>
              </div>
            </div>

            <div class="target-modal__divider" />

            <div class="target-modal__footer">
              <p class="target-modal__footer-desc">Removes this scan and its results from the timeline.</p>
              <button type="button" class="target-modal__delete" @click="deleteScanTimeline">
                <IconTrash :size="13" /> Delete Timeline
              </button>
            </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.scan-detail {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

// ── Sidebar ────────────────────────────────────────────────────────────────
.scan-timeline {
  width: 300px;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.side-card {
  background: #fff;
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
      background: linear-gradient(to bottom, rgba(255, 255, 255, 0), #fff 78%);
      pointer-events: none;
    }
  }

  &__scroll {
    height: 324px;
    overflow-y: auto;
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
      background: rgba(15, 23, 42, 0.04);
    }

    &--active {
      background: #F1F5F9;
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
      background: #F1F5F9;
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
    background: rgba(15, 23, 42, 0.06);
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
    background: #fff;
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
  background: #FFF5F5;
}

.check {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1.5px solid #cbd5e1;
  background: #fff;
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
  background: #ECEEF0;
  color: #5C6470;
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
  background: #fff;
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
    background: #fff;
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
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: var(--glacia-ink-dim);
    flex-wrap: wrap;
    margin-top: 6px;

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
  display: inline-flex; align-items: center; justify-content: center; gap: 4px;
  padding: 7px 10px; border-radius: 999px;
  border: 1px dashed var(--glacia-glass-border); background: #fff;
  font-size: 12px; font-weight: 600; font-family: 'Manrope', 'Inter', sans-serif;
  color: var(--glacia-ink-dim); cursor: pointer;
  &:hover { border-color: var(--glacia-red); color: var(--glacia-red); }
}

.dv-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}

.tag-popover {
  position: fixed; width: 280px; background: #fff; border-radius: 16px;
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
    &:focus { border-color: var(--glacia-red); }
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
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.create-modal {
  width: 100%; max-width: 460px; background: #fff; border-radius: 20px;
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
    flex-direction: column;
  }

  .scan-timeline {
    width: 100%;
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
  background: #fff;
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
    background: rgba(16, 24, 32, 0.1);
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
    background: #fff;
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
  border: 1px solid rgba(16, 24, 32, 0.12);
  background: rgba(15, 23, 42, 0.04);
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
  background: #F6F8FA;
  border-radius: 16px;
}

.target-stat-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(16, 24, 32, 0.08);
  border-radius: 11px;
  background: #fff;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(16, 24, 32, 0.16);
    box-shadow: 0 6px 16px -8px rgba(16, 24, 32, 0.18);
  }

  &__icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: #EAF1FC;
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
  border: 1px solid rgba(16, 24, 32, 0.12);
  background: rgba(15, 23, 42, 0.04);
  color: var(--glacia-ink);
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
