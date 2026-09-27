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
import {
  IconBuildingSkyscraper, IconChartBar, IconUsers, IconFileText,
  IconChevronDown, IconChevronRight, IconPower, IconSearch, IconDotsVertical,
  IconPencil, IconUserMinus, IconUserPlus, IconSitemap, IconTrash,
  IconX, IconCheck, IconAt, IconMail, IconShield, IconBuilding,
} from '@tabler/icons-vue'
import DatePicker from '@/components/reusable/DatePicker.vue'
import SearchInput from '@/components/reusable/SearchInput.vue'
import { formatDate } from '@/utils/helpers'

const { data: company } = useFetch(() => get('/company/info'))
const { data: members, loading } = useFetch(() => get('/company/members'))

const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'list',      label: 'Company list' },
  { key: 'audit',      label: 'Audit log' },
  { key: 'probe',      label: 'Probe box' },
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

function startActivationDate() {
  closeLiquidMenu(true)
  openStartActivationModal()
}

function openQuotaInfo() {
  closeLiquidMenu(true)
  showQuotaModal.value = true
}
const showQuotaModal = ref(false)
function closeQuotaModal() { showQuotaModal.value = false }
const quotaRows = computed(() => {
  // Mirrors the mock design: each type shows the same base quota, with only
  // Domain having an additional quota.
  const base = company.value?.quota ?? 4
  return [
    { key: 'domain',  label: 'Domain Inspection', count: base, used: 0, remaining: base, additional: 1, validity: '2026-01-31' },
    { key: 'network', label: 'Network',           count: base, used: 0, remaining: base, additional: null, validity: null },
    { key: 'webapp',  label: 'Web Application',   count: base, used: 0, remaining: base, additional: null, validity: null },
    { key: 'source',  label: 'Source Code',       count: base, used: 0, remaining: base, additional: null, validity: null },
  ]
})

// ── Start Activation Date modal ──────────────────────────────────────────
const showStartActivationModal = ref(false)
const startActivationEnabled = ref(false)
const startActivationDateVal = ref('')
const startExpirationDateVal = ref('')
const startActivationState = ref('idle') // 'idle' | 'loading' | 'saved'
const startActivationField = ref(null) // which date picker is open

// Reuse the quota display from the company info; single value shown in all
// four inputs as read-only to match the mock (per-scan-type quotas later).
const currentQuotas = computed(() => {
  const q = company.value?.quota
  const label = q != null ? String(q) : '—'
  return { domain: label, network: label, webapp: label, source: label }
})

const canSaveStartActivation = computed(() => {
  if (!startActivationEnabled.value) return false
  if (!startActivationDateVal.value || !startExpirationDateVal.value) return false
  return startExpirationDateVal.value >= startActivationDateVal.value
})

function openStartActivationModal() {
  startActivationEnabled.value = false
  startActivationDateVal.value = ''
  startExpirationDateVal.value = ''
  startActivationField.value = null
  startActivationState.value = 'idle'
  if (companyModalEl.value) companyModalEl.value.style.height = ''
  showStartActivationModal.value = true
}
function closeStartActivationModal() {
  showStartActivationModal.value = false
  startActivationField.value = null
  if (companyModalEl.value) {
    if (companyModalEl.value._releaseTimer) clearTimeout(companyModalEl.value._releaseTimer)
    companyModalEl.value.style.height = ''
  }
}
const companyModalEl = ref(null)
function animateCompanyModalHeight(mutate) {
  const modal = companyModalEl.value
  if (!modal) { mutate(); return }
  if (modal._releaseTimer) clearTimeout(modal._releaseTimer)
  modal.style.height = `${modal.offsetHeight}px`
  mutate()
  nextTick(() => {
    requestAnimationFrame(() => {
      const target = Math.min(modal.scrollHeight, Math.floor(window.innerHeight * 0.88))
      if (Math.abs(target - modal.offsetHeight) < 2) { modal.style.height = ''; return }
      modal.style.height = `${target}px`
      modal._releaseTimer = setTimeout(() => { modal.style.height = '' }, 500)
    })
  })
}
function releaseCompanyModalHeight(e) {
  if (e.propertyName !== 'height') return
  if (companyModalEl.value) companyModalEl.value.style.height = ''
}
function toggleStartActivationField(key) {
  animateCompanyModalHeight(() => {
    startActivationField.value = startActivationField.value === key ? null : key
  })
}
function selectStartDate(field, iso) {
  animateCompanyModalHeight(() => {
    if (field === 'activation') {
      startActivationDateVal.value = iso
      if (startExpirationDateVal.value && startExpirationDateVal.value < iso) startExpirationDateVal.value = ''
    } else {
      startExpirationDateVal.value = iso
    }
    startActivationField.value = null
  })
}
function toggleStartActivation() {
  animateCompanyModalHeight(() => {
    startActivationEnabled.value = !startActivationEnabled.value
  })
}
function submitStartActivation() {
  if (!canSaveStartActivation.value || startActivationState.value !== 'idle') return
  startActivationState.value = 'loading'
  setTimeout(() => {
    console.info('Start activation', {
      company: company.value?.name,
      activation: startActivationEnabled.value
        ? { activationDate: startActivationDateVal.value, expirationDate: startExpirationDateVal.value }
        : null,
    })
    startActivationState.value = 'saved'
    setTimeout(closeStartActivationModal, 700)
  }, 500)
}

