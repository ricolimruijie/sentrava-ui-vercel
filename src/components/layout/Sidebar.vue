<script setup>
import { useRoute } from 'vue-router'
import {
  IconShieldFilled,
  IconLayoutGrid,
  IconWorld,
  IconNetwork,
  IconBrowser,
  IconCode,
  IconGitPullRequest,
  IconDeviceDesktop,
  IconBuilding,
  IconKey,
  IconTicket,
} from '@tabler/icons-vue'

const props = defineProps({
  collapsed: { type: Boolean, default: false },
})

const route = useRoute()

const sections = [
  {
    label: 'Menu',
    items: [
      { label: 'Dashboard',         icon: IconLayoutGrid,     route: '/dashboard' },
    ],
  },
  {
    label: 'Services',
    items: [
      { label: 'Domain Inspection', icon: IconWorld,          route: '/assets/domains' },
      { label: 'Network',           icon: IconNetwork,        route: '/assets/networks' },
      { label: 'Web Application',   icon: IconBrowser,        route: '/assets/webapps' },
      { label: 'Source Code',       icon: IconCode,           route: '/assets/source-code' },
    ],
  },
  {
    label: 'Logs',
    items: [
      { label: 'CI / CD',           icon: IconGitPullRequest, route: '/scans/history' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Asset Inventory',   icon: IconDeviceDesktop,  route: '/assets' },
      { label: 'Company',           icon: IconBuilding,       route: '/companies' },
      { label: 'API Keys',          icon: IconKey,            route: '/settings/api-keys' },
      { label: 'Ticket',            icon: IconTicket,         route: '/tickets' },
    ],
  },
]

function isActive(itemRoute) {
  if (itemRoute === '/assets') return route.path === '/assets'
  return route.path === itemRoute || route.path.startsWith(itemRoute + '/')
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': props.collapsed }">

    <!-- ── Header ──────────────────────────────────────────────── -->
    <div class="sidebar__header">
      <IconShieldFilled class="sidebar__logo-icon" :size="26" aria-hidden="true" />
      <transition name="label-fade">
        <span v-if="!props.collapsed" class="sidebar__logo-text">SentraVA</span>
      </transition>
    </div>

    <!-- ── Nav ──────────────────────────────────────────────────── -->
    <nav class="sidebar__nav">
      <div
        v-for="section in sections"
        :key="section.label"
        class="sidebar__section"
      >
        <transition name="label-fade">
          <p v-if="!props.collapsed" class="sidebar__section-label">{{ section.label }}</p>
        </transition>
        <!-- collapsed divider replaces the label -->
        <div v-if="props.collapsed" class="sidebar__section-divider" />

        <router-link
          v-for="item in section.items"
          :key="item.route"
          :to="item.route"
          class="sidebar__item"
          :class="{ 'sidebar__item--active': isActive(item.route) }"
          :title="props.collapsed ? item.label : undefined"
        >
          <component
            :is="item.icon"
            class="sidebar__item-icon"
            :size="20"
            stroke-width="1.75"
            aria-hidden="true"
          />
          <transition name="label-fade">
            <span v-if="!props.collapsed" class="sidebar__item-label">{{ item.label }}</span>
          </transition>
        </router-link>
      </div>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
// ── Variables ───────────────────────────────────────────────────────────────
$w-expanded:  230px;
$w-collapsed:  64px;

.sidebar {
  width: $w-expanded;
  min-width: $w-expanded;
  height: 100vh;
  background: var(--glacia-glass-fill);
  border-right: 1px solid var(--glacia-glass-border);
  backdrop-filter: blur(var(--glacia-blur-lg)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--glacia-blur-lg)) saturate(140%);
  display: flex;
  flex-direction: column;
  padding: 0 10px 24px;
  overflow: hidden;
  flex-shrink: 0;
  transition: width 0.22s ease, min-width 0.22s ease;

  &--collapsed {
    width: $w-collapsed;
    min-width: $w-collapsed;
  }

  // ── Header ──────────────────────────────────────────────────────
  &__header {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 18px 10px 24px;
    flex-shrink: 0;
    overflow: hidden;
  }

  &__logo-icon {
    color: #FF2529;
    flex-shrink: 0;
  }

  &__logo-text {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 14.5px;
    font-weight: 800;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--glacia-ink);
    user-select: none;
    white-space: nowrap;
  }

  // ── Nav ─────────────────────────────────────────────────────────
  &__nav {
    display: flex;
    flex-direction: column;
    gap: 22px;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__section-label {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--glacia-ink-dim);
    padding: 0 10px;
    margin-bottom: 4px;
    user-select: none;
    white-space: nowrap;
    opacity: 0.7;
  }

  &__section-divider {
    height: 1px;
    background: var(--glacia-glass-border);
    margin: 2px 6px 6px;
  }

  // ── Nav item ────────────────────────────────────────────────────
  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 9px;
    color: var(--glacia-ink-dim);
    font-size: 13.5px;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.13s, color 0.13s;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;

    .sidebar--collapsed & {
      justify-content: center;
      padding: 9px 0;
    }

    &:hover:not(&--active) {
      background: var(--glacia-glass-fill-strong);
      color: var(--glacia-ink);
    }

    &--active {
      background: var(--glacia-red);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(255,37,41,0.35);

      &:hover { background: #e01f22; }
    }
  }

  &__item-icon { flex-shrink: 0; }

  &__item-label {
    line-height: 1;
    overflow: hidden;
    white-space: nowrap;
  }
}

// ── Label fade transition ────────────────────────────────────────────────────
.label-fade-enter-active { transition: opacity 0.18s ease 0.08s; }
.label-fade-leave-active { transition: opacity 0.10s ease; }
.label-fade-enter-from,
.label-fade-leave-to     { opacity: 0; }
</style>
