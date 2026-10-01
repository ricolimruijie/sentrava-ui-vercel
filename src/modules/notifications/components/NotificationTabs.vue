<script setup>
import { TABS } from '@/modules/notifications/utils/catalogue'

// The five notification tabs (All, Scans, Infrastructure, Tickets, System) with an unread count each.
defineProps({
  modelValue: { type: String, default: 'all' },
  unread: { type: Object, default: () => ({}) },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="n-tabs" role="tablist">
    <button
      v-for="t in TABS"
      :key="t.key"
      type="button"
      role="tab"
      class="n-tabs__tab"
      :class="{ 'n-tabs__tab--active': modelValue === t.key }"
      :aria-selected="modelValue === t.key"
      @click="$emit('update:modelValue', t.key)"
    >
      {{ t.label }}
      <span v-if="unread[t.key]" class="n-tabs__count">{{ unread[t.key] > 99 ? '99+' : unread[t.key] }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
// Every tab is as wide as the widest one ("Infrastructure"): equal 1fr columns. By default the row
// is only as wide as its tabs; give it a width (the bell panel does) and the equal columns stretch.
.n-tabs {
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr); // truly equal: a long label can't widen its own column
  gap: 4px;

  &__tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    padding: 0 3px;
    border: none;
    border-radius: var(--glacia-radius-pill);
    background: transparent;
    color: var(--glacia-ink-dim);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    transition: background 0.13s, color 0.13s;
    &:hover { background: var(--glacia-glass-fill-strong); color: var(--glacia-ink); }
    &--active, &--active:hover { background: var(--glacia-red); color: #fff; }
  }

  // Unread count: a small badge on the tab's corner, so it never changes a tab's width.
  &__count {
    position: absolute;
    top: -5px;
    right: -2px;
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
  &__tab--active &__count { background: #fff; color: var(--glacia-red); box-shadow: 0 0 0 2px var(--glacia-red); }
}
</style>