// Liquid action menu — goo filter fuses the circular trigger button and the
// panel into one shape (see references/liquid-menu.html). Unlike the
// teleported row menus, button and panel must share one container.
const liquidOpen = ref(false)
const liquidClosing = ref(false)
const configSubOpen = ref(false)
let liquidTimer = null

function openLiquidMenu() {
  clearTimeout(liquidTimer)
  liquidClosing.value = false
  liquidOpen.value = true
}

function closeLiquidMenu(instant = false) {
  if (!liquidOpen.value && !liquidClosing.value) {
    configSubOpen.value = false
    return
  }
  if (instant) {
    clearTimeout(liquidTimer)
    liquidOpen.value = false
    liquidClosing.value = false
    configSubOpen.value = false
    return
  }
  liquidOpen.value = false
  liquidClosing.value = true
  configSubOpen.value = false
  clearTimeout(liquidTimer)
  liquidTimer = setTimeout(() => { liquidClosing.value = false }, 440)
}

function toggleLiquidMenu() {
  if (liquidOpen.value) closeLiquidMenu()
  else openLiquidMenu()
}

// ── Edit company name modal — same idle/loading/saved flow as the API Keys
// Edit modal (pre-filled input, spinner while saving, checkmark, auto-close).
const showEditNameModal = ref(false)
const editNameValue = ref('')
const editNameState = ref('idle') // 'idle' | 'loading' | 'saved'
const canSaveName = computed(() => editNameValue.value.trim().length > 0)

function editCompanyName() {
  closeLiquidMenu(true)
  editNameValue.value = company.value?.name ?? ''
  editNameState.value = 'idle'
  showEditNameModal.value = true
}

function closeEditNameModal() {
  showEditNameModal.value = false
  editNameValue.value = ''
  editNameState.value = 'idle'
}

function saveCompanyName() {
  if (!canSaveName.value || editNameState.value !== 'idle') return
  editNameState.value = 'loading'
  setTimeout(() => {
    const name = editNameValue.value.trim()
    if (company.value) company.value = { ...company.value, name }
    editNameState.value = 'saved'
    setTimeout(closeEditNameModal, 700)
  }, 500)
}

function addScanQuota() {
  closeLiquidMenu(true)
  console.info('Add scan quota')
}

// ── Invite User modal ────────────────────────────────────────────────────
const showInviteModal = ref(false)
const inviteUsername = ref('')
const inviteEmail = ref('')
const inviteRole = ref(null)
const inviteLocation = ref(null)
const inviteLocationQuery = ref('')
const inviteField = ref(null)
const inviteState = ref('idle') // 'idle' | 'loading' | 'saved'

const inviteRoleOptions = [
  { value: 'admin',  label: 'Admin' },
  { value: 'member', label: 'Member' },
]
const inviteLocationSource = [
  { value: 'co-1', label: 'Protergo Cyber Security Ampera', type: 'Head Company' },
  { value: 'co-2', label: 'Protergo Cyber Security Jakarta',  type: 'Sub Company' },
  { value: 'co-8', label: 'Protergo Cyber Security Rempoa',   type: 'Sub Company' },
  { value: 'co-3', label: 'Protergo Cyber Security Surabaya', type: 'Sub Company' },
  { value: 'co-7', label: 'Protergo Cyber Security Bandung',  type: 'Sub Company' },
  { value: 'co-4', label: 'Protergo Fintech Solutions',       type: 'Sub Company' },
]
const filteredInviteLocations = computed(() => {
  const q = inviteLocationQuery.value.trim().toLowerCase()
  if (!q) return inviteLocationSource
  return inviteLocationSource.filter((o) => o.label.toLowerCase().includes(q) || o.type.toLowerCase().includes(q))
})

const inviteEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.value.trim()))
const inviteUsernameError = computed(() => {
  const v = inviteUsername.value.trim()
  if (!v) return ''
  if (!/^[a-zA-Z0-9._-]+$/.test(v)) return 'Username cannot contain special characters'
  return ''
})
const inviteEmailError = computed(() => {
  const v = inviteEmail.value.trim()
  if (!v) return ''
  if (!inviteEmailValid.value) return 'Please enter a valid email address'
  return ''
})
const canInvite = computed(() =>
  !!inviteUsername.value.trim() && !inviteUsernameError.value && inviteEmailValid.value && !!inviteRole.value && !!inviteLocation.value,
)
function openInviteUser() {
  inviteUsername.value = ''
  inviteEmail.value = ''
  inviteRole.value = null
  inviteLocation.value = null
  inviteLocationQuery.value = ''
  inviteField.value = null
  inviteState.value = 'idle'
  showInviteModal.value = true
}
function closeInviteModal() {
  showInviteModal.value = false
  inviteField.value = null
  inviteLocationQuery.value = ''
}
function toggleInviteField(key) {
  if (key === 'location' && inviteField.value !== 'location') inviteLocationQuery.value = ''
  inviteField.value = inviteField.value === key ? null : key
}
function selectInviteOption(key, value) {
  if (key === 'role') inviteRole.value = value
  else if (key === 'location') inviteLocation.value = value
  if (key === 'location') inviteLocationQuery.value = ''
  inviteField.value = null
}
function submitInviteUser() {
  if (!canInvite.value || inviteState.value !== 'idle') return
  inviteState.value = 'loading'
  setTimeout(() => {
    console.info('Invite user', {
      username: inviteUsername.value.trim(),
      email: inviteEmail.value.trim(),
      role: inviteRole.value,
      companyLocation: inviteLocation.value,
    })
    inviteState.value = 'saved'
    setTimeout(closeInviteModal, 700)
  }, 500)
}

function inviteUser() {
  closeLiquidMenu(true)
  openInviteUser()
}

function createSubCompany() {
  closeLiquidMenu(true)
  console.info('Create sub company')
}

const showDeleteModal = ref(false)
const deleteConfirmed = ref(false)
const deleteState = ref('idle') // 'idle' | 'loading' | 'saved'
function openDeleteCompany() {
  deleteConfirmed.value = false
  deleteState.value = 'idle'
  showDeleteModal.value = true
}
function closeDeleteModal() {
  showDeleteModal.value = false
}
function submitDeleteCompany() {
  if (!deleteConfirmed.value || deleteState.value !== 'idle') return
  deleteState.value = 'loading'
  setTimeout(() => {
    console.info('Delete company', company.value?.name)
    deleteState.value = 'saved'
    setTimeout(closeDeleteModal, 700)
  }, 500)
}

