<script setup>
import { useRole } from '@/composables/useRole'
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import QuotaInfoModal from '@/modules/company/components/QuotaInfoModal.vue'
import AssignQuotaModal from '@/modules/company/components/AssignQuotaModal.vue'
import CreateCompanyModal from '@/modules/company/components/CreateCompanyModal.vue'
import GlassField from '@/components/common/GlassField.vue'
import { formatDate } from '@/utils/helpers'
import {
  IconBuildingSkyscraper, IconChartBar, IconUsers, IconFileText, IconChevronRight, IconChevronLeft, IconPower, IconDotsVertical, IconPencil, IconUserPlus, IconSitemap, IconTrash, IconX, IconCheck, IconLock, IconCalendar, IconWorld, IconNetwork, IconBrowser, IconCode, IconPlug,
} from '@tabler/icons-vue'

const { can } = useRole()

// Company header — title, meta row and the liquid ⋮ actions menu with all of
// its modals. Shared by the Company page and a sub company's members page.
const props = defineProps({
  // { name, type, quota, contractType, ... }
  company: { type: Object, default: null },
  userCount: { type: Number, default: 0 },
  // A sub company can't have sub companies of its own.
  allowCreateSubCompany: { type: Boolean, default: true },
})
const emit = defineEmits(['renamed', 'deleted'])

