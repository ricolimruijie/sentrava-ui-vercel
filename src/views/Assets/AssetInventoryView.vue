<script setup>
import { ref, computed } from 'vue'
import DataTable from '@/components/table/DataTable.vue'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import { IconSearch, IconDotsVertical, IconPlus, IconWorld, IconBrowser, IconNetwork, IconCode, IconTag, IconListDetails } from '@tabler/icons-vue'

const tabs = [
  { key: 'domain', label: 'Domain', icon: IconWorld },
  { key: 'webapp', label: 'Web Application', icon: IconBrowser },
  { key: 'network', label: 'Network', icon: IconNetwork },
  { key: 'source', label: 'Source Code', icon: IconCode },
  { key: 'tags', label: 'Tags', icon: IconTag },
]
const activeTab = ref('domain')

const assets = ref([
  { id: 1, domain: 'protergo.id', owner: 'Protergo Cyber Security Ampera', lastScanned: '23 June 2026', status: 'Completed' },
  { id: 2, domain: 'api.protergo.id', owner: 'Protergo Cyber Security Ampera', lastScanned: '22 June 2026', status: 'Completed' },
  { id: 3, domain: 'app.protergo.id', owner: 'Protergo Cyber Security Jakarta', lastScanned: '20 June 2026', status: 'In Progress' },
  { id: 4, domain: 'staging.protergo.id', owner: 'Protergo Cyber Security Surabaya', lastScanned: '18 June 2026', status: 'Completed' },
  { id: 5, domain: 'admin.protergo.id', owner: 'Protergo Fintech Solutions', lastScanned: '15 June 2026', status: 'Completed' },
  { id: 6, domain: 'vpn.protergo.id', owner: 'Protergo Cyber Security Bandung', lastScanned: '10 June 2026', status: 'In Progress' },
  { id: 7, domain: 'cdn.protergo.id', owner: 'Beta Ventures Security', lastScanned: '05 June 2026', status: 'Completed' },
  { id: 8, domain: 'partners.protergo.id', owner: 'Protergo Labs', lastScanned: '01 June 2026', status: 'Completed' },
])

const webapps = ref([
  { id: 1, appName: 'Protergo Website', url: 'https://protergo.id/', owner: 'Protergo Cyber Security Ampera', basicAuth: 'Inactive', lastScanned: '03 June 2026', tags: [], status: 'Completed' },
  { id: 2, appName: 'Protergo Admin', url: 'https://admin.protergo.id/', owner: 'Protergo Cyber Security Jakarta', basicAuth: 'Active', lastScanned: '02 June 2026', tags: ['internal'], status: 'Completed' },
  { id: 3, appName: 'API Gateway', url: 'https://api.protergo.id/v1', owner: 'Protergo Cyber Security Surabaya', basicAuth: 'Active', lastScanned: '01 June 2026', tags: [], status: 'In Progress' },
  { id: 4, appName: 'Staging Portal', url: 'https://staging.protergo.id/', owner: 'Protergo Fintech Solutions', basicAuth: 'Inactive', lastScanned: '30 May 2026', tags: ['staging'], status: 'Completed' },
  { id: 5, appName: 'Customer Dashboard', url: 'https://app.protergo.id/dashboard', owner: 'Protergo Cyber Security Bandung', basicAuth: 'Inactive', lastScanned: '28 May 2026', tags: [], status: 'Completed' },
  { id: 6, appName: 'Billing Service', url: 'https://billing.protergo.id/', owner: 'Beta Ventures Security', basicAuth: 'Active', lastScanned: '25 May 2026', tags: ['finance'], status: 'In Progress' },
  { id: 7, appName: 'Partner Portal', url: 'https://partners.protergo.id/', owner: 'Protergo Labs', lastScanned: '20 May 2026', tags: [], status: 'Completed' },
  { id: 8, appName: 'VPN Console', url: 'https://vpn.protergo.id/admin', owner: 'Protergo Cyber Security Ampera', basicAuth: 'Active', lastScanned: '18 May 2026', tags: ['vpn', 'internal'], status: 'Completed' },
])

