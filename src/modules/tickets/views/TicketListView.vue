<script setup>
import { ref, computed, watch } from 'vue'
import DataTable from '@/components/common/DataTable.vue'
import FilterDropdown from '@/components/common/FilterDropdown.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import { useRouter } from 'vue-router'
import { useRole } from '@/composables/useRole'
import { useAuthStore } from '@/stores/auth'
import { useTicketStore } from '@/modules/tickets/store/tickets'
import CreateTicketModal from '@/modules/tickets/components/CreateTicketModal.vue'
import { emptyData } from '@/utils/dataMode'
import { notifyMock } from '@/utils/notifyMock'
import { formatShortDate } from '@/utils/helpers'
import { sampleTicketOwners, canViewTicket } from '@/modules/tickets/utils/visibility'
import { IconArrowUpRight, IconPlus, IconTicket } from '@tabler/icons-vue'

const sampleTickets = [
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

// Tickets created this session sit above the built-in samples.
const ticketStore = useTicketStore()
const { can } = useRole()
const auth = useAuthStore()
const allTickets = computed(() => [
  ...ticketStore.created,
  ...(emptyData.value ? [] : sampleTickets.map((t) => ({ ...t, ...sampleTicketOwners[t.ticketId] }))),
])
// Each role only sees the tickets it is allowed to (super admin: all).
const rawTickets = computed(() => allTickets.value.filter((t) => canViewTicket(t, auth.user)))

// Only roles other than super admin raise tickets.
const showCreate = ref(false)

function createTicket({ name, category, description }) {
  const now = new Date()
  // 'ANO' + 17 digits, like the sample ticket IDs (13-digit timestamp + 4 random digits).
  const ticketId = `ANO${now.getTime()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  ticketStore.add({
    id: `new-${ticketId}`,
    ticketId,
    date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    name,
    detail: description,
    description,
    category,
    status: 'open',
    submitter: auth.user?.name ?? auth.user?.username ?? 'You',
    company: auth.user?.companies?.[0]?.name ?? '—',
  })
  // N-TK-01: tell Super Admin about the new ticket (the real backend does this itself).
  notifyMock('N-TK-01', {
    vars: { ticket: ticketId, company: auth.user?.companies?.[0]?.name ?? '—', category },
    companyId: auth.user?.companies?.[0]?.id,
    link: `/tickets/${ticketId}`,
  })
  issueFilter.value = null
  search.value = ''
  activeTab.value = 'open'
}

const tableRef = ref(null)

const columns = [
  { key: '__index', label: 'No',            width: '52px',  dim: true, align: 'left' },
  { key: 'date',     label: 'Submission Date', width: '15%', padLeft: '4px', truncate: true },
  { key: 'name',     label: 'Ticket Name', width: '28%' },
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
const openCount = computed(() => rawTickets.value.filter((t) => t.status === 'open').length)
const resolvedCount = computed(() => rawTickets.value.filter((t) => t.status === 'resolved').length)

const router = useRouter()

const search = ref('')
const issueCategoryOptions = [
  { value: 'Application & System Failures', label: 'Application & System Failures' },
  { value: 'General Enquiry',               label: 'General Enquiry' },
  { value: 'Others',                        label: 'Others' },
]
const issueFilter = ref(null)

const filteredData = computed(() => {
  let list = rawTickets.value.filter((t) => t.status === activeTab.value)
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
      <div class="ticket-list__actions">
        <button v-if="can('create_ticket')" type="button" class="btn-create-ticket" @click="showCreate = true">
          <IconPlus :size="15" /> Create Ticket
        </button>
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
      empty-text="No tickets found." :empty-icon="IconTicket"
    >
      <template #cell-name="{ row }">
        <div class="ticket-name">
          <div class="ticket-name__title">{{ row.name }}</div>
        </div>
      </template>
      <template #cell-date="{ row }">
        <span class="ticket-name__title">{{ formatShortDate(row.date) }}</span>
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

    <CreateTicketModal v-if="can('create_ticket')" v-model="showCreate" @create="createTicket" />
  </div>
</template>

<style scoped lang="scss" src="./TicketListView.scss"></style>
