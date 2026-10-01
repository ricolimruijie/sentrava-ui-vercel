<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import QuotaInfoModal from '@/components/company/QuotaInfoModal.vue'
import AssignQuotaModal from '@/components/company/AssignQuotaModal.vue'
import CreateCompanyModal from '@/components/company/CreateCompanyModal.vue'
import GlassField from '@/components/reusable/GlassField.vue'
import { formatDate } from '@/utils/helpers'
import {
  IconBuildingSkyscraper, IconChartBar, IconUsers, IconFileText, IconChevronRight, IconChevronLeft, IconPower, IconDotsVertical, IconPencil, IconUserPlus, IconSitemap, IconTrash, IconX, IconCheck, IconLock, IconCalendar, IconWorld, IconNetwork, IconBrowser, IconCode, IconPlug,
} from '@tabler/icons-vue'

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

<style scoped lang="scss">
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
  // Above the table's sticky header row (z-index 1) so the open menu isn't
  // painted over by the content below it.
  z-index: 20;
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
  height: 166px;
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
  height: 160px; // 3 × 48px items + 2 × 8px padding
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
  white-space: nowrap;
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

  // Wrapped in a block div, so the button no longer stretches like its
  // flex-column siblings — fill the row so the hover pill matches.
  > .lm-item {
    width: 100%;
  }
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
      border-color: #2563EB;
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

// ── Start Activation two-panel modal (matches Image 1) ───────────────────
.sa-modal {
  width: 100%;
  max-width: 980px;
  min-height: 640px;
  max-height: calc(100vh - 40px);
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  overflow: hidden;
  display: flex;
  align-items: stretch;
  animation: create-modal-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition: height 0.38s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 760px) {
    flex-direction: column;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
  }

  &__left {
    width: 340px;
    flex-shrink: 0;
    padding: 28px 26px;
    background: linear-gradient(160deg, #f4f8ff 0%, #e9f1fd 55%, #eef3fb 100%);
    border-right: 1px solid rgba(15, 23, 42, 0.06);
    display: flex;
    flex-direction: column;

    @media (max-width: 760px) {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    }
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #0f172a;
    margin: 0;
  }

  &__right {
    flex: 1;
    padding: 26px 28px;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
}

.sa-company {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;

  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #eef4ff;
    color: #1e3a5f;
    font-weight: 800;
    font-size: 17px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__label {
    font-size: 13px;
    color: #64748b;
  }

  &__name {
    font-size: 16px;
    font-weight: 800;
    line-height: 1.3;
    color: #0f172a;
  }
}

.sa-divider {
  height: 1px;
  background: rgba(15, 23, 42, 0.1);
  margin: 18px 0;
}

.sa-dates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.sa-date-pill {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 14px;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: 'Manrope', 'Inter', sans-serif;

  &--active {
    border-color: #93b4e5;
    box-shadow: 0 0 0 1px #93b4e5;
  }

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    white-space: nowrap;
  }

  &__value {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &--placeholder {
      color: #64748b;
      font-weight: 700;
    }
  }
}

.sa-required {
  color: #dc2626;
}

.sa-cal {
  margin-top: 20px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  &__month {
    display: inline-block;
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
    animation: sa-fade 0.3s ease;
  }

  &__nav {
    display: flex;
    gap: 8px;
  }

  &__nav-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid rgba(15, 23, 42, 0.1);
    background: #fff;
    color: #0f172a;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.13s;

    &:hover {
      background: #f1f5f9;
    }
  }

  &__gridwrap {
    overflow: hidden; // fallback for browsers without `clip` support
    overflow: clip;
    overflow-clip-margin: 8px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    position: relative;
    row-gap: 4px;

    &--slide-l { animation: sa-slide-l 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
    &--slide-r { animation: sa-slide-r 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
  }

  &__pill {
    position: absolute;
    z-index: 0;
    pointer-events: none;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--glacia-glass-fill-strong);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid rgba(255, 37, 41, 0.3);
    box-shadow: inset 0 1px 0 var(--glacia-glass-highlight), 0 6px 16px -6px rgba(255, 46, 58, 0.45);
    box-sizing: border-box;
    transition: left 0.5s cubic-bezier(0.3, 1.35, 0.5, 1), top 0.5s cubic-bezier(0.3, 1.35, 0.5, 1), opacity 0.2s ease;

    &--glide-a { animation: sa-glide-a 0.5s; }
    &--glide-b { animation: sa-glide-b 0.5s; }
  }

  &__weekday {
    font-size: 12px;
    font-weight: 700;
    color: #475569;
    height: 28px;
    line-height: 28px;
    margin-bottom: 2px;
    position: relative;
    z-index: 1;
  }

  &__blank {
    height: 34px;
  }

  &__day {
    width: 34px;
    height: 34px;
    justify-self: center;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--glacia-ink);
    font-size: 14px;
    font-weight: 500;
    font-family: 'Manrope', 'Inter', sans-serif;
    cursor: pointer;
    position: relative;
    z-index: 1;
    transition: color 0.3s ease, background-color 0.18s ease, transform 0.18s ease;

    &:hover:not(:disabled):not(&--selected) {
      color: var(--glacia-ink);
      background-color: rgba(255, 37, 41, 0.08);
      transform: scale(1.1);
    }

    &:active:not(:disabled):not(&--selected) {
      transform: scale(0.94);
    }

    &--selected {
      background: transparent;
      color: #b91c1c;
      font-weight: 700;
      animation: sa-pop 0.34s;
    }

    &:disabled {
      color: #cbd5e1;
      cursor: default;
    }
  }
}

