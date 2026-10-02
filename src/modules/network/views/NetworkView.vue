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
import { getNetworks, getNetworkEndpoints, preloadNetworkList } from '@/modules/network/services/networkService'
import { IconDotsVertical, IconCirclePlus, IconScan, IconCheck, IconX, IconArrowUpRight, IconTrash, IconNetwork, IconPlus, IconArrowRight } from '@tabler/icons-vue'

// Load this page's data before it renders (the page is shown inside <Suspense>).
await preloadNetworkList()

const { can } = useRole()

// modalOnly: rendered from the Dashboard's Start Scan menu — shows just the
// Start Scanning modal (opened on mount) and tells the parent when it closes.
const props = defineProps({
  modalOnly: { type: Boolean, default: false },
})
const emit = defineEmits(['close-scan'])

const router = useRouter()

const networks = ref(getNetworks())

const columns = [
  { key: '__index', label: 'No', width: '52px', dim: true },
  { key: 'lastScanned', label: 'Last Scanned', width: '14%', truncate: true },
  { key: 'endpoint', label: 'Endpoint', width: '18%', mono: true, truncate: true },
  { key: 'targetType', label: 'Target Type', width: '14%', truncate: true},
  { key: 'registeredCount', label: 'Total Endpoint', width: '13%', align: 'center' },
  { key: 'scanType', label: 'Scan Type', width: '16%', truncate: true},
  { key: 'status', label: 'Scanning Status', width: '13%', align: 'center' },
  { key: 'actions', label: 'Action', width: '32px', align: 'center' },
]

const statusMeta = {
  NotStarted: { label: 'Not yet started', pill: 'status-pill--notstarted' },
  Queue:      { label: 'Queue',      pill: 'status-pill--queue' },
  Scanning:   { label: 'Scanning',   pill: 'status-pill--scanning' },
  Completed:  { label: 'Completed',  pill: 'status-pill--completed' },
  Failed:     { label: 'Failed',     pill: 'status-pill--failed' },
  Waiting:    { label: 'Waiting',    pill: 'status-pill--waiting' },
}

const targetTypeOptions = [
  { value: 'IP Single', label: 'IP Single' },
  { value: 'CIDR', label: 'CIDR' },
]

const scanTypeOptions = [
  { value: 'manual_scan', label: 'Manual Scan' },
  { value: 'scheduled_scan', label: 'Scheduled Scan' },
  { value: 'continuous_scan', label: 'Continuous Scan' },
]

// ── Filters ────────────────────────────────────────────────────────────────
const targetTypeFilter = ref(null)
const scanTypeFilter = ref(null)
const statusFilter = ref(null)
const search = ref('')

const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))

