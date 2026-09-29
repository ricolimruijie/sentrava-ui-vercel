<script setup>
import { ref, computed, watch } from 'vue'
import DataTable from '@/components/table/DataTable.vue'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import SearchInput from '@/components/reusable/SearchInput.vue'
import { useRouter } from 'vue-router'
import { IconArrowUpRight } from '@tabler/icons-vue'

const rawTickets = [
  { id: 't1',  date: '10 February 2026', name: "Can't executed scan in module Domain Inspection", detail: 'Scan job failed with error 500 when targeting protergo.id', category: 'Application & System Failures', ticketId: 'ANO31456123458765', status: 'open' },
  { id: 't2',  date: '12 February 2026', name: 'Potential Port Scanning detected on 10.20.1.10', detail: 'IDS flagged repeated SYN probes from external IP', category: 'Application & System Failures', ticketId: 'ANO31456123458766', status: 'open' },
  { id: 't3',  date: '15 February 2026', name: 'Web Application scan returns empty results', detail: 'Nuclei scan finished but no findings stored', category: 'Application & System Failures', ticketId: 'ANO31456123458767', status: 'open' },
  { id: 't4',  date: '18 February 2026', name: 'Billing inquiry: additional quota for Domain Inspection', detail: 'Request to increase monthly quota from 4 to 8', category: 'General Enquiry', ticketId: 'ANO31456123458768', status: 'open' },
  { id: 't5',  date: '20 February 2026', name: 'Source Code scan timeout after 30 minutes', detail: 'Semgrep job exceeded timeout on repo protergo-backend', category: 'Others', ticketId: 'ANO31456123458769', status: 'open' },
  { id: 't6',  date: '22 February 2026', name: 'Unable to download vulnerability report PDF', detail: 'Export button returns 404 for report 2026-02-22', category: 'General Enquiry', ticketId: 'ANO31456123458770', status: 'open' },
  { id: 't7',  date: '25 February 2026', name: 'Probe Box offline in Jakarta DC', detail: 'Probe probe-jakarta-01 last seen 3 days ago', category: 'Application & System Failures', ticketId: 'ANO31456123458771', status: 'resolved' },
  { id: 't8',  date: '27 February 2026', name: 'Request for API key rotation', detail: 'Need to revoke old key and issue new for CI/CD', category: 'Others', ticketId: 'ANO31456123458772', status: 'open' },
  { id: 't9',  date: '28 February 2026', name: 'False positive on CVE-2023-1234', detail: 'Semgrep flagged test fixture as critical', category: 'Application & System Failures', ticketId: 'ANO31456123458773', status: 'resolved' },
  { id: 't10', date: '02 March 2026',     name: 'Top-up credit not reflected in dashboard', detail: 'Payment succeeded but credits still 0', category: 'General Enquiry', ticketId: 'ANO31456123458774', status: 'open' },
]

const tableRef = ref(null)

const columns = [
  { key: '__index', label: '#',            width: '24px',  dim: true, align: 'left' },
  { key: 'date',     label: 'Submission Date', width: '13%', padLeft: '4px', truncate: true },
  { key: 'name',     label: 'Ticket Name', width: '30%' },
  { key: 'category', label: 'Issue Category', width: '18%', truncate: true },
  { key: 'ticketId', label: 'Ticket ID',  width: '17%', truncate: true },
  { key: 'status',   label: 'Ticket Status', width: '12%', align: 'center' },
  { key: 'action',   label: 'Action',     width: '30px',  align: 'center', compact: true },
]

