<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/table/DataTable.vue'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import SearchInput from '@/components/reusable/SearchInput.vue'
import DateTimePicker from '@/components/reusable/DateTimePicker.vue'
import GlassField from '@/components/reusable/GlassField.vue'
import { getDomains, getDomainEndpoints } from '@/mocks/assets/domain.js'
import { IconDotsVertical, IconCirclePlus, IconScan, IconCheck, IconX, IconArrowUpRight, IconTrash, IconGlobe, IconPlus, IconArrowRight } from '@tabler/icons-vue'

const router = useRouter()

const domains = ref(getDomains())

const columns = [
  { key: '__index', label: '#', width: '24px', dim: true },
  { key: 'lastScanned', label: 'Last Scanned', width: '12%', truncate: true },
  { key: 'endpoint', label: 'Domain', width: '18%', truncate: true },
  { key: 'registeredCount', label: 'Registered endpoint', width: '14%', align: 'center' },
  { key: 'owner', label: 'Asset owner', width: '20%', truncate: true },
  { key: 'scanType', label: 'Scan type', width: '14%', truncate: true},
  { key: 'status', label: 'Scanning status', width: '12%', align: 'center' },
  { key: 'actions', label: 'Action', width: '76px', align: 'center' },
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
  { value: 'manual', label: 'Manual triggered' },
  { value: 'scheduled', label: 'Scheduled scanning' },
  { value: 'continuous', label: 'Continuous scanning' },
]

// ── Filters ────────────────────────────────────────────────────────────────
const scanTypeFilter = ref(null)
const statusFilter = ref(null)
const search = ref('')

const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))

const filtered = computed(() => {
  let list = domains.value
  if (scanTypeFilter.value) list = list.filter((n) => n.scanType === scanTypeFilter.value)
  if (statusFilter.value) list = list.filter((n) => n.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((n) => n.endpoint.toLowerCase().includes(q))
  return list
})

// ── Row action menu (teleported) ───────────────────────────────────────────
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

function deleteDomain(id) {
  closeMenu()
  deletingDomain.value = domains.value.find((n) => n.id === id) ?? null
  deleteState.value = 'idle'
  deleteAcknowledged.value = false
  deleteHolding.value = false
  showDeleteModal.value = true
}

// ── Delete domain modal — same hold-to-delete as WebAppView ─────
// Acknowledge checkbox → press-and-hold Delete (1000ms fill) → deleting
// spinner → done panel. Close is blocked while deleting.
const showDeleteModal = ref(false)
const deletingDomain = ref(null)
const deleteState = ref('idle') // 'idle' | 'loading' | 'saved'
const deleteAcknowledged = ref(false)
const deleteHolding = ref(false)
let deleteHoldTimer = null
let deleteDoneTimer = null

const deleteReady = computed(() => deleteAcknowledged.value && deleteState.value === 'idle')
const deleteLabel = computed(() => {
  if (deleteState.value === 'loading') return 'Deleting…'
  if (!deleteAcknowledged.value) return 'Delete'
  return deleteHolding.value ? 'Keep holding…' : 'Hold to delete'
})
const deleteHint = computed(() => {
  if (!deleteAcknowledged.value && deleteState.value === 'idle') return 'Tick the box above to enable Delete'
  if (deleteReady.value && !deleteHolding.value) return 'Press and hold, or hold Enter'
  return ''
})

function closeDeleteModal() {
  if (deleteState.value === 'loading') return
  clearTimeout(deleteHoldTimer)
  deleteHolding.value = false
  showDeleteModal.value = false
  deletingDomain.value = null
  deleteState.value = 'idle'
  deleteAcknowledged.value = false
}
function toggleDeleteAck() {
  if (deleteState.value !== 'idle') return
  deleteAcknowledged.value = !deleteAcknowledged.value
  deleteHolding.value = false
}
function doDeleteDomain() {
  clearTimeout(deleteHoldTimer)
  deleteHolding.value = false
  deleteState.value = 'loading'
  deleteDoneTimer = setTimeout(() => {
    domains.value = domains.value.filter((n) => n.id !== deletingDomain.value.id)
    deleteState.value = 'saved'
  }, 1200)
}
function deleteHoldStart() {
  if (!deleteReady.value) return
  deleteHolding.value = true
  clearTimeout(deleteHoldTimer)
  deleteHoldTimer = setTimeout(doDeleteDomain, 1000)
}
function deleteHoldEnd() {
  if (deleteHolding.value) {
    clearTimeout(deleteHoldTimer)
    deleteHolding.value = false
  }
}
function deleteKeyDown(e) {
  if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
    e.preventDefault()
    deleteHoldStart()
  }
}
function deleteKeyUp(e) {
  if (e.key === 'Enter' || e.key === ' ') deleteHoldEnd()
}
onUnmounted(() => {
  clearTimeout(deleteHoldTimer)
  clearTimeout(deleteDoneTimer)
})

