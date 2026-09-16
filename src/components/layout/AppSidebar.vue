<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRole } from '@/composables/useRole'
import { useAuthStore } from '@/store/auth'
import {
  IconLayoutDashboard, IconShieldSearch, IconGlobe, IconNetwork,
  IconWorldWww, IconCode, IconLink, IconBug, IconFileAnalytics,
  IconSettings, IconBuilding, IconCoin, IconLogout, IconChevronLeft,
  IconChevronRight, IconCalendar, IconHistory,
} from '@tabler/icons-vue'

const props = defineProps({
  collapsed: { type: Boolean, default: false },
})
defineEmits(['update:collapsed'])

const route    = useRoute()
const router   = useRouter()
const auth     = useAuthStore()
const { isSuperAdmin, can } = useRole()

const clientNav = [
  { label: 'Dashboard',    to: '/dashboard',        icon: IconLayoutDashboard },
  {
    label: 'Assets', icon: IconShieldSearch, children: [
      { label: 'Domains',     to: '/assets/domains',     icon: IconGlobe },
      { label: 'Networks',    to: '/assets/networks',    icon: IconNetwork },
      { label: 'Web Apps',    to: '/assets/webapps',     icon: IconWorldWww },
      { label: 'Source Code', to: '/assets/source-code', icon: IconCode },
      { label: 'URL Crawl',   to: '/assets/url-crawl',   icon: IconLink },
    ]
  },
  {
    label: 'Scans', icon: IconHistory, children: [
      { label: 'Run Scan',  to: '/scans/run',       icon: IconShieldSearch, perm: 'run_scan' },
      { label: 'History',   to: '/scans/history',   icon: IconHistory },
      { label: 'Scheduled', to: '/scans/scheduled', icon: IconCalendar, perm: 'schedule_scans' },
    ]
  },
  { label: 'Vulnerabilities', to: '/vulnerabilities', icon: IconBug },
  { label: 'Reports',         to: '/reports',          icon: IconFileAnalytics },
  { label: 'Settings',        to: '/settings',         icon: IconSettings },
]

const superNav = [
  { label: 'Dashboard',       to: '/dashboard',       icon: IconLayoutDashboard },
  { label: 'Companies',       to: '/companies',       icon: IconBuilding },
  { label: 'Scans',           to: '/scans/history',   icon: IconHistory },
  { label: 'Vulnerabilities', to: '/vulnerabilities', icon: IconBug },
  { label: 'Credits',         to: '/credits',         icon: IconCoin },
  { label: 'Reports',         to: '/reports',         icon: IconFileAnalytics },
  { label: 'Settings',        to: '/settings',        icon: IconSettings },
]

const navItems = computed(() => isSuperAdmin.value ? superNav : clientNav)

const expandedGroups = ref(new Set())

function toggleGroup(label) {
  expandedGroups.value.has(label)
    ? expandedGroups.value.delete(label)
    : expandedGroups.value.add(label)
}

function isActive(to) {
  return route.path === to || route.path.startsWith(to + '/')
}

