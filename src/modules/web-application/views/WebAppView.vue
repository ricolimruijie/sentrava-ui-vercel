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
import { getWebApps, preloadWebAppList } from '@/modules/web-application/services/webAppService'
import { IconDotsVertical, IconCirclePlus, IconScan, IconX, IconTag, IconArrowUpRight, IconTrash, IconCheck, IconFolder, IconPlus, IconBuilding, IconKey, IconInfoCircle, IconArrowRight, IconBrowser } from '@tabler/icons-vue'

// Load this page's data before it renders (the page is shown inside <Suspense>).
await preloadWebAppList()

const { can } = useRole()

// modalOnly: rendered from the Dashboard's Start Scan menu — shows just the
// Start Scanning modal (opened on mount) and tells the parent when it closes.
const props = defineProps({
  modalOnly: { type: Boolean, default: false },
})
const emit = defineEmits(['close-scan'])

const router = useRouter()

const apps = ref(getWebApps())

const columns = [
  { key: '__index', label: 'No', kind: 'index', width: '52px', dim: true  },
  { key: 'lastScanned', label: 'Last scanned', width: '154px', truncate: true },
  { key: 'name', label: 'Application name', min: 151, max: 280, truncate: true },
  { key: 'target', label: 'Target', min: 130, max: 440, truncate: true },
  { key: 'owner', label: 'Asset owner', min: 130, max: 260, truncate: true },
  { key: 'scanType', label: 'Scan type', width: '136px', truncate: true },
  { key: 'tags', label: 'Multi-Tags', min: 130, max: 260 },
  { key: 'status', label: 'Scanning status', width: '146px', align: 'center' },
  { key: 'actions', label: 'Action', kind: 'action', align: 'center'  },
]

// Same palette as SourceCodeView so tags render identically.
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

const scanTypeOptions = [
  { value: 'manual_scan', label: 'Manual Scan' },
  { value: 'scheduled_scan', label: 'Scheduled Scan' },
  { value: 'continuous_scan', label: 'Continuous Scan' },
]

// ── Filters ────────────────────────────────────────────────────────────────
const multiTagFilter = ref(null)
const scanTypeFilter = ref(null)
const statusFilter = ref(null)
const search = ref('')

const multiTagOptions = computed(() => {
  const vocab = new Map()
  apps.value.forEach((a) => (a.tags || []).forEach((t) => vocab.set(t.label, t.colorId)))
  return [...vocab.keys()].sort().map((label) => ({ value: label, label }))
})
const scanTypeFilterOptions = computed(() => scanTypeOptions.map((o) => ({ value: o.value, label: o.label })))
const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))

const filtered = computed(() => {
  let list = apps.value
  if (multiTagFilter.value) list = list.filter((a) => (a.tags || []).some((t) => t.label === multiTagFilter.value))
  if (scanTypeFilter.value) list = list.filter((a) => a.scanType === scanTypeFilter.value)
  if (statusFilter.value) list = list.filter((a) => a.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((a) => a.name.toLowerCase().includes(q) || a.target.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q))
  return list
})

// ── Row action menu (teleported, same as SourceCodeView) ───────────────────
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

function deleteApp(id) {
  closeMenu()
  deletingApp.value = apps.value.find((a) => a.id === id) ?? null
  showDeleteModal.value = true
}

// ── Delete modal (shared HoldToDeleteModal) ──
const showDeleteModal = ref(false)
const deletingApp = ref(null)
function confirmDeleteApp() {
  apps.value = apps.value.filter((a) => a.id !== deletingApp.value.id)
}

// ── Detail: dedicated page ─────────────────────────────────────────────────
function seeDetail(id) {
  closeMenu()
  router.push(`/assets/webapps/${id}`)
}

