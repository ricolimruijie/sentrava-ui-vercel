<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataTable from '@/components/table/DataTable.vue'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import SearchInput from '@/components/reusable/SearchInput.vue'
import VulnerabilityDetailModal from '@/components/vulnerabilities/VulnerabilityDetailModal.vue'
import { getSourceCodeRepos, getSourceCodeScans, getSourceCodeVulns } from '@/mocks/assets/sourceCode.js'
import {
  IconDotsVertical, IconArrowUpRight, IconCheck, IconInfoCircle,
  IconDownload, IconPencil, IconRefresh, IconChevronDown, IconChevronRight, IconMinus, IconTag,
  IconX, IconGitBranch, IconLock, IconTrash, IconCode, IconCalendar, IconBuilding, IconClock,
} from '@tabler/icons-vue'

const route = useRoute()
const router = useRouter()

const repo = computed(() => {
  const id = Number(route.params.id)
  return getSourceCodeRepos().find((r) => r.id === id) ?? getSourceCodeRepos()[0]
})

// Same palette as SourceCodeView/AssetInventoryView so tags render identically.
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

// Splits "10 Feb 2025 8:30 AM" into { date: "10 Feb 2025", time: "8:30 AM" }
// so the Target Details modal can show the time as its own pill.
const selectedScanParts = computed(() => {
  const raw = scans.value[selectedScan.value]?.date ?? ''
  const m = raw.match(/^(.*)\s(\d{1,2}:\d{2}\s?[AP]M)$/i)
  return m ? { date: m[1], time: m[2] } : { date: raw, time: '' }
})

function deleteScanTimeline() {
  if (!scans.value.length) return
  scans.value.splice(selectedScan.value, 1)
  selectedScan.value = 0
  closeTargetDetailModal()
}

// ── Scan timeline ──────────────────────────────────────────────────────────
const scans = ref(getSourceCodeScans())
const selectedScan = ref(0)

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

function rescan() {
  const now = new Date().toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
  scans.value.unshift({ id: `s-${Date.now()}`, date: now, status: 'Queue' })
  selectedScan.value = 0
}

onMounted(() => {
  updateTimelineHint()
  document.addEventListener('mousedown', handleClickOutside)
})
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

// ── Vulnerability cycle tabs ───────────────────────────────────────────────
const cycleTabs = ['Active', 'Fixing', 'Mitigated', 'Tolerated', 'False positive']
const activeCycle = ref('Active')

const vulns = ref(getSourceCodeVulns())
const cycleCount = (cycle) => vulns.value.filter((v) => v.cycle === cycle).length

// ── Filters ────────────────────────────────────────────────────────────────
const search = ref('')
const severityFilter = ref(null)

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

// Highest severity first, always — independent of whatever order the
// underlying scan data arrives in.
const severityRank = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