function deleteCompany() {
  closeLiquidMenu(true)
  openDeleteCompany()
}

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
  if (!e.target.closest('.lm')) closeLiquidMenu(true)
  if (!e.target.closest('.form-select')) {
    if (startActivationField.value) {
      animateCompanyModalHeight(() => { startActivationField.value = null })
    }
    if (inviteField.value) inviteField.value = null
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

function handleLiquidKeydown(e) {
  if (e.key === 'Escape') closeLiquidMenu(true)
}

onMounted(() => document.addEventListener('keydown', handleLiquidKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleLiquidKeydown))
</script>

<template>
  <div class="company">
    <div class="company-header">
      <div class="company-header__left">
        <div class="company-header__titlewrap">
          <div class="company-header__titlerow">
            <h1 class="company-header__title">{{ company?.name ?? '—' }}</h1>
            <div
              class="lm"
              :class="{ 'is-open': liquidOpen, 'is-closing': liquidClosing }"
            >
              <div class="lm-goo" aria-hidden="true">
                <span class="lm-dot" />
                <div class="lm-shape" />
              </div>
              <button
                type="button"
                class="lm-btn"
                aria-label="Company actions"
                aria-haspopup="menu"
                :aria-expanded="liquidOpen"
                @click="toggleLiquidMenu"
              >
                <IconDotsVertical :size="18" />
              </button>
              <div class="lm-list" role="menu">
                <button type="button" class="lm-item" role="menuitem" @click="startActivationDate">
                  <IconPower :size="18" />
                  <span>Start activation date</span>
                </button>
                <button type="button" class="lm-item" role="menuitem" @click="openQuotaInfo">
                  <IconFileText :size="18" />
                  <span>Quota information</span>
                </button>
                <div class="lm-row">
                  <button type="button" class="lm-item" role="menuitem" @click.stop="configSubOpen = !configSubOpen">
                    <IconSitemap :size="18" />
                    <span>Company configuration</span>
                    <IconChevronRight :size="16" class="lm-chev" />
                  </button>
                  <div v-if="configSubOpen" class="lm-submenu">
                    <button type="button" class="lm-item" role="menuitem" @click="editCompanyName">
                      <IconPencil :size="18" />
                      <span>Edit company name</span>
                    </button>
                    <button type="button" class="lm-item" role="menuitem" @click="addScanQuota">
                      <IconChartBar :size="18" />
                      <span>Add scan quota</span>
                    </button>
                    <button type="button" class="lm-item" role="menuitem" @click="inviteUser">
                      <IconUserPlus :size="18" />
                      <span>Invite user</span>
                    </button>
                    <button type="button" class="lm-item" role="menuitem" @click="createSubCompany">
                      <IconSitemap :size="18" />
                      <span>Create sub company</span>
                    </button>
                    <button type="button" class="lm-item lm-item--danger" role="menuitem" @click="deleteCompany">
                      <IconTrash :size="18" />
                      <span>Delete company</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="company-header__meta">
            <span><IconBuildingSkyscraper :size="14" /> {{ company?.type }}</span>
            <span><IconChartBar :size="14" /> {{ company?.quota }} quota</span>
            <span><IconUsers :size="14" /> {{ members?.length ?? 0 }} users</span>
            <span><IconFileText :size="14" /> {{ company?.contractType }}</span>
          </div>
        </div>
      </div>
    </div>

    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <defs>
        <filter id="lm-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
        </filter>
      </defs>
    </svg>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showEditNameModal" class="modal-backdrop" @mousedown.self="closeEditNameModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Edit Company Name</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeEditNameModal">
                <IconX :size="20" />
              </button>
            </div>

            <label class="edit-modal__label" for="edit-company-name">Name</label>
            <input
              id="edit-company-name"
              v-model="editNameValue"
              type="text"
              class="create-modal__input"
              placeholder="Company name"
              @keyup.enter="saveCompanyName"
            />

            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeEditNameModal">Cancel</button>
              <button
                type="button"
                class="modal-btn modal-btn--save"
                :class="{ 'modal-btn--saved': editNameState === 'saved' }"
                :disabled="!canSaveName"
                @click="saveCompanyName"
              >
                <span v-if="editNameState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="editNameState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Save</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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

            <label class="edit-modal__label" for="edit-member-name">Name</label>
            <input
              id="edit-member-name"
              v-model="editMemberName"
              type="text"
              class="create-modal__input"
              placeholder="Member name"
              @keyup.enter="saveEditMember"
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
        <div v-if="showStartActivationModal" class="modal-backdrop" @mousedown.self="closeStartActivationModal">
          <div ref="companyModalEl" class="create-modal create-modal--wide" @transitionend.self="releaseCompanyModalHeight">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Start Activation Date</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeStartActivationModal">
                <IconX :size="20" />
              </button>
            </div>

            <div class="create-modal__body">
              <div class="activation-info">
                <div class="activation-info__label">Company Name</div>
                <div class="activation-info__value">{{ company?.name ?? '—' }}</div>
              </div>

              <div class="activation-divider" />

              <h3 class="activation-subtitle">Current Quota</h3>

              <div class="quota-grid">
                <div class="quota-grid__field">
                  <label class="create-modal__label">Domain inspection scan quota for one month</label>
                  <input type="text" class="create-modal__input create-modal__input--readonly" :value="currentQuotas.domain" readonly tabindex="-1" />
                </div>
                <div class="quota-grid__field">
                  <label class="create-modal__label">Network scan quota for one month</label>
                  <input type="text" class="create-modal__input create-modal__input--readonly" :value="currentQuotas.network" readonly tabindex="-1" />
                </div>
                <div class="quota-grid__field">
                  <label class="create-modal__label">Web application scan quota for one month</label>
                  <input type="text" class="create-modal__input create-modal__input--readonly" :value="currentQuotas.webapp" readonly tabindex="-1" />
                </div>
                <div class="quota-grid__field">
                  <label class="create-modal__label">Source code scan quota for one month</label>
                  <input type="text" class="create-modal__input create-modal__input--readonly" :value="currentQuotas.source" readonly tabindex="-1" />
                </div>
              </div>

              <div class="activation-card activation-card--spaced">
                <div class="activation-card__row">
                  <div class="activation-card__text">
                    <div class="activation-card__title">Set up company account activation</div>
                    <div class="activation-card__desc">This setup can be configured later in the company section.</div>
                  </div>
                  <button
                    type="button"
                    class="toggle-switch"
                    :class="{ 'toggle-switch--on': startActivationEnabled }"
                    role="switch"
                    :aria-checked="startActivationEnabled"
                    @click="toggleStartActivation"
                  >
                    <span class="toggle-switch__thumb" />
                  </button>
                </div>
                <Transition name="form-select-fade">
                  <div v-if="startActivationEnabled" class="activation-card__dates">
                    <div class="activation-card__divider" />
                    <label class="create-modal__label">Company account activation date<span class="create-modal__required">*</span></label>
                    <DatePicker
                      v-model="startActivationDateVal"
                      :open="startActivationField === 'activation'"
                      @toggle="toggleStartActivationField('activation')"
                      @select="selectStartDate('activation', $event)"
                    />
                    <label class="create-modal__label">Company account expiration date<span class="create-modal__required">*</span></label>
                    <DatePicker
                      v-model="startExpirationDateVal"
                      :open="startActivationField === 'expiration'"
                      :min="startActivationDateVal || undefined"
                      @toggle="toggleStartActivationField('expiration')"
                      @select="selectStartDate('expiration', $event)"
                    />
                  </div>
                </Transition>
              </div>
            </div>

            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeStartActivationModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="canSaveStartActivation
                  ? { 'modal-btn--save': true, 'modal-btn--saved': startActivationState === 'saved' }
                  : 'modal-btn--create'"
                :disabled="!canSaveStartActivation"
                @click="submitStartActivation"
              >
                <span v-if="startActivationState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="startActivationState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Save</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showQuotaModal" class="modal-backdrop" @mousedown.self="closeQuotaModal">
          <div class="create-modal create-modal--wide create-modal--quota">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Monthly Quota Information</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeQuotaModal">
                <IconX :size="20" />
              </button>
            </div>

            <div class="activation-info">
              <div class="activation-info__label">Company Name</div>
              <div class="activation-info__value">{{ company?.name ?? '—' }}</div>
            </div>

            <div class="activation-divider" />

            <div class="quota-info-list">
              <div v-for="row in quotaRows" :key="row.key" class="quota-info-row">
                <div class="quota-info-row__main">
                  <div class="quota-info-row__title">{{ row.label }}</div>
                  <div class="quota-info-row__stats">
                    <span>Monthly Quota: {{ row.count }}</span>
                    <span>Used: {{ row.used }}</span>
                    <span>Remaining: {{ row.remaining }}</span>
                  </div>
                </div>
                <span class="quota-info-row__divider" aria-hidden="true" />
                <div class="quota-info-row__extra">
                  <div class="quota-info-row__title">Additional Quota</div>
                  <div class="quota-info-row__stats">
                    <span>Additional Monthly Quota: {{ row.additional ?? '-' }}</span>
                    <span>Validity Until: {{ row.validity ? formatDate(row.validity) : '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showInviteModal" class="modal-backdrop" @mousedown.self="closeInviteModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Invite User</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeInviteModal">
                <IconX :size="20" />
              </button>
            </div>

            <div class="create-modal__body invite-body">
              <div class="invite-field">
                <label class="create-modal__label" for="invite-username">Username<span class="create-modal__required">*</span></label>
                <input
                  id="invite-username"
                  v-model="inviteUsername"
                  type="text"
                  class="create-modal__input"
                  :class="{ 'create-modal__input--error': !!inviteUsernameError }"
                  placeholder="input username..."
                />
                <p v-if="inviteUsernameError" class="field-error">{{ inviteUsernameError }}</p>
              </div>

              <div class="invite-field">
                <label class="create-modal__label" for="invite-email">Email Address<span class="create-modal__required">*</span></label>
                <input
                  id="invite-email"
                  v-model="inviteEmail"
                  type="email"
                  class="create-modal__input"
                  :class="{ 'create-modal__input--error': !!inviteEmailError }"
                  placeholder="input email address..."
                />
                <p v-if="inviteEmailError" class="field-error">{{ inviteEmailError }}</p>
              </div>

              <div class="invite-field">
                <label class="create-modal__label">Role<span class="create-modal__required">*</span></label>
                <div class="form-select">
                  <button type="button" class="form-select__trigger" @click="toggleInviteField('role')">
                    <span :class="{ 'form-select__trigger-text--placeholder': !inviteRole }">
                      {{ inviteRoleOptions.find((o) => o.value === inviteRole)?.label ?? 'select role...' }}
                    </span>
                    <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': inviteField === 'role' }" />
                  </button>
                  <div class="select-panel" :class="{ open: inviteField === 'role' }">
                    <div class="form-select__inline-menu select-panel__inner">
                      <button
                        v-for="opt in inviteRoleOptions"
                        :key="opt.value"
                        type="button"
                        class="form-select__inline-item"
                        :class="{ 'form-select__inline-item--active': opt.value === inviteRole }"
                        @click="selectInviteOption('role', opt.value)"
                      >
                        {{ opt.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="invite-field">
                <label class="create-modal__label">Company Location<span class="create-modal__required">*</span></label>
                <div class="form-select">
                  <button type="button" class="form-select__trigger" @click="toggleInviteField('location')">
                    <span :class="{ 'form-select__trigger-text--placeholder': !inviteLocation }">
                      {{ inviteLocationSource.find((o) => o.value === inviteLocation)?.label ?? 'select company location...' }}
                    </span>
                    <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': inviteField === 'location' }" />
                  </button>
                  <div class="select-panel" :class="{ open: inviteField === 'location' }">
                    <div class="form-select__inline-menu select-panel__inner location-panel">
                      <div class="location-search">
                        <input v-model="inviteLocationQuery" type="text" class="location-search__input" placeholder="Find..." @click.stop />
                        <IconSearch :size="18" class="location-search__icon" />
                      </div>
                      <button
                        v-for="opt in filteredInviteLocations"
                        :key="opt.value"
                        type="button"
                        class="form-select__inline-item location-option"
                        :class="{ 'form-select__inline-item--active': opt.value === inviteLocation }"
                        @click="selectInviteOption('location', opt.value)"
                      >
                        <span class="location-option__name">{{ opt.label }}</span>
                        <span class="location-option__type">{{ opt.type }}</span>
                      </button>
                      <div v-if="!filteredInviteLocations.length" class="location-empty">No company found.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeInviteModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="canInvite
                  ? { 'modal-btn--save': true, 'modal-btn--saved': inviteState === 'saved' }
                  : 'modal-btn--create'"
                :disabled="!canInvite"
                @click="submitInviteUser"
              >
                <span v-if="inviteState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="inviteState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Send Invitation</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteModal" class="modal-backdrop" @mousedown.self="closeDeleteModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Delete Company</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeDeleteModal">
                <IconX :size="20" />
              </button>
            </div>

            <div class="delete-company__info">
              <span class="delete-company__icon" aria-hidden="true">
                <IconBuildingSkyscraper :size="36" />
              </span>
              <span class="delete-company__name">{{ company?.name ?? '—' }}</span>
            </div>

            <label class="revoke-ack">
              <input v-model="deleteConfirmed" type="checkbox" class="revoke-ack__box" />
              <span>I understand that this action is irreversible and will permanently delete the organization and all associated user accounts.</span>
            </label>

            <div class="create-modal__actions">
              <button
                type="button"
                class="modal-btn"
                :class="deleteConfirmed
                  ? { 'modal-btn--save': true, 'modal-btn--saved': deleteState === 'saved' }
                  : 'modal-btn--create'"
                :disabled="!deleteConfirmed"
                @click="submitDeleteCompany"
              >
                <span v-if="deleteState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="deleteState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Delete</span>
              </button>
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeDeleteModal">Cancel</button>
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
              empty-text="No members found."
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

// Plain, unboxed header — matches the dashboard's own DashboardHeader.vue
// (title/subtitle left, actions right, no card/border treatment) instead of
// a bespoke bordered "ID card" look.
.company-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 4px 0;
  flex-wrap: wrap;

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 220px;
  }

  &__titlewrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  &__titlerow {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
    line-height: 1.2;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;

    span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--glacia-ink-dim);
      white-space: nowrap;
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
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
  background: #fff;
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

// ── Liquid action menu (references/liquid-menu.html) ─────────────────────────
// Goo filter fuses the trigger circle and the panel into one liquid shape.
// Panel grows downward from the button centre, same as the reference.
.lm {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  flex-shrink: 0;
}

.lm-btn {
  position: relative;
  z-index: 2;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glacia-red);
  color: #fff;
  box-shadow: 0 6px 20px rgba(255, 37, 41, 0.4);
  transition: background 160ms ease;

  &:hover {
    background: #e01e22;
  }
}

.lm-goo {
  position: absolute;
  left: 0;
  top: 0;
  width: 308px;
  height: 182px;
  pointer-events: none;
  filter: url(#lm-goo) drop-shadow(0 18px 24px rgba(16, 24, 32, 0.18));
}

.lm-dot {
  position: absolute;
  left: 0;
  top: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--glacia-red);
}

.lm-shape,
.lm-list {
  width: 264px;
  transform-origin: -13px 19px; // = button centre
}

.lm-shape {
  position: absolute;
  left: 32px;
  top: 0;
  height: 176px;
  border-radius: 20px;
  background: #fff;
}

.lm-list {
  position: absolute;
  left: 32px;
  top: 0;
  z-index: 1;
  box-sizing: border-box;
  padding: 8px;
  display: flex;
  flex-direction: column;
  // Solid backing identical to the flyout — the goo shape alone can't be
  // trusted to cover the list in every browser's filter region.
  background: #fff;
  border-radius: 20px;
}

.lm:not(.is-open):not(.is-closing) .lm-goo > .lm-shape,
.lm:not(.is-open):not(.is-closing) .lm-list {
  display: none;
}

.lm.is-open .lm-shape {
  animation: lm-grow 760ms cubic-bezier(0.3, 0.8, 0.35, 1) both;
}
.lm.is-open .lm-list {
  animation: lm-grow 760ms cubic-bezier(0.3, 0.8, 0.35, 1) both, lm-show 760ms ease both;
}
.lm.is-closing .lm-shape {
  animation: lm-close 440ms cubic-bezier(0.55, 0, 0.8, 0.4) both;
}
.lm.is-closing .lm-list {
  animation: lm-close 440ms cubic-bezier(0.55, 0, 0.8, 0.4) both, lm-show 440ms ease reverse both;
  pointer-events: none;
}

.lm-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 8px 14px 8px 11px;
  border: 0;
  border-radius: 14px;
  background: none;
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--glacia-ink);
  text-align: left;
  cursor: pointer;
  transition: background 160ms ease;

  &:hover {
    background: rgba(15, 23, 42, 0.05);
  }

  span:nth-child(2) {
    flex: 1;
  }

  &--danger {
    color: var(--glacia-sev-critical);
  }
}

.lm-chev {
  color: var(--glacia-ink-dim);
  flex-shrink: 0;
}

.lm-row {
  position: relative;
}

.lm-submenu {
  position: absolute;
  top: 0;
  left: 100%;
  margin-left: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 220px;
  padding: 8px;
  background: #fff;
  border: 1px solid var(--glacia-glass-border);
  border-radius: 14px;
  box-shadow: 0 12px 28px -6px rgba(16, 24, 32, 0.2);
  z-index: 3;
}

@keyframes lm-grow {
  0% { transform: scale(0.06, 0.1); }
  45% { transform: scale(1.05, 0.94); }
  65% { transform: scale(0.97, 1.04); }
  82% { transform: scale(1.01, 0.99); }
  100% { transform: scale(1); }
}
@keyframes lm-close {
  0% { transform: scale(1); }
  100% { transform: scale(0.06, 0.1); }
}
@keyframes lm-show {
  0%, 28% { opacity: 0; }
  70%, 100% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .lm-shape, .lm-list {
    animation-duration: 1ms !important;
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
    position: absolute; z-index: 0; background: #fff; border-radius: var(--glacia-radius-pill);
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
  background: rgba(15, 23, 42, 0.06);
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
  background: #fff;
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
    background: #fff;
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
      border-color: var(--glacia-red);
      box-shadow: 0 2px 6px rgba(16, 24, 32, 0.12);
    }

    &--readonly {
      background: #f8fafc;
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

.edit-modal__label {
  display: block;
  margin: 16px 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--glacia-ink);
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
    border: 2px solid rgba(255, 255, 255, 0.4);
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

.activation-info {
  margin-top: 16px;

  &__label {
    font-size: 13px;
    color: var(--glacia-ink-dim);
    margin-bottom: 4px;
  }

  &__value {
    font-size: 15px;
    font-weight: 800;
    color: var(--glacia-ink);
  }
}

.activation-divider {
  height: 1px;
  background: var(--glacia-glass-border);
  margin: 16px 0;
}

.activation-subtitle {
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 800;
  color: var(--glacia-ink);
  margin: 0 0 4px;
}

.quota-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }

  &__field {
    display: flex;
    flex-direction: column;
  }

  // Keep the four inputs on a common row baseline even when labels wrap
  // at different lengths (e.g. "Domain inspection…" = 2 lines vs others = 1).
  &__field .create-modal__label {
    white-space: nowrap;
    font-size: 13px;
    min-height: auto;
    line-height: 1.3;

    @media (max-width: 560px) {
      white-space: normal;
    }
  }
}

.activation-card {
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  padding: 18px;
  border-radius: 16px;
  border: 0.5px solid var(--glacia-glass-border);
  background: #fff;
  box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);

  &--spaced {
    margin-top: 18px;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__title {
    font-size: 15px;
    font-weight: 700;
    color: var(--glacia-ink);
  }

  &__desc {
    margin-top: 4px;
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  &__divider {
    height: 1px;
    background: var(--glacia-glass-border);
    margin: 16px 0 0;
  }

  &__dates {
    display: flex;
    flex-direction: column;
  }
}

.toggle-switch {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 26px;
  border-radius: 999px;
  border: none;
  background: rgba(15, 23, 42, 0.12);
  cursor: pointer;
  transition: background 0.18s ease;

  &--on {
    background: var(--glacia-red);
  }

  &__thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(16, 24, 32, 0.25);
    transition: transform 0.18s ease;

    .toggle-switch--on & {
      transform: translateX(18px);
    }
  }
}

.form-select-fade-enter-active {
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
.form-select-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.form-select-fade-enter-from,
.form-select-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.invite-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.field-error {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--glacia-sev-critical);
}

.invite-field .create-modal__label {
  margin: 0 0 8px;
}

.location-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.location-search {
  position: relative;

  &__input {
    width: 100%;
    height: 46px;
    padding: 0 42px 0 16px;
    border-radius: 12px;
    border: 1px solid var(--glacia-glass-border);
    background: #fff;
    color: var(--glacia-ink);
    font-size: 14px;
    font-family: 'Manrope', 'Inter', sans-serif;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.13s, box-shadow 0.13s;

    &::placeholder {
      color: var(--glacia-ink-dim);
    }

    &:focus {
      border-color: var(--glacia-red);
      box-shadow: 0 2px 6px rgba(16, 24, 32, 0.08);
    }
  }

  &__icon {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--glacia-ink-dim);
    pointer-events: none;
  }
}

