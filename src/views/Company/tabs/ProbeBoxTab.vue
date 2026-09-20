<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { get } from '@/utils/request'
import { useFetch } from '@/composables/useFetch'
import DataTable from '@/components/table/DataTable.vue'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import { IconSearch, IconDotsVertical, IconRefresh, IconTrash } from '@tabler/icons-vue'

const { data, loading } = useFetch(() => get('/company/probes'))

const columns = [
  { key: '__index', label: '#', width: '32px', dim: true },
  { key: 'name', label: 'Probe Name', width: '24%', bold: true, mono: true },
  { key: 'ip', label: 'IP Address', width: '18%', mono: true, dim: true },
  { key: 'lastSeen', label: 'Last Checked', width: '21%', dim: true },
  { key: 'status', label: 'Status', width: '16%', align: 'center' },
  { key: 'action', label: 'Action', width: '10%', align: 'center' },
]

const statusMeta = {
  online:  { label: 'Online',  color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' },
  offline: { label: 'Offline', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
}
function s(status) {
  return statusMeta[status] ?? { label: status === 'maintenance' ? 'Offline' : status, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' }
}

function fmt(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
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
  if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.ip.includes(q))
  return list
})

const openMenuId = ref(null)
const menuPos = ref({ top: 0, left: 0 })

function toggleMenu(item, event) {
  if (openMenuId.value === item.id) {
    openMenuId.value = null
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  menuPos.value = { top: rect.bottom + 6, left: rect.right - 176 }
  openMenuId.value = item.id
}
function closeMenu() { openMenuId.value = null }

function restartProbe(item) {
  closeMenu()
  console.info('Restart probe', item.id)
}
function removeProbe(item) {
  closeMenu()
  data.value = (data.value ?? []).filter((p) => p.id !== item.id)
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
      <div class="company-search">
        <IconSearch :size="16" class="company-search__icon" />
        <input v-model="search" type="text" class="company-search__input" placeholder="Search" />
      </div>
      <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Status" />
    </div>

    <DataTable
      :columns="columns"
      :items="filteredData"
      :loading="loading"
      empty-text="No probes found."
    >
      <template #cell-status="{ row }">
        <span class="status-pill" :style="{ background: s(row.status).bg, color: s(row.status).color }">
          {{ s(row.status).label }}
        </span>
      </template>
      <template #cell-lastSeen="{ row }">{{ fmt(row.lastSeen) }}</template>
      <template #cell-action="{ row }">
        <button type="button" class="action-btn" aria-label="Actions" @click.stop="toggleMenu(row, $event)">
          <IconDotsVertical :size="16" />
        </button>
      </template>
    </DataTable>

    <Teleport to="body">
      <div v-if="openMenuId" class="action-menu" :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }">
        <button type="button" class="action-menu__item" @click="restartProbe((data ?? []).find((i) => i.id === openMenuId))">
          <IconRefresh :size="15" />
          Restart probe
        </button>
        <button
          type="button"
          class="action-menu__item action-menu__item--danger"
          @click="removeProbe((data ?? []).find((i) => i.id === openMenuId))"
        >
          <IconTrash :size="15" />
          Remove probe
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

.company-search {
  position: relative;
  width: 260px;

  &__icon {
    position: absolute;
    top: 50%;
    left: 14px;
    transform: translateY(-50%);
    color: var(--glacia-ink-dim);
    pointer-events: none;
  }

  &__input {
    width: 100%;
    box-sizing: border-box;
    height: 38px;
    padding: 0 14px 0 38px;
    border-radius: var(--glacia-radius-pill);
    border: 1px solid var(--glacia-glass-border);
    background: var(--glacia-glass-fill-strong);
    color: var(--glacia-ink);
    font-size: 13px;
    font-family: 'Manrope', 'Inter', sans-serif;
    outline: none;
    transition: border-color 0.13s, box-shadow 0.13s;

    &::placeholder {
      color: var(--glacia-ink-dim);
    }

    &:focus {
      border-color: var(--glacia-red);
      box-shadow: 0 2px 6px rgba(16, 24, 32, 0.1);
    }
  }
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

.action-btn {
  width: 30px;
  height: 30px;
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
  width: 176px;
  background: #fff;
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