const filtered = computed(() => {
  let list = vulns.value.filter((v) => v.cycle === activeCycle.value)
  if (severityFilter.value) list = list.filter((v) => v.severity === severityFilter.value)
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
  { key: 'name', label: 'Vulnerability name', width: '42%', truncate: true },
  { key: 'line', label: 'Line', width: '64px', align: 'center', dim: true },
  { key: 'severity', label: 'Severity', width: '100px', align: 'center' },
  { key: 'lastModified', label: 'Last modified', width: '120px', dim: true, truncate: true},
  { key: 'action', label: 'Action', width: '70px', align: 'center' },
]

function rowClass(row) {
  return isChecked(row.id) ? 'scan-row--checked' : ''
}

watch([severityFilter, activeCycle], () => tableRef.value?.pagination.goTo(1))
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

function viewFinding(id) {
  closeMenu()
  selectedFinding.value = vulns.value.find((v) => v.id === id) ?? null
  showDetailModal.value = true
}

// ── Header actions ─────────────────────────────────────────────────────────
function downloadReport() {
  const rows = [['No', 'Vulnerability name', 'Component', 'Line', 'Severity', 'Last modified', 'Modified by']]
  filtered.value.forEach((v, i) => {
    rows.push([i + 1, `"${v.name.replace(/"/g, '""')}"`, v.component, v.line, severityPill[v.severity]?.label ?? v.severity, v.lastModified, v.modifiedBy])
  })
  const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `scan-report-${repo.value.repo}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="scan-detail">
    <!-- ── Sidebar cards ──────────────────────────────────────────────── -->
    <aside class="scan-timeline">
      <section class="side-card">
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
            <h1 class="scan-main__title">{{ repo.repo }}</h1>
          </div>
          <div class="scan-main__meta">
            <span>Branch <b class="mono">{{ repo.branch }}</b></span>
            <span>Total vulnerabilities <b class="mono">{{ vulns.length.toLocaleString() }}</b></span>
            <span>Total scan time taken <b class="mono">{{ scans[selectedScan]?.duration ?? '—' }}</b></span>
          </div>
        </div>
        <div class="scan-main__actions">
          <button type="button" class="btn-glass target-detail-trigger" @click="toggleTargetDetailModal($event)">
            <IconInfoCircle :size="15" /> View detail
          </button>
          <button type="button" class="btn-register" @click="downloadReport">
            <IconDownload :size="15" /> Report
          </button>
        </div>
      </section>

      <div class="scan-main__controls">
        <SearchInput v-model="search" placeholder="Search vulnerabilities" />
        <FilterDropdown v-model="severityFilter" :options="severityOptions" placeholder="Severity" />
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
        empty-text="No vulnerabilities in this status."
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
            <IconTag :size="15" />
            Change cycle
            <IconChevronRight
              :size="14"
              class="action-menu__chevron"
              :class="{ 'action-menu__chevron--open': cycleMenuOpen }"
            />
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
      </div>
    </Teleport>

    <VulnerabilityDetailModal v-model="showDetailModal" :item="selectedFinding" summary-strip />

    <Teleport to="body">
      <Transition name="target-panel-fade">
        <div v-if="showTargetDetailModal" class="target-modal" :style="{ top: `${targetDetailPos.top}px`, left: `${targetDetailPos.left}px` }">
            <div class="target-modal__head">
              <div class="target-modal__heading">
                <p class="target-modal__eyebrow">Target Details</p>
                <div class="target-modal__pills">
                  <span class="target-pill target-pill--mono"><IconGitBranch :size="12" /> {{ repo.branch }}</span>
                  <span class="target-pill">{{ repo.gitProvider }}</span>
                  <span class="target-pill"><IconLock :size="12" /> {{ repo.visibility }}</span>
                </div>
              </div>
              <button type="button" class="target-modal__close" aria-label="Close" @click="closeTargetDetailModal">
                <IconX :size="20" />
              </button>
            </div>

            <div class="target-modal__body">
              <div class="target-stat-list">
                <div class="target-stat-row">
                  <span class="target-stat-row__icon"><IconCode :size="16" /></span>
                  <div class="target-stat-row__text">
                    <p class="target-stat-row__label">Total Line of Code</p>
                    <p class="target-stat-row__value">
                      {{ (repo.linesOfCode ?? 0).toLocaleString('id-ID') }}
                      <span class="target-stat-row__unit">lines</span>
                    </p>
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
                    <p class="target-stat-row__value">{{ repo.owner }}</p>
                  </div>
                </div>
              </div>

              <div class="target-modal__section">
                <p class="target-modal__section-label">Multi-Tags</p>
                <div class="target-modal__tag-list">
                  <span
                    v-for="(t, i) in repo.tags"
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
  width: 264px;
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

.scan-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
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

.btn-register {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px; padding: 0 14px;
  border-radius: var(--glacia-radius-pill); border: none;
  background: var(--glacia-red); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(255, 37, 41, 0.4); transition: background 0.15s, box-shadow 0.15s;
  &:hover { background: #e01e22; box-shadow: 0 8px 24px rgba(255, 37, 41, 0.5); }

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
  }

  &__meta {
    display: flex;
    gap: 18px;
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

// ── Table (reusable DataTable + local cells) ─────────────────────────────────
// Checked-row tint lives in the child table — reach it with :deep.
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

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--glacia-ink-dim);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
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

.page-ellipsis {
  padding: 0 4px;
  color: var(--glacia-ink-dim);
}

@media (max-width: 1024px) {
  .scan-detail {
    flex-direction: column;
  }

  .scan-timeline {
    width: 100%;

    &__scroll {
      height: auto;
      max-height: 220px;
    }
  }

  .scan-main {
    padding-top: 0;
  }
}

@keyframes scan-timeline-more-pulse {
  0%, 100% { box-shadow: 0 4px 12px -2px rgba(255, 37, 41, 0.45), 0 0 0 0 rgba(255, 37, 41, 0.35); }
  50% { box-shadow: 0 4px 12px -2px rgba(255, 37, 41, 0.45), 0 0 0 5px rgba(255, 37, 41, 0); }
}

// ── Target Details panel (View detail) ──────────────────────────────────────
// Anchored popover — not a centered modal — so it has no backdrop and fades
// in place near the button that opened it.
.target-panel-fade-enter-active, .target-panel-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.target-panel-fade-enter-from, .target-panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.dv-tag {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  font-family: 'Manrope', 'Inter', sans-serif;
  white-space: nowrap;
  flex-shrink: 0;
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

  &__section-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
  }

  &__section-title {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--glacia-ink-dim);
    margin: 0;
  }

  &__severity-total {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 5px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.06);
    color: var(--glacia-ink-dim);
    font-size: 9.5px;
    font-weight: 700;
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

  &__severity-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
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

  &--mono {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  }
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

@media (max-width: 640px) {
  .target-modal__severity-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