// ── Detail: dedicated page ─────────────────────────────────────────────────
function seeDetail(id) {
  closeMenu()
  router.push(`/assets/domains/${id}`)
}

function handleClickOutside(e) {
  if (!e.target.closest('.action-menu, .action-btn')) closeMenu()
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

// ── Register Domain modal — same as Asset Inventory › Domain ─────────────
const ownerOptions = [
  { value: 'Protergo Cyber Security Ampera', label: 'Protergo Cyber Security Ampera' },
  { value: 'Protergo Cyber Security Jakarta', label: 'Protergo Cyber Security Jakarta' },
  { value: 'Protergo Cyber Security Surabaya', label: 'Protergo Cyber Security Surabaya' },
  { value: 'Protergo Fintech Solutions', label: 'Protergo Fintech Solutions' },
  { value: 'Protergo Cyber Security Bandung', label: 'Protergo Cyber Security Bandung' },
  { value: 'Beta Ventures Security', label: 'Beta Ventures Security' },
  { value: 'Protergo Labs', label: 'Protergo Labs' },
]
// ── Register Domain modal — same design/behaviour as Asset Inventory › Register Domain
const showRegisterDomainModal = ref(false)
const regDomOwner = ref(null)
const regDomName = ref('')
const regDomState = ref('idle') // 'idle' | 'loading' | 'saved'
const lastRegisteredDomain = ref('')
const canRegisterDomain = computed(() => {
  const d = regDomName.value.trim()
  const domainOk = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d)
  return !!regDomOwner.value && domainOk
})
const regDomNameError = computed(() => {
  const d = regDomName.value.trim()
  if (!d) return ''
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d)) return 'Please enter a valid domain (e.g., example.com)'
  return ''
})
function openRegisterDomainModal() {
  regDomOwner.value = null
  regDomName.value = ''
  regDomState.value = 'idle'
  showRegisterDomainModal.value = true
}
function goToAssetInventoryDomain() {
  closeRegisterDomainModal()
  router.push('/assets?tab=domain')
}
function closeRegisterDomainModal() {
  showRegisterDomainModal.value = false
}
function selectRegDomOwner(value) {
  regDomOwner.value = value
}
function submitRegisterDomain() {
  if (!canRegisterDomain.value || regDomState.value !== 'idle') return
  regDomState.value = 'loading'
  setTimeout(() => {
    const newId = Math.max(0, ...domains.value.map((n) => n.id)) + 1
    domains.value.unshift({
      id: newId,
      endpoint: regDomName.value.trim().toLowerCase(),
      targetType: 'Domain',
      owner: regDomOwner.value,
      lastScanned: '-',
      scanType: 'manual',
      registeredCount: 0,
      status: 'Scanning',
      tags: [],
    })
    lastRegisteredDomain.value = domains.value[0].endpoint
    regDomState.value = 'saved'
  }, 500)
}

// ── Start Scanning modal ───────────────────────────────────────────────────
const showScanModal = ref(false)
const scanTargetType = ref(null) // 'IP Single' | 'CIDR'
const scanAccess = ref(null) // 'selected' | 'all'
const scanTarget = ref([]) // domain ids (IP Single: several, CIDR: one)
const scanEndpoints = ref([]) // CIDR + 'Selected endpoint': chosen endpoint ids
const scanType = ref(null)
const scanRecurrence = ref(null)
const scanDate = ref('')
const scanDateOpen = ref(false)
const scanState = ref('idle') // 'idle' | 'loading' | 'saved'