@keyframes sa-slide-l { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }

@keyframes sa-slide-r { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: none; } }

@keyframes sa-fade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

@keyframes sa-pop {
  0% { transform: scale(0.8); animation-timing-function: cubic-bezier(0.3, 1.5, 0.5, 1); }
  60% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

@keyframes sa-glide-a {
  0% { transform: scale(1, 1); }
  30% { transform: scale(1.18, 0.86); animation-timing-function: ease-out; }
  70% { transform: scale(0.95, 1.05); }
  100% { transform: scale(1, 1); }
}

@keyframes sa-glide-b {
  0% { transform: scale(1, 1); }
  30% { transform: scale(1.18, 0.86); animation-timing-function: ease-out; }
  70% { transform: scale(0.95, 1.05); }
  100% { transform: scale(1, 1); }
}

@media (prefers-reduced-motion: reduce) {
  .sa-cal * { transition: none !important; animation: none !important; }
}

.sa-quota-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.sa-quota-title {
  display: flex;
  align-items: center;
  gap: 10px;

  h3 {
    margin: 0;
    font-size: 19px;
    font-weight: 800;
    color: #0f172a;
  }
}

.sa-readonly {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #64748b;
}

.sa-quota-desc {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #64748b;
}

.sa-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: #f8fafc;
  color: #0f172a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    background: #eef2f7;
  }
}

.sa-quota-list {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
}

.sa-quota-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: #f8fafc;

  &__icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__meta {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-size: 12px;
    line-height: 1.4;
    color: #64748b;
  }

  &__value {
    font-size: 20px;
    font-weight: 800;
    line-height: 1.1;
    color: #0f172a;
  }
}

.sa-activate-card {
  margin-top: 18px;
  padding: 18px 20px;
  border-radius: 16px;
  border: 1px solid #c9dcf5;
  background: #fff;
  box-shadow: 0 12px 28px -18px rgba(59, 110, 190, 0.45);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  &__title {
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
  }

  &__desc {
    margin-top: 4px;
    font-size: 13px;
    color: #64748b;
  }
}

.sa-toggle {
  position: relative;
  flex-shrink: 0;
  width: 52px;
  height: 30px;
  border-radius: 999px;
  border: none;
  background: rgba(15, 23, 42, 0.12);
  cursor: pointer;
  transition: background 0.18s ease;

  &--on {
    background: #5b8dc6;
  }

  &__thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(16, 24, 32, 0.25);
    transition: transform 0.18s ease;

    .sa-toggle--on & {
      transform: translateX(22px);
    }
  }
}

.sa-actions {
  display: flex;
  gap: 14px;
  margin-top: auto;
  padding-top: 28px;
}

.sa-btn {
  flex: 1;
  height: 52px;
  border-radius: 16px;
  border: none;
  font-size: 16px;
  font-weight: 800;
  font-family: 'Manrope', 'Inter', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &--cancel {
    background: #fef2f2;
    color: #dc2626;

    &:hover {
      background: #fee2e2;
    }
  }

  &--save-idle {
    background: #f8fafc;
    color: #64748b;
    cursor: default;
  }

  &--save-active {
    background: #ff2e3a;
    color: #fff;
    box-shadow: 0 8px 20px -6px rgba(255, 46, 58, 0.4);

    &:hover {
      background: #e6212c;
    }
  }

  &:disabled {
    cursor: default;
  }
}

.modal-btn__spinner--dark {
  border-color: rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
}

.sa-empty {
  margin-top: auto;
  padding-top: 120px;
  padding-bottom: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;

  &__icon {
    color: #64748b;
  }

  &__text {
    margin: 0;
    font-size: 14px;
    line-height: 1.55;
    color: #64748b;
    max-width: 240px;
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
  gap: 10px;
  margin-top: 12px;
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
  // Setting only overflow-x makes the browser auto-compute overflow-y as
  // "auto" (not "visible") per spec — which would clip a GlassField
  // dropdown menu wherever it overflows past this box. Keep it explicit.
  overflow-y: visible;
  padding: 2px 2px 0;
  margin: 0 -2px;
}
</style>
