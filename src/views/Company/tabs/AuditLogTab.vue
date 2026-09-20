<script setup>
import { ref, computed } from 'vue'
import { get } from '@/utils/request'
import { useFetch } from '@/composables/useFetch'
import DataTable from '@/components/table/DataTable.vue'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import { IconSearch, IconArrowUpRight } from '@tabler/icons-vue'

const { data, loading } = useFetch(() => get('/company/audit-log'))

const columns = [
  { key: '__index', label: '#', width: '32px', dim: true },
  { key: 'dateTime', label: 'Date and Time', width: '16%' },
  { key: 'actor', label: 'Actor', width: '14%', bold: true },
  { key: 'action', label: 'Activity', width: '16%' },
  { key: 'detail', label: 'Detail', width: '43%', dim: true, truncate: true },
  { key: 'view', label: 'Action', width: '8%', align: 'center' },
]

function viewEntry(item) {
  // stub — wire up to a real audit entry detail view when the API exists
  console.info('View audit entry', item.id)
}

function fmt(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

const search = ref('')
const actionOptions = computed(() => {
  const seen = new Set()
  return (data.value ?? []).reduce((acc, entry) => {
    if (!seen.has(entry.action)) {
      seen.add(entry.action)
      acc.push({ value: entry.action, label: entry.action })
    }
    return acc
  }, [])
})
const actionFilter = ref(null)

const filteredData = computed(() => {
  let list = data.value ?? []
  if (actionFilter.value) list = list.filter((a) => a.action === actionFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter((a) =>
      a.actor.toLowerCase().includes(q) ||
      a.action.toLowerCase().includes(q) ||
      a.detail.toLowerCase().includes(q))
  }
  return list
})
</script>

<template>
  <div class="audit-log">
    <div class="company-controls">
      <div class="company-search">
        <IconSearch :size="16" class="company-search__icon" />
        <input v-model="search" type="text" class="company-search__input" placeholder="Search" />
      </div>
      <FilterDropdown v-model="actionFilter" :options="actionOptions" placeholder="Action" />
    </div>

    <DataTable
      :columns="columns"
      :items="filteredData"
      :loading="loading"
      empty-text="No audit entries found."
    >
      <template #cell-dateTime="{ row }">{{ fmt(row.dateTime) }}</template>
      <template #cell-view="{ row }">
        <button type="button" class="view-btn" aria-label="View entry" @click="viewEntry(row)">
          <IconArrowUpRight :size="17" />
        </button>
      </template>
    </DataTable>
  </div>
</template>

<style scoped lang="scss">
.audit-log {
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

.view-btn {
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
</style>