// Target access only applies to CIDR; it decides between all endpoints of the
// chosen CIDR and a hand-picked (checkbox) endpoint list.
const scanAccessEffective = computed(() => (scanTargetType.value === 'IP Single' ? 'selected' : scanAccess.value))
// Scan type + Date & Time only appear once the target itself is fully chosen.
const scanTargetReady = computed(() => {
  if (!scanTargetType.value || !scanTarget.value.length) return false
  if (scanTargetType.value === 'IP Single') return true
  if (!scanAccess.value) return false
  return scanAccess.value === 'all' || scanEndpoints.value.length > 0
})
// Dummy discovered endpoints of the chosen CIDR.
const scanEndpointOptions = computed(() =>
  getDomainEndpoints().map((e) => ({ value: e.id, label: e.endpoint })),
)
// IP Single can pick several endpoints (checkboxes); CIDR picks exactly one.
const scanTargetIsMulti = computed(() => scanTargetType.value === 'IP Single')
const scanTargetTypeOptions = [
  { value: 'Domain', label: 'Domain' },
]
// Manual Triggered runs immediately, so it takes no date & time.
const scanNeedsNoDate = computed(() => scanType.value === 'manual')
const scanRecurrenceOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every Two Weeks' },
  { value: 'monthly', label: 'Monthly' },
]
const scanAccessOptions = [
  { value: 'selected', label: 'Selected endpoint' },
  { value: 'all', label: 'All endpoints' },
]
// Endpoint List only offers domains of the chosen target type.
const scanTargetOptions = computed(() =>
  domains.value
    .filter((n) => n.targetType === scanTargetType.value)
    .map((n) => ({ value: n.id, label: n.endpoint })),
)
const canProceedScan = computed(() => {
  if (!scanTargetReady.value || !scanType.value) return false
  if (scanNeedsNoDate.value) return true
  // Continuous scans also need a recurrence.
  if (scanType.value === 'continuous' && !scanRecurrence.value) return false
  // Scheduled scans need at least one fully-picked date & time.
  if (scanType.value === 'scheduled') {
    return scanSchedules.value.length > 0 && scanSchedules.value.every((s) => !!s.value)
  }
  return !!scanDate.value
})

// ── Multiple schedules (Scheduled Scanning only) ───────────────────────────
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

function pickScanType(value) {
  scanType.value = value
  scanDateOpen.value = false
  // Scheduled scans collect their own list of dates.
  if (value === 'scheduled' && scanSchedules.value.length === 0) addScheduleRow(false)
  if (value !== 'scheduled') scanSchedules.value = []
  // Recurrence only applies to Continuous scans.
  if (value !== 'continuous') scanRecurrence.value = null
}

function pickScanTargetType(value) {
  scanTargetType.value = value
  scanTarget.value = []
  scanEndpoints.value = []
  if (value === 'IP Single') scanAccess.value = null
}
function pickScanAccess(value) {
  scanAccess.value = value
  scanEndpoints.value = []
}

function openScanModal() {
  scanTargetType.value = null
  scanAccess.value = null
  scanTarget.value = []
  scanEndpoints.value = []
  scanType.value = null
  scanRecurrence.value = null
  scanDate.value = ''
  scanSchedules.value = []
  scanDateOpen.value = false
  scanState.value = 'idle'
  showScanModal.value = true
}

function closeScanModal() {
  showScanModal.value = false
  scanDateOpen.value = false
  scanState.value = 'idle'
}

function toggleScanDate() {
  scanSchedules.value = scanSchedules.value.map((s) => ({ ...s, open: false }))
  scanDateOpen.value = !scanDateOpen.value
}

function submitScan() {
  if (!canProceedScan.value || scanState.value !== 'idle') return
  scanState.value = 'loading'
  setTimeout(() => {
    const rows = domains.value.filter((n) => scanTarget.value.includes(n.id))
    rows.forEach((row) => {
      row.status = 'Scanning'
      row.lastScanned = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      row.scanType = scanType.value
      // Persist recurrence so the detail timeline can show it.
      row.recurrence = scanType.value === 'continuous' ? scanRecurrence.value : null
    })
    scanState.value = 'saved'
    setTimeout(closeScanModal, 700)
  }, 500)
}
</script>