const columns = [
  { key: '__index', label: '#', width: '32px', dim: true },
  { key: 'domain', label: 'Domain', width: '28%' },
  { key: 'owner', label: 'Asset Owner', width: '26%' },
  { key: 'lastScanned', label: 'Last Scanned', width: '18%' },
  { key: 'status', label: 'Scanner Status', width: '16%', align: 'center' },
  { key: 'actions', label: 'Action', width: '10%', align: 'center' },
]

const webappColumns = [
  { key: '__index', label: 'No', width: '40px', dim: true },
  { key: 'appName', label: 'App Name', width: '14%' },
  { key: 'url', label: 'URL', width: '20%' },
  { key: 'owner', label: 'Asset Owner', width: '18%' },
  { key: 'basicAuth', label: 'Basic Auth', width: '10%', align: 'center' },
  { key: 'lastScanned', label: 'Last Scanned', width: '12%' },
  { key: 'tags', label: 'Multi-Tags', width: '14%', align: 'center' },
  { key: 'status', label: 'Scanner Status', width: '12%', align: 'center' },
  { key: 'actions', label: 'Action', width: '8%', align: 'center' },
]

const ownerOptions = [
  { value: 'Protergo Cyber Security Ampera', label: 'Protergo Cyber Security Ampera' },
  { value: 'Protergo Cyber Security Jakarta', label: 'Protergo Cyber Security Jakarta' },
  { value: 'Protergo Cyber Security Surabaya', label: 'Protergo Cyber Security Surabaya' },
  { value: 'Protergo Fintech Solutions', label: 'Protergo Fintech Solutions' },
  { value: 'Protergo Cyber Security Bandung', label: 'Protergo Cyber Security Bandung' },
  { value: 'Beta Ventures Security', label: 'Beta Ventures Security' },
  { value: 'Protergo Labs', label: 'Protergo Labs' },
]
const statusOptions = [{ value: 'Completed', label: 'Completed' }, { value: 'In Progress', label: 'In Progress' }]
const appNameOptions = [{ value: 'Protergo Website', label: 'Protergo Website' }]
const basicAuthOptions = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]
const ownerFilter = ref(null)
const statusFilter = ref(null)
const appNameFilter = ref(null)
const basicAuthFilter = ref(null)
const multiTagFilter = ref(null)
const search = ref('')

const filtered = computed(() => {
  let list = assets.value
  if (ownerFilter.value) list = list.filter((a) => a.owner === ownerFilter.value)
  if (statusFilter.value) list = list.filter((a) => a.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((a) => a.domain.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q))
  return list
})

const filteredWebapps = computed(() => {
  let list = webapps.value
  if (basicAuthFilter.value) list = list.filter((a) => a.basicAuth === basicAuthFilter.value)
  if (statusFilter.value) list = list.filter((a) => a.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((a) => a.appName.toLowerCase().includes(q) || a.url.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q))
  return list
})

const openMenuId = ref(null)
const menuPos = ref({ top: 0, left: 0 })
function toggleMenu(row, e) {
  if (openMenuId.value === row.id) { openMenuId.value = null; return }
  const rect = e.currentTarget.getBoundingClientRect()
  menuPos.value = { top: rect.bottom + 6, left: rect.right - 100 }
  openMenuId.value = row.id
}
</script>

