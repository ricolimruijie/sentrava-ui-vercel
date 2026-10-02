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
import { getDomains, getDomainEndpoints, preloadDomainList } from '@/modules/domain-inspection/services/domainService'
import { IconDotsVertical, IconCirclePlus, IconScan, IconCheck, IconX, IconArrowUpRight, IconTrash, IconGlobe, IconPlus, IconArrowRight, IconWorld } from '@tabler/icons-vue'

// Load this page's data before it renders (the page is shown inside <Suspense>).
await preloadDomainList()

const { can } = useRole()

// modalOnly: rendered from the Dashboard's Start Scan menu — shows just the
// Start Scanning modal (opened on mount) and tells the parent when it closes.
const props = defineProps({
  modalOnly: { type: Boolean, default: false },
})
const emit = defineEmits(['close-scan'])

const router = useRouter()

const domains = ref(getDomains())

const columns = [
  { key: '__index', label: 'No', width: '52px', dim: true },
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
  { value: 'manual_scan', label: 'Manual Scan' },
  { value: 'scheduled_scan', label: 'Scheduled Scan' },
  { value: 'continuous_scan', label: 'Continuous Scan' },
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
  showDeleteModal.value = true
}

// ── Delete modal (shared HoldToDeleteModal) ──
const showDeleteModal = ref(false)
const deletingDomain = ref(null)
function confirmDeleteDomain() {
  domains.value = domains.value.filter((n) => n.id !== deletingDomain.value.id)
}

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
      scanType: 'manual_scan',
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
const scanAccess = ref(null) // 'selected' | 'all'
const scanTarget = ref([]) // the chosen domain id (single)
const scanEndpoints = ref([]) // 'Selected endpoint': chosen endpoint ids
const scanType = ref(null)
const scanRecurrence = ref(null)
const scanDate = ref('')
const scanDateOpen = ref(false)
const scanState = ref('idle') // 'idle' | 'loading' | 'saved'

// The domain comes first, then Target access decides between all endpoints of
// that domain and a hand-picked (checkbox) endpoint list.
// Scan type + Date & Time only appear once the target itself is fully chosen.
// Domain + access picked: Scan type shows alongside the Endpoint List.
const scanTargetChosen = computed(() => scanTarget.value.length > 0 && !!scanAccess.value)
// Selected endpoint additionally needs at least one endpoint before proceeding.
const scanTargetReady = computed(() => {
  if (!scanTarget.value.length) return false
  if (!scanAccess.value) return false
  return scanAccess.value === 'all' || scanEndpoints.value.length > 0
})
// Dummy discovered endpoints of the chosen domain, listed by IP address.
const scanEndpointOptions = computed(() =>
  getDomainEndpoints().map((e) => ({ value: e.id, label: e.ip })),
)
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
const scanTargetOptions = computed(() =>
  domains.value.map((n) => ({ value: n.id, label: n.endpoint })),
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

function pickScanAccess(value) {
  scanAccess.value = value
  scanEndpoints.value = []
}

function openScanModal() {
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
    const rows = domains.value.filter((n) => scanTarget.value.includes(n.id))
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
  <div class="domain" :class="{ 'domain--modal-only': modalOnly }">
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
      empty-text="No domains found." :empty-icon="IconWorld"
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
        <button v-if="can('delete_asset')" type="button" class="action-menu__item action-menu__item--danger" @click="deleteDomain(openMenuId)">
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
                  :model-value="scanTarget[0] ?? null"
                  @update:model-value="(v) => { scanTarget = [v]; scanEndpoints = [] }"
                  type="select"
                  label="Domain"
                  placeholder="select domain..."
                  required
                  :options="scanTargetOptions"
                  error-text="Domain is required."
                />

                <GlassField
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
                  v-if="scanAccess === 'selected'"
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
                  v-if="scanTargetChosen"
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
                  v-if="scanTargetChosen && scanType === 'continuous_scan'"
                  v-model="scanRecurrence"
                  type="select"
                  label="Recurrence"
                  placeholder="select recurrence..."
                  required
                  :options="scanRecurrenceOptions"
                  error-text="Choose a recurrence"
                />
              </div>

              <template v-if="scanTargetChosen && scanType === 'scheduled_scan'">
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

              <template v-else-if="scanTargetChosen && scanType && !scanNeedsNoDate">
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
      title="Delete domain"
      :subject="deletingDomain?.endpoint"
      :icon="IconGlobe"
      message="and its scan history will be removed immediately. Once deleted, you won't be able to view or restore its findings."
      done-title="Domain deleted"
      @confirm="confirmDeleteDomain"
      @closed="deletingDomain = null"
    />
  </div>
</template>

<style scoped lang="scss" src="./DomainView.scss"></style>
