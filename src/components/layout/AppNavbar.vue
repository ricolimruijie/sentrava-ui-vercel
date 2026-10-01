<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { navSections } from '@/config/navSections'
import { get } from '@/utils/request'
import { dashboardOrigin } from '@/utils/navOrigin'
import { useFetch } from '@/composables/useFetch'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import {
  IconBell,
  IconSun,
  IconMoon,
  IconChevronDown,
  IconChevronRight,
  IconSettings,
  IconUserCircle,
  IconChevronsLeft,
  IconChevronsRight,
  IconPlus,
} from '@tabler/icons-vue'
import CreateCompanyModal from '@/components/company/CreateCompanyModal.vue'
import Avatar from 'primevue/avatar'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggle: toggleTheme } = useTheme()

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
}

onMounted(()  => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

// Profile and Settings both open the Settings page (Profile jumps to its Profile section).
function openSettings(section) {
  showMenu.value = false
  router.push({ path: '/settings', query: section ? { section } : {} })
}

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
  // Reached from the Dashboard: breadcrumb starts at Dashboard, not the section.
  const base = dashboardOrigin.value === route.path
    ? [{ label: 'Dashboard', to: '/dashboard' }]
    : (route.meta.crumbs ?? [])
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

// ── Create Company modal (the form itself lives in CreateCompanyModal) ─────
const showCreateCompanyModal = ref(false)
function openCreateCompany() {
  showCreateCompanyModal.value = true
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

      <div class="navbar__divider" />

      <button
        type="button"
        class="navbar__icon-btn navbar__icon-btn--theme"
        :class="{ 'is-dark': isDark }"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        :aria-pressed="isDark"
        :title="isDark ? 'Light mode' : 'Dark mode'"
        @click="toggleTheme"
      >
        <span class="theme-swap">
          <IconSun :size="18" class="theme-swap__sun" />
          <IconMoon :size="18" class="theme-swap__moon" />
        </span>
      </button>

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
              <button class="user-menu__card" @click="openSettings('profile')">
                <IconUserCircle :size="20" />
                <span>Profile</span>
              </button>

              <button class="user-menu__card" @click="openSettings()">
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

  <CreateCompanyModal v-model="showCreateCompanyModal" />
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

    // Sun/moon icons swap with a turn + fade.
    &--theme .theme-swap {
      position: relative;
      width: 18px;
      height: 18px;
      display: block;
    }
    &--theme .theme-swap > svg {
      position: absolute;
      inset: 0;
      transition: transform 0.4s cubic-bezier(0.3, 1.4, 0.5, 1), opacity 0.25s ease;
    }
    &--theme .theme-swap__sun { opacity: 1; transform: rotate(0) scale(1); color: #f59e0b; }
    &--theme .theme-swap__moon { opacity: 0; transform: rotate(-90deg) scale(0.4); }
    &--theme.is-dark .theme-swap__sun { opacity: 0; transform: rotate(90deg) scale(0.4); }
    &--theme.is-dark .theme-swap__moon { opacity: 1; transform: rotate(0) scale(1); color: #a5b4fc; }

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
    background: var(--surface);
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
  background: var(--surface);
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

</style>