// ── Multi-Tags picker popover (same pattern as SourceCodeView) ─────────────
const tagPopoverFor = ref(null) // app id
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
  apps.value.forEach((a) => (a.tags || []).forEach((t) => m.set(t.label, t.colorId)))
  createdTags.value.forEach((t) => m.set(t.label, t.colorId))
  return [...m.entries()].map(([label, colorId]) => ({ label, colorId, bg: tagColors[colorId].bg, fg: tagColors[colorId].fg }))
})
const filteredTagVocab = computed(() => {
  const q = tagQuery.value.trim().toLowerCase()
  if (!q) return tagVocab.value
  return tagVocab.value.filter((t) => t.label.toLowerCase().includes(q))
})
const tagPopoverRow = computed(() => apps.value.find((a) => a.id === tagPopoverFor.value) || null)

function openTagPopover(row, e) {
  tagPopoverFor.value = row.id
  tagQuery.value = ''
  const rect = e.currentTarget.getBoundingClientRect()
  tagPopoverPos.value = { top: rect.bottom + 6, left: Math.max(8, Math.min(rect.left, window.innerWidth - 288)) }
}

function manageTags(id) {
  const row = apps.value.find((a) => a.id === id)
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

// ── Register URL modal (same fields as Asset Inventory's Register URL) ────
const showUrlModal = ref(false)
const regUrlOwner = ref(null)
const regUrlName = ref('')
const regUrl = ref('')
const regUrlBasic = ref(false)
const regUrlUser = ref('')
const regUrlPass = ref('')
const regUrlState = ref('idle') // 'idle' | 'loading' | 'saved'
const lastRegisteredApp = ref('')

const ownerOptions = [
  { value: 'Protergo Cyber Security Ampera', label: 'Protergo Cyber Security Ampera' },
  { value: 'Protergo Cyber Security Jakarta', label: 'Protergo Cyber Security Jakarta' },
  { value: 'Protergo Cyber Security Surabaya', label: 'Protergo Cyber Security Surabaya' },
  { value: 'Protergo Fintech Solutions', label: 'Protergo Fintech Solutions' },
  { value: 'Protergo Cyber Security Bandung', label: 'Protergo Cyber Security Bandung' },
  { value: 'Beta Ventures Security', label: 'Beta Ventures Security' },
  { value: 'Protergo Labs', label: 'Protergo Labs' },
]

const regUrlError = computed(() => {
  const u = regUrl.value.trim()
  if (!u) return ''
  if (!/^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(u)) return 'Please enter a valid URL (e.g., https://example.com)'
  return ''
})
const canRegisterUrl = computed(() => {
  if (!regUrlOwner.value || !regUrlName.value.trim() || !regUrl.value.trim() || regUrlError.value) return false
  if (regUrlBasic.value && (!regUrlUser.value.trim() || !regUrlPass.value)) return false
  return true
})

function openUrlModal() {
  regUrlOwner.value = null
  regUrlName.value = ''
  regUrl.value = ''
  regUrlBasic.value = false
  regUrlUser.value = ''
  regUrlPass.value = ''
  regUrlState.value = 'idle'
  showUrlModal.value = true
}

function goToAssetInventoryUrl() {
  closeUrlModal()
  router.push('/assets?tab=webapp')
}
function closeUrlModal() {
  showUrlModal.value = false
  regUrlState.value = 'idle'
}

function selectRegUrlOwner(value) {
  regUrlOwner.value = value
}

function submitUrl() {
  if (!canRegisterUrl.value || regUrlState.value !== 'idle') return
  regUrlState.value = 'loading'
  setTimeout(() => {
    let name = regUrlName.value.trim()
    apps.value.unshift({
      id: Math.max(...apps.value.map((a) => a.id)) + 1,
      name,
      target: regUrl.value.trim(),
      owner: regUrlOwner.value,
      scanType: 'manual_scan',
      tags: [],
      status: 'Scanning',
    })
    lastRegisteredApp.value = name
    regUrlState.value = 'saved'
  }, 500)
}

// ── Input Application modal ────────────────────────────────────────────────
const showAppModal = ref(false)
const appName = ref('')
const appTarget = ref('')
const appOwner = ref('')
const appScanType = ref(null)
const appAttempted = ref(false)
const appState = ref('idle') // 'idle' | 'loading' | 'saved'

function openAppModal() {
  appName.value = ''
  appTarget.value = ''
  appOwner.value = ''
  appScanType.value = null
  appAttempted.value = false
  appState.value = 'idle'
  showAppModal.value = true
}

function closeAppModal() {
  showAppModal.value = false
  appAttempted.value = false
  appState.value = 'idle'
}

function submitApp() {
  appAttempted.value = true
  if (!appName.value.trim() || !appTarget.value.trim() || !appOwner.value.trim() || !appScanType.value || appState.value !== 'idle') return
  appState.value = 'loading'
  setTimeout(() => {
    apps.value.unshift({
      id: Math.max(...apps.value.map((a) => a.id)) + 1,
      name: appName.value.trim(),
      target: appTarget.value.trim(),
      owner: appOwner.value.trim(),
      scanType: appScanType.value,
      tags: [],
      status: 'NotStarted',
    })
    appState.value = 'saved'
    setTimeout(closeAppModal, 700)
  }, 500)
}

// ── Start Scanning modal (same GlassField + DateTimePicker pattern as ──────
// SourceCodeView): Application / target info card / Scan type / Recurrence ──
const showScanModal = ref(false)
const scanApp = ref(null)
const scanType = ref(null)
const scanRecurrence = ref(null)
const scanDate = ref('')
const scanDateOpen = ref(false)
const scanState = ref('idle') // 'idle' | 'loading' | 'saved'

const scanAppOptions = computed(() =>
  apps.value.map((a) => ({ value: a.id, label: a.name })),
)
const selectedScanApp = computed(() => apps.value.find((a) => a.id === scanApp.value) ?? null)
const scanAppAuthActive = computed(() => (selectedScanApp.value?.auth ?? 'Inactive') === 'Active')
const scanRecurrenceOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every Two Weeks' },
  { value: 'monthly', label: 'Monthly' },
]
const canProceedScan = computed(() => {
  if (!scanApp.value || !scanType.value) return false
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
  scanSchedules.value = [
    ...scanSchedules.value.map((s) => ({ ...s, open: false })),
    { id: ++scheduleSeq, value: '', open },
  ]
}
function removeScheduleRow(id) {
  scanSchedules.value = scanSchedules.value.filter((s) => s.id !== id)
}

function toggleScheduleRow(id) {
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
  scanApp.value = null
  scanType.value = null
  scanRecurrence.value = null
  scanSchedules.value = []
  scanDate.value = ''
  scanDateOpen.value = false
  scanState.value = 'idle'
  showScanModal.value = true
}

function closeScanModal() {
  showScanModal.value = false
  // Let the modal's leave transition finish before the parent unmounts us.
  if (props.modalOnly) setTimeout(() => emit('close-scan'), 300)
  scanDateOpen.value = false
  scanState.value = 'idle'
}

function pickScanField(name, value) {
  if (name === 'app') scanApp.value = value
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
}

function toggleScanDate() {
  scanSchedules.value = scanSchedules.value.map((s) => ({ ...s, open: false }))
  scanDateOpen.value = !scanDateOpen.value
}

function submitScan() {
  if (!canProceedScan.value || scanState.value !== 'idle') return
  scanState.value = 'loading'
  setTimeout(() => {
    const targets = scanApp.value
      ? apps.value.filter((a) => a.id === scanApp.value)
      : apps.value.filter((a) => a.status === 'NotStarted')
    targets.forEach((a) => {
      a.status = 'Scanning'
      a.lastScanned = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      a.scanType = scanType.value
      // Persist recurrence so detail views can show it on the timeline.
      a.recurrence = scanType.value === 'continuous_scan' ? scanRecurrence.value : null
    })
    scanState.value = 'saved'
    setTimeout(closeScanModal, 700)
  }, 500)
}

onMounted(() => {
  if (props.modalOnly) openScanModal()
})
</script>

<template>
  <div class="web-app" :class="{ 'web-app--modal-only': modalOnly }">
    <div class="web-app__head">
      <h1 class="web-app__title">Web Application Assessment</h1>
      <div class="web-app__actions">
        <button type="button" class="btn-register" @click="openUrlModal"><IconCirclePlus :size="15" /> Register URL</button>
        <button type="button" class="btn-register" @click="openScanModal"><IconScan :size="15" /> Start Scanning</button>
      </div>
    </div>

    <div class="web-app__controls">
      <div class="web-app__filters">
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
      empty-text="No applications found." :empty-icon="IconBrowser"
    >
      <template #cell-tags="{ row }">
        <div class="cell-tags">
          <span
            v-for="t in row.tags.slice(0, 2)"
            :key="t.label"
            :title="t.label" class="dv-tag"
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
        <button v-if="can('delete_asset')" type="button" class="action-menu__item action-menu__item--danger" @click="deleteApp(openMenuId)">
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
        <div v-if="showUrlModal" class="modal-backdrop" @mousedown.self="closeUrlModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Register URL</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeUrlModal">
                <IconX :size="20" />
              </button>
            </div>
            <div v-if="regUrlState === 'saved'" class="create-modal__body">
              <div class="reg-success">
                <div class="reg-success__card">
                  <span class="reg-success__icon">
                    <IconBrowser :size="22" />
                    <span class="reg-success__check"><IconCheck :size="11" /></span>
                  </span>
                  <div class="reg-success__card-text">
                    <p class="reg-success__repo">{{ lastRegisteredApp }}</p>
                    <p class="reg-success__sub">URL registered</p>
                  </div>
                  <span class="status-pill status-pill--scanning reg-success__status">
                    <span class="reg-success__status-dot"></span> Scanning
                  </span>
                </div>

                <p class="reg-success__desc">
                  <strong>{{ lastRegisteredApp }}</strong> is now being discovered. It will be available to scan for vulnerability assessment once the discovery scan finishes. You can track its progress from Asset Inventory in the meantime.
                </p>
              </div>
            </div>

            <div v-else class="create-modal__body">
              <div class="create-modal__group">
                <GlassField
                  type="select"
                  label="Asset Owner"
                  placeholder="Asset Owner"
                  required
                  :options="ownerOptions"
                  :model-value="regUrlOwner"
                  @update:model-value="selectRegUrlOwner"
                  error-text="Asset Owner is required"
                />

                <GlassField
                  v-model="regUrlName"
                  label="Application Name"
                  placeholder="Application Name"
                  required
                  error-text="Application Name is required"
                />

                <GlassField
                  v-model="regUrl"
                  label="Input URL"
                  placeholder="Input URL"
                  required
                  :invalid="!!regUrlError"
                  :error-text="regUrlError || 'URL is required'"
                />
              </div>

              <div class="auth-block">
                <span class="auth-block__label">Authentication</span>
                <div class="basic-auth-card">
                  <div class="basic-auth-card__row">
                    <span class="basic-auth-card__title">Basic Authentication</span>
                    <button
                      type="button"
                      class="toggle-switch"
                      :class="{ 'toggle-switch--on': regUrlBasic }"
                      role="switch"
                      :aria-checked="regUrlBasic"
                      @click="regUrlBasic = !regUrlBasic"
                    >
                      <span class="toggle-switch__thumb" />
                    </button>
                  </div>
                  <Transition name="dv-expand">
                    <div v-if="regUrlBasic" class="basic-auth-card__fields">
                      <GlassField v-model="regUrlUser" label="Username" placeholder="Username" required error-text="Username is required" />
                      <GlassField v-model="regUrlPass" label="Password" placeholder="Password" input-type="password" required error-text="Password is required" />
                    </div>
                  </Transition>
                </div>
              </div>
            </div>

            <div v-if="regUrlState === 'saved'" class="create-modal__actions create-modal__actions--column">
              <button type="button" class="reg-success__link" @click="goToAssetInventoryUrl">
                View scanning progress <IconArrowRight :size="16" />
              </button>
              <button type="button" class="reg-success__close" @click="closeUrlModal">Close</button>
            </div>
            <div v-else class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeUrlModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="canRegisterUrl ? { 'modal-btn--save': true, 'modal-btn--saved': regUrlState === 'saved' } : 'modal-btn--create'"
                :disabled="!canRegisterUrl"
                @click="submitUrl"
              >
                <span v-if="regUrlState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="regUrlState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Register</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showAppModal" class="modal-backdrop" @mousedown.self="closeAppModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Input Application</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeAppModal">
                <IconX :size="20" />
              </button>
            </div>
            <div class="create-modal__body">
              <GlassField
                v-model="appName"
                label="Application name"
                placeholder="e.g. Customer Portal"
                required
                error-text="Application name is required."
              />

              <GlassField
                v-model="appTarget"
                label="Target"
                placeholder="e.g. https://app.protergo.id"
                required
                error-text="Target is required."
              />

              <GlassField
                v-model="appOwner"
                label="Asset owner"
                placeholder="e.g. Protergo Cyber Security HQ"
                required
                error-text="Asset owner is required."
              />

              <GlassField
                v-model="appScanType"
                type="select"
                label="Scan type"
                placeholder="select scan type..."
                required
                :options="scanTypeOptions"
                error-text="Scan type is required."
              />

              <div class="create-modal__actions">
                <button
                  type="button"
                  class="modal-btn"
                  :class="appState === 'saved' ? 'modal-btn--saved' : 'modal-btn--create'"
                  :disabled="appState !== 'idle'"
                  @click="submitApp"
                >
                  {{ appState === 'saved' ? 'Saved' : appState === 'loading' ? 'Saving…' : 'Save' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showScanModal" class="modal-backdrop" @mousedown.self="closeScanModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Web Application Scan Configuration</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeScanModal">
                <IconX :size="20" />
              </button>
            </div>

            <div class="create-modal__body">
              <div v-show="!pickerOpen">
                <div class="scan-field">
                  <GlassField
                    :model-value="scanApp"
                    type="select"
                    label="Application"
                    placeholder="select application..."
                    :options="scanAppOptions"
                    :visible-rows="4"
                    required
                    error-text="Choose an application"
                    @update:model-value="(v) => pickScanField('app', v)"
                  />
                </div>

                <div v-if="selectedScanApp" class="scan-target">
                  <div class="scan-target__hero">
                    <span class="scan-target__eyebrow">Target</span>
                    <h3 class="scan-target__name">{{ selectedScanApp.name }}</h3>
                    <div class="scan-target__url">{{ selectedScanApp.target }}</div>
                  </div>
                  <div class="scan-target__grid">
                    <div class="scan-target__card">
                      <span class="scan-target__label"><IconBuilding :size="15" /> Asset Owner</span>
                      <span class="scan-target__value">{{ selectedScanApp.owner }}</span>
                    </div>
                    <div class="scan-target__card">
                      <span class="scan-target__label"><IconKey :size="15" /> Authentication</span>
                      <span class="scan-target__value">Basic Authentication</span>
                      <span
                        class="scan-target__pill"
                        :class="scanAppAuthActive ? 'scan-target__pill--active' : 'scan-target__pill--inactive'"
                      ><span
                        class="scan-target__dot"
                        :class="scanAppAuthActive ? 'scan-target__dot--active' : 'scan-target__dot--inactive'"
                      />{{ scanAppAuthActive ? 'Active' : 'Inactive' }}</span>
                    </div>
                  </div>
                  <p v-if="!scanAppAuthActive" class="scan-target__notice">
                    <IconInfoCircle :size="18" class="scan-target__notice-icon" />
                    <span>Authentication is inactive, so only publicly reachable pages will be scanned.</span>
                  </p>
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
                <label v-show="!scanDateOpen" class="create-modal__label">Initial Date and Time<span class="create-modal__required">*</span></label>
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

    <HoldToDeleteModal
      v-model="showDeleteModal"
      title="Delete application"
      :subject="deletingApp?.name"
      :icon="IconFolder"
      message="and its scan history will be removed immediately. Once deleted, you won't be able to view or restore its findings."
      done-title="Application deleted"
      @confirm="confirmDeleteApp"
      @closed="deletingApp = null"
    />
  </div>
</template>

<style scoped lang="scss" src="./WebAppView.scss"></style>
