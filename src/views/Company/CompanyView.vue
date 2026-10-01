<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get } from '@/utils/request'
import { useFetch } from '@/composables/useFetch'
import DataTable from '@/components/table/DataTable.vue'
import TablePagination from '@/components/table/TablePagination.vue'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import CompanyListTab from './tabs/CompanyListTab.vue'
import AuditLogTab from './tabs/AuditLogTab.vue'
import ProbeBoxTab from './tabs/ProbeBoxTab.vue'
import CompanyHeader from '@/components/company/CompanyHeader.vue'
import {
  IconDotsVertical, IconPencil, IconUserMinus, IconX, IconCheck, IconAt, IconMail, IconShield, IconUsers,
} from '@tabler/icons-vue'
import SearchInput from '@/components/reusable/SearchInput.vue'
import GlassField from '@/components/reusable/GlassField.vue'

const { data: company } = useFetch(() => get('/company/info'))
const { data: members, loading } = useFetch(() => get('/company/members'))

const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'overview', label: 'Overview' },
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

const columns = [
  { key: '__index', label: '#', width: '24px', dim: true },
  { key: 'name', label: 'Name', width: '25%' },
  { key: 'email', label: 'Email Address', width: '23%', dim: true, truncate: true},
  { key: 'company', label: 'Company', width: '27%', dim: true, truncate: true},
  { key: 'role', label: 'Role', width: '12%', align: 'center' },
  { key: 'action', label: 'Action', width: '32px', align: 'center' },
]

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

<style scoped lang="scss">
.company {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

// Pagination sits on the controls row, right-aligned with search + role.
.company-pagination-inline {
  margin-top: 0;
  margin-left: auto;
}

// Tabs + controls + table live inside the same "card" surface used by the
// dashboard's own widgets (AccountOverview, TopVulnerabilities, etc.).
.company-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.company-tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.tab-forward-enter-active,
.tab-forward-leave-active,
.tab-backward-enter-active,
.tab-backward-leave-active {
  transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.34, 0.8, 0.6, 1);
}

.tab-forward-enter-from  { opacity: 0; transform: translateX(18px); }
.tab-forward-leave-to    { opacity: 0; transform: translateX(-18px); }
.tab-backward-enter-from { opacity: 0; transform: translateX(-18px); }
.tab-backward-leave-to   { opacity: 0; transform: translateX(18px); }

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 18px;
  border-radius: var(--glacia-radius-pill);
  border: 1px solid var(--glacia-glass-border);
  background: var(--surface);
  color: var(--glacia-ink);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.13s, border-color 0.13s;

  &:hover {
    background: rgba(0, 0, 0, 0.03);
    border-color: var(--glacia-ink-dim);
  }
}

.company-tabs {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px;
  border-radius: var(--glacia-radius-pill);
  background: var(--glacia-glass-fill-strong);
  border: 1px solid var(--glacia-glass-border);
  width: max-content;
  max-width: 100%;
  align-self: flex-start;

  &__pill {
    position: absolute; z-index: 0; background: var(--surface); border-radius: var(--glacia-radius-pill);
    box-shadow: 0 2px 6px rgba(16, 24, 32, 0.1);
    &--ready { transition: left 0.42s cubic-bezier(0.3,1.12,0.5,1), top 0.42s cubic-bezier(0.3,1.12,0.5,1), width 0.42s cubic-bezier(0.3,1.12,0.5,1), height 0.42s cubic-bezier(0.3,1.12,0.5,1); }
  }

  &__item {
    position: relative;
    z-index: 1;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 9px 16px;
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
    transition: color 0.15s;

    &:not(.company-tabs__item--active):hover {
      color: var(--glacia-ink);
    }

    &--active {
      color: var(--glacia-ink);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .company-tabs__pill--ready { transition: none; }
}

.company-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

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

  &--unset {
    font-style: italic;
    font-weight: 600;
    color: var(--glacia-ink-dim);
  }
}

.member-cell__username {
  font-size: 12px;
  line-height: 1.3;
  color: var(--glacia-ink-dim);
}

.role-pill {
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

// Teleported to <body>, so this is positioned via fixed top/left (see
// menuPos in script) rather than relative to its DOM parent.
.action-menu {
  position: fixed;
  width: 176px;
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

// ── Edit Company Name modal ──────────────────────────────────────────────────
// Same structure/behaviour as ApiKeysView.vue's Edit API Key modal.

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.create-modal {
  width: 100%;
  max-width: 480px;
  background: var(--surface);
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  padding: 28px;
  animation: create-modal-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition: height 0.38s cubic-bezier(0.4, 0, 0.2, 1);

  &--wide {
    max-width: 720px;
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 26px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__close {
    width: 32px;
    height: 32px;
    border-radius: var(--glacia-radius-sm);
    border: none;
    background: none;
    color: var(--glacia-ink-dim);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.13s, color 0.13s;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--glacia-ink);
    }
  }

  &__input {
    width: 100%;
    height: 54px;
    padding: 0 18px;
    border-radius: 14px;
    border: 1px solid var(--glacia-glass-border);
    background: var(--surface);
    color: var(--glacia-ink);
    font-size: 15px;
    font-family: 'Manrope', 'Inter', sans-serif;
    outline: none;
    box-sizing: border-box;
    box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);
    transition: border-color 0.13s, box-shadow 0.13s;

    &::placeholder {
      color: var(--glacia-ink-dim);
    }

    &:focus {
      border-color: #2563EB;
      box-shadow: 0 2px 6px rgba(16, 24, 32, 0.12);
    }

    &--readonly {
      background: var(--surface-2);
      color: var(--glacia-ink-dim);
      cursor: default;

      &:focus {
        border-color: var(--glacia-glass-border);
        box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);
      }
    }

    &--error {
      border-color: var(--glacia-sev-critical);
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.12);

      &:focus {
        border-color: var(--glacia-sev-critical);
        box-shadow: 0 2px 6px rgba(220, 38, 38, 0.18);
      }
    }
  }

  &__actions {
    display: flex;
    gap: 14px;
    margin-top: 20px;
  }
}