.location-option {
  justify-content: space-between;
  gap: 12px;

  &__name {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__type {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 400;
    color: var(--glacia-ink-dim);
  }
}

.location-empty {
  padding: 10px 12px;
  font-size: 13px;
  color: var(--glacia-ink-dim);
  text-align: center;
}

.revoke-ack {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 8px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1.5px solid var(--glacia-red);
  background: #fff;
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
  background: #fff;
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
  background: #fff;
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
    background: #f1f5f9;
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
    background: #e8f5e9;
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

.delete-company__info {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 18px;
}

.delete-company__icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(255, 37, 41, 0.1);
  color: #e53925;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.delete-company__name {
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 800;
  color: var(--glacia-ink);
  line-height: 1.3;
}

.create-modal__body {
  overflow-x: hidden;
  padding: 2px 2px 0;
  margin: 0 -2px;
}

.select-panel {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.22s ease,
    margin-top 0.32s cubic-bezier(0.4, 0, 0.2, 1);

  &.open {
    max-height: 300px;
    opacity: 1;
    margin-top: 10px;
  }

  &__inner {
    margin-top: 0;
  }
}

.form-select {
  position: relative;

  &__trigger {
    width: 100%;
    height: 54px;
    padding: 0 18px;
    border-radius: 14px;
    border: 0.5px solid var(--glacia-glass-border);
    background: #fff;
    box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    cursor: pointer;
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 15px;
    color: var(--glacia-ink);
    text-align: left;
    transition: border-color 0.13s, box-shadow 0.13s;

    &:hover {
      border-color: var(--glacia-ink-dim);
    }
  }

  &__trigger-text--placeholder {
    color: var(--glacia-ink-dim);
  }

  &__chevron {
    flex-shrink: 0;
    color: var(--glacia-ink-dim);
    transition: transform 0.2s ease;

    &--open {
      transform: rotate(180deg);
    }
  }

  &__inline-menu {
    margin-top: 10px;
    padding: 8px;
    border-radius: 16px;
    border: 0.5px solid var(--glacia-glass-border);
    background: #fff;
    max-height: 260px;
    overflow-y: auto;
  }

  &__inline-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 14px 16px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: var(--glacia-ink);
    font-size: 15px;
    font-weight: 500;
    font-family: 'Manrope', 'Inter', sans-serif;
    cursor: pointer;
    text-align: left;
    transition: background 0.13s, color 0.13s;

    & + & {
      margin-top: 4px;
    }

    &:not(.form-select__inline-item--active):hover {
      background: rgba(255, 37, 41, 0.06);
    }

    &--active {
      color: var(--glacia-red);
      font-weight: 700;
      background: rgba(255, 37, 41, 0.08);
    }
  }
}

.quota-info-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
  margin-top: 18px;
}

.quota-info-row {
  display: grid;
  grid-template-columns: 1fr 3px 1fr;
  gap: 0 18px;
  align-items: start;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  &__divider {
    width: 3px;
    height: 18px;
    border-radius: 999px;
    background: #e85a28;
    justify-self: center;
    align-self: start;
    margin-top: 4px;

    @media (max-width: 560px) {
      display: none;
    }
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 800;
    color: var(--glacia-ink);
    line-height: 1.3;
  }

  &__stats {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 14px;
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.4;
    color: var(--glacia-ink);
  }
}
</style>