function isGroupActive(item) {
  return item.children?.some(c => isActive(c.to))
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
    <!-- Logo -->
    <div class="sidebar__logo">
      <div class="sidebar__logo-mark">
        <span>S</span>
      </div>
      <transition name="fade">
        <span v-if="!collapsed" class="sidebar__logo-text">SentraVA</span>
      </transition>
    </div>

    <!-- Nav -->
    <nav class="sidebar__nav">
      <template v-for="item in navItems" :key="item.label">
        <!-- Group -->
        <template v-if="item.children">
          <button
            class="sidebar__item sidebar__item--group"
            :class="{ active: isGroupActive(item), expanded: expandedGroups.has(item.label) }"
            :title="collapsed ? item.label : undefined"
            @click="!collapsed && toggleGroup(item.label)"
          >
            <component :is="item.icon" class="sidebar__icon" :size="20" />
            <transition name="fade">
              <span v-if="!collapsed" class="sidebar__label">{{ item.label }}</span>
            </transition>
            <transition name="fade">
              <IconChevronRight
                v-if="!collapsed"
                class="sidebar__chevron"
                :class="{ 'sidebar__chevron--open': expandedGroups.has(item.label) }"
                :size="14"
              />
            </transition>
          </button>
          <transition name="expand">
            <div
              v-if="!collapsed && expandedGroups.has(item.label)"
              class="sidebar__children"
            >
              <template v-for="child in item.children" :key="child.to">
                <router-link
                  v-if="!child.perm || can(child.perm)"
                  :to="child.to"
                  class="sidebar__item sidebar__item--child"
                  :class="{ active: isActive(child.to) }"
                >
                  <component :is="child.icon" class="sidebar__icon" :size="16" />
                  <span class="sidebar__label">{{ child.label }}</span>
                </router-link>
              </template>
            </div>
          </transition>
        </template>

        <!-- Link -->
        <router-link
          v-else
          :to="item.to"
          class="sidebar__item"
          :class="{ active: isActive(item.to) }"
          :title="collapsed ? item.label : undefined"
        >
          <component :is="item.icon" class="sidebar__icon" :size="20" />
          <transition name="fade">
            <span v-if="!collapsed" class="sidebar__label">{{ item.label }}</span>
          </transition>
        </router-link>
      </template>
    </nav>

    <!-- Footer -->
    <div class="sidebar__footer">
      <button class="sidebar__item sidebar__logout" @click="auth.logout(); $router.push('/login')">
        <IconLogout :size="20" class="sidebar__icon" />
        <transition name="fade">
          <span v-if="!collapsed" class="sidebar__label">Logout</span>
        </transition>
      </button>

      <!-- Collapse toggle -->
      <button
        class="sidebar__toggle"
        @click="$emit('update:collapsed', !collapsed)"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <component :is="collapsed ? IconChevronRight : IconChevronLeft" :size="16" />
      </button>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  width: $sidebar-width;
  min-width: $sidebar-width;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transition: width 0.22s ease, min-width 0.22s ease;
  overflow: hidden;
  position: sticky;
  top: 0;

  &--collapsed {
    width: $sidebar-collapsed-width;
    min-width: $sidebar-collapsed-width;
  }

  // ── Logo
  &__logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 18px 16px;
    border-bottom: 1px solid var(--color-border);
    min-height: 64px;
  }

  &__logo-mark {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 800;
    font-size: 18px;
  }

  &__logo-text {
    font-size: var(--text-lg);
    font-weight: 800;
    color: var(--color-text);
    white-space: nowrap;
  }

  // ── Nav
  &__nav {
    flex: 1;
    overflow-y: auto;
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    font-weight: 500;
    text-decoration: none;
    width: 100%;
    transition: background 0.13s, color 0.13s;
    white-space: nowrap;

    &:hover   { background: var(--color-bg); color: var(--color-text); }

    &.active {
      background: var(--color-primary-50);
      color: var(--color-primary);
      font-weight: 600;
    }

    &--child {
      padding-left: 32px;
      font-size: var(--text-xs);
    }

    &--group {
      justify-content: flex-start;
    }
  }

  &__icon   { flex-shrink: 0; }
  &__label  { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }

  &__chevron {
    transition: transform 0.2s;
    margin-left: auto;
    flex-shrink: 0;
    &--open { transform: rotate(90deg); }
  }

  &__children {
    overflow: hidden;
  }

  // ── Footer
  &__footer {
    padding: 10px;
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__logout {
    color: var(--color-text-secondary);
    &:hover { color: #DC2626; background: #fef2f2; }
  }

  &__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: transparent;
    cursor: pointer;
    color: var(--color-text-secondary);
    align-self: flex-end;
    transition: background 0.13s;

    &:hover { background: var(--color-bg); }
  }
}

// transitions
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }

.expand-enter-active, .expand-leave-active {
  transition: max-height 0.2s ease, opacity 0.15s;
  max-height: 500px;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