<template>
  <div class="asset-mgmt">
    <h1 class="asset-mgmt__title">Asset Inventory Management</h1>
    <p class="asset-mgmt__sub">Total Domain Registered: <b>{{ filtered.length }}</b></p>
    <p class="asset-mgmt__desc">This is where you store and keep all your assets. All assets are automatically categorized by type including Domain, Web Application, Network, Source Code, and Tags. You can register new assets, track their scan status, monitor last scanned dates, and manage your inventory in one place. This helps you keep your security posture organized, up to date, and ready for scanning at any time.</p>

    <div class="asset-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="asset-tabs__item"
        :class="{ 'asset-tabs__item--active': t.key === activeTab }"
        @click="activeTab = t.key"
      >
        <component :is="t.icon" :size="14" />
        {{ t.label }}
      </button>
    </div>

    <div class="asset-controls">
      <template v-if="activeTab === 'domain'">
        <div class="asset-controls__left">
          <FilterDropdown v-model="ownerFilter" :options="ownerOptions" placeholder="Asset Owner" />
          <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scan Status" />
        </div>
        <div class="asset-controls__right">
          <div class="asset-search">
            <input v-model="search" type="text" class="asset-search__input" placeholder="Search" />
            <IconSearch :size="16" class="asset-search__icon" />
          </div>
          <button type="button" class="btn-register"><IconPlus :size="14" /> Register Domain</button>
        </div>
      </template>
      <template v-else-if="activeTab === 'webapp'">
        <div class="asset-controls__left">
          <FilterDropdown v-model="basicAuthFilter" :options="basicAuthOptions" placeholder="Basic Auth" />
          <FilterDropdown v-model="multiTagFilter" :options="[]" placeholder="Multi-Tags" />
          <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scan Status" />
        </div>
        <div class="asset-controls__right">
          <div class="asset-search">
            <input v-model="search" type="text" class="asset-search__input" placeholder="Search" />
            <IconSearch :size="16" class="asset-search__icon" />
          </div>
          <button type="button" class="btn-register"><IconPlus :size="14" /> Register Web Application</button>
        </div>
      </template>
      <template v-else>
        <div class="asset-controls__left">
          <FilterDropdown v-model="ownerFilter" :options="ownerOptions" placeholder="Asset Owner" />
          <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scan Status" />
        </div>
        <div class="asset-controls__right">
          <div class="asset-search">
            <input v-model="search" type="text" class="asset-search__input" placeholder="Search" />
            <IconSearch :size="16" class="asset-search__icon" />
          </div>
          <button type="button" class="btn-register"><IconPlus :size="14" /> Register</button>
        </div>
      </template>
    </div>

    <DataTable
      v-if="activeTab === 'domain'"
      :columns="columns"
      :items="filtered"
      :loading="false"
      empty-text="No assets found."
    >
      <template #cell-status="{ row }">
        <span class="status-pill" :class="row.status === 'In Progress' ? 'status-pill--progress' : 'status-pill--completed'">{{ row.status }}</span>
      </template>
      <template #cell-actions="{ row }">
        <button type="button" class="action-btn" @click.stop="toggleMenu(row, $event)"><IconDotsVertical :size="16" /></button>
      </template>
    </DataTable>

    <DataTable
      v-else-if="activeTab === 'webapp'"
      :columns="webappColumns"
      :items="filteredWebapps"
      :loading="false"
      empty-text="No web applications found."
    >
      <template #cell-url="{ row }">
        <a :href="row.url" target="_blank" rel="noopener" class="url-link">{{ row.url }}</a>
      </template>
      <template #cell-basicAuth="{ row }">
        <span class="pill" :class="row.basicAuth === 'Active' ? 'pill--active' : 'pill--inactive'">{{ row.basicAuth }}</span>
      </template>
      <template #cell-tags="{ row }">
        <button type="button" class="tag-add"><IconPlus :size="12" /> Add tag</button>
      </template>
      <template #cell-status="{ row }">
        <span class="status-pill" :class="row.status === 'In Progress' ? 'status-pill--progress' : 'status-pill--completed'">{{ row.status }}</span>
      </template>
      <template #cell-actions="{ row }">
        <button type="button" class="action-btn" @click.stop="toggleMenu(row, $event)"><IconDotsVertical :size="16" /></button>
      </template>
    </DataTable>

    <DataTable
      v-else
      :columns="columns"
      :items="[]"
      :loading="false"
      empty-text="No assets found for this category."
    />

    <Teleport to="body">
      <div v-if="openMenuId" class="action-menu" :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }">
        <button type="button" class="action-menu__item">View</button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.asset-mgmt {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__title { font-family: 'Manrope', 'Inter', sans-serif; font-size: 20px; font-weight: 800; color: var(--glacia-ink); margin: 0; line-height: 1.2; }
  &__sub { font-size: 13px; color: var(--glacia-ink-dim); margin: 0; b { color: var(--glacia-ink); font-weight: 700; } }
  &__desc { margin: 4px 0 0; max-width: 900px; font-size: 13px; line-height: 1.6; color: var(--glacia-ink-dim); }
}

