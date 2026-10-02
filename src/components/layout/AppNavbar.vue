<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRole } from '@/composables/useRole'
import NotificationBell from '@/modules/notifications/components/NotificationBell.vue'
import { navSections } from '@/config/navSections'
import { getCompanyList } from '@/modules/company/services/companyService'
import { dashboardOrigin } from '@/utils/navOrigin'
import { useFetch } from '@/composables/useFetch'
import FilterDropdown from '@/components/common/FilterDropdown.vue'
import {
  IconSun,
  IconMoon,
  IconChevronDown,
  IconChevronRight,
  IconSettings,
  IconChevronsLeft,
  IconChevronsRight,
  IconPlus,
} from '@tabler/icons-vue'
import CreateCompanyModal from '@/modules/company/components/CreateCompanyModal.vue'
import Avatar from 'primevue/avatar'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggle: toggleTheme } = useTheme()

defineProps({
  collapsed: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle-sidebar'])

const auth   = useAuthStore()
const { can, isSuperAdmin } = useRole()
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

function openSettings() {
  showMenu.value = false
  router.push('/settings')
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

const { data: companyList } = useFetch(() => getCompanyList())
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
      <template v-if="isCompanyPage && can('manage_company')">
        <button type="button" class="navbar__create-company" @click="openCreateCompany">
          <IconPlus :size="16" />
          Create Company
        </button>

        <div class="navbar__divider" />
      </template>

      <template v-if="isSuperAdmin">
        <FilterDropdown
          v-model="companyFilter"
          :options="companyOptions"
          placeholder="Filter company"
        />

        <div class="navbar__divider" />
      </template>

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

      <NotificationBell />

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

<style scoped lang="scss" src="./AppNavbar.scss"></style>
