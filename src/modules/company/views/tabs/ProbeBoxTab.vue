<script setup>
import { formatLongDateTime12 } from '@/utils/helpers'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getProbes } from '@/modules/company/services/companyService'
import { useFetch } from '@/composables/useFetch'
import DataTable from '@/components/common/DataTable.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import FilterDropdown from '@/components/common/FilterDropdown.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import ProbeBoxOverviewModal from '@/modules/company/components/ProbeBoxOverviewModal.vue'
import { IconDotsVertical, IconArrowUpRight, IconPlugConnected } from '@tabler/icons-vue'

const { data, loading } = useFetch(() => getProbes())

const tableRef = ref(null)

const columns = [
  { key: '__index', label: 'No', kind: 'index', width: '52px', dim: true  },
  { key: 'name', label: 'Integration Name', min: 153, max: 280, bold: true, mono: true, truncate: true },
  { key: 'lastSeen', label: 'Last Checked', width: '229px', dim: true, truncate: true },
  { key: 'monitoring', label: 'Connection Monitoring', width: '195px' },
  { key: 'status', label: 'Status', width: '146px', align: 'center' },
  { key: 'action', label: 'Action', kind: 'action', align: 'center'  },
]

const statusMeta = {
  online:  { label: 'Online',  color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' },
  offline: { label: 'Offline', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
}
function s(status) {
  return statusMeta[status] ?? { label: status === 'maintenance' ? 'Offline' : status, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' }
}

const search = ref('')
const statusOptions = [
  { value: 'online',  label: 'Online' },
  { value: 'offline', label: 'Offline' },
]
const statusFilter = ref(null)

const filteredData = computed(() => {
  let list = data.value ?? []
  if (statusFilter.value) list = list.filter((p) => p.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((p) => p.name.toLowerCase().includes(q))
  return list
})

const openMenuId = ref(null)
const menuPos = ref({ top: 0, right: 0 })

function toggleMenu(item, event) {
  if (openMenuId.value === item.id) {
    openMenuId.value = null
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  // Anchored by its right edge so the menu can size to its widest item.
  menuPos.value = { top: rect.bottom + 6, right: window.innerWidth - rect.right }
  openMenuId.value = item.id
}
function closeMenu() { openMenuId.value = null }

const showOverview = ref(false)
const overviewProbe = ref(null)

function viewProbe(item) {
  closeMenu()
  overviewProbe.value = item
  showOverview.value = true
}
// Keep the table row in sync with edits/checks made in the modal.
function updateProbe(patch) {
  data.value = (data.value ?? []).map((p) => (p.id === patch.id ? { ...p, ...patch } : p))
  if (overviewProbe.value?.id === patch.id) overviewProbe.value = { ...overviewProbe.value, ...patch }
}
function checkConnection(item) {
  closeMenu()
  console.info('Check connection', item.id)
}

function handleClickOutside(e) {
  if (!e.target.closest('.action-menu, .action-btn')) closeMenu()
}
onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div class="probe-box">
    <div class="company-controls">
      <SearchInput v-model="search" placeholder="Search…" />
      <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Status" />

      <TablePagination
        v-if="tableRef"
        :pagination="tableRef.pagination"
        class="company-pagination-inline"
      />
    </div>

    <DataTable
      ref="tableRef"
      :columns="columns"
      :items="filteredData"
      :loading="loading"
      hide-pagination
      empty-text="No integrations found." :empty-icon="IconPlugConnected"
    >
      <template #cell-status="{ row }">
        <span class="status-pill" :style="{ background: s(row.status).bg, color: s(row.status).color }">
          {{ s(row.status).label }}
        </span>
      </template>
      <template #cell-lastSeen="{ row }">{{ formatLongDateTime12(row.lastSeen) }}</template>
      <template #cell-monitoring="{ row }">
        <div class="monitor" role="img" :aria-label="`Last ${row.monitoring?.length ?? 0} connection checks`">
          <span
            v-for="(check, i) in row.monitoring ?? []"
            :key="i"
            class="monitor__tick"
            :class="{ 'monitor__tick--down': check === 'down' }"
            :title="check === 'down' ? 'Down' : 'Up'"
          />
        </div>
      </template>
      <template #cell-action="{ row }">
        <button type="button" class="action-btn" aria-label="Actions" @click.stop="toggleMenu(row, $event)">
          <IconDotsVertical :size="12" />
        </button>
      </template>
    </DataTable>

    <ProbeBoxOverviewModal v-model="showOverview" :probe="overviewProbe" @update="updateProbe" />

    <Teleport to="body">
      <div v-if="openMenuId" class="action-menu" :style="{ top: `${menuPos.top}px`, right: `${menuPos.right}px` }">
        <button type="button" class="action-menu__item" @click="viewProbe((data ?? []).find((i) => i.id === openMenuId))">
          <IconArrowUpRight :size="15" />
          See Details
        </button>
        <button type="button" class="action-menu__item" @click="checkConnection((data ?? []).find((i) => i.id === openMenuId))">
          <IconPlugConnected :size="15" />
          Check connection
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.probe-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.company-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

// Pagination sits on the controls row, right-aligned with search + filter.
.company-pagination-inline {
  margin-top: 0;
  margin-left: auto;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: var(--glacia-radius-pill);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.monitor {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 320px;

  &__tick {
    flex: 1 1 0;
    min-width: 6px;
    max-width: 20px;
    aspect-ratio: 1;
    border-radius: 5px;
    background: #62c46b;

    &--down {
      background: #e8776f;
    }
  }
}

.action-btn {
  width: 22px;
  height: 22px;
  border-radius: var(--glacia-radius-sm);
  background: none;
  border: none;
  color: var(--glacia-ink-dim);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.13s, color 0.13s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--glacia-ink);
  }
}

.action-menu {
  position: fixed;
  width: max-content;
  min-width: 176px;
  background: var(--surface);
  border-radius: 12px;
  box-shadow: 0 12px 28px -6px rgba(16, 24, 32, 0.2);
  overflow: hidden;
  padding: 6px;
  z-index: 200;
  transform-origin: top right;
  animation: action-menu-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 10px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--glacia-ink);
    font-size: 13px;
    font-weight: 500;
    font-family: 'Manrope', 'Inter', sans-serif;
    white-space: nowrap;
    cursor: pointer;
    text-align: left;
    transition: background 0.13s, color 0.13s;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    &--danger {
      color: var(--glacia-sev-critical);

      &:hover {
        background: rgba(220, 38, 38, 0.08);
      }
    }
  }
}

@keyframes action-menu-bounce {
  0%   { opacity: 0; transform: scale(0.85) translateY(-8px); }
  60%  { opacity: 1; transform: scale(1.03) translateY(0); }
  100% { transform: scale(1); }
}
</style>