@keyframes create-modal-bounce {
  0%   { opacity: 0; transform: scale(0.92) translateY(10px); }
  60%  { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
}

.modal-btn {
  flex: 1;
  height: 52px;
  border-radius: 14px;
  border: none;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Manrope', 'Inter', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.13s, opacity 0.13s;

  &--cancel {
    background: rgba(220, 38, 38, 0.06);
    color: var(--glacia-sev-critical);

    &:hover {
      background: rgba(220, 38, 38, 0.12);
    }
  }

  &--save {
    background: #ff2e3a;
    color: #fff;
    box-shadow: 0 8px 20px -6px rgba(255, 46, 58, 0.4);

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }

    // Excludes --saved so a lingering :hover (the mouse doesn't move after
    // a click) can't out-specificity the green "saved" background below.
    &:not(:disabled):not(.modal-btn--saved):hover {
      background: #e6212c;
    }
  }

  &--saved {
    background: #16a34a;
    box-shadow: 0 8px 20px -6px rgba(22, 163, 74, 0.4);
  }

  &__spinner {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 2px solid rgba(var(--glass-rgb), 0.4);
    border-top-color: #fff;
    animation: modal-btn-spin 0.7s linear infinite;
  }

  &__check {
    animation: modal-btn-pop 0.4s ease;
  }
}

@keyframes modal-btn-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes modal-btn-pop {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}

.modal-btn__spinner--dark {
  border-color: rgba(var(--glass-rgb), 0.4);
  border-top-color: #fff;
}

.field-error {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--glacia-sev-critical);
}

.revoke-ack {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 8px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1.5px solid var(--glacia-red);
  background: var(--surface);
  cursor: pointer;
  user-select: none;
}

.revoke-ack__box {
  appearance: none;
  width: 20px;
  height: 20px;
  margin: 0;
  border-radius: 6px;
  border: 2px solid var(--glacia-red);
  background: var(--surface);
  flex-shrink: 0;
  cursor: pointer;
  position: relative;

  &:checked::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 3px;
    background: var(--glacia-red);
  }
}

.revoke-ack span {
  font-size: 14px;
  line-height: 1.5;
  color: var(--glacia-ink);
}

.account-card {
  margin-top: 16px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid var(--glacia-glass-border);
  background: var(--surface);
  box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);

  &__header {
    height: 56px;
    background: linear-gradient(135deg, #e53925, #d63a2e);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 18px;
    color: #fff;
  }

  &__id {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
  }

  &__shield {
    color: #fff;
    opacity: 0.95;
  }

  &__avatar-wrap {
    display: flex;
    justify-content: center;
    margin-top: -28px;
  }

  &__avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--surface-3);
    border: 3px solid #fff;
    box-shadow: 0 4px 12px rgba(16, 24, 32, 0.12);
    color: var(--glacia-ink-dim);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 800;

    &--named {
      background: #ffe9ea;
      color: var(--glacia-red);
    }
  }

  &__body {
    padding: 12px 18px 16px;
    text-align: center;
  }

  &__name {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 18px;
    font-weight: 800;
    color: var(--glacia-ink);
  }

  &__company {
    margin-top: 2px;
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  .role-pill {
    margin-top: 10px;
  }

  &__divider {
    height: 1px;
    background: repeating-linear-gradient(90deg, var(--glacia-glass-border) 0 6px, transparent 6px 10px);
    margin: 14px 0;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    text-align: left;
  }

  &__row-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  &__row-value {
    font-size: 13px;
    font-weight: 700;
    color: var(--glacia-ink);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__2fa {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
    padding: 10px 14px;
    border-radius: 12px;
    background: var(--green-soft);
  }

  &__2fa-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--glacia-ink);
  }

  &__2fa-value {
    font-size: 13px;
    font-weight: 700;
    color: #2e7d32;
  }
}

.create-modal__body {
  overflow-x: hidden;
  // Setting only overflow-x makes the browser auto-compute overflow-y as
  // "auto" (not "visible") per spec — which would clip a GlassField
  // dropdown menu wherever it overflows past this box. Keep it explicit.
  overflow-y: visible;
  padding: 2px 2px 0;
  margin: 0 -2px;
}

</style>
