  <script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { navSections } from '@/config/navSections'
import { get } from '@/utils/request'
import { useFetch } from '@/composables/useFetch'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import {
  IconBell,
  IconChevronDown,
  IconChevronRight,
  IconSettings,
  IconUserCircle,
  IconChevronsLeft,
  IconChevronsRight,
  IconPlus,
  IconX,
  IconCheck,
} from '@tabler/icons-vue'
import DatePicker from '@/components/reusable/DatePicker.vue'
import Avatar from 'primevue/avatar'

defineProps({
  collapsed: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle-sidebar'])

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

const showMenu = ref(false)
const menuRef  = ref(null)

const initials = (name) =>
  name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '??'

// Breadcrumb section crumbs (e.g. "Manage", "Logs") aren't pages themselves,
// but clicking one opens a dropdown of that section's pages so the
// breadcrumb doubles as quick navigation, not just a static label.
const openSection = ref(null)

function sectionItems(label) {
  return navSections.find((s) => s.label === label)?.items ?? []
}

function toggleSection(label) {
  openSection.value = openSection.value === label ? null : label
}

function closeSection() {
  openSection.value = null
}

function handleClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    showMenu.value = false
  }
  if (!e.target.closest('.breadcrumb__crumb--section')) {
    closeSection()
  }
  if (!e.target.closest('.form-select')) {
    // A modal dropdown closed by outside click still tweens the height shut.
    const modalFields = ['billing', 'domain', 'network', 'webapp', 'source', 'activationDate', 'expirationDate']
    if (showCreateCompanyModal.value && modalFields.includes(openFieldMenu.value)) {
      animateModalHeight(() => {
        openFieldMenu.value = null
      })
    } else {
      openFieldMenu.value = null
    }
  }
}