const statusMeta = {
  open:     { label: 'Open',     color: '#e53925', bg: 'rgba(255, 37, 41, 0.08)' },
  resolved: { label: 'Resolved', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' },
}
function s(status) { return statusMeta[status] ?? { label: status, color: '#64748b', bg: 'rgba(100,116,139,0.12)' } }

const activeTab = ref('open')
const openCount = computed(() => rawTickets.filter((t) => t.status === 'open').length)
const resolvedCount = computed(() => rawTickets.filter((t) => t.status === 'resolved').length)

const router = useRouter()

const search = ref('')
const issueCategoryOptions = [
  { value: 'Application & System Failures', label: 'Application & System Failures' },
  { value: 'General Enquiry',               label: 'General Enquiry' },
  { value: 'Others',                        label: 'Others' },
]
const issueFilter = ref(null)

const filteredData = computed(() => {
  let list = rawTickets.filter((t) => t.status === activeTab.value)
  if (issueFilter.value) list = list.filter((t) => t.category === issueFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((t) => t.name.toLowerCase().includes(q) || t.ticketId.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
  return list
})

watch([activeTab, issueFilter, search], () => tableRef.value?.pagination.goTo(1))

function viewTicket(item) {
  router.push(`/tickets/${item.ticketId}`)
}
</script>

<template>
  <div class="ticket-list">
    <div class="ticket-list__head">
      <h1 class="ticket-list__title">Ticket List</h1>
      <div class="ticket-tabs">
        <button
          type="button"
          class="ticket-tabs__item"
          :class="{ 'ticket-tabs__item--active': activeTab === 'open' }"
          @click="activeTab = 'open'"
        >
          Open <span class="ticket-tabs__count">{{ openCount }}</span>
        </button>
        <button
          type="button"
          class="ticket-tabs__item"
          :class="{ 'ticket-tabs__item--active': activeTab === 'resolved' }"
          @click="activeTab = 'resolved'"
        >
          Resolved <span class="ticket-tabs__count ticket-tabs__count--dim">{{ resolvedCount }}</span>
        </button>
      </div>
    </div>

    <div class="ticket-controls">
      <div class="ticket-controls__left">
        <FilterDropdown v-model="issueFilter" :options="issueCategoryOptions" placeholder="Issue Category" />
      </div>
      <SearchInput v-model="search" placeholder="Search…" />
    </div>

    <DataTable
      ref="tableRef"
      :columns="columns"
      :items="filteredData"
      :loading="false"
      empty-text="No tickets found."
    >
      <template #cell-name="{ row }">
        <div class="ticket-name">
          <div class="ticket-name__title">{{ row.name }}</div>
        </div>
      </template>
      <template #cell-date="{ row }">
        <span class="ticket-name__title">{{ row.date }}</span>
      </template>
      <template #cell-category="{ row }">
        <span class="ticket-name__title">{{ row.category }}</span>
      </template>
      <template #cell-ticketId="{ row }">
        <span class="ticket-name__title">{{ row.ticketId }}</span>
      </template>
      <template #cell-status="{ row }">
        <span class="status-pill" :style="{ background: s(row.status).bg, color: s(row.status).color }">
          {{ s(row.status).label }}
        </span>
      </template>
      <template #cell-action="{ row }">
        <button type="button" class="view-btn" aria-label="View ticket" @click="viewTicket(row)">
          <IconArrowUpRight :size="16" />
        </button>
      </template>
    </DataTable>
  </div>
</template>

<style scoped lang="scss">
.ticket-list {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }
}

.ticket-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: var(--glacia-radius-pill);
  background: var(--glacia-glass-fill-strong);
  border: 1px solid var(--glacia-glass-border);
  width: 100%;
  max-width: 260px;

  &__item {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: var(--glacia-radius-pill);
    border: none;
    background: transparent;
    color: var(--glacia-ink-dim);
    font-size: 13px;
    font-weight: 600;
    font-family: 'Manrope', 'Inter', sans-serif;
    cursor: pointer;
    white-space: nowrap;
    min-width: 0;
    transition: background 0.15s, color 0.15s, box-shadow 0.15s;

    &--active {
      background: #fff;
      color: var(--glacia-ink);
      box-shadow: 0 2px 8px rgba(16,24,32,0.08);
    }
  }

  &__count {
    min-width: 22px;
    padding: 2px 6px;
    border-radius: 999px;
    background: #e5e7eb;
    color: var(--glacia-ink-dim);
    font-size: 11px;
    font-weight: 700;
    text-align: center;

    .ticket-tabs__item--active & {
      background: #e5e7eb;
      color: var(--glacia-ink);
    }

    &--dim {
      opacity: 0.9;
    }
  }
}

.ticket-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
}


.ticket-name {
  min-width: 0;

  &__title {
    font-size: 13px;
    font-weight: 500;
    color: var(--glacia-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__detail {
    margin-top: 2px;
    font-size: 11px;
    color: #a1a8b5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 5px 14px;
  border-radius: var(--glacia-radius-pill);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
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
  &:hover { background: rgba(0,0,0,0.05); color: var(--glacia-ink); }
}
</style>
