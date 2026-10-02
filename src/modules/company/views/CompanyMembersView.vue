<script setup>
import { useRole } from '@/composables/useRole'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCompanyList, getMembers } from '@/modules/company/services/companyService'
import { useFetch } from '@/composables/useFetch'
import DataTable from '@/components/common/DataTable.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import FilterDropdown from '@/components/common/FilterDropdown.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import MemberActionModals from '@/modules/company/components/MemberActionModals.vue'
import CompanyHeader from '@/modules/company/components/CompanyHeader.vue'
import { IconDotsVertical, IconPencil, IconUserMinus, IconUsers } from '@tabler/icons-vue'

const { can } = useRole()

const route = useRoute()
const router = useRouter()

// The mock only has one member set (Ampera's), so other companies get a slice
// of it sized to their `users` count, re-labelled with their own name.
const { data: companies } = useFetch(() => getCompanyList())
const { data: allMembers, loading } = useFetch(() => getMembers())

const companyName = ref(null) // set after a rename from the header menu
const company = computed(() => {
  const c = (companies.value ?? []).find((x) => x.id === route.params.id) ?? null
  return c && companyName.value ? { ...c, name: companyName.value } : c
})
const baseMembers = computed(() => {
  const c = company.value
  if (!c) return []
  return (allMembers.value ?? [])
    .slice(0, c.users)
    .map((m) => ({ ...m, id: `${c.id}-${m.id}`, company: c.name }))
})

// Local edits/removals layered over the fetched list (mock mode keeps nothing
// server-side, so they live for the lifetime of the page).
const nameEdits = ref({})
const removedIds = ref(new Set())
const members = computed(() =>
  baseMembers.value
    .filter((m) => !removedIds.value.has(m.id))
    .map((m) => (m.id in nameEdits.value ? { ...m, name: nameEdits.value[m.id] } : m)),
)

const modals = ref(null)
function onEdited({ id, name }) {
  nameEdits.value = { ...nameEdits.value, [id]: name }
}
function onRemoved(id) {
  removedIds.value = new Set([...removedIds.value, id])
  tableRef.value?.pagination.goTo(tableRef.value.pagination.page.value)
}

const tableRef = ref(null)

// Same columns as the Company overview members table, minus the row actions.
const allColumns = [
  { key: '__index', label: 'No', kind: 'index', width: '52px', dim: true  },
  { key: 'name', label: 'Name', min: 130, max: 280 },
  { key: 'email', label: 'Email Address', min: 130, max: 280, dim: true, truncate: true },
  { key: 'company', label: 'Company', min: 130, max: 260, dim: true, truncate: true },
  { key: 'role', label: 'Role', width: '134px', align: 'center' },
  { key: 'action', label: 'Action', kind: 'action', align: 'center'  },
]
// The action column only holds actions this role may not use.
const columns = computed(() => allColumns.filter((c) => c.key !== 'action' || can('manage_company')))

const roleMeta = {
  admin:  { label: 'Admin',  color: 'var(--glacia-red)', bg: 'rgba(255, 37, 41, 0.1)' },
  member: { label: 'Member', color: 'var(--glacia-ink-dim)', bg: 'rgba(15, 23, 42, 0.06)' },
}
function roleOf(role) {
  return roleMeta[role] ?? roleMeta.member
}

function initials(row) {
  if (row.name) {
    const parts = row.name.trim().split(/\s+/)
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
  }
  return row.username.slice(0, 2).toUpperCase()
}

const search = ref('')
const roleFilter = ref(null)
const roleOptions = [
  { value: 'admin',  label: 'Admin' },
  { value: 'member', label: 'Member' },
]

const filteredMembers = computed(() => {
  let list = members.value
  if (roleFilter.value) list = list.filter((m) => m.role === roleFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter((m) =>
      (m.name ?? '').toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q))
  }
  return list
})

watch([roleFilter, search], () => tableRef.value?.pagination.goTo(1))

// Action menu — teleported to <body> and positioned from the clicked button's
// rect, so it can never be clipped by the table's scroll container.
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

function menuMember() {
  return members.value.find((m) => m.id === openMenuId.value)
}
function editMember() {
  const m = menuMember()
  closeMenu()
  if (m) modals.value?.openEdit(m)
}
function removeMember() {
  const m = menuMember()
  closeMenu()
  if (m) modals.value?.openDelete(m)
}

function handleClickOutside(e) {
  if (!e.target.closest('.action-menu, .action-btn')) closeMenu()
}
onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div class="company-members">
    <CompanyHeader
      :company="company"
      :user-count="members.length"
      :allow-create-sub-company="false"
      @renamed="(name) => (companyName = name)"
      @deleted="router.push('/companies?tab=list')"
    />

    <div class="members-controls">
      <SearchInput v-model="search" placeholder="Search…" />
      <FilterDropdown v-model="roleFilter" :options="roleOptions" placeholder="Role" />

      <TablePagination
        v-if="tableRef"
        :pagination="tableRef.pagination"
        class="members-pagination-inline"
      />
    </div>

    <DataTable
      ref="tableRef"
      :columns="columns"
      :items="filteredMembers"
      :loading="loading"
      hide-pagination
      empty-text="No members found." :empty-icon="IconUsers"
    >
      <template #cell-name="{ row }">
        <div class="member-cell">
          <span class="member-avatar" :class="{ 'member-avatar--named': !!row.name }">{{ initials(row) }}</span>
          <div class="member-cell__text">
            <div class="member-cell__name" :class="{ 'member-cell__name--unset': !row.name }">
              {{ row.name ?? 'No name set' }}
            </div>
            <div class="member-cell__username">{{ row.username }}</div>
          </div>
        </div>
      </template>
      <template #cell-role="{ row }">
        <span class="role-pill" :style="{ background: roleOf(row.role).bg, color: roleOf(row.role).color }">
          {{ roleOf(row.role).label }}
        </span>
      </template>
      <template #cell-action="{ row }">
        <button type="button" class="action-btn" aria-label="Actions" @click.stop="toggleMenu(row, $event)">
          <IconDotsVertical :size="12" />
        </button>
      </template>
    </DataTable>

    <MemberActionModals ref="modals" @edited="onEdited" @removed="onRemoved" />

    <Teleport to="body">
      <div v-if="openMenuId" class="action-menu" :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }">
        <button type="button" class="action-menu__item" @click="editMember">
          <IconPencil :size="15" />
          Edit
        </button>
        <button type="button" class="action-menu__item action-menu__item--danger" @click="removeMember">
          <IconUserMinus :size="15" />
          Remove
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss" src="./CompanyMembersView.scss"></style>
