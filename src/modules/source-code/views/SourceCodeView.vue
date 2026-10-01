<script setup>
import HoldToDeleteModal from '@/components/common/HoldToDeleteModal.vue'
import { useRole } from '@/composables/useRole'
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/common/DataTable.vue'
import FilterDropdown from '@/components/common/FilterDropdown.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import DateTimePicker from '@/components/common/DateTimePicker.vue'
import GlassField from '@/components/common/GlassField.vue'
import { IconDotsVertical, IconCirclePlus, IconScan, IconArrowUpRight, IconArrowRight, IconTrash, IconX, IconCheck, IconPlus, IconTag, IconFolder, IconCode } from '@tabler/icons-vue'
import { getSourceCodeRepos, preloadSourceCodeList } from '@/modules/source-code/services/sourceCodeService'

// Load this page's data before it renders (the page is shown inside <Suspense>).
await preloadSourceCodeList()

const { can } = useRole()

// modalOnly: rendered from the Dashboard's Start Scan menu — shows just the
// Start Scanning modal (opened on mount) and tells the parent when it closes.
const props = defineProps({
  modalOnly: { type: Boolean, default: false },
})
const emit = defineEmits(['close-scan'])

const router = useRouter()
const repos = ref(getSourceCodeRepos())

const columns = [
  { key: '__index', label: '#', width: '24px', dim: true },
  { key: 'lastScanned', label: 'Last Scanned', width: '11%', truncate: true },
  { key: 'repo', label: 'Repository', width: '14%', truncate: true },
  { key: 'branch', label: 'Branch', width: '7%', truncate: true},
  { key: 'owner', label: 'Asset Owner', width: '16%', truncate: true },
  { key: 'scanType', label: 'Scan Type', width: '12%' },
  { key: 'tags', label: 'Multi-Tags', width: '18%' },
  { key: 'status', label: 'Scanning status', width: '12%', align: 'center' },
  { key: 'actions', label: 'Action', width: '70px', align: 'center' },
]

// Same palette as AssetInventoryView so tags render identically.
const tagColors = [
  { swatch: '#F26D6D', bg: '#FDE8E8', fg: '#E03131' }, { swatch: '#F2994A', bg: '#FDEEE0', fg: '#E8590C' },
  { swatch: '#F2C94C', bg: '#FCF3D6', fg: '#A67C00' }, { swatch: '#A8BD3A', bg: '#F1F5D6', fg: '#6B8E00' },
  { swatch: '#4CAF6D', bg: '#E3F5E8', fg: '#2F9E52' }, { swatch: '#3DBFA8', bg: '#DEF7F0', fg: '#12967D' },
  { swatch: '#3DC6F2', bg: '#DFF3FC', fg: '#1197C2' }, { swatch: '#7C93F0', bg: '#E6E9FC', fg: '#5C6BC0' },
  { swatch: '#E896BB', bg: '#FBE6F0', fg: '#C2255C' }, { swatch: '#B69AE8', bg: '#F0E6FB', fg: '#7C3FC4' },
  { swatch: '#9AA5B1', bg: '#ECEEF0', fg: '#5C6470' },
]

const statusMeta = {
  NotStarted: { label: 'Not yet started', pill: 'status-pill--notstarted' },
  Queue:      { label: 'Queue',      pill: 'status-pill--queue' },
  Scanning:   { label: 'Scanning',   pill: 'status-pill--scanning' },
  Completed:  { label: 'Completed',  pill: 'status-pill--completed' },
  Failed:     { label: 'Failed',     pill: 'status-pill--failed' },
  Waiting:    { label: 'Waiting',    pill: 'status-pill--waiting' },
}

// ── Filters ────────────────────────────────────────────────────────────────
const multiTagFilter = ref(null)
const scanTypeFilter = ref(null)
const statusFilter = ref(null)
const search = ref('')

const gitProviderOptions = [{ value: 'GitHub', label: 'GitHub' }]
const multiTagOptions = computed(() => {
  const vocab = new Map()
  repos.value.forEach((r) => (r.tags || []).forEach((t) => vocab.set(t.label, t.colorId)))
  createdTags.value.forEach((t) => vocab.set(t.label, t.colorId))
  return [...vocab.keys()].sort().map((label) => ({ value: label, label }))
})
const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))
const scanTypeFilterOptions = computed(() => scanTypeOptions.map((o) => ({ value: o.value, label: o.label })))

