<script setup>
import { ref, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import logoIcon from '@/assets/sentrava-logo-icon.svg'
import { navSections as sections } from '@/config/navSections'

const props = defineProps({
  collapsed: { type: Boolean, default: false },
})

const route = useRoute()

function isActive(itemRoute) {
  if (itemRoute === '/assets') return route.path === '/assets'
  return route.path === itemRoute || route.path.startsWith(itemRoute + '/')
}

function activeItemRoute() {
  for (const section of sections) {
    for (const item of section.items) {
      if (isActive(item.route)) return item.route
    }
  }
  return null
}

// ── Sliding pill behind the active item ──────────────────────────────────────
// Only moves when the active route changes (i.e. the user clicks a different
// item) — hover has its own separate, non-sliding highlight in CSS.
const navRef = ref(null)
const itemEls = {}
function setItemRef(key, el) {
  // router-link resolves to a component instance in the ref callback — grab
  // its root DOM element rather than the proxy.
  const node = el?.$el ?? el
  if (node) itemEls[key] = node
}

const pillStyle = ref({ top: '0px', left: '0px', width: '0px', height: '0px', opacity: 0 })

function movePill() {
  const activeRoute = activeItemRoute()
  const el = activeRoute ? itemEls[activeRoute] : null
  const nav = navRef.value
  if (!el || !nav) {
    pillStyle.value = { ...pillStyle.value, opacity: 0 }
    return
  }
  const elRect = el.getBoundingClientRect()
  const navRect = nav.getBoundingClientRect()
  pillStyle.value = {
    top: `${elRect.top - navRect.top}px`,
    left: `${elRect.left - navRect.left}px`,
    width: `${elRect.width}px`,
    height: `${elRect.height}px`,
    opacity: 1,
  }
}

watch(() => route.path, () => nextTick(movePill))

// While the sidebar animates its width the pill follows it frame by frame (its own
// left/width transition is switched off meanwhile), so it never lags behind or
// overshoots the item it sits on. Position changes between items still slide.
const resizing = ref(false)
let resizeObserver = null
let resizeTimer = null
function onNavResize() {
  resizing.value = true
  movePill()
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => { resizing.value = false }, 150)
}
onMounted(() => {
  nextTick(movePill)
  if (typeof ResizeObserver !== 'undefined' && navRef.value) {
    resizeObserver = new ResizeObserver(onNavResize)
    resizeObserver.observe(navRef.value)
  }
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  clearTimeout(resizeTimer)
})
// Safety net: re-snap once the collapse/expand transition has settled.
watch(() => props.collapsed, () => setTimeout(movePill, 260))
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': props.collapsed }">

    <!-- ── Header ──────────────────────────────────────────────── -->
    <div class="sidebar__header">
      <img :src="logoIcon" class="sidebar__logo-icon" width="30" height="30" alt="" aria-hidden="true" />
      <transition name="label-fade">
        <span v-if="!props.collapsed" class="sidebar__logo-text">SentraVA</span>
      </transition>
    </div>

    <!-- ── Nav ──────────────────────────────────────────────────── -->
    <nav ref="navRef" class="sidebar__nav">
      <div class="sidebar__pill" :class="{ 'sidebar__pill--resizing': resizing }" :style="pillStyle" />

      <div
        v-for="section in sections"
        :key="section.label"
        class="sidebar__section"
      >
        <!-- Fixed-height slot: the label (expanded) and the divider (collapsed) are both absolutely
             positioned inside it, so toggling never moves the items below. -->
        <div class="sidebar__section-head">
          <transition name="label-fade">
            <p v-if="!props.collapsed" class="sidebar__section-label">{{ section.label }}</p>
          </transition>
          <div v-if="props.collapsed" class="sidebar__section-divider" />
        </div>

        <router-link
          v-for="item in section.items"
          :key="item.route"
          :ref="(el) => setItemRef(item.route, el)"
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
    gap: 6px;
    padding: 18px 10px 24px;
    flex-shrink: 0;
    overflow: hidden;
  }

  // Centred on the same vertical line as the nav icons (x = 31.5px) in both states (the negative left
  // margin); the wordmark sits 6px from the icon, same as on the login page.
  &__logo-icon {
    display: block;
    flex-shrink: 0;
    margin: 0 0 0 -3.5px;
  }

  &__logo-text {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 17px; // same size as the SENTRAVA text on the login page
    font-weight: 800;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: #FB0207; // same red as the logo icon (src/assets/sentrava-logo-icon.svg), in light and dark
    user-select: none;
    white-space: nowrap;
  }

  // ── Nav ─────────────────────────────────────────────────────────
  &__nav {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 22px;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  &__pill {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    border-radius: 9px;
    z-index: 0;
    opacity: 0;
    pointer-events: none;
    background: var(--glacia-red);
    box-shadow: 0 4px 14px rgba(255, 37, 41, 0.35);
    transition: top 0.28s cubic-bezier(0.3, 1.15, 0.5, 1), left 0.28s cubic-bezier(0.3, 1.15, 0.5, 1),
      width 0.28s cubic-bezier(0.3, 1.15, 0.5, 1), height 0.28s cubic-bezier(0.3, 1.15, 0.5, 1),
      opacity 0.15s ease;
  }

  &__pill--resizing {
    transition: top 0.28s cubic-bezier(0.3, 1.15, 0.5, 1), height 0.28s cubic-bezier(0.3, 1.15, 0.5, 1),
      opacity 0.15s ease;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__section-head {
    position: relative;
    height: 17px; // label (13px) + its 4px gap
    flex-shrink: 0;
  }

  &__section-label {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    margin: 0;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--glacia-ink-dim);
    padding: 0 10px;
    user-select: none;
    white-space: nowrap;
    opacity: 0.7;
  }

  &__section-divider {
    position: absolute;
    top: 2px;
    left: 6px;
    right: 6px;
    height: 1px;
    background: var(--glacia-glass-border);
  }

  // ── Nav item ────────────────────────────────────────────────────
  // Background/shadow live on the sliding &__pill sitting behind these at
  // z-index:0 — the item itself only ever carries the foreground color.
  &__item {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    // Icon centre at x = 31.5px: the middle of the 43px collapsed pill, so the icon sits in the
    // same spot open and closed. Label position is unchanged (padding-left + gap = 20px).
    gap: 8.5px;
    padding: 9px 10px 9px 11.5px;
    border-radius: 9px;
    color: var(--glacia-ink-dim);
    font-size: 13.5px;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.13s, color 0.13s;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;

    // Icons keep the exact same position when collapsed (the label just disappears).
    .sidebar--collapsed & {
      justify-content: flex-start;
    }

    // Plain, instant hover — the pill only ever slides for the active item.
    &:hover:not(&--active) {
      background: var(--glacia-glass-fill-strong);
      color: var(--glacia-ink);
    }

    &--active {
      color: #ffffff;
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