onMounted(()  => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

function logout() {
  showMenu.value = false
  auth.logout()
  router.push({ name: 'login' })
}

// A route can flag part of its UI (e.g. tabs) as living in a query param via
// meta.tabQuery — when that param is set, the breadcrumb pushes the static
// page title down into a clickable crumb and shows the active tab's label
// as the new current page instead, so e.g. Company > Overview / Company list.
const activeTabLabel = computed(() => {
  const key = route.meta.tabQuery && route.query[route.meta.tabQuery]
  return key ? route.meta.tabLabels?.[key] : null
})

const breadcrumbCrumbs = computed(() => {
  const base = route.meta.crumbs ?? []
  return activeTabLabel.value ? [...base, { label: route.meta.title, to: route.path }] : base
})

const breadcrumbTitle = computed(() => activeTabLabel.value ?? route.meta.title)

// ── Company-page-only navbar controls ────────────────────────────────────────
const isCompanyPage = computed(() => route.path === '/companies')

const { data: companyList } = useFetch(() => get('/company/list'))
const companyOptions = computed(() =>
  (companyList.value ?? [])
    .filter((c) => (c.type ?? '').toLowerCase() === 'head company')
    .map((c) => ({ value: c.name, label: c.name }))
)

const companyFilter = ref(route.query.q || null)

watch(() => route.query.q, (val) => {
  if ((val || null) !== companyFilter.value) companyFilter.value = val || null
})

watch(companyFilter, (val) => {
  const next = val || undefined
  if ((route.query.q ?? undefined) === next && route.path === '/companies') return
  // Always land on the Company list tab so the filter has a visible effect
  router.push({ path: '/companies', query: { tab: 'list', ...(next ? { q: next } : {}) } })
})

onMounted(()  => document.addEventListener('mousedown', handleClickOutside))

// ── Create Company modal ─────────────────────────────────────────────────────
const showCreateCompanyModal = ref(false)
const newCompanyName = ref('')
const billingModel = ref(null)
const domainQuota = ref(null)
const networkQuota = ref(null)
const webappQuota = ref(null)
const sourceQuota = ref(null)
const createCompanyState = ref('idle') // 'idle' | 'loading' | 'saved'
const createStep = ref('form') // 'form' | 'activation' — contract flow is two steps
const activationEnabled = ref(false)
const activationDate = ref('')
const expirationDate = ref('')

// Which of the modal's dropdown fields is currently open (only one at a time).
// Rendered inline, right below its own trigger — it pushes the rest of the
// form (and the Cancel/Next row) down rather than floating over it.
const openFieldMenu = ref(null)

const billingOptions = [
  { value: 'contract', label: 'Contract Based' },
  { value: 'credit',   label: 'Credit Based' },
]

const quotaOptions = [
  { value: 'unlimited', label: 'Unlimited' },
  { value: '1',  label: '1 scan / month' },
  { value: '2',  label: '2 scans / month' },
  { value: '3',  label: '3 scans / month' },
  { value: '4',  label: '4 scans / month' },
  { value: '5',  label: '5 scans / month' },
  { value: '6',  label: '6 scans / month' },
  { value: '7',  label: '7 scans / month' },
  { value: '8',  label: '8 scans / month' },
  { value: '9',  label: '9 scans / month' },
  { value: '10', label: '10 scans / month' },
  { value: '11', label: '11 scans / month' },
  { value: '12', label: '12 scans / month' },
]

// Only Contract Based needs the per-module quotas set up front — Credit
// Based is pay-as-you-go, so those fields don't apply and stay hidden.
const showQuotaFields = computed(() => billingModel.value === 'contract')

const canCreateCompany = computed(() => {
  if (!newCompanyName.value.trim() || !billingModel.value) return false
  if (showQuotaFields.value) {
    return !!(domainQuota.value && networkQuota.value && webappQuota.value && sourceQuota.value)
  }
  return true
})

// Step 2 (contract only): toggle off → Save stays active; toggle on → both
// dates required and expiration must not precede activation.
const canSaveActivation = computed(() => {
  if (!activationEnabled.value) return true
  if (!activationDate.value || !expirationDate.value) return false
  return expirationDate.value >= activationDate.value
})

function openCreateCompany() {
  newCompanyName.value = ''
  billingModel.value = null
  domainQuota.value = null
  networkQuota.value = null
  webappQuota.value = null
  sourceQuota.value = null
  createStep.value = 'form'
  activationEnabled.value = false
  activationDate.value = ''
  expirationDate.value = ''
  openFieldMenu.value = null
  createCompanyState.value = 'idle'
  // Fresh open always starts at natural height.
  if (createModalEl.value) createModalEl.value.style.height = ''
  showCreateCompanyModal.value = true
}

function closeCreateCompanyModal() {
  showCreateCompanyModal.value = false
  openFieldMenu.value = null
  if (createModalEl.value) {
    if (createModalEl.value._releaseTimer) clearTimeout(createModalEl.value._releaseTimer)
    createModalEl.value.style.height = ''
  }
}

function toggleFieldMenu(key) {
  animateModalHeight(() => {
    openFieldMenu.value = openFieldMenu.value === key ? null : key
  })
}

// The modal tweens its own height to follow in-flow panels: lock to the
// current height, apply the DOM change, measure the new natural height,
// then release back to auto once the tween finishes.
const createModalEl = ref(null)

function animateModalHeight(mutate) {
  const modal = createModalEl.value
  if (!modal) {
    mutate()
    return
  }
  if (modal._releaseTimer) clearTimeout(modal._releaseTimer)
  modal.style.height = `${modal.offsetHeight}px`
  mutate()
  nextTick(() => {
    requestAnimationFrame(() => {
      const target = Math.min(modal.scrollHeight, Math.floor(window.innerHeight * 0.88))
      // Already at the target height — no transition will run (and none is
      // needed), so release immediately instead of stranding a pixel height.
      if (Math.abs(target - modal.offsetHeight) < 2) {
        modal.style.height = ''
        return
      }
      modal.style.height = `${target}px`
      // Safety net: a skipped transitionend (interrupted tween, throttled
      // frames) must never leave a stale pixel height behind.
      modal._releaseTimer = setTimeout(() => {
        modal.style.height = ''
      }, 500)
    })
  })
}

function releaseModalHeight(e) {
  if (e.propertyName !== 'height') return
  if (createModalEl.value) createModalEl.value.style.height = ''
}

function toggleActivation() {
  animateModalHeight(() => {
    activationEnabled.value = !activationEnabled.value
  })
}

const fieldRefs = { domain: domainQuota, network: networkQuota, webapp: webappQuota, source: sourceQuota }

// Each of the 5 fields renders its own inline menu (only one open at a
// time via openFieldMenu), but they all funnel through this one setter.
function selectFieldOption(value) {
  animateModalHeight(() => {
    if (openFieldMenu.value === 'billing') {
      billingModel.value = value
      // Switching away from Contract Based clears any quotas already chosen —
      // they're hidden and no longer part of the payload.
      if (value !== 'contract') {
        domainQuota.value = null
        networkQuota.value = null
        webappQuota.value = null
        sourceQuota.value = null
      }
    } else if (fieldRefs[openFieldMenu.value]) {
      fieldRefs[openFieldMenu.value].value = value
    }
    openFieldMenu.value = null
  })
}

// Calendar picks funnel through here so choosing a new activation date can
// also drop an expiration date it would invalidate.
function selectDate(field, iso) {
  animateModalHeight(() => {
    if (field === 'activationDate') {
      activationDate.value = iso
      if (expirationDate.value && expirationDate.value < iso) expirationDate.value = ''
    } else {
      expirationDate.value = iso
    }
    openFieldMenu.value = null
  })
}

function submitCreateCompany() {
  if (!canCreateCompany.value || createCompanyState.value !== 'idle') return
  // Contract flow continues to the activation step instead of saving here.
  if (showQuotaFields.value) {
    animateModalHeight(() => {
      activationEnabled.value = false
      activationDate.value = ''
      expirationDate.value = ''
      createStep.value = 'activation'
    })
    return
  }
  createCompanyState.value = 'loading'
  setTimeout(() => {
    // stub — wire up to a real create-company API call when it exists
    console.info('Create company', {
      name: newCompanyName.value.trim(),
      billingModel: billingModel.value,
      quotas: null,
      activation: null,
    })
    createCompanyState.value = 'saved'
    setTimeout(closeCreateCompanyModal, 700)
  }, 500)
}

function submitActivation() {
  if (!canSaveActivation.value || createCompanyState.value !== 'idle') return
  createCompanyState.value = 'loading'
  setTimeout(() => {
    // stub — wire up to a real create-company API call when it exists
    console.info('Create company', {
      name: newCompanyName.value.trim(),
      billingModel: billingModel.value,
      quotas: { domain: domainQuota.value, network: networkQuota.value, webapp: webappQuota.value, source: sourceQuota.value },
      activation: activationEnabled.value
        ? { activationDate: activationDate.value, expirationDate: expirationDate.value }
        : null,
    })
    createCompanyState.value = 'saved'
    setTimeout(closeCreateCompanyModal, 700)
  }, 500)
}
</script>

<template>
  <header class="navbar">
    <div class="navbar__left">
      <button
        class="navbar__icon-btn"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="emit('toggle-sidebar')"
      >
        <component :is="collapsed ? IconChevronsRight : IconChevronsLeft" :size="18" />
      </button>
      <nav v-if="route.meta.title" class="breadcrumb" aria-label="Breadcrumb">
        <template v-for="(crumb, i) in breadcrumbCrumbs" :key="i">
          <RouterLink v-if="crumb.to" :to="crumb.to" class="breadcrumb__crumb breadcrumb__crumb--link">
            {{ crumb.label }}
          </RouterLink>
          <span v-else class="breadcrumb__crumb breadcrumb__crumb--section">
            <button
              type="button"
              class="breadcrumb__section-btn"
              :class="{ 'breadcrumb__section-btn--open': openSection === crumb.label }"
              @click="toggleSection(crumb.label)"
            >
              {{ crumb.label }}
              <IconChevronDown :size="12" class="breadcrumb__section-chevron" />
            </button>

            <div v-if="openSection === crumb.label" class="breadcrumb__section-menu">
              <RouterLink
                v-for="item in sectionItems(crumb.label)"
                :key="item.route"
                :to="item.route"
                class="breadcrumb__section-item"
                @click="closeSection"
              >
                <component :is="item.icon" :size="15" />
                {{ item.label }}
              </RouterLink>
            </div>
          </span>
          <IconChevronRight :size="14" class="breadcrumb__sep" />
        </template>
        <h1 class="breadcrumb__current">{{ breadcrumbTitle }}</h1>
      </nav>
      <slot />
    </div>

    <div class="navbar__right">
      <template v-if="isCompanyPage">
        <button type="button" class="navbar__create-company" @click="openCreateCompany">
          <IconPlus :size="16" />
          Create Company
        </button>

        <div class="navbar__divider" />
      </template>

      <FilterDropdown
        v-model="companyFilter"
        :options="companyOptions"
        placeholder="Filter company"
      />

      <button class="navbar__icon-btn navbar__icon-btn--notif" aria-label="Notifications">
        <IconBell :size="18" />
        <span class="notif-dot" />
      </button>

      <div class="navbar__divider" />

      <!-- User button + dropdown -->
      <div ref="menuRef" class="navbar__user-wrap">
        <button
          class="navbar__user"
          :class="{ 'navbar__user--open': showMenu }"
          @click="showMenu = !showMenu"
        >
          <Avatar
            :label="initials(auth.user?.name)"
            class="navbar__avatar"
            size="small"
            shape="circle"
          />
          <span class="navbar__username">{{ auth.user?.name }}</span>
          <IconChevronDown
            :size="14"
            class="navbar__chevron"
            :class="{ 'navbar__chevron--up': showMenu }"
          />
        </button>

        <!-- Dropdown -->
        <transition name="dropdown">
          <div v-if="showMenu" class="user-menu">
            <!-- User info -->
            <div class="user-menu__profile">
              <Avatar
                :label="initials(auth.user?.name)"
                class="user-menu__avatar user-menu__avatar--bounce"
                size="large"
                shape="circle"
              />
              <div class="user-menu__name">{{ auth.user?.name ?? '—' }}</div>
              <div class="user-menu__email">{{ auth.user?.email ?? '—' }}</div>
            </div>

            <!-- Actions -->
            <div class="user-menu__grid">
              <button class="user-menu__card" @click="showMenu = false">
                <IconUserCircle :size="20" />
                <span>Profile</span>
              </button>

              <button class="user-menu__card" @click="showMenu = false">
                <IconSettings :size="20" />
                <span>Settings</span>
              </button>
            </div>

            <button class="user-menu__logout" @click="logout">Log out</button>
          </div>
        </transition>
      </div>
    </div>
  </header>

  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="showCreateCompanyModal" class="modal-backdrop" @mousedown.self="closeCreateCompanyModal">
        <div ref="createModalEl" class="create-modal" @transitionend.self="releaseModalHeight">
          <div class="create-modal__head">
            <h2 class="create-modal__title">Create Company</h2>
            <button type="button" class="create-modal__close" aria-label="Close" @click="closeCreateCompanyModal">
              <IconX :size="22" />
            </button>
          </div>

          <div class="create-modal__body">
            <template v-if="createStep === 'form'">
            <label class="create-modal__label" for="create-company-name">Company name<span class="create-modal__required">*</span></label>
            <input
              id="create-company-name"
              v-model="newCompanyName"
              type="text"
              class="create-modal__input"
              placeholder="input company name..."
            />

            <label class="create-modal__label">Billing model<span class="create-modal__required">*</span></label>
            <div class="form-select">
              <button type="button" class="form-select__trigger" @click="toggleFieldMenu('billing')">
                <span :class="{ 'form-select__trigger-text--placeholder': !billingModel }">
                  {{ billingOptions.find((o) => o.value === billingModel)?.label ?? 'select billing model...' }}
                </span>
                <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': openFieldMenu === 'billing' }" />
              </button>

              <div class="select-panel select-panel--billing" :class="{ open: openFieldMenu === 'billing' }">
                <div class="form-select__inline-menu select-panel__inner">
                  <button
                    v-for="opt in billingOptions"
                    :key="opt.value"
                    type="button"
                    class="form-select__inline-item"
                    :class="{ 'form-select__inline-item--active': opt.value === billingModel }"
                    @click="selectFieldOption(opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
            </div>

            <div class="quota-panel" :class="{ 'quota-panel--open': showQuotaFields }">
              <div class="quota-stagger-item" :class="{ 'quota-stagger-item--animate': showQuotaFields }">
                <label class="create-modal__label">Domain inspection scan quota for one month<span class="create-modal__required">*</span></label>
                <div class="form-select">
                  <button type="button" class="form-select__trigger" @click="toggleFieldMenu('domain')">
                    <span :class="{ 'form-select__trigger-text--placeholder': !domainQuota }">
                      {{ quotaOptions.find((o) => o.value === domainQuota)?.label ?? 'select quota' }}
                    </span>
                    <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': openFieldMenu === 'domain' }" />
                  </button>
                  <div class="select-panel" :class="{ open: openFieldMenu === 'domain' }">
                    <div class="form-select__inline-menu select-panel__inner">
                      <button
                        v-for="opt in quotaOptions"
                        :key="opt.value"
                        type="button"
                        class="form-select__inline-item"
                        :class="{ 'form-select__inline-item--active': opt.value === domainQuota }"
                        @click="selectFieldOption(opt.value)"
                      >
                        {{ opt.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="quota-stagger-item" :class="{ 'quota-stagger-item--animate': showQuotaFields }">
                <label class="create-modal__label">Network scan quota for one month<span class="create-modal__required">*</span></label>
                <div class="form-select">
                  <button type="button" class="form-select__trigger" @click="toggleFieldMenu('network')">
                    <span :class="{ 'form-select__trigger-text--placeholder': !networkQuota }">
                      {{ quotaOptions.find((o) => o.value === networkQuota)?.label ?? 'select quota' }}
                    </span>
                    <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': openFieldMenu === 'network' }" />
                  </button>
                  <div class="select-panel" :class="{ open: openFieldMenu === 'network' }">
                    <div class="form-select__inline-menu select-panel__inner">
                      <button
                        v-for="opt in quotaOptions"
                        :key="opt.value"
                        type="button"
                        class="form-select__inline-item"
                        :class="{ 'form-select__inline-item--active': opt.value === networkQuota }"
                        @click="selectFieldOption(opt.value)"
                      >
                        {{ opt.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="quota-stagger-item" :class="{ 'quota-stagger-item--animate': showQuotaFields }">
                <label class="create-modal__label">Web application scan quota for one month<span class="create-modal__required">*</span></label>
                <div class="form-select">
                  <button type="button" class="form-select__trigger" @click="toggleFieldMenu('webapp')">
                    <span :class="{ 'form-select__trigger-text--placeholder': !webappQuota }">
                      {{ quotaOptions.find((o) => o.value === webappQuota)?.label ?? 'select quota' }}
                    </span>
                    <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': openFieldMenu === 'webapp' }" />
                  </button>
                  <div class="select-panel" :class="{ open: openFieldMenu === 'webapp' }">
                    <div class="form-select__inline-menu select-panel__inner">
                      <button
                        v-for="opt in quotaOptions"
                        :key="opt.value"
                        type="button"
                        class="form-select__inline-item"
                        :class="{ 'form-select__inline-item--active': opt.value === webappQuota }"
                        @click="selectFieldOption(opt.value)"
                      >
                        {{ opt.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="quota-stagger-item" :class="{ 'quota-stagger-item--animate': showQuotaFields }">
                <label class="create-modal__label">Source code scan quota for one month<span class="create-modal__required">*</span></label>
                <div class="form-select">
                  <button type="button" class="form-select__trigger" @click="toggleFieldMenu('source')">
                    <span :class="{ 'form-select__trigger-text--placeholder': !sourceQuota }">
                      {{ quotaOptions.find((o) => o.value === sourceQuota)?.label ?? 'select quota' }}
                    </span>
                    <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': openFieldMenu === 'source' }" />
                  </button>
                  <div class="select-panel" :class="{ open: openFieldMenu === 'source' }">
                    <div class="form-select__inline-menu select-panel__inner">
                      <button
                        v-for="opt in quotaOptions"
                        :key="opt.value"
                        type="button"
                        class="form-select__inline-item"
                        :class="{ 'form-select__inline-item--active': opt.value === sourceQuota }"
                        @click="selectFieldOption(opt.value)"
                      >
                        {{ opt.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </template>

            <template v-else>
              <p class="create-modal__desc">Activate your company account now to start using all features right away. Not ready yet? You can set it up later.</p>
              <div class="activation-card">
                <div class="activation-card__row">
                  <div class="activation-card__text">
                    <div class="activation-card__title">Set up company account activation</div>
                    <div class="activation-card__desc">This setup can be configured later in the company section.</div>
                  </div>
                  <button
                    type="button"
                    class="toggle-switch"
                    :class="{ 'toggle-switch--on': activationEnabled }"
                    role="switch"
                    :aria-checked="activationEnabled"
                    @click="toggleActivation"
                  >
                    <span class="toggle-switch__thumb" />
                  </button>
                </div>
                <Transition name="form-select-fade">
                  <div v-if="activationEnabled" class="activation-card__dates">
                    <div class="activation-card__divider" />
                    <label class="create-modal__label">Company account activation date<span class="create-modal__required">*</span></label>
                    <DatePicker
                      v-model="activationDate"
                      :open="openFieldMenu === 'activationDate'"
                      @toggle="toggleFieldMenu('activationDate')"
                      @select="selectDate('activationDate', $event)"
                    />
                    <label class="create-modal__label">Company account expiration date<span class="create-modal__required">*</span></label>
                    <DatePicker
                      v-model="expirationDate"
                      :open="openFieldMenu === 'expirationDate'"
                      :min="activationDate || undefined"
                      @toggle="toggleFieldMenu('expirationDate')"
                      @select="selectDate('expirationDate', $event)"
                    />
                  </div>
                </Transition>
              </div>
            </template>
          </div>

          <div class="create-modal__actions">
            <button type="button" class="modal-btn modal-btn--cancel" @click="closeCreateCompanyModal">Cancel</button>
            <button
              v-if="createStep === 'form'"
              type="button"
              class="modal-btn"
              :class="canCreateCompany
                ? { 'modal-btn--save': true, 'modal-btn--saved': createCompanyState === 'saved' }
                : 'modal-btn--create'"
              :disabled="!canCreateCompany"
              @click="submitCreateCompany"
            >
              <span v-if="createCompanyState === 'loading'" class="modal-btn__spinner" />
              <IconCheck v-else-if="createCompanyState === 'saved'" :size="18" class="modal-btn__check" />
              <span v-else>{{ showQuotaFields ? 'Next' : 'Save' }}</span>
            </button>
            <button
              v-else
              type="button"
              class="modal-btn"
              :class="canSaveActivation
                ? { 'modal-btn--save': true, 'modal-btn--saved': createCompanyState === 'saved' }
                : 'modal-btn--create'"
              :disabled="!canSaveActivation"
              @click="submitActivation"
            >
              <span v-if="createCompanyState === 'loading'" class="modal-btn__spinner" />
              <IconCheck v-else-if="createCompanyState === 'saved'" :size="18" class="modal-btn__check" />
              <span v-else>Save</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.navbar {
  height: 60px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: var(--glacia-glass-fill);
  border-bottom: 1px solid var(--glacia-glass-border);
  backdrop-filter: blur(var(--glacia-blur-md)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--glacia-blur-md)) saturate(140%);
  box-shadow: inset 0 -1px 0 var(--glacia-glass-border);
  position: sticky;
  top: 0;
  z-index: 20;

  &__left  {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  &__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--glacia-radius-sm);
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--glacia-ink-dim);
    position: relative;
    transition: background 0.13s, color 0.13s;

    &:hover { background: var(--glacia-glass-fill-strong); color: var(--glacia-ink); }

    &--notif .notif-dot {
      position: absolute;
      top: 7px; right: 7px;
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--glacia-red);
      border: 2px solid transparent;
    }
  }

  &__divider {
    width: 1px;
    height: 24px;
    background: var(--glacia-glass-border);
    margin: 0 6px;
  }

  &__create-company {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 14px;
    border-radius: var(--glacia-radius-pill);
    border: none;
    background: var(--glacia-red);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    box-shadow: 0 6px 20px rgba(255, 37, 41, 0.4);
    transition: background 0.15s, box-shadow 0.15s;

    &:hover {
      background: #e01e22;
      box-shadow: 0 8px 24px rgba(255, 37, 41, 0.5);
    }
  }

  &__user-wrap {
    position: relative;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 10px 5px 6px;
    border-radius: var(--glacia-radius-sm);
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--glacia-ink);
    transition: background 0.13s;

    &:hover, &--open { background: var(--glacia-glass-fill-strong); }
  }

  &__avatar {
    background: var(--glacia-red) !important;
    color: #fff !important;
    font-size: var(--text-xs) !important;
    font-weight: 700 !important;
  }

  &__username {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--glacia-ink);
    max-width: 120px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__chevron {
    transition: transform 0.18s ease;
    color: var(--glacia-ink-dim);

    &--up { transform: rotate(180deg); }
  }
}

// ── Breadcrumb ───────────────────────────────────────────────────────────────

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;

  &__crumb {
    font-size: 14px;
    font-weight: 500;
    color: var(--glacia-ink-dim);
    white-space: nowrap;

    &--link {
      text-decoration: none;
      border-radius: 6px;
      padding: 2px 4px;
      margin: -2px -4px;
      transition: background 0.13s, color 0.13s;

      &:hover {
        color: var(--glacia-red);
        background: rgba(255, 37, 41, 0.08);
      }
    }

    &--section {
      position: relative;
    }
  }

  &__section-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: none;
    background: transparent;
    padding: 2px 4px;
    margin: -2px -4px;
    border-radius: 6px;
    font: inherit;
    font-size: 14px;
    font-weight: 500;
    color: var(--glacia-ink-dim);
    cursor: pointer;
    transition: background 0.13s, color 0.13s;

    &:hover,
    &--open {
      color: var(--glacia-red);
      background: rgba(255, 37, 41, 0.08);
    }
  }

  &__section-chevron {
    transition: transform 0.18s ease;
    opacity: 0.7;

    .breadcrumb__section-btn--open & {
      transform: rotate(180deg);
    }
  }

  &__section-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 210px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 12px 28px -6px rgba(16, 24, 32, 0.2);
    overflow: hidden;
    padding: 6px;
    z-index: 100;
    transform-origin: top left;
    animation: breadcrumb-menu-bounce 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &__section-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 10px;
    border-radius: 8px;
    color: var(--glacia-ink);
    font-size: 13px;
    font-weight: 500;
    font-family: 'Manrope', 'Inter', sans-serif;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.13s, color 0.13s;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
  }

  &__sep {
    color: var(--glacia-ink-dim);
    opacity: 0.6;
    flex-shrink: 0;
  }

  &__current {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--glacia-ink);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// ── Dropdown ─────────────────────────────────────────────────────────────────

.user-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 28px -6px rgba(16, 24, 32, 0.2);
  overflow: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 100;

  &__profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
  }

  &__avatar {
    background: var(--glacia-red) !important;
    color: #fff !important;
    font-weight: 700 !important;

    &--bounce {
      animation: menu-avatar-bounce 0.4s ease;
    }
  }

  &__name {
    margin-top: 6px;
    font-size: 14px;
    font-weight: 700;
    color: var(--glacia-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    animation: menu-body-fade 0.3s ease 0.15s both;
  }

  &__email {
    font-size: 12px;
    color: var(--glacia-ink-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    animation: menu-body-fade 0.3s ease 0.2s both;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    animation: menu-body-fade 0.3s ease 0.26s both;
  }

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 8px;
    border: 1px solid var(--glacia-glass-border);
    border-radius: 12px;
    background: none;
    color: var(--glacia-ink-dim);
    font-size: 12px;
    font-family: 'Manrope', 'Inter', sans-serif;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);
    transition: background 0.13s, border-color 0.13s, box-shadow 0.13s;

    &:hover {
      background: rgba(0, 0, 0, 0.03);
      border-color: var(--glacia-ink-dim);
      box-shadow: 0 2px 6px rgba(16, 24, 32, 0.12);
    }
  }

  &__logout {
    border: none;
    border-radius: 12px;
    padding: 10px;
    background: rgba(220, 38, 38, 0.08);
    color: var(--glacia-sev-critical);
    font-weight: 600;
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 13.5px;
    cursor: pointer;
    transition: background 0.13s;
    animation: menu-body-fade 0.3s ease 0.32s both;

    &:hover {
      background: rgba(220, 38, 38, 0.14);
    }
  }
}

