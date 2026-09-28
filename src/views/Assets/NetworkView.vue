<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/table/DataTable.vue'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import SearchInput from '@/components/reusable/SearchInput.vue'
import DateTimePicker from '@/components/reusable/DateTimePicker.vue'
import GlassField from '@/components/reusable/GlassField.vue'
import { getNetworks } from '@/mocks/assets/network.js'
import { IconDotsVertical, IconCirclePlus, IconScan, IconCheck, IconX, IconArrowUpRight, IconTrash } from '@tabler/icons-vue'

const router = useRouter()

const networks = ref(getNetworks())

const columns = [
  { key: '__index', label: '#', width: '24px', dim: true },
  { key: 'endpoint', label: 'Endpoint', width: '22%', mono: true, truncate: true },
  { key: 'targetType', label: 'Target Type', width: '16%', truncate: true},
  { key: 'scanType', label: 'Scan Type', width: '18%', truncate: true},
  { key: 'registeredCount', label: 'Total Endpoint', width: '15%', align: 'center' },
  { key: 'status', label: 'Scanning Status', width: '15%', align: 'center' },
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
  { value: 'singular', label: 'Singular Scanning' },
  { value: 'specified', label: 'Specified Scanning' },
  { value: 'continuous', label: 'Continuous Scanning' },
  { value: 'manual', label: 'Manual Triggered' },
  { value: 'scheduled', label: 'Scheduled Scanning' },
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
  networks.value = networks.value.filter((n) => n.id !== id)
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

// ── Register IP Address modal ──────────────────────────────────────────────
const showRegisterModal = ref(false)
const regEndpoint = ref('')
const regType = ref(null)
const regAttempted = ref(false)
const regState = ref('idle') // 'idle' | 'loading' | 'saved'

function openRegisterModal() {
  regEndpoint.value = ''
  regType.value = null
  regAttempted.value = false
  regState.value = 'idle'
  showRegisterModal.value = true
}

function closeRegisterModal() {
  showRegisterModal.value = false
  regAttempted.value = false
  regState.value = 'idle'
}

function submitRegister() {
  regAttempted.value = true
  if (!regEndpoint.value.trim() || !regType.value || regState.value !== 'idle') return
  regState.value = 'loading'
  setTimeout(() => {
    networks.value.unshift({
      id: Math.max(...networks.value.map((n) => n.id)) + 1,
      endpoint: regEndpoint.value.trim(),
      targetType: regType.value,
      scanType: 'singular',
      registeredCount: regType.value === 'CIDR' ? 30 : 1,
      status: 'NotStarted',
    })
    regState.value = 'saved'
    setTimeout(closeRegisterModal, 700)
  }, 500)
}

// ── Start Scanning modal ───────────────────────────────────────────────────
const showScanModal = ref(false)
const scanTarget = ref(null)
const scanType = ref(null)
const scanDate = ref('')
const scanDateOpen = ref(false)
const scanState = ref('idle') // 'idle' | 'loading' | 'saved'

const scanTargetOptions = computed(() =>
  networks.value.map((n) => ({ value: n.id, label: n.endpoint })),
)
const canProceedScan = computed(() => !!scanTarget.value && !!scanType.value && !!scanDate.value)

function openScanModal() {
  scanTarget.value = null
  scanType.value = null
  scanDate.value = ''
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
  scanDateOpen.value = !scanDateOpen.value
}

function submitScan() {
  if (!canProceedScan.value || scanState.value !== 'idle') return
  scanState.value = 'loading'
  setTimeout(() => {
    const row = networks.value.find((n) => n.id === scanTarget.value)
    if (row) {
      row.status = 'Scanning'
      row.scanType = scanType.value
    }
    scanState.value = 'saved'
    setTimeout(closeScanModal, 700)
  }, 500)
}
</script>

<template>
  <div class="network">
    <div class="network__head">
      <h1 class="network__title">Network Assessment</h1>
      <div class="network__actions">
        <button type="button" class="btn-register" @click="openRegisterModal"><IconCirclePlus :size="15" /> Register IP Address</button>
        <button type="button" class="btn-register" @click="openScanModal"><IconScan :size="15" /> Start Scanning</button>
      </div>
    </div>

    <div class="network__controls">
      <div class="network__filters">
        <FilterDropdown v-model="targetTypeFilter" :options="targetTypeOptions" placeholder="Target Type" />
        <FilterDropdown v-model="scanTypeFilter" :options="scanTypeOptions" placeholder="Scan Type" />
        <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scanning Status" />
      </div>
      <SearchInput v-model="search" placeholder="Search" />
    </div>

    <DataTable
      :columns="columns"
      :items="filtered"
      :loading="false"
      empty-text="No endpoints found."
    >
      <template #cell-status="{ row }">
        <span class="status-pill" :class="statusMeta[row.status]?.pill ?? 'status-pill--notstarted'">
          {{ statusMeta[row.status]?.label ?? row.status }}
        </span>
      </template>
      <template #cell-scanType="{ row }">
        {{ scanTypeOptions.find((o) => o.value === row.scanType)?.label ?? row.scanType }}
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
        <button type="button" class="action-menu__item action-menu__item--danger" @click="deleteNetwork(openMenuId)">
          <IconTrash :size="15" />
          Delete
        </button>
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showRegisterModal" class="modal-backdrop" @mousedown.self="closeRegisterModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Register IP Address</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeRegisterModal">
                <IconX :size="20" />
              </button>
            </div>
            <div class="create-modal__body">
              <div class="create-modal__group">
                <GlassField
                  v-model="regEndpoint"
                  label="IP Address / CIDR"
                  placeholder="e.g. 10.10.19.52 or 10.10.19.0/24"
                  required
                  error-text="Endpoint is required."
                />

                <GlassField
                  v-model="regType"
                  type="select"
                  label="Target Type"
                  placeholder="select target type..."
                  required
                  :options="targetTypeOptions"
                  error-text="Target type is required."
                />
              </div>

              <div class="create-modal__actions">
                <button
                  type="button"
                  class="modal-btn"
                  :class="regState === 'saved' ? 'modal-btn--saved' : 'modal-btn--create'"
                  :disabled="regState !== 'idle'"
                  @click="submitRegister"
                >
                  {{ regState === 'saved' ? 'Registered' : regState === 'loading' ? 'Registering…' : 'Register' }}
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
              <h2 class="create-modal__title">Network Scan Configuration</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeScanModal">
                <IconX :size="20" />
              </button>
            </div>
            <div class="create-modal__body">
              <div v-show="!scanDateOpen" class="create-modal__group">
                <GlassField
                  v-model="scanTarget"
                  type="select"
                  label="Target"
                  placeholder="select target..."
                  required
                  :options="scanTargetOptions"
                  error-text="Target is required."
                />

                <GlassField
                  v-model="scanType"
                  type="select"
                  label="Scan Type"
                  placeholder="select scan type..."
                  required
                  :options="scanTypeOptions"
                  error-text="Scan type is required."
                />
              </div>

              <label class="create-modal__label">Date &amp; Time<span class="create-modal__required">*</span></label>
              <DateTimePicker
                v-model="scanDate"
                :open="scanDateOpen"
                placeholder="select date & time..."
                @toggle="toggleScanDate"
                @select="scanDateOpen = false"
              />

              <div v-show="!scanDateOpen" class="create-modal__actions">
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
                  <span v-else>Proceed</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.network {
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
  &__title { font-family: 'Manrope', 'Inter', sans-serif; font-size: 22px; font-weight: 800; color: var(--glacia-ink); margin: 0; }
  &__close { width: 32px; height: 32px; border-radius: 8px; border: none; background: none; color: var(--glacia-ink); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; &:hover { background: rgba(0,0,0,0.05); } }
  &__body { margin-top: 12px; overflow-y: auto; min-height: 0; flex: 1 1 auto; overscroll-behavior: contain; }
  &__group { display: flex; flex-direction: column; gap: 10px; }
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
}

.field-error { margin: 6px 0 0; font-size: 12px; line-height: 1.4; color: var(--glacia-sev-critical); }

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
  &--create { background: var(--glacia-red); color: #fff; box-shadow: 0 6px 20px rgba(255,37,41,0.35); }
  &--cancel { background: rgba(220,38,38,0.06); color: var(--glacia-sev-critical); &:hover { background: rgba(220,38,38,0.12); } }
  &--save { background: linear-gradient(135deg, #e53925, #b91c1c); color: #fff; box-shadow: 0 8px 20px -6px rgba(229,57,37,0.4); &:disabled { opacity: 0.5; cursor: default; } }
  &--saved { background: #16a34a; box-shadow: 0 8px 20px -6px rgba(22,163,74,0.4); }
  &:disabled { cursor: default; }
  &__spinner { width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; animation: modal-btn-spin 0.7s linear infinite; }
  &__check { animation: modal-btn-pop 0.4s ease; }
}
@keyframes modal-btn-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes modal-btn-pop { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
</style>