const filtered = computed(() => {
  let list = repos.value
  if (multiTagFilter.value) list = list.filter((r) => (r.tags || []).some((t) => t.label === multiTagFilter.value))
  if (statusFilter.value) list = list.filter((r) => r.status === statusFilter.value)
  if (scanTypeFilter.value) list = list.filter((r) => r.scanType === scanTypeFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((r) => r.repo.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q) || r.branch.toLowerCase().includes(q))
  return list
})

// ── Header actions ─────────────────────────────────────────────────────────
// Start Scanning opens the scan-configuration modal (same create-modal +
// form-select pattern as the AssetInventory register modals).
const showScanModal = ref(false)
const scanRepo = ref(null)
const scanBranch = ref(null)
const scanType = ref(null)
const scanDate = ref('')
const scanField = ref(null) // open in-modal select: 'repo' | 'branch' | 'type' | 'recurrence' | null
const scanDateOpen = ref(false)
const scanState = ref('idle') // 'idle' | 'loading' | 'saved'

const scanRepoOptions = computed(() =>
  repos.value.map((r) => ({ value: r.id, label: r.repo })),
)
const scanBranchOptions = computed(() => {
  const branches = new Set(repos.value.map((r) => r.branch))
  return [...branches].map((b) => ({ value: b, label: b }))
})
const scanTypeOptions = [
  { value: 'manual_scan', label: 'Manual Scan' },
  { value: 'scheduled_scan', label: 'Scheduled Scan' },
  { value: 'continuous_scan', label: 'Continuous Scan' },
]
const scanRecurrenceOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every Two Weeks' },
  { value: 'monthly', label: 'Monthly' },
]
const scanRecurrence = ref(null)
const canProceedScan = computed(() => {
  if (!scanRepo.value || !scanBranch.value || !scanType.value) return false
  // Manual Scan runs immediately — no schedule needed.
  if (scanType.value === 'manual_scan') return true
  // Scheduled scans need at least one fully-picked date & time.
  if (scanType.value === 'scheduled_scan') {
    return scanSchedules.value.length > 0 && scanSchedules.value.every((s) => !!s.value)
  }
  // Continuous scans also need a recurrence.
  if (scanType.value === 'continuous_scan') return !!scanDate.value && !!scanRecurrence.value
  return !!scanDate.value
})

// ── Multiple schedules (Scheduled Scan only) ───────────────────────────
const scanSchedules = ref([]) // [{ id, value: 'YYYY-MM-DD HH:mm', open }]
let scheduleSeq = 0
const anyScheduleOpen = computed(() => scanSchedules.value.some((s) => s.open))
// Any open picker (single or rows) collapses the rest of the form.
const pickerOpen = computed(() => scanDateOpen.value || anyScheduleOpen.value)

function addScheduleRow(open = true) {
  scanField.value = null
  scanSchedules.value = [
    ...scanSchedules.value.map((s) => ({ ...s, open: false })),
    { id: ++scheduleSeq, value: '', open },
  ]
}

function removeScheduleRow(id) {
  scanSchedules.value = scanSchedules.value.filter((s) => s.id !== id)
}

function toggleScheduleRow(id) {
  scanField.value = null
  scanDateOpen.value = false
  scanSchedules.value = scanSchedules.value.map((s) =>
    s.id === id ? { ...s, open: !s.open } : { ...s, open: false },
  )
  revealOpenCalendar()
}