.asset-tabs {
  display: flex;
  gap: 6px;
  padding: 6px;
  background: var(--glacia-glass-fill-strong);
  border: 1px solid var(--glacia-glass-border);
  border-radius: 999px;
  align-self: stretch;
  width: 100%;
  max-width: 640px;

  &__item {
    flex: 1;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 12px; border-radius: 999px; border: none;
    background: transparent; font-size: 13px; font-weight: 600; font-family: 'Manrope', 'Inter', sans-serif; color: var(--glacia-ink-dim); cursor: pointer; white-space: nowrap; min-width: 0;
    &--active { background: #fff; color: var(--glacia-ink); box-shadow: 0 2px 8px rgba(16,24,32,0.08); }
  }
}

.asset-controls {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  &__left { display: flex; gap: 12px; }
  &__right { display: flex; align-items: center; gap: 12px; }
}

.asset-search {
  position: relative; width: 260px;
  &__input {
    width: 100%; height: 38px; padding: 0 38px 0 14px; border-radius: 999px;
    border: 1px solid var(--glacia-glass-border); background: var(--glacia-glass-fill-strong);
    font-size: 13px; font-family: 'Manrope', 'Inter', sans-serif; color: var(--glacia-ink); outline: none;
    transition: border-color 0.13s, box-shadow 0.13s;
    &::placeholder { color: var(--glacia-ink-dim); }
    &:focus { border-color: var(--glacia-red); box-shadow: 0 2px 6px rgba(16,24,32,0.08); }
  }
  &__icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--glacia-ink-dim); pointer-events: none; }
}

.btn-register {
  height: 36px; padding: 0 16px; border-radius: 999px; border: none;
  background: linear-gradient(135deg, #e53925, #b91c1c); color: #fff;
  font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
}

.status-pill {
  display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700;
  &--completed { background: #dcfce7; color: #166534; }
  &--progress { background: #fef9c3; color: #854d0e; }
}

.pill {
  display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
  &--active { background: #dcfce7; color: #166534; }
  &--inactive { background: #f3f4f6; color: #6b7280; }
}

.url-link {
  color: var(--glacia-ink); font-weight: 600; text-decoration: underline; text-underline-offset: 2px;
  &:hover { color: var(--glacia-red); }
}

.tag-add {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px;
  border: 1px dashed var(--glacia-glass-border); background: #fff; font-size: 12px; font-weight: 500; color: var(--glacia-ink-dim); cursor: pointer;
  &:hover { border-color: var(--glacia-red); color: var(--glacia-red); }
}

.action-btn {
  width: 28px; height: 28px; border-radius: 8px; border: none; background: transparent;
  color: var(--glacia-ink-dim); cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  &:hover { background: rgba(0,0,0,0.05); }
}

.action-menu {
  position: fixed; background: #fff; border-radius: 12px; box-shadow: 0 12px 28px -6px rgba(16,24,32,0.2);
  padding: 6px; z-index: 200; width: 120px;
  &__item { width: 100%; padding: 8px 10px; border-radius: 8px; border: none; background: transparent; text-align: left; font-size: 13px; cursor: pointer; &:hover { background: rgba(0,0,0,0.05); } }
}
</style>