const filtered = computed(() => {
  let list = networks.value
  if (targetTypeFilter.value) list = list.filter((n) => n.targetType === targetTypeFilter.value)
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

function deleteNetwork(id) {
  closeMenu()
  deletingNet.value = networks.value.find((n) => n.id === id) ?? null
  showDeleteModal.value = true
}

// ── Delete modal (shared HoldToDeleteModal) ──
const showDeleteModal = ref(false)
const deletingNet = ref(null)
function confirmDeleteNet() {
  networks.value = networks.value.filter((n) => n.id !== deletingNet.value.id)
}

// ── Detail: dedicated page ─────────────────────────────────────────────────
function seeDetail(id) {
  closeMenu()
  router.push(`/assets/networks/${id}`)
}

function handleClickOutside(e) {
  if (!e.target.closest('.action-menu, .action-btn')) closeMenu()
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

// ── Register Network modal — same as Asset Inventory › Network ─────────────
const ownerOptions = [
  { value: 'Protergo Cyber Security Ampera', label: 'Protergo Cyber Security Ampera' },
  { value: 'Protergo Cyber Security Jakarta', label: 'Protergo Cyber Security Jakarta' },
  { value: 'Protergo Cyber Security Surabaya', label: 'Protergo Cyber Security Surabaya' },
  { value: 'Protergo Fintech Solutions', label: 'Protergo Fintech Solutions' },
  { value: 'Protergo Cyber Security Bandung', label: 'Protergo Cyber Security Bandung' },
  { value: 'Beta Ventures Security', label: 'Beta Ventures Security' },
  { value: 'Protergo Labs', label: 'Protergo Labs' },
]
const showRegisterNetworkModal = ref(false)
const regNetOwner = ref(null)
const regNetType = ref(null) // 'single' | 'range'
const regNetState = ref('idle') // 'idle' | 'loading' | 'saved'
const lastRegisteredNet = ref('')
const regNetIp = ref('')
const regNetRange = ref('')
// Set once Proceed is clicked while the IP fields are still empty — only
// then do the inline "required" errors show, matching the reference (the
// button itself stays enabled once Owner + Type are picked; it's the IP
// fields that block the actual submit).
const regNetAttempted = ref(false)
const ipTypeOptions = [
  { value: 'single', label: 'IP Single' },
  { value: 'range',  label: 'IP Range' },
]
// Owner + Type alone gate whether Proceed is clickable at all.
// A filled-in but invalid IP / range also blocks Proceed (empty fields stay
// clickable so the "required" errors can appear on the first attempt).
const regNetHasInvalidInput = computed(() =>
  (!!regNetIp.value.trim() && !isValidIpAddress(regNetIp.value)) ||
  (regNetType.value === 'range' && !!regNetRange.value.trim() && !isValidCidrRange(regNetRange.value)),
)
const canRegisterNetwork = computed(() => !!regNetOwner.value && !!regNetType.value && !regNetHasInvalidInput.value)
const isValidIpAddress = (v) => /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(v.trim())
const isValidCidrRange = (v) => /^\d{1,2}$/.test(v.trim()) && Number(v.trim()) >= 0 && Number(v.trim()) <= 32
const IP_FORMAT_ERROR = 'Please enter a valid IP address (e.g., 192.168.**.**)'
const regNetIpError = computed(() => {
  // Text is accepted in the field, but flagged right away.
  if (/[^0-9.]/.test(regNetIp.value)) return IP_FORMAT_ERROR
  if (!regNetAttempted.value) return ''
  if (!regNetIp.value.trim()) return 'IP Address is required'
  if (!isValidIpAddress(regNetIp.value)) return IP_FORMAT_ERROR
  return ''
})
const RANGE_FORMAT_ERROR = 'Please enter a valid range (e.g., 24)'
const regNetRangeError = computed(() => {
  if (regNetType.value !== 'range') return ''
  // Text is accepted in the field, but flagged right away.
  if (/\D/.test(regNetRange.value)) return RANGE_FORMAT_ERROR
  if (!regNetAttempted.value) return ''
  if (!regNetRange.value.trim()) return 'Range is required'
  if (!isValidCidrRange(regNetRange.value)) return RANGE_FORMAT_ERROR
  return ''
})

function openRegisterNetworkModal() {
  regNetOwner.value = null
  regNetType.value = null
  regNetState.value = 'idle'
  regNetIp.value = ''
  regNetRange.value = ''
  regNetAttempted.value = false
  showRegisterNetworkModal.value = true
}
function goToAssetInventoryNetwork() {
  closeRegisterNetworkModal()
  router.push('/assets?tab=network')
}
function closeRegisterNetworkModal() {
  showRegisterNetworkModal.value = false
}
function selectRegNetOwner(value) {
  regNetOwner.value = value
}
function selectRegNetType(value) {
  regNetType.value = value
  regNetIp.value = ''
  regNetRange.value = ''
  regNetAttempted.value = false
}
function onRegNetIpInput(e) {
  regNetIp.value = e.target.value
}
function onRegNetRangeInput(e) {
  regNetRange.value = e.target.value
}
function submitRegisterNetwork() {
  if (!canRegisterNetwork.value || regNetState.value !== 'idle') return
  regNetAttempted.value = true
  if (regNetIpError.value || regNetRangeError.value) return
  regNetState.value = 'loading'
  setTimeout(() => {
    const isSingle = regNetType.value === 'single'
    const range = Number(regNetRange.value.trim())
    networks.value.unshift({
      id: Math.max(0, ...networks.value.map((n) => n.id)) + 1,
      endpoint: isSingle ? regNetIp.value.trim() : `${regNetIp.value.trim()}/${range}`,
      targetType: isSingle ? 'IP Single' : 'CIDR',
      owner: regNetOwner.value,
      scanType: 'manual_scan',
      registeredCount: isSingle ? 1 : Math.max(1, 2 ** (32 - range) - 2),
      status: 'Scanning',
      tags: [],
    })
    lastRegisteredNet.value = networks.value[0].endpoint
    regNetState.value = 'saved'
  }, 500)
}

// ── Start Scanning modal ───────────────────────────────────────────────────
const showScanModal = ref(false)
const scanTargetType = ref(null) // 'IP Single' | 'CIDR'
const scanAccess = ref(null) // 'selected' | 'all'
const scanTarget = ref([]) // network ids (IP Single: several, CIDR: one)
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
  getNetworkEndpoints().map((e) => ({ value: e.id, label: e.endpoint })),
)
// IP Single can pick several endpoints (checkboxes); CIDR picks exactly one.
const scanTargetIsMulti = computed(() => scanTargetType.value === 'IP Single')
const scanTargetTypeOptions = [
  { value: 'IP Single', label: 'IP Single' },
  { value: 'CIDR', label: 'Classless Inter-Domain Routing (CIDR)' },
]
// Manual Scan runs immediately, so it takes no date & time.
const scanNeedsNoDate = computed(() => scanType.value === 'manual_scan')
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
// Endpoint List only offers networks of the chosen target type.
const scanTargetOptions = computed(() =>
  networks.value
    .filter((n) => n.targetType === scanTargetType.value)
    .map((n) => ({ value: n.id, label: n.endpoint })),
)
const canProceedScan = computed(() => {
  if (!scanTargetReady.value || !scanType.value) return false
  if (scanNeedsNoDate.value) return true
  // Continuous scans also need a recurrence.
  if (scanType.value === 'continuous_scan' && !scanRecurrence.value) return false
  // Scheduled scans need at least one fully-picked date & time.
  if (scanType.value === 'scheduled_scan') {
    return scanSchedules.value.length > 0 && scanSchedules.value.every((s) => !!s.value)
  }
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

function pickScanType(value) {
  scanType.value = value
  scanDateOpen.value = false
  // Scheduled scans collect their own list of dates.
  if (value === 'scheduled_scan' && scanSchedules.value.length === 0) addScheduleRow(false)
  if (value !== 'scheduled_scan') scanSchedules.value = []
  // Recurrence only applies to Continuous scans.
  if (value !== 'continuous_scan') scanRecurrence.value = null
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
  // Let the modal's leave transition finish before the parent unmounts us.
  if (props.modalOnly) setTimeout(() => emit('close-scan'), 300)
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
    const rows = networks.value.filter((n) => scanTarget.value.includes(n.id))
    rows.forEach((row) => {
      row.status = 'Scanning'
      row.lastScanned = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      row.scanType = scanType.value
      // Persist recurrence so the detail timeline can show it.
      row.recurrence = scanType.value === 'continuous_scan' ? scanRecurrence.value : null
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
  <div class="network" :class="{ 'network--modal-only': modalOnly }">
    <div class="network__head">
      <h1 class="network__title">Network Assessment</h1>
      <div class="network__actions">
        <button type="button" class="btn-register" @click="openRegisterNetworkModal"><IconCirclePlus :size="15" /> Register IP Address</button>
        <button type="button" class="btn-register" @click="openScanModal"><IconScan :size="15" /> Start Scanning</button>
      </div>
    </div>

    <div class="network__controls">
      <div class="network__filters">
        <FilterDropdown v-model="scanTypeFilter" :options="scanTypeOptions" placeholder="Scan Type" />
        <FilterDropdown v-model="targetTypeFilter" :options="targetTypeOptions" placeholder="Target Type" />
        <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scanning Status" />
      </div>
      <SearchInput v-model="search" placeholder="Search" />
    </div>

    <DataTable
      :columns="columns"
      :items="filtered"
      :loading="false"
      empty-text="No endpoints found." :empty-icon="IconNetwork"
    >
      <template #cell-status="{ row }">
        <span class="status-pill" :class="statusMeta[row.status]?.pill ?? 'status-pill--notstarted'">
          {{ statusMeta[row.status]?.label ?? row.status }}
        </span>
      </template>
      <template #cell-lastScanned="{ row }">
        <span :class="{ dim: !row.lastScanned }">{{ row.lastScanned || 'Not available' }}</span>
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
        <button v-if="can('delete_asset')" type="button" class="action-menu__item action-menu__item--danger" @click="deleteNetwork(openMenuId)">
          <IconTrash :size="15" />
          Delete
        </button>
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showRegisterNetworkModal" class="modal-backdrop" @mousedown.self="closeRegisterNetworkModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Register Network</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeRegisterNetworkModal">
                <IconX :size="20" />
              </button>
            </div>

            <div v-if="regNetState === 'saved'" class="create-modal__body">
              <div class="reg-success">
                <div class="reg-success__card">
                  <span class="reg-success__icon">
                    <IconNetwork :size="22" />
                    <span class="reg-success__check"><IconCheck :size="11" /></span>
                  </span>
                  <div class="reg-success__card-text">
                    <p class="reg-success__repo">{{ lastRegisteredNet }}</p>
                    <p class="reg-success__sub">Network registered</p>
                  </div>
                  <span class="status-pill status-pill--scanning reg-success__status">
                    <span class="reg-success__status-dot"></span> Scanning
                  </span>
                </div>

                <p class="reg-success__desc">
                  <strong>{{ lastRegisteredNet }}</strong> is now being discovered. It will be available to scan for vulnerability assessment once the discovery scan finishes. You can track its progress from Asset Inventory in the meantime.
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
                :model-value="regNetOwner"
                @update:model-value="selectRegNetOwner"
                error-text="Asset Owner is required"
              />

              <GlassField
                type="select"
                label="IP Address Type"
                placeholder="IP Address Type"
                required
                :options="ipTypeOptions"
                :model-value="regNetType"
                @update:model-value="selectRegNetType"
                error-text="IP Address Type is required"
              />

              <Transition name="dv-expand">
                <div v-if="regNetType === 'single'" class="ip-field-gap">
                  <GlassField
                    :model-value="regNetIp"
                    @update:model-value="(v) => onRegNetIpInput({ target: { value: v } })"
                    label="IP Address"
                    placeholder="Input IP Address"
                    required
                    :invalid="!!regNetIpError"
                    :error-text="regNetIpError || 'IP Address is required'"
                  />
                </div>
                <div v-else-if="regNetType === 'range'" class="ip-range-row ip-field-gap">
                  <div class="ip-range-row__field">
                    <GlassField
                      :model-value="regNetIp"
                      @update:model-value="(v) => onRegNetIpInput({ target: { value: v } })"
                      label="IP Address"
                      placeholder="IP Address"
                      required
                      :invalid="!!regNetIpError"
                      :error-text="regNetIpError || 'IP Address is required'"
                    />
                  </div>
                  <span class="ip-range-row__sep">/</span>
                  <div class="ip-range-row__field">
                    <GlassField
                      :model-value="regNetRange"
                      @update:model-value="(v) => onRegNetRangeInput({ target: { value: v } })"
                      label="Range"
                      placeholder="Range"
                      required
                      :invalid="!!regNetRangeError"
                      :error-text="regNetRangeError || 'Range is required'"
                    />
                  </div>
                </div>
              </Transition>
            </div>

            <div v-if="regNetState === 'saved'" class="create-modal__actions create-modal__actions--column">
              <button type="button" class="reg-success__link" @click="goToAssetInventoryNetwork">
                View scanning progress <IconArrowRight :size="16" />
              </button>
              <button type="button" class="reg-success__close" @click="closeRegisterNetworkModal">Close</button>
            </div>
            <div v-else class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeRegisterNetworkModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="canRegisterNetwork ? { 'modal-btn--save': true, 'modal-btn--saved': regNetState === 'saved' } : 'modal-btn--idle'"
                :disabled="!canRegisterNetwork"
                @click="submitRegisterNetwork"
              >
                <span v-if="regNetState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="regNetState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Proceed</span>
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
              <h2 class="create-modal__title">Network Scan Configuration</h2>
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
                  :label="scanTargetType === 'CIDR' ? 'CIDR List' : 'Endpoint List'"
                  placeholder="select target asset..."
                  required
                  :options="scanTargetOptions"
                  error-text="Endpoint is required."
                />

                <GlassField
                  v-if="scanTargetType === 'CIDR'"
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
                  v-if="scanTargetType === 'CIDR' && scanAccess === 'selected'"
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
                  v-if="scanTargetReady && scanType === 'continuous_scan'"
                  v-model="scanRecurrence"
                  type="select"
                  label="Recurrence"
                  placeholder="select recurrence..."
                  required
                  :options="scanRecurrenceOptions"
                  error-text="Choose a recurrence"
                />
              </div>

              <template v-if="scanTargetReady && scanType === 'scheduled_scan'">
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
                <label v-show="!scanDateOpen" class="create-modal__label">{{ scanType === 'continuous_scan' ? 'Initial Date and Time' : 'Date & Time' }}<span class="create-modal__required">*</span></label>
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

    <HoldToDeleteModal
      v-model="showDeleteModal"
      title="Delete network"
      :subject="deletingNet?.endpoint"
      :icon="IconNetwork"
      message="and its scan history will be removed immediately. Once deleted, you won't be able to view or restore its findings."
      done-title="Network deleted"
      @confirm="confirmDeleteNet"
      @closed="deletingNet = null"
    />
  </div>
</template>

<style scoped lang="scss" src="./NetworkView.scss"></style>
