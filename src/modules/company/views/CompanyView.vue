<script setup>
import { useRole } from '@/composables/useRole'
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCompanyInfo, getMembers } from '@/modules/company/services/companyService'
import { useFetch } from '@/composables/useFetch'
import DataTable from '@/components/common/DataTable.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import FilterDropdown from '@/components/common/FilterDropdown.vue'
import CompanyListTab from '@/modules/company/views/tabs/CompanyListTab.vue'
import AuditLogTab from '@/modules/company/views/tabs/AuditLogTab.vue'
import ProbeBoxTab from '@/modules/company/views/tabs/ProbeBoxTab.vue'
import CompanyHeader from '@/modules/company/components/CompanyHeader.vue'
import {
  IconDotsVertical, IconPencil, IconUserMinus, IconX, IconCheck, IconAt, IconMail, IconShield, IconUsers,
} from '@tabler/icons-vue'
import SearchInput from '@/components/common/SearchInput.vue'
import GlassField from '@/components/common/GlassField.vue'

const { can } = useRole()

const { data: company } = useFetch(() => getCompanyInfo())
const { data: members, loading } = useFetch(() => getMembers())

const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'overview', label: 'Overview'  },
  { key: 'list',      label: 'Sub company' },
  { key: 'audit',      label: 'Audit log' },
  { key: 'probe',      label: 'Integration' },
]
// Mirrored into the `tab` query param (see router meta.tabQuery) so the
// navbar breadcrumb can show the active tab as the current page.
const activeTab = ref(tabs.some((t) => t.key === route.query.tab) ? route.query.tab : 'overview')
const tabTransition = ref('tab-forward')

function selectTab(key) {
  if (key === activeTab.value) return
  const oldIndex = tabs.findIndex((t) => t.key === activeTab.value)
  const newIndex = tabs.findIndex((t) => t.key === key)
  tabTransition.value = newIndex >= oldIndex ? 'tab-forward' : 'tab-backward'
  activeTab.value = key
  router.replace({ query: { ...route.query, tab: key } })
}

