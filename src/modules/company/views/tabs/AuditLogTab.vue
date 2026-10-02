<script setup>
import { formatLongDateTime24 } from '@/utils/helpers'
import { ref, computed } from 'vue'
import { getAuditLog } from '@/modules/company/services/companyService'
import { useFetch } from '@/composables/useFetch'
import DataTable from '@/components/common/DataTable.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import FilterDropdown from '@/components/common/FilterDropdown.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import ReportDownloadModal from '@/components/common/ReportDownloadModal.vue'
import { IconDownload, IconListDetails } from '@tabler/icons-vue'

const { data, loading } = useFetch(() => getAuditLog())

const tableRef = ref(null)

const columns = [
  { key: '__index', label: 'No', kind: 'index', width: '64px', dim: true  },
  { key: 'dateTime', label: 'Date and Time', width: '196px', truncate: true },
  { key: 'actor', label: 'Actor', min: 130, max: 260 },
  { key: 'action', label: 'Activity', min: 130, max: 220, truncate: true },
  { key: 'detail', label: 'Detail', min: 130, max: 420, dim: true, truncate: true },
]

// Same day-month-year style as the Last Scanned column ("14 July 2026"),
// with the time after it ("14 July 2026, 15:45").
// Initials for the avatar — same rule as the Overview members table.
function initials(row) {
  const parts = row.actor.trim().split(/\s+/)
  return parts.length > 1
    ? ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
    : row.actor.slice(0, 2).toUpperCase()
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

// ── Download report — same flow as the scan Download Report modal: pick which
// entries to include, see the count, then Download.
const showDownload = ref(false)
const downloadGroups = computed(() => {
  const uniq = (key) => [...new Set((data.value ?? []).map((e) => e[key]))].map((v) => ({ value: v, label: v }))
  return [
    { key: 'action', label: 'Activity', options: uniq('action')  },
    { key: 'actor', label: 'Actor', options: uniq('actor')  },
  ]
})

function downloadAuditLog(entries) {
  const header = ['No', 'Date and Time', 'Actor', 'Username', 'Activity', 'Detail']
  const rows = [header, ...entries.map((e, i) => [
    i + 1,
    `"${formatLongDateTime24(e.dateTime)}"`,
    `"${e.actor.replace(/"/g, '""')}"`,
    e.actorUsername,
    `"${e.action.replace(/"/g, '""')}"`,
    `"${e.detail.replace(/"/g, '""')}"`,
  ])]
  const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'audit-log.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="audit-log">
    <div class="company-controls">
      <SearchInput v-model="search" placeholder="Search…" />
      <FilterDropdown v-model="actionFilter" :options="actionOptions" placeholder="Action" />

      <button type="button" class="btn-download" @click="showDownload = true">
        <IconDownload :size="15" /> Download report
      </button>

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
      empty-text="No audit entries found." :empty-icon="IconListDetails"
    >
      <template #cell-dateTime="{ row }">{{ formatLongDateTime24(row.dateTime) }}</template>
      <template #cell-actor="{ row }">
        <div class="member-cell">
          <span class="member-avatar" :class="{ 'member-avatar--named': row.actor !== 'System' }">{{ initials(row) }}</span>
          <div class="member-cell__text">
            <div class="member-cell__name">{{ row.actor }}</div>
            <div class="member-cell__username">{{ row.actorUsername }}</div>
          </div>
        </div>
      </template>
    </DataTable>

    <ReportDownloadModal
      v-model="showDownload"
      title="Download Audit Log"
      description="Choose which audit entries to include in the export."
      noun="entries"
      :rows="data ?? []"
      :groups="downloadGroups"
      @download="downloadAuditLog"
    />
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

// Pagination sits on the controls row, right-aligned with search + filter.
.company-pagination-inline {
  margin-top: 0;
  margin-left: auto;
}

// Actor cell — same avatar + name + username layout as the Overview members table.
.member-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: rgba(var(--tint), 0.06);
  color: var(--glacia-ink-dim);

  &--named {
    background: rgba(255, 37, 41, 0.1);
    color: var(--glacia-red);
  }
}

.member-cell__text {
  min-width: 0;
}

.member-cell__name {
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--glacia-ink);
}

.member-cell__username {
  font-size: 12px;
  line-height: 1.3;
  color: var(--glacia-ink-dim);
}

.btn-download {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px; padding: 0 14px;
  border-radius: var(--glacia-radius-pill); border: none;
  background: var(--glacia-red); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(255, 37, 41, 0.4); transition: background 0.15s, box-shadow 0.15s;
  &:hover { background: #e01e22; box-shadow: 0 8px 24px rgba(255, 37, 41, 0.5); }
}
</style>