@keyframes breadcrumb-menu-bounce {
  0%   { opacity: 0; transform: scale(0.9) translateY(-6px); }
  60%  { opacity: 1; transform: scale(1.03) translateY(0); }
  100% { transform: scale(1); }
}

@keyframes menu-avatar-bounce {
  0%   { opacity: 0; transform: scale(0.4); }
  60%  { opacity: 1; transform: scale(1.12); }
  100% { transform: scale(1); }
}

@keyframes menu-body-fade {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

// ── Dropdown animation ────────────────────────────────────────────────────────

.dropdown-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

// ── Create Company modal ─────────────────────────────────────────────────────

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
  max-width: 540px;
  max-height: 88vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  padding: 28px;
  animation: create-modal-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  // Height is tweened by JS (animateModalHeight) whenever in-flow panels
  // open/close, so the modal grows and shrinks with its content.
  transition: height 0.38s cubic-bezier(0.4, 0, 0.2, 1);

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
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

  &__label {
    display: block;
    margin: 16px 0 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--glacia-ink);
  }

  &__desc {
    margin: 8px 0 0;
    font-size: 14px;
    line-height: 1.55;
    color: var(--glacia-ink);
  }

  &__required {
    color: var(--glacia-red);
    margin-left: 2px;
  }

  &__input {
    width: 100%;
    height: 54px;
    padding: 0 18px;
    border-radius: 14px;
    border: 0.5px solid var(--glacia-glass-border);
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
  }

  &__actions {
    display: flex;
    gap: 14px;
    margin-top: 22px;
  }
}

