<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get } from '@/utils/request'
import { useFetch } from '@/composables/useFetch'
import DataTable from '@/components/table/DataTable.vue'
import TablePagination from '@/components/table/TablePagination.vue'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import SearchInput from '@/components/reusable/SearchInput.vue'
import { IconDotsVertical, IconEye, IconSettings } from '@tabler/icons-vue'

const { data, loading } = useFetch(() => get('/company/list'))

const tableRef = ref(null)

const columns = [
  { key: '__index', label: '#', width: '24px', dim: true },
  { key: 'name', label: 'Company Name', width: '40%', bold: true, truncate: true},
  { key: 'type', label: 'Type', width: '18%', dim: true, truncate: true},
  { key: 'users', label: 'Users', width: '12%', align: 'center' },
  { key: 'status', label: 'Status', width: '18%', align: 'center' },
  { key: 'action', label: 'Action', width: '32px', align: 'center' },
]

const statusMeta = {
  active:    { label: 'Active',    color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' },
  suspended: { label: 'Suspended', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
}
function s(status) {
  // Any legacy 'trial' value is treated as 'suspended' so only two statuses appear.
  const key = status === 'trial' ? 'suspended' : status
  return statusMeta[key] ?? { label: key, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' }
}

function displayType(raw) {
  if (!raw) return '—'
  return raw.toLowerCase() === 'head company' ? 'Head Company' : 'Sub Company'
}

const route = useRoute()
const router = useRouter()

// Synced with `?q=` so the navbar's Company-page filter field (only shown
// while this page/tab is active) can drive this same search from outside.
const search = ref(route.query.q ?? '')

watch(() => route.query.q, (val) => {
  if ((val ?? '') !== search.value) search.value = val ?? ''
})

watch(search, (val) => {
  if ((route.query.q ?? '') !== val) {
    router.replace({ query: { ...route.query, q: val || undefined } })
  }
})

const statusOptions = [
  { value: 'active',    label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
]
const statusFilter = ref(null)

const filteredData = computed(() => {
  let list = data.value ?? []
  if (statusFilter.value) list = list.filter((c) => c.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((c) => c.name.toLowerCase().includes(q))
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

function viewCompany(item) {
  closeMenu()
  console.info('View company', item.id)
}
function manageCompany(item) {
  closeMenu()
  console.info('Manage company', item.id)
}

function handleClickOutside(e) {
  if (!e.target.closest('.action-menu, .action-btn')) closeMenu()
}
onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div class="company-list">
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
      empty-text="No companies found."
    >
      <template #cell-type="{ row }">
        {{ displayType(row.type) }}
      </template>
      <template #cell-status="{ row }">
        <span class="status-pill" :style="{ background: s(row.status).bg, color: s(row.status).color }">
          {{ s(row.status).label }}
        </span>
      </template>
      <template #cell-action="{ row }">
        <button type="button" class="action-btn" aria-label="Actions" @click.stop="toggleMenu(row, $event)">
          <IconDotsVertical :size="16" />
        </button>
      </template>
    </DataTable>

    <Teleport to="body">
      <div v-if="openMenuId" class="action-menu" :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }">
        <button type="button" class="action-menu__item" @click="viewCompany((data ?? []).find((i) => i.id === openMenuId))">
          <IconEye :size="15" />
          View
        </button>
        <button type="button" class="action-menu__item" @click="manageCompany((data ?? []).find((i) => i.id === openMenuId))">
          <IconSettings :size="15" />
          Manage
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.company-list {
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
  }
}

@keyframes action-menu-bounce {
  0%   { opacity: 0; transform: scale(0.85) translateY(-8px); }
  60%  { opacity: 1; transform: scale(1.03) translateY(0); }
  100% { transform: scale(1); }
}
</style>
