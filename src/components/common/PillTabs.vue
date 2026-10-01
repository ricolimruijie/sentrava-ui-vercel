<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

// Pill-shaped tab bar with a highlight that slides to the active tab: the same look and motion as the
// tabs on the Company page. `tabs` is [{ key, label, badge? }]; `badge` (a number) adds a small count on
// the tab's corner. `equal` makes every tab as wide as the widest one.
const props = defineProps({
  modelValue: { type: String, required: true },
  tabs: { type: Array, required: true },
  equal: { type: Boolean, default: false },
  // 'sm' is the tighter size used inside the bell panel.
  size: { type: String, default: 'md' },
})
defineEmits(['update:modelValue'])

const els = {}
const pill = ref({ left: '0px', top: '0px', width: '0px', height: '0px' })
const ready = ref(false) // no slide on the very first placement

function setEl(key, el) { if (el) els[key] = el }
function movePill() {
  const el = els[props.modelValue]
  if (!el) return
  pill.value = { left: `${el.offsetLeft}px`, top: `${el.offsetTop}px`, width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px` }
}

onMounted(() => {
  nextTick(() => {
    movePill()
    requestAnimationFrame(() => { ready.value = true })
  })
  window.addEventListener('resize', movePill)
})
onBeforeUnmount(() => window.removeEventListener('resize', movePill))
watch(() => props.modelValue, () => nextTick(movePill))
watch(() => props.tabs.map((t) => t.label).join('|'), () => nextTick(movePill))
</script>

<template>
  <div class="pill-tabs" :class="{ 'pill-tabs--equal': equal, 'pill-tabs--sm': size === 'sm' }" role="tablist">
    <div class="pill-tabs__pill" :class="{ 'pill-tabs__pill--ready': ready }" :style="pill"></div>
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :ref="(el) => setEl(tab.key, el)"
      type="button"
      role="tab"
      class="pill-tabs__item"
      :class="{ 'pill-tabs__item--active': tab.key === modelValue }"
      :aria-selected="tab.key === modelValue"
      @click="$emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
      <span v-if="tab.badge" class="pill-tabs__badge">{{ tab.badge > 99 ? '99+' : tab.badge }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.pill-tabs {
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

  &--equal {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
  }

  &--sm { padding: 4px; gap: 2px; }
  &--sm &__item { padding: 7px 8px; font-size: 12px; }

  &__pill {
    position: absolute;
    z-index: 0;
    background: var(--surface);
    border-radius: var(--glacia-radius-pill);
    box-shadow: 0 2px 6px rgba(16, 24, 32, 0.1);
    &--ready {
      transition: left 0.42s cubic-bezier(0.3, 1.12, 0.5, 1), top 0.42s cubic-bezier(0.3, 1.12, 0.5, 1),
        width 0.42s cubic-bezier(0.3, 1.12, 0.5, 1), height 0.42s cubic-bezier(0.3, 1.12, 0.5, 1);
    }
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

    &:not(.pill-tabs__item--active):hover { color: var(--glacia-ink); }
    &--active { color: var(--glacia-ink); }
  }

  // Count on the tab's corner, so it never changes a tab's width.
  &__badge {
    position: absolute;
    top: -4px;
    right: 0;
    min-width: 17px;
    height: 17px;
    padding: 0 5px;
    border-radius: 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--glacia-red);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    line-height: 1;
    box-shadow: 0 0 0 2px var(--surface);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pill-tabs__pill--ready { transition: none; }
}
</style>