@keyframes create-modal-bounce {
  0%   { opacity: 0; transform: scale(0.92) translateY(10px); }
  60%  { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
}

.create-modal__body {
  // No height cap or scroll here — the modal shell itself tweens its height
  // to follow this content (see animateModalHeight).
  overflow-x: hidden;
  // Room for the dropdown menus' shadow/focus ring without clipping.
  padding: 2px 2px 0;
  margin: 0 -2px;
}

// In-flow dropdown panel: always rendered, expands via max-height so the
// modal height can follow it instead of popping in over content.
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

  &--billing.open {
    max-height: 170px;
  }

  &__inner {
    margin-top: 0;
  }
}

// Always rendered (not v-if'd) and driven by max-height + opacity instead of
// a Vue <Transition> — this reveals the panel growing open rather than
// popping/sliding as one block, and lets each field inside stagger in on
// its own (see .quota-stagger-item) instead of moving in lockstep.
.quota-panel {
  display: flex;
  flex-direction: column;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.42s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;

  &--open {
    // Room for the quota dropdowns' expanding panels.
    max-height: 1000px;
    opacity: 1;
  }
}

.quota-stagger-item {
  opacity: 0;

  &--animate {
    animation: quota-stagger-in 0.32s ease both;
  }

  // Cascading delay per field, matching the panel's own reveal so each
  // field visibly follows the one before it instead of all arriving at once.
  &:nth-child(1).quota-stagger-item--animate { animation-delay: 0.1s; }
  &:nth-child(2).quota-stagger-item--animate { animation-delay: 0.16s; }
  &:nth-child(3).quota-stagger-item--animate { animation-delay: 0.22s; }
  &:nth-child(4).quota-stagger-item--animate { animation-delay: 0.28s; }
}

@keyframes quota-stagger-in {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
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

  // Inline — lives in normal document flow right below the trigger, full
  // width to match it, so opening it pushes the rest of the form (and the
  // Cancel/Next row) down instead of floating over them.
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

// translateY-only, same reasoning as .quota-fields above — scaling this
// bordered box distorted its border/padding rather than reading as smooth.
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

.activation-card {
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  padding: 18px;
  border-radius: 16px;
  border: 0.5px solid var(--glacia-glass-border);
  background: #fff;
  box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);

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

    &:not(:disabled):not(.modal-btn--saved):hover {
      background: #e6212c;
    }
  }

  &--saved {
    background: #16a34a;
    box-shadow: 0 8px 20px -6px rgba(22, 163, 74, 0.4);
  }

  &--create {
    background: var(--glacia-glass-fill-strong);
    color: var(--glacia-ink);
    border: 1px solid var(--glacia-glass-border);

    &:disabled {
      color: var(--glacia-ink-dim);
      cursor: default;
    }

    &:not(:disabled):hover {
      background: rgba(255, 37, 41, 0.08);
      border-color: rgba(255, 37, 41, 0.3);
      color: var(--glacia-red);
    }
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
</style>