// ── Sliding tab-bar pill — mirrors the active tab's box, animating between
// positions instead of each tab owning its own static "active" background.
const tabButtonEls = {}
const tabPillStyle = ref({ left: '0px', top: '0px', width: '0px', height: '0px' })
const tabPillReady = ref(false)
function setTabButtonRef(key, el) {
  if (el) tabButtonEls[key] = el
}
function moveTabPill() {
  const el = tabButtonEls[activeTab.value]
  if (!el) return
  tabPillStyle.value = { left: `${el.offsetLeft}px`, top: `${el.offsetTop}px`, width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px` }
}
function onTabResize() { moveTabPill() }
onMounted(() => {
  nextTick(() => {
    moveTabPill()
    requestAnimationFrame(() => { tabPillReady.value = true })
  })
  window.addEventListener('resize', onTabResize)
})
onUnmounted(() => window.removeEventListener('resize', onTabResize))
watch(activeTab, () => nextTick(moveTabPill))

// Keeps the tab synced with the URL both ways: browser back/forward, and a
// route change that reuses this same component instance (e.g. clicking the
// "Company" breadcrumb crumb, which only drops the query — Vue Router won't
// remount the component for that, so this can't be a one-time setup check).
// `immediate: true` also covers the initial load, always writing the tab
// back into the URL (even the default) so the breadcrumb can show it as
// soon as the page loads.
watch(() => route.query.tab, (val) => {
  const next = tabs.some((t) => t.key === val) ? val : 'overview'
  if (next !== activeTab.value) activeTab.value = next
  if (route.query.tab !== next) router.replace({ query: { ...route.query, tab: next } })
}, { immediate: true })

const tableRef = ref(null)

const allColumns = [
  { key: '__index', label: 'No', kind: 'index', width: '52px', dim: true  },
  { key: 'name', label: 'Name'  },
  { key: 'email', label: 'Email Address', dim: true, truncate: true },
  { key: 'company', label: 'Company', dim: true, truncate: true },
  { key: 'role', label: 'Role', width: '134px', align: 'center'   },
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

// ── Search + role filter ─────────────────────────────────────────────────────
const search = ref('')
const roleOptions = [
  { value: 'admin',  label: 'Admin' },
  { value: 'member', label: 'Member' },
]
const roleFilter = ref(null)

const filteredMembers = computed(() => {
  let list = members.value ?? []
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

// Action menu — teleported to <body> and positioned from the clicked
// button's rect, so it can never be clipped by the table's scroll container.
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

function closeMenu() {
  openMenuId.value = null
}

// ── Edit member modal — mirrors Edit company name (idle/loading/saved, pre-filled, auto-close)
const showEditMemberModal = ref(false)
const editingMember = ref(null)
const editMemberName = ref('')
const editMemberState = ref('idle') // 'idle' | 'loading' | 'saved'
const canSaveMember = computed(() => editMemberName.value.trim().length > 0)

function editMember(item) {
  closeMenu()
  editingMember.value = item
  editMemberName.value = item.name ?? ''
  editMemberState.value = 'idle'
  showEditMemberModal.value = true
}

function closeEditMemberModal() {
  showEditMemberModal.value = false
  editingMember.value = null
  editMemberName.value = ''
  editMemberState.value = 'idle'
}

function saveEditMember() {
  if (!canSaveMember.value || editMemberState.value !== 'idle' || !editingMember.value) return
  editMemberState.value = 'loading'
  setTimeout(() => {
    const name = editMemberName.value.trim()
    members.value = (members.value ?? []).map((m) => (m.id === editingMember.value.id ? { ...m, name: name || null } : m))
    editMemberState.value = 'saved'
    setTimeout(closeEditMemberModal, 700)
  }, 500)
}

const showDeleteUserModal = ref(false)
const deletingMember = ref(null)
const deleteUserConfirmed = ref(false)
const deleteUserState = ref('idle') // 'idle' | 'loading' | 'saved'
function openDeleteUser(item) {
  deletingMember.value = item
  deleteUserConfirmed.value = false
  deleteUserState.value = 'idle'
  showDeleteUserModal.value = true
}
function closeDeleteUserModal() {
  showDeleteUserModal.value = false
  deletingMember.value = null
}
function submitDeleteUser() {
  if (!deleteUserConfirmed.value || deleteUserState.value !== 'idle' || !deletingMember.value) return
  deleteUserState.value = 'loading'
  setTimeout(() => {
    members.value = (members.value ?? []).filter((m) => m.id !== deletingMember.value.id)
    tableRef.value?.pagination.goTo(tableRef.value.pagination.page.value)
    deleteUserState.value = 'saved'
    setTimeout(closeDeleteUserModal, 700)
  }, 500)
}

function removeMember(item) {
  closeMenu()
  openDeleteUser(item)
}

function handleClickOutside(e) {
  if (!e.target.closest('.action-menu, .action-btn')) closeMenu()
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

</script>

<template>
  <div class="company">
    <CompanyHeader
      :company="company"
      :user-count="members?.length ?? 0"
      @renamed="(name) => { if (company) company = { ...company, name } }"
    />

<Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showEditMemberModal" class="modal-backdrop" @mousedown.self="closeEditMemberModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Edit Member</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeEditMemberModal">
                <IconX :size="20" />
              </button>
            </div>

            <GlassField
              v-model="editMemberName"
              label="Name"
              placeholder="Member name"
              required
              error-text="Member name is required"
              @enter="canSaveMember && saveEditMember()"
            />

            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeEditMemberModal">Cancel</button>
              <button
                type="button"
                class="modal-btn modal-btn--save"
                :class="{ 'modal-btn--saved': editMemberState === 'saved' }"
                :disabled="!canSaveMember"
                @click="saveEditMember"
              >
                <span v-if="editMemberState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="editMemberState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Save</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

<Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteUserModal" class="modal-backdrop" @mousedown.self="closeDeleteUserModal">
          <div class="create-modal create-modal--wide">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Delete User</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeDeleteUserModal">
                <IconX :size="20" />
              </button>
            </div>
            <div class="account-card">
              <div class="account-card__header">
                <span class="account-card__id">ACCOUNT ID</span>
                <IconShield :size="18" class="account-card__shield" />
              </div>
              <div class="account-card__avatar-wrap">
                <span class="account-card__avatar" :class="{ 'account-card__avatar--named': !!deletingMember?.name }">{{ deletingMember ? initials(deletingMember) : '—' }}</span>
              </div>
              <div class="account-card__body">
                <div class="account-card__name">{{ deletingMember?.name ?? deletingMember?.username ?? '—' }}</div>
                <div class="account-card__company">{{ deletingMember?.company ?? company?.name ?? '—' }}</div>
                <span class="role-pill" :style="{ background: roleOf(deletingMember?.role ?? 'member').bg, color: roleOf(deletingMember?.role ?? 'member').color }">
                  {{ roleOf(deletingMember?.role ?? 'member').label }}
                </span>

                <div class="account-card__divider" />

                <div class="account-card__row">
                  <span class="account-card__row-label"><IconAt :size="14" /> Username</span>
                  <span class="account-card__row-value">{{ deletingMember?.username ?? '—' }}</span>
                </div>
                <div class="account-card__row">
                  <span class="account-card__row-label"><IconMail :size="14" /> Email</span>
                  <span class="account-card__row-value">{{ deletingMember?.email ?? '—' }}</span>
                </div>

                <div class="account-card__2fa">
                  <span class="account-card__2fa-label"><IconShield :size="14" /> Two-factor authentication</span>
                  <span class="account-card__2fa-value">Active</span>
                </div>
              </div>
            </div>

            <label class="revoke-ack" style="margin-top: 18px;">
              <input v-model="deleteUserConfirmed" type="checkbox" class="revoke-ack__box" />
              <span>I understand that this action will permanently remove the user and cannot be undone.</span>
            </label>

            <div class="create-modal__actions">
              <button
                type="button"
                class="modal-btn"
                :class="deleteUserConfirmed
                  ? { 'modal-btn--save': true, 'modal-btn--saved': deleteUserState === 'saved' }
                  : 'modal-btn--create'"
                :disabled="!deleteUserConfirmed"
                @click="submitDeleteUser"
              >
                <span v-if="deleteUserState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="deleteUserState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Delete</span>
              </button>
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeDeleteUserModal">Cancel</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div class="company-panel card">
      <div class="company-tabs">
        <div class="company-tabs__pill" :class="{ 'company-tabs__pill--ready': tabPillReady }" :style="tabPillStyle"></div>
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :ref="(el) => setTabButtonRef(tab.key, el)"
          type="button"
          class="company-tabs__item"
          role="tab"
          :aria-selected="tab.key === activeTab"
          :class="{ 'company-tabs__item--active': tab.key === activeTab }"
          @click="selectTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <Transition :name="tabTransition" mode="out-in">
        <div :key="activeTab" class="company-tab-content">
          <template v-if="activeTab === 'overview'">
            <div class="company-controls">
              <SearchInput v-model="search" placeholder="Search…" />

              <FilterDropdown v-model="roleFilter" :options="roleOptions" placeholder="Role" />

              <TablePagination
                v-if="tableRef"
                :pagination="tableRef.pagination"
                class="company-pagination-inline"
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
                  <IconDotsVertical :size="16" />
                </button>
              </template>
            </DataTable>
          </template>

          <CompanyListTab v-else-if="activeTab === 'list'" />
          <AuditLogTab v-else-if="activeTab === 'audit'" />
          <ProbeBoxTab v-else-if="activeTab === 'probe'" />
        </div>
      </Transition>
    </div>

    <Teleport to="body">
      <div v-if="openMenuId" class="action-menu" :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }">
        <button type="button" class="action-menu__item" @click="editMember((members ?? []).find((i) => i.id === openMenuId))">
          <IconPencil :size="15" />
          Edit
        </button>
        <button
          type="button"
          class="action-menu__item action-menu__item--danger"
          @click="removeMember((members ?? []).find((i) => i.id === openMenuId))"
        >
          <IconUserMinus :size="15" />
          Remove
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss" src="./CompanyView.scss"></style>