// Scroll an opened calendar into view — the picker card is taller than the
// modal body, so without this its Apply/Cancel footer stays cut off.
function revealOpenCalendar() {
  nextTick(() => {
    document
      .querySelector('.schedule-row .select-panel.open .dt-card')
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

function selectScheduleRow(id, value) {
  scanSchedules.value = scanSchedules.value.map((s) =>
    s.id === id ? { ...s, value, open: false } : s,
  )
}

function openScanModal() {
  scanRepo.value = null
  scanBranch.value = null
  scanType.value = null
  scanRecurrence.value = null
  scanSchedules.value = []
  scanDate.value = ''
  scanField.value = null
  scanDateOpen.value = false
  scanState.value = 'idle'
  showScanModal.value = true
}

function closeScanModal() {
  showScanModal.value = false
  // Let the modal's leave transition finish before the parent unmounts us.
  if (props.modalOnly) setTimeout(() => emit('close-scan'), 300)
  scanField.value = null
  scanDateOpen.value = false
  scanState.value = 'idle'
}

function pickScanField(name, value) {
  if (name === 'repo') scanRepo.value = value
  if (name === 'branch') scanBranch.value = value
  if (name === 'type') {
    scanType.value = value
    scanDateOpen.value = false
    // Manual Scan has no schedule — drop any previously picked date.
    if (value === 'manual_scan') {
      scanDate.value = ''
    }
    // Scheduled scans collect their own list of dates.
    if (value === 'scheduled_scan' && scanSchedules.value.length === 0) {
      addScheduleRow(false)
    }
    if (value !== 'scheduled_scan') scanSchedules.value = []
    // Recurrence only applies to Continuous scans.
    if (value !== 'continuous_scan') scanRecurrence.value = null
  }
  if (name === 'recurrence') scanRecurrence.value = value
  scanField.value = null
}

function toggleScanDate() {
  scanField.value = null
  scanSchedules.value = scanSchedules.value.map((s) => ({ ...s, open: false }))
  scanDateOpen.value = !scanDateOpen.value
}

function submitScan() {
  if (!canProceedScan.value || scanState.value !== 'idle') return
  scanState.value = 'loading'
  setTimeout(() => {
    const targets = scanRepo.value
      ? repos.value.filter((r) => r.id === scanRepo.value)
      : repos.value.filter((r) => r.status === 'NotStarted')
    targets.forEach((r) => {
      r.status = 'Scanning'
      r.lastScanned = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      r.scanType = scanType.value
      // Persist recurrence so detail views can show it on the timeline.
      r.recurrence = scanType.value === 'continuous_scan' ? scanRecurrence.value : null
    })
    scanState.value = 'saved'
    setTimeout(closeScanModal, 700)
  }, 500)
}

// ── Register Repository modal — same pattern as AssetInventoryView's
// Repository tab (Asset Owner / Git Provider / URL / Visibility + token) ────
const showRegisterModal = ref(false)
const regOwner = ref(null)
const regProvider = ref(null)
const regVisibility = ref(null)
const regToken = ref('')
const regRepoUrl = ref('')
const regState = ref('idle') // 'idle' | 'loading' | 'saved'
const lastRegisteredRepo = ref('')

const ownerOptions = [
  { value: 'Protergo Cyber Security Ampera', label: 'Protergo Cyber Security Ampera' },
  { value: 'Protergo Cyber Security Jakarta', label: 'Protergo Cyber Security Jakarta' },
  { value: 'Protergo Cyber Security Surabaya', label: 'Protergo Cyber Security Surabaya' },
  { value: 'Protergo Fintech Solutions', label: 'Protergo Fintech Solutions' },
  { value: 'Protergo Cyber Security Bandung', label: 'Protergo Cyber Security Bandung' },
  { value: 'Beta Ventures Security', label: 'Beta Ventures Security' },
  { value: 'Protergo Labs', label: 'Protergo Labs' },
]
const repoVisibilityOptions = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

const regRepoUrlError = computed(() => {
  const u = regRepoUrl.value.trim()
  if (!u) return ''
  const ok = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}\/[\w.-]+\/[\w.-]+\/?$/i.test(u)
  if (!ok) return 'Please enter a valid URL (e.g., https://example.com)'
  return ''
})
const canRegister = computed(() =>
  !!regOwner.value && !!regProvider.value && !!regVisibility.value &&
  !!regRepoUrl.value.trim() && !regRepoUrlError.value &&
  (regVisibility.value === 'public' || !!regToken.value.trim())
)

function openRegisterModal() {
  regOwner.value = null
  regProvider.value = null
  regVisibility.value = null
  regToken.value = ''
  regRepoUrl.value = ''
  regState.value = 'idle'
  showRegisterModal.value = true
}

function closeRegisterModal() {
  showRegisterModal.value = false
}

function submitRegister() {
  if (!canRegister.value || regState.value !== 'idle') return
  regState.value = 'loading'
  setTimeout(() => {
    const url = regRepoUrl.value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
    const parts = url.split('/').filter(Boolean)
    const repoName = parts[parts.length - 1] || url
    repos.value.unshift({
      id: Math.max(...repos.value.map((r) => r.id)) + 1,
      repo: repoName,
      branch: 'main',
      gitProvider: gitProviderOptions.find((o) => o.value === regProvider.value)?.label ?? '',
      visibility: repoVisibilityOptions.find((o) => o.value === regVisibility.value)?.label ?? '',
      owner: regOwner.value,
      tags: [],
      status: 'Scanning',
    })
    lastRegisteredRepo.value = repoName
    regState.value = 'saved'
  }, 500)
}

function goToAssetInventoryRepository() {
  closeRegisterModal()
  router.push('/assets?tab=source')
}

// ── Row action menu (teleported, same as CiCdView) ──────────────────────────
const openMenuId = ref(null)
const menuPos = ref({ top: 0, left: 0 })

function toggleMenu(row, event) {
  if (openMenuId.value === row.id) {
    openMenuId.value = null
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  menuPos.value = { top: rect.bottom + 6, left: rect.right - 176 }
  openMenuId.value = row.id
}

function closeMenu() {
  openMenuId.value = null
}

function seeDetail(id) {
  closeMenu()
  router.push(`/assets/source-code/${id}`)
}

// ── Delete modal (shared HoldToDeleteModal) ──
const showDeleteModal = ref(false)
const deletingRepo = ref(null)

function deleteRepo(id) {
  closeMenu()
  deletingRepo.value = repos.value.find((r) => r.id === id) ?? null
  showDeleteModal.value = true
}
function confirmDeleteRepo() {
  repos.value = repos.value.filter((r) => r.id !== deletingRepo.value.id)
}

// ── Multi-Tags picker popover (same pattern as AssetInventoryView) ─────────
const tagPopoverFor = ref(null) // repo id
const tagPopoverPos = ref({ top: 0, left: 0 })
const tagQuery = ref('')
const tagNewColor = ref(4)
const createdTags = ref([
  { label: 'Production', colorId: 4 },
  { label: 'Staging', colorId: 1 },
  { label: 'Dev', colorId: 3 },
])
const tagVocab = computed(() => {
  const m = new Map()
  repos.value.forEach((r) => (r.tags || []).forEach((t) => m.set(t.label, t.colorId)))
  createdTags.value.forEach((t) => m.set(t.label, t.colorId))
  return [...m.entries()].map(([label, colorId]) => ({ label, colorId, bg: tagColors[colorId].bg, fg: tagColors[colorId].fg }))
})
const filteredTagVocab = computed(() => {
  const q = tagQuery.value.trim().toLowerCase()
  if (!q) return tagVocab.value
  return tagVocab.value.filter((t) => t.label.toLowerCase().includes(q))
})
const tagPopoverRow = computed(() => repos.value.find((r) => r.id === tagPopoverFor.value) || null)

function openTagPopover(row, e) {
  tagPopoverFor.value = row.id
  tagQuery.value = ''
  const rect = e.currentTarget.getBoundingClientRect()
  tagPopoverPos.value = { top: rect.bottom + 6, left: Math.max(8, Math.min(rect.left, window.innerWidth - 288)) }
}

function manageTags(id) {
  const row = repos.value.find((r) => r.id === id)
  const pos = { ...menuPos.value }
  closeMenu()
  if (!row) return
  tagPopoverFor.value = row.id
  tagQuery.value = ''
  tagPopoverPos.value = { top: pos.top, left: Math.max(8, Math.min(pos.left, window.innerWidth - 288)) }
}

function closeTagPopover() { tagPopoverFor.value = null }

function pickExistingTag(row, tag) {
  if (!row.tags.some((t) => t.label === tag.label)) row.tags.push({ label: tag.label, colorId: tag.colorId })
}

function createRowTag(row) {
  const label = tagQuery.value.trim()
  if (!label || row.tags.some((t) => t.label === label)) return
  const entry = { label, colorId: tagNewColor.value }
  createdTags.value.push(entry)
  row.tags.push(entry)
  tagQuery.value = ''
}

function removeRowTag(row, label) {
  row.tags = row.tags.filter((t) => t.label !== label)
}

function handleClickOutside(e) {
  if (!e.target.closest('.action-menu, .action-btn')) closeMenu()
  if (!e.target.closest('.tag-popover, .tag-add')) closeTagPopover()
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

onMounted(() => {
  if (props.modalOnly) openScanModal()
})
</script>

<template>
  <div class="source-code" :class="{ 'source-code--modal-only': modalOnly }">
    <div class="source-code__head">
      <h1 class="source-code__title">Source Code Assessment</h1>
      <div class="source-code__actions">
        <button type="button" class="btn-register" @click="openRegisterModal"><IconCirclePlus :size="15" /> Register Repository</button>
        <button type="button" class="btn-register" @click="openScanModal"><IconScan :size="15" /> Start Scanning</button>
      </div>
    </div>

    <div class="source-code__controls">
      <div class="source-code__filters">
        <FilterDropdown v-model="scanTypeFilter" :options="scanTypeFilterOptions" placeholder="Scan Type" />
        <FilterDropdown v-model="multiTagFilter" :options="multiTagOptions" placeholder="Multi-Tags" />
        <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scanning Status" />
      </div>
      <SearchInput v-model="search" placeholder="Search" />
    </div>

    <DataTable
      :columns="columns"
      :items="filtered"
      :loading="false"
      empty-text="No repositories found." :empty-icon="IconCode"
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
          <button v-if="!row.tags.length" type="button" class="tag-add" @click.stop="openTagPopover(row, $event)">Add tag</button>
        </div>
      </template>
      <template #cell-status="{ row }">
        <span class="status-pill" :class="statusMeta[row.status]?.pill ?? 'status-pill--notstarted'">
          {{ statusMeta[row.status]?.label ?? row.status }}
        </span>
      </template>
      <template #cell-lastScanned="{ row }">
        <span :class="{ dim: !row.lastScanned }">{{ row.lastScanned || 'Not available' }}</span>
      </template>
      <template #cell-scanType="{ row }">
        <span :class="{ dim: !row.scanType }">
          {{ scanTypeOptions.find((o) => o.value === row.scanType)?.label ?? '—' }}
        </span>
      </template>
      <template #cell-actions="{ row }">
        <button type="button" class="action-btn" aria-label="Actions" @click.stop="toggleMenu(row, $event)">
          <IconDotsVertical :size="16" />
        </button>
      </template>
    </DataTable>

    <Teleport to="body">
      <div v-if="openMenuId" class="action-menu" :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }">
        <button type="button" class="action-menu__item" @click="seeDetail(openMenuId)">
          <IconArrowUpRight :size="15" />
          See Detail
        </button>
        <button type="button" class="action-menu__item" @click="manageTags(openMenuId)">
          <IconTag :size="15" />
          Manage tag
        </button>
        <button v-if="can('delete_asset')" type="button" class="action-menu__item action-menu__item--danger" @click="deleteRepo(openMenuId)">
          <IconTrash :size="15" />
          Delete
        </button>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="tagPopoverFor && tagPopoverRow" class="tag-popover" :style="{ top: `${tagPopoverPos.top}px`, left: `${tagPopoverPos.left}px` }">
        <div class="tag-popover__title">Manage Multi Tags</div>
        <div class="tag-popover__current">
          <span v-for="t in tagPopoverRow.tags" :key="t.label" class="dv-tag" :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }">
            {{ t.label }}
            <button type="button" class="dv-tag__x" @click="removeRowTag(tagPopoverRow, t.label)">×</button>
          </span>
          <span v-if="!tagPopoverRow.tags.length" class="tag-popover__empty">No tags yet.</span>
        </div>
        <input v-model="tagQuery" type="text" class="tag-popover__search" placeholder="Find or create tag..." />
        <div class="tag-popover__list">
          <button
            v-for="t in filteredTagVocab"
            :key="t.label"
            type="button"
            class="tag-popover__item"
            :class="{ 'tag-popover__item--added': tagPopoverRow.tags.some((x) => x.label === t.label) }"
            @click="pickExistingTag(tagPopoverRow, t)"
          >
            <span class="dv-dot" :style="{ background: t.fg }"></span>{{ t.label }}
            <span v-if="tagPopoverRow.tags.some((x) => x.label === t.label)" class="tag-popover__check">✓</span>
          </button>
          <div v-if="!filteredTagVocab.length" class="tag-popover__empty">No matches — create it below.</div>
        </div>
        <div class="tag-popover__create">
          <div class="tag-popover__colors">
            <button
              v-for="(c, i) in tagColors"
              :key="c.swatch"
              type="button"
              class="tag-popover__swatch"
              :class="{ 'tag-popover__swatch--active': tagNewColor === i }"
              :style="{ background: c.swatch }"
              @click="tagNewColor = i"
            ></button>
          </div>
          <button type="button" class="tag-popover__add" :disabled="!tagQuery.trim()" @click="createRowTag(tagPopoverRow)">Add</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showScanModal" class="modal-backdrop" @mousedown.self="closeScanModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Source Code Scan Configuration</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeScanModal">
                <IconX :size="20" />
              </button>
            </div>

            <div class="create-modal__body">
              <!-- The other fields step aside while any calendar is open so
                only the Date & Time content shows; they return on Apply. -->
              <div v-show="!pickerOpen">
              <div class="scan-field">
                <GlassField
                  :model-value="scanRepo"
                  type="select"
                  label="Repository"
                  placeholder="select repository..."
                  :options="scanRepoOptions"
                  :visible-rows="4"
                  required
                  error-text="Choose a repository"
                  @update:model-value="(v) => pickScanField('repo', v)"
                />
              </div>

              <div class="scan-field">
                <GlassField
                  :model-value="scanBranch"
                  type="select"
                  label="Branch"
                  placeholder="select branch..."
                  :options="scanBranchOptions"
                  :visible-rows="4"
                  required
                  error-text="Choose a branch"
                  @update:model-value="(v) => pickScanField('branch', v)"
                />
              </div>

              <div class="scan-field">
                <GlassField
                  :model-value="scanType"
                  type="select"
                  label="Scan type"
                  placeholder="select scan type..."
                  :options="scanTypeOptions"
                  :visible-rows="4"
                  required
                  error-text="Choose a scan type"
                  @update:model-value="(v) => pickScanField('type', v)"
                />
              </div>

              <template v-if="scanType === 'continuous_scan'">
                <div class="scan-field">
                  <GlassField
                    :model-value="scanRecurrence"
                    type="select"
                    label="Recurrence"
                    placeholder="select recurrence..."
                    :options="scanRecurrenceOptions"
                    :visible-rows="4"
                    required
                    error-text="Choose a recurrence"
                    @update:model-value="(v) => pickScanField('recurrence', v)"
                  />
                </div>
              </template>
              </div>

              <template v-if="scanType === 'scheduled_scan'">
                <div v-show="!anyScheduleOpen" class="schedule-block">
                  <span class="schedule-block__label">Scheduled Dates &amp; Times<span class="create-modal__required">*</span></span>
                </div>
                <div class="schedule-list">
                  <div
                    v-for="row in scanSchedules"
                    :key="row.id"
                    v-show="!anyScheduleOpen || row.open"
                    class="schedule-row"
                  >
                    <DateTimePicker
                      :model-value="row.value"
                      :open="row.open"
                      placeholder="select date & time..."
                      @toggle="toggleScheduleRow(row.id)"
                      @update:model-value="(v) => selectScheduleRow(row.id, v)"
                    />
                    <button
                      v-show="!row.open"
                      type="button"
                      class="schedule-row__remove"
                      aria-label="Remove schedule"
                      @click="removeScheduleRow(row.id)"
                    >
                      <IconX :size="16" />
                    </button>
                  </div>
                  <button v-show="!anyScheduleOpen" type="button" class="schedule-add" @click="addScheduleRow(true)">
                    <IconPlus :size="14" /> Add date &amp; time
                  </button>
                </div>
              </template>

              <template v-if="scanType === 'continuous_scan'">
                <label v-show="!scanDateOpen" class="create-modal__label">{{ scanType === 'continuous_scan' ? 'Initial Date and Time' : 'Date & Time' }}<span class="create-modal__required">*</span></label>
                <DateTimePicker
                  v-model="scanDate"
                  :open="scanDateOpen"
                  placeholder="select date & time..."
                  @toggle="toggleScanDate"
                  @select="scanDateOpen = false"
                />
              </template>
            </div>

            <div v-show="!pickerOpen" class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeScanModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="canProceedScan ? { 'modal-btn--save': true, 'modal-btn--saved': scanState === 'saved' } : 'modal-btn--create'"
                :disabled="!canProceedScan"
                @click="submitScan"
              >
                <span v-if="scanState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="scanState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Initiate Scan</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showRegisterModal" class="modal-backdrop" @mousedown.self="closeRegisterModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Register Repository</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeRegisterModal">
                <IconX :size="20" />
              </button>
            </div>

            <div v-if="regState === 'saved'" class="create-modal__body">
              <div class="reg-success">
                <div class="reg-success__card">
                  <span class="reg-success__icon">
                    <IconFolder :size="22" />
                    <span class="reg-success__check"><IconCheck :size="11" /></span>
                  </span>
                  <div class="reg-success__card-text">
                    <p class="reg-success__repo">{{ lastRegisteredRepo }}</p>
                    <p class="reg-success__sub">Repository registered</p>
                  </div>
                  <span class="status-pill status-pill--scanning reg-success__status">
                    <span class="reg-success__status-dot"></span> Scanning
                  </span>
                </div>

                <p class="reg-success__desc">
                  <strong>{{ lastRegisteredRepo }}</strong> is now being discovered. It will be available to scan for vulnerability assessment once the discovery scan finishes. You can track its progress from Asset Inventory in the meantime.
                </p>
              </div>
            </div>

            <div v-else class="create-modal__body create-modal__body--fields">
              <GlassField
                v-model="regOwner"
                type="select"
                label="Asset Owner"
                placeholder="Asset Owner"
                required
                :options="ownerOptions"
                error-text="Asset owner is required."
              />

              <GlassField
                v-model="regProvider"
                type="select"
                label="Git Provider"
                placeholder="Git Provider"
                required
                :options="gitProviderOptions"
                error-text="Git provider is required."
              />

              <div>
                <GlassField
                  v-model="regRepoUrl"
                  label="URL Repository"
                  placeholder="URL Repository"
                  required
                  :invalid="!!regRepoUrlError"
                  :error-text="regRepoUrlError || 'URL Repository is required.'"
                />
              </div>

              <GlassField
                v-model="regVisibility"
                type="select"
                label="Repository Visibility"
                placeholder="Repository Visibility"
                required
                :options="repoVisibilityOptions"
                error-text="Repository visibility is required."
              />

              <Transition name="dv-expand">
                <div v-if="regVisibility === 'private'">
                  <GlassField
                    v-model="regToken"
                    input-type="password"
                    label="Personal Access Token"
                    placeholder="Personal Access Token"
                    required
                    error-text="Personal access token is required."
                  />
                </div>
              </Transition>
            </div>

            <div v-if="regState === 'saved'" class="create-modal__actions create-modal__actions--column">
              <button type="button" class="reg-success__link" @click="goToAssetInventoryRepository">
                View scanning progress <IconArrowRight :size="16" />
              </button>
              <button type="button" class="reg-success__close" @click="closeRegisterModal">Close</button>
            </div>
            <div v-else class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeRegisterModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="canRegister ? 'modal-btn--save' : 'modal-btn--create'"
                :disabled="!canRegister || regState === 'loading'"
                @click="submitRegister"
              >
                <span v-if="regState === 'loading'" class="modal-btn__spinner" />
                <span v-else>Proceed</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <HoldToDeleteModal
      v-model="showDeleteModal"
      title="Delete repository"
      :subject="deletingRepo?.repo"
      :icon="IconFolder"
      message="and its scan history will be removed immediately. Once deleted, you won't be able to view or restore its findings."
      done-title="Repository deleted"
      @confirm="confirmDeleteRepo"
      @closed="deletingRepo = null"
    />
  </div>
</template>

<style scoped lang="scss" src="./SourceCodeView.scss"></style>
