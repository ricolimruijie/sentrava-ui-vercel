<script setup>
import ScanTimelineCard from '@/components/common/ScanTimelineCard.vue'
import { useScanTimeline, scanTypeLabels, to24Hour } from '@/composables/useScanTimeline'
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
  IconDotsVertical,
  IconArrowUpRight,
  IconCheck,
  IconInfoCircle,
  IconDownload,
  IconPencil,
  IconRefresh,
  IconChevronRight,
  IconMinus,
  IconFlag,
  IconUpload,
  IconX,
  IconLink,
  IconCalendar,
  IconBuilding,
  IconClock,
  IconTrash,
  IconShieldSearch,
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
  { key: 'critical', label: 'Critical', bg: '#FBE3E3', bar: '#DC2626'  },
  { key: 'high', label: 'High', bg: '#FDEEE3', bar: '#EA580C'  },
  { key: 'medium', label: 'Medium', bg: '#FEF6DC', bar: '#EAB308'  },
  { key: 'low', label: 'Low', bg: '#E7F7ED', bar: '#16A34A'  },
  { key: 'info', label: 'Info', bg: '#E5F3FC', bar: '#0EA5E9'  },
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

// ── Scan timeline (shared: useScanTimeline + <ScanTimelineCard>) ──
const timeline = useScanTimeline({
  target: app,
  initialScans: getWebAppScans(app.value.id),
  selectFirstFinished: true,
  trackDuration: true,
})
const {
  scans, selectedScan, scanTypeLabel, recurrenceLabel, updateTimelineHint,
} = timeline
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
  { key: 'check', label: '', kind: 'check', align: 'center'  },
  { key: '__index', label: 'No', kind: 'index', width: '52px', dim: true  },
  { key: 'name', label: 'Vulnerability Name', min: 167, max: 420, truncate: true },
  { key: 'lastModified', label: 'Last Modified', width: '150px', dim: true, truncate: true },
  { key: 'severity', label: 'Severity', width: '97px', align: 'center' },
  { key: 'cycle', label: 'Validation Cycle', width: '147px', align: 'center' },
  { key: 'action', label: 'Action', kind: 'action', align: 'center'  },
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
      <ScanTimelineCard :timeline="timeline" :can-rescan="app.scanType === 'manual_scan'" :can-stop="app.scanType === 'continuous_scan'" />

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