const company = computed(() => props.company)

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
// Stable pseudo-random numbers per company + service (seeded string hash), so
// the mock quotas look varied but don't change on every render.
function seeded(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const quotaRows = computed(() => {
  const base = company.value?.quota ?? 4
  const services = [
    { key: 'domain',  label: 'Domain Inspection' },
    { key: 'network', label: 'Network' },
    { key: 'webapp',  label: 'Web Application' },
    { key: 'source',  label: 'Source Code' },
  ]
  return services.map((sv) => {
    const rnd = seeded(`${company.value?.name ?? ''}:${sv.key}`)
    const used = Math.round(base * rnd() * 0.85)
    // Roughly half the services carry an additional quota with an expiry date.
    const hasExtra = rnd() < 0.5
    const validity = new Date(2026, 9 + Math.floor(rnd() * 4), 1 + Math.floor(rnd() * 28))
    return {
      ...sv,
      count: base,
      used,
      remaining: base - used,
      additional: hasExtra ? 1 + Math.floor(rnd() * Math.max(1, base * 0.2)) : null,
      validity: hasExtra ? `${validity.getFullYear()}-${String(validity.getMonth() + 1).padStart(2, '0')}-${String(validity.getDate()).padStart(2, '0')}` : null,
      ...quotaAdditions.value[sv.key],
    }
  })
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
  startActivationField.value = 'activation'
  startActivationState.value = 'idle'
  const now = new Date()
  saViewYear.value = now.getFullYear()
  saViewMonth.value = now.getMonth()
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
  // Pills select (never deselect) — the inline calendar always edits one
  // field. Toggling to null used to silently fall back to 'activation',
  // so days clicked after picking expiration overwrote activation.
  startActivationField.value = key
  nextTick(saMovePill)
}
function selectStartDate(field, iso) {
  if (field === 'activation') {
    startActivationDateVal.value = iso
    if (startExpirationDateVal.value && startExpirationDateVal.value < iso) startExpirationDateVal.value = ''
    // Advance to expiration so the next day click edits expiration.
    startActivationField.value = 'expiration'
  } else {
    startExpirationDateVal.value = iso
    startActivationField.value = 'expiration'
  }
  nextTick(saMovePill)
}
function toggleStartActivation() {
  // Fixed-height modal (see .sa-modal min-height) — no height animation,
  // so toggling the switch never resizes the dialog.
  startActivationEnabled.value = !startActivationEnabled.value
  if (startActivationEnabled.value) {
    if (!startActivationField.value) startActivationField.value = 'activation'
    // Snap the calendar back to the current month when it (re)appears.
    const now = new Date()
    saViewYear.value = now.getFullYear()
    saViewMonth.value = now.getMonth()
  }
  nextTick(saMovePill)
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

// ── Start Activation two-panel calendar (Image 1) ───────────────────────
// Inline Monday-first calendar. Pills pick which field the calendar edits.
// Month-change slide + month fade + day pop mirror the scan-config calendar.
const saViewYear = ref(new Date().getFullYear())
const saViewMonth = ref(new Date().getMonth())
const saWeekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const companyInitials = computed(() => {
  const name = (company.value?.name ?? '').trim()
  if (!name) return '—'
  const parts = name.split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
})

const saQuotaRows = computed(() => {
  const q = company.value?.quota
  const label = q != null ? String(q) : '—'
  return [
    { key: 'domain',  label: 'Domain inspection scan quota for one month', value: label, icon: IconWorld,   color: '#2563EB', bg: '#eff6ff' },
    { key: 'network', label: 'Network scan quota for one month',            value: label, icon: IconNetwork, color: '#7C3AED', bg: '#f5f3ff' },
    { key: 'webapp',  label: 'Web application scan quota for one month',    value: label, icon: IconBrowser, color: '#0D9488', bg: '#f0fdfa' },
    { key: 'source',  label: 'Source code scan quota for one month',        value: label, icon: IconCode,    color: '#EA580C', bg: '#fff7ed' },
  ]
})

const saMonthLabel = computed(() =>
  new Date(saViewYear.value, saViewMonth.value, 1)
    .toLocaleString('en-US', { month: 'long', year: 'numeric' }),
)

function saToISO(day) {
  const mm = String(saViewMonth.value + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${saViewYear.value}-${mm}-${dd}`
}

// Monday-first cells: leading blanks + days.
const saCells = computed(() => {
  const firstDowSun = new Date(saViewYear.value, saViewMonth.value, 1).getDay()
  const leading = (firstDowSun + 6) % 7
  const daysInMonth = new Date(saViewYear.value, saViewMonth.value + 1, 0).getDate()
  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
})

function saShiftMonth(delta) {
  const d = new Date(saViewYear.value, saViewMonth.value + delta, 1)
  saViewYear.value = d.getFullYear()
  saViewMonth.value = d.getMonth()
  saNavDir.value = delta > 0 ? 1 : -1
  saNavN.value += 1
  nextTick(saMovePill)
}

function saTodayISO() {
  const t = new Date()
  const mm = String(t.getMonth() + 1).padStart(2, '0')
  const dd = String(t.getDate()).padStart(2, '0')
  return `${t.getFullYear()}-${mm}-${dd}`
}

function saIsDisabled(day) {
  const iso = saToISO(day)
  // Past dates can't be chosen — activation can't start in the past.
  if (iso < saTodayISO()) return true
  const active = startActivationField.value || 'activation'
  if (active === 'expiration' && startActivationDateVal.value) return iso < startActivationDateVal.value
  return false
}

function saIsSelected(day) {
  const iso = saToISO(day)
  const active = startActivationField.value || 'activation'
  return active === 'activation'
    ? iso === startActivationDateVal.value
    : iso === startExpirationDateVal.value
}

function saSelectDay(day) {
  if (day == null || saIsDisabled(day)) return
  const active = startActivationField.value || 'activation'
  selectStartDate(active, saToISO(day))
  saPickN.value += 1
  nextTick(saMovePill)
}

function saDisplay(which) {
  const iso = which === 'activation' ? startActivationDateVal.value : startExpirationDateVal.value
  return iso ? formatDate(iso) : 'Select a date'
}

// Month-change slide direction/keys (same motion as scan-config calendar).
const saNavN = ref(0)
const saNavDir = ref(1)

// ── Sliding glass pill behind the selected day (same as the scan-config
// DateTimePicker calendar): measured cell position + spring transition,
// alternating glide classes replay the stretch without remounting.
const saGridRef = ref(null)
const saPill = ref({ left: '0px', top: '0px', opacity: 0 })
const saPickN = ref(0)

function saActiveISO() {
  const active = startActivationField.value || 'activation'
  return active === 'activation' ? startActivationDateVal.value : startExpirationDateVal.value
}

function saMovePill() {
  const iso = saActiveISO()
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')
  if (!m) {
    saPill.value = { ...saPill.value, opacity: 0 }
    return
  }
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  if (y !== saViewYear.value || mo !== saViewMonth.value) {
    saPill.value = { ...saPill.value, opacity: 0 }
    return
  }
  const el = saGridRef.value?.querySelector(`[data-day="${d}"]`)
  if (!el) {
    saPill.value = { ...saPill.value, opacity: 0 }
    return
  }
  saPill.value = { left: `${el.offsetLeft}px`, top: `${el.offsetTop}px`, opacity: 1 }
}

watch(startActivationEnabled, (on) => {
  if (on) nextTick(saMovePill)
})

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
    emit('renamed', name)
    editNameState.value = 'saved'
    setTimeout(closeEditNameModal, 700)
  }, 500)
}

// ── Assign a quota configuration modal (Company configuration › Add scan quota)
const showAssignQuota = ref(false)
// Additional quota assigned this session, layered over the base rows so
// Quota information reflects it: { [serviceKey]: { additional, validity } }.
const quotaAdditions = ref({})

function addScanQuota() {
  closeLiquidMenu(true)
  showAssignQuota.value = true
}
function onQuotaAssigned({ service, mode, amount, start, end }) {
  console.info('Assign quota', { service, mode, amount, start, end })
  quotaAdditions.value = { ...quotaAdditions.value, [service]: { additional: amount, validity: end } }
}

// ── Invite User modal ────────────────────────────────────────────────────
const showInviteModal = ref(false)
const inviteUsername = ref('')
const inviteEmail = ref('')
const inviteRole = ref(null)
const inviteLocation = ref(null)
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
// GlassField's select has no in-menu search, and the location list is short
// enough (6 entries) that search isn't load-bearing — the "type" distinction
// (Head/Sub company) that the old searchable panel showed as a badge is
// folded into the label instead of being dropped silently.
const inviteLocationOptions = inviteLocationSource.map((o) => ({ value: o.value, label: `${o.label} (${o.type})` }))

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
  inviteState.value = 'idle'
  showInviteModal.value = true
}
function closeInviteModal() {
  showInviteModal.value = false
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

// ── Integrate Probe Box modal — same idle/loading/saved flow as Invite User.
const showIntegrateModal = ref(false)
const integrateLocation = ref(null)
const integrateUrl = ref('')
const integrateState = ref('idle') // 'idle' | 'loading' | 'saved'

const integrateUrlValid = computed(() => /^https?:\/\/[^\s/$.?#][^\s]*$/i.test(integrateUrl.value.trim()))
const integrateUrlError = computed(() => {
  if (!integrateUrl.value.trim() || integrateUrlValid.value) return ''
  return 'Please enter a valid URL (http:// or https://)'
})
const canIntegrate = computed(() => !!integrateLocation.value && integrateUrlValid.value)

function addIntegration() {
  closeLiquidMenu(true)
  integrateLocation.value = null
  integrateUrl.value = ''
  integrateState.value = 'idle'
  showIntegrateModal.value = true
}
function closeIntegrateModal() {
  showIntegrateModal.value = false
}
function submitIntegrate() {
  if (!canIntegrate.value || integrateState.value !== 'idle') return
  integrateState.value = 'loading'
  setTimeout(() => {
    console.info('Integrate probe box', {
      companyLocation: integrateLocation.value,
      url: integrateUrl.value.trim(),
    })
    integrateState.value = 'saved'
    setTimeout(closeIntegrateModal, 700)
  }, 500)
}

// Same form as the navbar's Create Company — only the title differs.
const showCreateSub = ref(false)
function createSubCompany() {
  closeLiquidMenu(true)
  showCreateSub.value = true
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
    emit('deleted')
    deleteState.value = 'saved'
    setTimeout(closeDeleteModal, 700)
  }, 500)
}

function deleteCompany() {
  closeLiquidMenu(true)
  openDeleteCompany()
}


function handleClickOutside(e) {
  if (!e.target.closest('.lm')) closeLiquidMenu(true)
  // The inline SA calendar lives in .sa-modal__left (not .form-select),
  // so clicks on its pills/days must not reset the active field —
  // otherwise mousedown fires before the day's click and expiration
  // picks silently fall back to activation.
  if (!e.target.closest('.form-select') && !e.target.closest('.sa-modal__left') && startActivationField.value) {
    animateCompanyModalHeight(() => { startActivationField.value = null })
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
  <div>
    <div class="company-header">
      <div class="company-header__left">
        <div class="company-header__titlewrap">
          <div class="company-header__titlerow">
            <h1 class="company-header__title">{{ company?.name ?? '—' }}</h1>
              <div
                v-if="can('manage_company')"
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
                    <button type="button" class="lm-item" role="menuitem" @click="addIntegration">
                      <IconPlug :size="18" />
                      <span>Add integration</span>
                    </button>
                    <button v-if="allowCreateSubCompany" type="button" class="lm-item" role="menuitem" @click="createSubCompany">
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
            <span><IconUsers :size="14" /> {{ userCount }} users</span>
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

            <GlassField
              v-model="editNameValue"
              label="Name"
              placeholder="Company name"
              required
              error-text="Company name is required"
              @enter="canSaveName && saveCompanyName()"
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
        <div v-if="showStartActivationModal" class="modal-backdrop" @mousedown.self="closeStartActivationModal">
          <div ref="companyModalEl" class="sa-modal" @transitionend.self="releaseCompanyModalHeight">
            <!-- Left: date picking -->
            <div class="sa-modal__left">
              <h2 class="sa-modal__title">Start Activation Date</h2>

              <div class="sa-company">
                <div class="sa-company__avatar">{{ companyInitials }}</div>
                <div class="sa-company__meta">
                  <div class="sa-company__label">Company Name</div>
                  <div class="sa-company__name">{{ company?.name ?? '—' }}</div>
                </div>
              </div>

              <div class="sa-divider" />

              <template v-if="startActivationEnabled">
              <div class="sa-dates">
                <button
                  type="button"
                  class="sa-date-pill"
                  :class="{ 'sa-date-pill--active': (startActivationField || 'activation') === 'activation' }"
                  @click="toggleStartActivationField('activation')"
                >
                  <span class="sa-date-pill__label">Activation date <span class="sa-required">*</span></span>
                  <span class="sa-date-pill__value" :class="{ 'sa-date-pill__value--placeholder': !startActivationDateVal }">
                    {{ saDisplay('activation') }}
                  </span>
                </button>
                <button
                  type="button"
                  class="sa-date-pill"
                  :class="{ 'sa-date-pill--active': startActivationField === 'expiration' }"
                  @click="toggleStartActivationField('expiration')"
                >
                  <span class="sa-date-pill__label">Expiration date <span class="sa-required">*</span></span>
                  <span class="sa-date-pill__value" :class="{ 'sa-date-pill__value--placeholder': !startExpirationDateVal }">
                    {{ saDisplay('expiration') }}
                  </span>
                </button>
              </div>

              <div class="sa-cal">
                <div class="sa-cal__head">
                  <span class="sa-cal__month" :key="`sam${saNavN}`">{{ saMonthLabel }}</span>
                  <div class="sa-cal__nav">
                    <button type="button" class="sa-cal__nav-btn" aria-label="Previous month" @click="saShiftMonth(-1)">
                      <IconChevronLeft :size="18" />
                    </button>
                    <button type="button" class="sa-cal__nav-btn" aria-label="Next month" @click="saShiftMonth(1)">
                      <IconChevronRight :size="18" />
                    </button>
                  </div>
                </div>
                <div class="sa-cal__gridwrap">
                <div
                  ref="saGridRef"
                  class="sa-cal__grid"
                  :key="`sag${saNavN}`"
                  :class="saNavN ? (saNavDir > 0 ? 'sa-cal__grid--slide-l' : 'sa-cal__grid--slide-r') : ''"
                >
                  <div
                    class="sa-cal__pill"
                    :class="saPickN ? (saPickN % 2 ? 'sa-cal__pill--glide-a' : 'sa-cal__pill--glide-b') : ''"
                    :style="{ left: saPill.left, top: saPill.top, opacity: saPill.opacity }"
                  />
                  <span v-for="d in saWeekdays" :key="d" class="sa-cal__weekday">{{ d }}</span>
                  <template v-for="(day, i) in saCells" :key="i">
                    <span v-if="day === null" class="sa-cal__blank" />
                    <button
                      v-else
                      type="button"
                      class="sa-cal__day"
                      :data-day="day"
                      :class="{ 'sa-cal__day--selected': saIsSelected(day) }"
                      :disabled="saIsDisabled(day)"
                      @click="saSelectDay(day)"
                    >
                      {{ day }}
                    </button>
                  </template>
                </div>
                </div>
              </div>
              </template>
              <div v-else class="sa-empty">
                <IconCalendar :size="30" class="sa-empty__icon" />
                <p class="sa-empty__text">Turn on company account activation to set the activation and expiration dates.</p>
              </div>
            </div>

            <!-- Right: quota + activation toggle -->
            <div class="sa-modal__right">
              <div class="sa-quota-head">
                <div class="sa-quota-title">
                  <h3>Current Quota</h3>
                  <span class="sa-readonly"><IconLock :size="14" /> Read only</span>
                </div>
                <button type="button" class="sa-close" aria-label="Close" @click="closeStartActivationModal">
                  <IconX :size="20" />
                </button>
              </div>

              <p class="sa-quota-desc">These are the monthly scan limits set for this company. Limits reset at the start of each month. Starting activation begins the billing cycle and applies these limits to every scan type. You can adjust these limits in the company settings.</p>

              <div class="sa-quota-list">
                <div v-for="row in saQuotaRows" :key="row.key" class="sa-quota-card">
                  <div class="sa-quota-card__icon" :style="{ background: row.bg, color: row.color }">
                    <component :is="row.icon" :size="18" />
                  </div>
                  <div class="sa-quota-card__meta">
                    <span class="sa-quota-card__label">{{ row.label }}</span>
                    <span class="sa-quota-card__value">{{ row.value }}</span>
                  </div>
                </div>
              </div>

              <div class="sa-activate-card">
                <div class="sa-activate-card__text">
                  <div class="sa-activate-card__title">Set up company account activation</div>
                  <div class="sa-activate-card__desc">This setup can be configured later in the company section.</div>
                </div>
                <button
                  type="button"
                  class="sa-toggle"
                  :class="{ 'sa-toggle--on': startActivationEnabled }"
                  role="switch"
                  :aria-checked="startActivationEnabled"
                  @click="toggleStartActivation"
                >
                  <span class="sa-toggle__thumb" />
                </button>
              </div>

              <div class="sa-actions">
                <button type="button" class="sa-btn sa-btn--cancel" @click="closeStartActivationModal">Cancel</button>
                <button
                  type="button"
                  class="sa-btn"
                  :class="canSaveStartActivation ? 'sa-btn--save-active' : 'sa-btn--save-idle'"
                  :disabled="!canSaveStartActivation"
                  @click="submitStartActivation"
                >
                  <span v-if="startActivationState === 'loading'" class="modal-btn__spinner modal-btn__spinner--dark" />
                  <IconCheck v-else-if="startActivationState === 'saved'" :size="18" />
                  <span v-else>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <QuotaInfoModal v-model="showQuotaModal" :company-name="company?.name ?? ''" :rows="quotaRows" />
    <AssignQuotaModal v-model="showAssignQuota" :rows="quotaRows" @save="onQuotaAssigned" />
    <CreateCompanyModal v-model="showCreateSub" title="Create Sub Company" />

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
                <GlassField
                  v-model="inviteUsername"
                  label="Username"
                  placeholder="input username..."
                  required
                  error-text="Username is required"
                />
                <p v-if="inviteUsernameError" class="field-error">{{ inviteUsernameError }}</p>
              </div>

              <div class="invite-field">
                <GlassField
                  v-model="inviteEmail"
                  label="Email Address"
                  placeholder="input email address..."
                  asterisk
                  :invalid="!!inviteEmailError"
                />
              </div>

              <div class="invite-field">
                <GlassField
                  v-model="inviteRole"
                  type="select"
                  label="Role"
                  placeholder="select role..."
                  :options="inviteRoleOptions"
                  required
                  error-text="Choose a role"
                />
              </div>

              <div class="invite-field">
                <GlassField
                  v-model="inviteLocation"
                  type="select"
                  label="Company Location"
                  placeholder="select company location..."
                  :options="inviteLocationOptions"
                  :visible-rows="4"
                  required
                  error-text="Choose a company location"
                />
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
        <div v-if="showIntegrateModal" class="modal-backdrop" @mousedown.self="closeIntegrateModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Integrate Probe Box</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeIntegrateModal">
                <IconX :size="20" />
              </button>
            </div>

            <div class="create-modal__body invite-body">
              <div class="invite-field">
                <GlassField
                  v-model="integrateLocation"
                  type="select"
                  label="Probe Box Company Location"
                  placeholder="select location..."
                  :options="inviteLocationOptions"
                  :visible-rows="4"
                  required
                  error-text="Choose a location"
                />
              </div>

              <div class="invite-field">
                <GlassField
                  v-model="integrateUrl"
                  label="URL"
                  placeholder="input url..."
                  required
                  error-text="URL is required"
                  @enter="canIntegrate && submitIntegrate()"
                />
                <p v-if="integrateUrlError" class="field-error">{{ integrateUrlError }}</p>
              </div>
            </div>

            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeIntegrateModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="canIntegrate
                  ? { 'modal-btn--save': true, 'modal-btn--saved': integrateState === 'saved' }
                  : 'modal-btn--create'"
                :disabled="!canIntegrate"
                @click="submitIntegrate"
              >
                <span v-if="integrateState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="integrateState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Connect</span>
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
  </div>
</template>

<style scoped lang="scss" src="./CompanyHeader.scss"></style>