<template>
  <div class="domain">
    <div class="domain__head">
      <h1 class="domain__title">Domain Inspection Assessment</h1>
      <div class="domain__actions">
        <button type="button" class="btn-register" @click="openRegisterDomainModal"><IconCirclePlus :size="15" /> Register Domain</button>
        <button type="button" class="btn-register" @click="openScanModal"><IconScan :size="15" /> Start Scanning</button>
      </div>
    </div>

    <div class="domain__controls">
      <div class="domain__filters">
        <FilterDropdown v-model="scanTypeFilter" :options="scanTypeOptions" placeholder="Scan Type" />
        <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scanning Status" />
      </div>
      <SearchInput v-model="search" placeholder="Search" />
    </div>

    <DataTable
      :columns="columns"
      :items="filtered"
      :loading="false"
      empty-text="No domains found."
    >
      <template #cell-status="{ row }">
        <span class="status-pill" :class="statusMeta[row.status]?.pill ?? 'status-pill--notstarted'">
          {{ statusMeta[row.status]?.label ?? row.status }}
        </span>
      </template>
      <template #cell-scanType="{ row }">
        {{ scanTypeOptions.find((o) => o.value === row.scanType)?.label ?? row.scanType }}
      </template>
      <template #cell-registeredCount="{ row }">
        <span class="count-badge">{{ row.registeredCount }}</span>
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
        <button type="button" class="action-menu__item action-menu__item--danger" @click="deleteDomain(openMenuId)">
          <IconTrash :size="15" />
          Delete
        </button>
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showRegisterDomainModal" class="modal-backdrop" @mousedown.self="closeRegisterDomainModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Register Domain</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeRegisterDomainModal">
                <IconX :size="20" />
              </button>
            </div>
            <p v-if="regDomState !== 'saved'" class="create-modal__desc">Once the domain is registered, it will go through scanning to discover and find all endpoints that are related to the domain.</p>

            <div v-if="regDomState === 'saved'" class="create-modal__body">
              <div class="reg-success">
                <div class="reg-success__card">
                  <span class="reg-success__icon">
                    <IconGlobe :size="22" />
                    <span class="reg-success__check"><IconCheck :size="11" /></span>
                  </span>
                  <div class="reg-success__card-text">
                    <p class="reg-success__repo">{{ lastRegisteredDomain }}</p>
                    <p class="reg-success__sub">Domain registered</p>
                  </div>
                  <span class="status-pill status-pill--scanning reg-success__status">
                    <span class="reg-success__status-dot"></span> Scanning
                  </span>
                </div>

                <p class="reg-success__desc">
                  <strong>{{ lastRegisteredDomain }}</strong> is now being discovered. It will be available to scan for vulnerability assessment once the discovery scan finishes. You can track its progress from Asset Inventory in the meantime.
                </p>
              </div>
            </div>

            <div v-else class="create-modal__body create-modal__group">
              <GlassField
                type="select"
                label="Asset Owner"
                placeholder="Asset Owner"
                required
                :options="ownerOptions"
                :model-value="regDomOwner"
                @update:model-value="selectRegDomOwner"
                error-text="Asset Owner is required"
              />

              <GlassField
                v-model="regDomName"
                label="Domain"
                placeholder="Input Domain"
                required
                :invalid="!!regDomNameError"
                :error-text="regDomNameError || 'Domain is required'"
              />
            </div>

            <div v-if="regDomState === 'saved'" class="create-modal__actions create-modal__actions--column">
              <button type="button" class="reg-success__link" @click="goToAssetInventoryDomain">
                View scanning progress <IconArrowRight :size="16" />
              </button>
              <button type="button" class="reg-success__close" @click="closeRegisterDomainModal">Close</button>
            </div>
            <div v-else class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeRegisterDomainModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="canRegisterDomain ? { 'modal-btn--save': true, 'modal-btn--saved': regDomState === 'saved' } : 'modal-btn--create'"
                :disabled="!canRegisterDomain"
                @click="submitRegisterDomain"
              >
                <span v-if="regDomState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="regDomState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Register</span>
              </button>
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
              <h2 class="create-modal__title">Domain Scan Configuration</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeScanModal">
                <IconX :size="20" />
              </button>
            </div>
            <div class="create-modal__body">
              <div v-show="!pickerOpen" class="create-modal__group">
                <GlassField
                  :model-value="scanTargetType"
                  @update:model-value="pickScanTargetType"
                  type="select"
                  label="Target type"
                  placeholder="select target type..."
                  required
                  :options="scanTargetTypeOptions"
                  error-text="Target type is required."
                />

                <GlassField
                  v-if="scanTargetType"
                  :model-value="scanTargetIsMulti ? scanTarget : (scanTarget[0] ?? null)"
                  @update:model-value="(v) => { scanTarget = scanTargetIsMulti ? v : [v]; scanEndpoints = [] }"
                  type="select"
                  :multiple="scanTargetIsMulti"
                  :label="scanTargetType === 'Domain' ? 'Domain List' : 'Endpoint List'"
                  placeholder="select target asset..."
                  required
                  :options="scanTargetOptions"
                  error-text="Endpoint is required."
                />

                <GlassField
                  v-if="scanTargetType === 'Domain'"
                  :model-value="scanAccess"
                  @update:model-value="pickScanAccess"
                  type="select"
                  label="Target access"
                  placeholder="select target access..."
                  required
                  :options="scanAccessOptions"
                  error-text="Target access is required."
                />

                <GlassField
                  v-if="scanTargetType === 'Domain' && scanAccess === 'selected'"
                  v-model="scanEndpoints"
                  type="select"
                  multiple
                  label="Endpoint List"
                  placeholder="select endpoints..."
                  required
                  :options="scanEndpointOptions"
                  error-text="Endpoint is required."
                />

                <GlassField
                  v-if="scanTargetReady"
                  :model-value="scanType"
                  @update:model-value="pickScanType"
                  type="select"
                  label="Scan type"
                  placeholder="select scan type..."
                  required
                  :options="scanTypeOptions"
                  error-text="Scan type is required."
                />

                <GlassField
                  v-if="scanTargetReady && scanType === 'continuous'"
                  v-model="scanRecurrence"
                  type="select"
                  label="Recurrence"
                  placeholder="select recurrence..."
                  required
                  :options="scanRecurrenceOptions"
                  error-text="Choose a recurrence"
                />
              </div>

              <template v-if="scanTargetReady && scanType === 'scheduled'">
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

              <template v-else-if="scanTargetReady && scanType && !scanNeedsNoDate">
                <label v-show="!scanDateOpen" class="create-modal__label">{{ scanType === 'continuous' ? 'Initial Date and Time' : 'Date & Time' }}<span class="create-modal__required">*</span></label>
                <DateTimePicker
                  v-model="scanDate"
                  :open="scanDateOpen"
                  placeholder="select date & time..."
                  @toggle="toggleScanDate"
                  @select="scanDateOpen = false"
                />
              </template>

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
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteModal" class="modal-backdrop" @mousedown.self="closeDeleteModal">
          <div class="del-modal" role="dialog" aria-modal="true" aria-labelledby="del-title">
            <div class="del-stack">
              <div class="del-panel" :class="{ 'del-hidden': deleteState === 'saved' }">
                <div class="del-head">
                  <span class="del-tile" :class="{ 'del-tile--acked': deleteAcknowledged }">
                    <IconTrash :size="22" />
                  </span>
                  <div class="del-titles">
                    <span id="del-title" class="del-title">Delete domain</span>
                    <span class="del-repo">
                      <IconGlobe :size="14" class="del-repo__icon" /><span class="del-ellip">{{ deletingDomain?.endpoint }}</span>
                    </span>
                  </div>
                  <button type="button" class="del-close" aria-label="Close" @click="closeDeleteModal">
                    <IconX :size="18" />
                  </button>
                </div>

                <p class="del-body">
                  <strong>{{ deletingDomain?.endpoint }}</strong> and its scan history will be removed immediately.
                  Once deleted, you won't be able to view or restore its findings.
                </p>

                <button
                  type="button"
                  class="del-ack"
                  :class="{ 'del-ack--on': deleteAcknowledged }"
                  role="checkbox"
                  :aria-checked="deleteAcknowledged"
                  @click="toggleDeleteAck"
                >
                  <span class="del-box"><IconCheck :size="16" class="del-tick" /></span>
                  <span class="del-ack__text">This action is permanent and cannot be undone.</span>
                </button>

                <div class="del-actions">
                  <button type="button" class="del-btn del-btn--cancel" @click="closeDeleteModal">Cancel</button>
                  <button
                    type="button"
                    class="del-btn del-btn--delete"
                    :class="{ 'is-ready': deleteReady, 'is-holding': deleteHolding, 'is-deleting': deleteState === 'loading' }"
                    :aria-disabled="!deleteReady"
                    @pointerdown="deleteHoldStart"
                    @pointerup="deleteHoldEnd"
                    @pointerleave="deleteHoldEnd"
                    @keydown="deleteKeyDown"
                    @keyup="deleteKeyUp"
                  >
                    <span class="del-fill" aria-hidden="true" />
                    <span class="del-label"><span v-if="deleteState === 'loading'" class="del-spinner" aria-hidden="true" />{{ deleteLabel }}</span>
                  </button>
                </div>
                <span class="del-hint">{{ deleteHint }}</span>
              </div>

              <div class="del-panel del-done" :class="{ 'is-shown': deleteState === 'saved' }">
                <span class="del-done__icon"><IconCheck :size="28" /></span>
                <span class="del-done__title">Domain deleted</span>
                <span class="del-done__body"><span class="del-mono">{{ deletingDomain?.endpoint }}</span> has been removed.</span>
                <button type="button" class="del-btn del-btn--cancel del-done__btn" @click="closeDeleteModal">Done</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.domain {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
    line-height: 1.2;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__filters {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.btn-register {
  display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: var(--glacia-radius-pill); border: none;
  background: var(--glacia-red); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(255, 37, 41, 0.4); transition: background 0.15s, box-shadow 0.15s;
  &:hover { background: #e01e22; box-shadow: 0 8px 24px rgba(255, 37, 41, 0.5); }
}

.status-pill {
  display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; white-space: nowrap;
  &--notstarted { background: #ECEEF0; color: #5C6470; }
  &--completed { background: #dcfce7; color: #16a34a; }
  &--scanning { background: #fef3c7; color: #F79009; }
  &--queue { background: #e0f2fe; color: #0c4a6e; }
  &--failed { background: #fee2e2; color: #dc2626; }
  &--waiting { background: #f3e8ff; color: #6b21a8; }
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 28px;
  padding: 0 9px;
  border-radius: 8px;
  background: #ECEEF0;
  border: 1px solid #d8dee4;
  color: #5C6470;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.action-btn {
  width: 28px; height: 28px; border-radius: 8px; border: none; background: transparent;
  color: var(--glacia-ink-dim); cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  &:hover { background: rgba(0,0,0,0.05); }
}

.dv-tag {
  padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700;
  font-family: 'Manrope', 'Inter', sans-serif; white-space: nowrap; flex-shrink: 0;
  display: inline-flex; align-items: center; gap: 4px;
}

.dv-tag__x {
  border: none; background: none; cursor: pointer; color: inherit;
  font-size: 13px; line-height: 1; padding: 0 0 0 2px; opacity: 0.7;
  &:hover { opacity: 1; }
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

.action-menu {
  position: fixed; z-index: 400; min-width: 176px; padding: 6px;
  background: #fff; border: 1px solid var(--glacia-glass-border); border-radius: 12px;
  box-shadow: 0 16px 40px -8px rgba(16,24,32,0.28);

  &__item {
    display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px;
    border: none; border-radius: 8px; background: transparent; cursor: pointer;
    font-size: 13px; font-weight: 500; font-family: 'Manrope', 'Inter', sans-serif; color: var(--glacia-ink);
    &:hover { background: rgba(255,37,41,0.06); }
    &--danger { color: var(--glacia-sev-critical); }
  }
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
  &__title { font-family: 'Manrope', 'Inter', sans-serif; font-size: 26px; font-weight: 800; color: var(--glacia-ink); margin: 0; }
  &__close { width: 32px; height: 32px; border-radius: 8px; border: none; background: none; color: var(--glacia-ink); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; &:hover { background: rgba(0,0,0,0.05); } }
  &__body { margin-top: 12px; padding-bottom: 16px; overflow-y: auto; min-height: 0; flex: 1 1 auto; overscroll-behavior: contain; }
  &__group { display: flex; flex-direction: column; gap: 10px; }
  &__desc { margin: 12px 0 0; font-size: 13px; line-height: 1.6; color: var(--glacia-ink-dim); flex-shrink: 0; }
  &__label { display: block; margin: 16px 0 8px; font-size: 14px; font-weight: 700; color: var(--glacia-ink); }
  &__required { color: var(--glacia-red); margin-left: 2px; }
  &__input {
    width: 100%; height: 48px; padding: 0 16px; border-radius: 14px; border: 1px solid var(--glacia-glass-border);
    background: #fff; color: var(--glacia-ink); font-size: 14px; font-family: 'Manrope', 'Inter', sans-serif;
    outline: none; box-sizing: border-box; box-shadow: 0 1px 3px rgba(16,24,32,0.08);
    &::placeholder { color: var(--glacia-ink-dim); }
    &:focus { border-color: #2563EB; box-shadow: 0 2px 6px rgba(16,24,32,0.12); }
    &--error { border-color: var(--glacia-sev-critical); &:focus { border-color: var(--glacia-sev-critical); } }
  }
  &__actions { display: flex; gap: 14px; margin-top: 20px; flex-shrink: 0; }
  &__actions--column { flex-direction: column; align-items: center; gap: 16px; }
}

.field-error { margin: 6px 0 0; font-size: 12px; line-height: 1.4; color: var(--glacia-sev-critical); }

.schedule-list {
  display: flex; flex-direction: column; gap: 10px;
  // keep the last row's focus ring / dashed add button clear of the actions
  padding-bottom: 2px;
}

.schedule-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin: 16px 0 8px; // same rhythm as .create-modal__label

  &__label {
    font-size: 14px;
    font-weight: 700;
    color: var(--glacia-ink);
  }
}

.schedule-row {
  display: flex; align-items: flex-start; gap: 8px;

  > .form-select { flex: 1; min-width: 0; }

  &__remove {
    width: 34px; height: 34px; margin-top: 5px; flex-shrink: 0;
    border-radius: 50%; border: 1px solid var(--glacia-glass-border); background: #fff;
    color: var(--glacia-ink-dim); cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    &:hover { border-color: var(--glacia-sev-critical); color: var(--glacia-sev-critical); }
  }
}

.schedule-add {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 10px; border-radius: 12px;
  border: 1px dashed var(--glacia-glass-border); background: #fff;
  font-size: 13px; font-weight: 600; font-family: 'Manrope', 'Inter', sans-serif;
  color: var(--glacia-ink-dim); cursor: pointer;
  &:hover { border-color: var(--glacia-red); color: var(--glacia-red); }
}

.form-select {
  position: relative;
  &__trigger {
    width: 100%; height: 54px; padding: 0 18px; border-radius: 14px; border: 1px solid var(--glacia-glass-border);
    background: #fff; color: var(--glacia-ink); font-size: 15px; font-family: 'Manrope', 'Inter', sans-serif;
    display: flex; align-items: center; justify-content: space-between; gap: 10px; cursor: pointer;
    box-shadow: 0 1px 3px rgba(16,24,32,0.08); box-sizing: border-box;
    &:hover { border-color: var(--glacia-ink-dim); }
  }
  &__trigger-text--placeholder { color: var(--glacia-ink-dim); }
  &__chevron { flex-shrink: 0; color: var(--glacia-ink-dim); transition: transform 0.2s ease; &--open { transform: rotate(180deg); } }
  &__inline-menu { margin-top: 10px; padding: 8px; border-radius: 16px; border: 1px solid var(--glacia-glass-border); background: #fff; max-height: 260px; overflow-y: auto; }
  &__inline-item {
    display: flex; align-items: center; width: 100%; padding: 14px 16px; border-radius: 10px; border: none;
    background: transparent; color: var(--glacia-ink); font-size: 15px; font-weight: 500; text-align: left; cursor: pointer;
    &--active { background: rgba(255,37,41,0.08); color: var(--glacia-red); font-weight: 700; }
    &:hover:not(&--active) { background: rgba(255,37,41,0.06); }
  }
}

.select-panel {
  overflow: hidden; max-height: 0; opacity: 0;
  transition: max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease, margin-top 0.32s cubic-bezier(0.4,0,0.2,1);
  &.open { max-height: 300px; opacity: 1; margin-top: 10px; }
  &__inner { margin-top: 0; }
}

.modal-btn {
  flex: 1; height: 46px; border-radius: 14px; border: none; font-size: 14px; font-weight: 700;
  font-family: 'Manrope', 'Inter', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  &--create { background: var(--glacia-glass-fill-strong); color: var(--glacia-ink-dim); border: 1px solid var(--glacia-glass-border); &:disabled { cursor: default; } }
  &--idle { background: var(--glacia-glass-fill-strong); color: var(--glacia-ink-dim); border: 1px solid var(--glacia-glass-border); }
  &--cancel { background: rgba(220,38,38,0.06); color: var(--glacia-sev-critical); &:hover { background: rgba(220,38,38,0.12); } }
  &--save { background: linear-gradient(135deg, #e53925, #b91c1c); color: #fff; box-shadow: 0 8px 20px -6px rgba(229,57,37,0.4); &:disabled { opacity: 0.5; cursor: default; } }
  &--saved { background: #16a34a; box-shadow: 0 8px 20px -6px rgba(22,163,74,0.4); }
  &:disabled { cursor: default; }
  &__spinner { width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; animation: modal-btn-spin 0.7s linear infinite; }
  &__check { animation: modal-btn-pop 0.4s ease; }
}
.dim { color: var(--glacia-ink-dim); }

.reg-success {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px;

  &__card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 16px;
    background: #F4F6F8;
  }

  &__icon {
    position: relative;
    flex-shrink: 0;
    width: 46px;
    height: 46px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid rgba(16, 24, 32, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--glacia-ink-dim);
  }

  &__check {
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #16a34a;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #fff;
  }

  &__card-text {
    flex: 1;
    min-width: 0;
  }

  &__repo {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--glacia-ink);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__sub {
    font-size: 12.5px;
    color: var(--glacia-ink-dim);
    margin: 2px 0 0;
  }

  &__status {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  &__status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  &__desc {
    font-size: 14px;
    line-height: 1.6;
    color: var(--glacia-ink-dim);
    text-align: center;
    margin: 0;

    strong { color: var(--glacia-ink); font-weight: 700; }
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: none;
    background: none;
    padding: 0;
    font-size: 14px;
    font-weight: 700;
    color: #2563EB;
    font-family: 'Manrope', 'Inter', sans-serif;
    cursor: pointer;
    transition: opacity 0.15s;

    &:hover { opacity: 0.75; }
  }

  &__close {
    border: none;
    background: none;
    padding: 0;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--glacia-ink-dim);
    font-family: 'Manrope', 'Inter', sans-serif;
    cursor: pointer;

    &:hover { color: var(--glacia-ink); }
  }
}
.reg-success {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px;

  &__card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 16px;
    background: #F4F6F8;
  }

  &__icon {
    position: relative;
    flex-shrink: 0;
    width: 46px;
    height: 46px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid rgba(16, 24, 32, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--glacia-ink-dim);
  }

  &__check {
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #16a34a;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #fff;
  }

  &__card-text {
    flex: 1;
    min-width: 0;
  }

  &__repo {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 15px;
    font-weight: 700;
    color: var(--glacia-ink);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__sub {
    font-size: 12.5px;
    color: var(--glacia-ink-dim);
    margin: 2px 0 0;
  }

  &__status {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  &__status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  &__desc {
    font-size: 14px;
    line-height: 1.6;
    color: var(--glacia-ink-dim);
    text-align: center;
    margin: 0;

    strong { color: var(--glacia-ink); font-weight: 700; font-family: ui-monospace, 'SF Mono', Menlo, monospace; }
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: none;
    background: none;
    padding: 0;
    font-size: 14px;
    font-weight: 700;
    color: #2563EB;
    font-family: 'Manrope', 'Inter', sans-serif;
    cursor: pointer;
    transition: opacity 0.15s;

    &:hover { opacity: 0.75; }
  }

  &__close {
    border: none;
    background: none;
    padding: 0;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--glacia-ink-dim);
    font-family: 'Manrope', 'Inter', sans-serif;
    cursor: pointer;

    &:hover { color: var(--glacia-ink); }
  }
}

.field-hint { margin: 6px 0 0; font-size: 12px; line-height: 1.4; color: var(--glacia-ink-dim); }
.ip-range-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;

  &__field { flex: 1; min-width: 0; }

  &__sep {
    flex-shrink: 0;
    height: 54px;
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: var(--glacia-ink-dim);
  }
}
.dv-expand-enter-active, .dv-expand-leave-active {
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, padding-top 0.3s ease, padding-bottom 0.3s ease;
  overflow: hidden;
}
.dv-expand-enter-from, .dv-expand-leave-to { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; }
.dv-expand-enter-to, .dv-expand-leave-from { max-height: 800px; opacity: 1; }
@keyframes modal-btn-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes modal-btn-pop { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }

// ── Delete application modal (same hold-to-delete as SourceCodeView) ──────
.del-modal {
  width: min(460px, calc(100% - 40px));
  box-sizing: border-box;
  border-radius: 16px;
  background: #fff;
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

.del-stack { display: grid; }
.del-panel { grid-area: 1 / 1; }

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

.del-head { display: flex; align-items: flex-start; gap: 14px; }

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

  &--acked { transform: rotate(-8deg) scale(1.06); }
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

  &__icon { flex-shrink: 0; }
}

.del-ellip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.del-close {
  flex: none;
  width: 36px;
  height: 36px;
  border: 0;
  padding: 0;
  border-radius: 999px;
  background: #eef1f4;
  color: var(--glacia-ink-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 160ms ease;

  &:hover { background: #e2e8f0; }
}

.del-body {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--glacia-ink-dim);

  strong { color: var(--glacia-ink); font-weight: 700; }
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
  border: 1px solid #e2e8f0;
  background: #fff;
  transition: background 260ms ease, border-color 260ms ease;

  &--on { border-color: var(--glacia-sev-critical); background: rgba(220, 38, 38, 0.06); }

  &__text {
    font-size: 14px;
    font-weight: 600;
    color: var(--glacia-ink);
    transition: color 220ms ease;
  }

  &--on &__text { color: var(--glacia-sev-critical); }
}

.del-box {
  flex: none;
  position: relative;
  width: 22px;
  height: 22px;
  box-sizing: border-box;
  border-radius: 7px;
  border: 1.5px solid #cbd5e1;
  background: #fff;
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
    border: 1px solid #e2e8f0;
    background: #fff;
    color: var(--glacia-ink);
    transition: background 160ms ease;

    &:hover { background: #f1f5f9; }
  }

  &--delete {
    position: relative;
    overflow: hidden;
    border: 0;
    background: #eef1f4;
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

    &.is-holding { transform: scale(0.98); }
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
  border: 2px solid rgba(255, 255, 255, 0.35);
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

  &.is-shown &__icon { transform: scale(1); }

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
