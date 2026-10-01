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
.n-tabs {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  &__tab {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 30px;
    padding: 0 8px;
    border: none;
    border-radius: var(--glacia-radius-pill);
    background: transparent;
    color: var(--glacia-ink-dim);
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.13s, color 0.13s;
    &:hover { background: var(--glacia-glass-fill-strong); color: var(--glacia-ink); }
    &--active, &--active:hover { background: var(--glacia-red); color: #fff; }
  }
  &__count {
    min-width: 17px;
    height: 17px;
    padding: 0 5px;
    border-radius: 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--tint), 0.1);
    font-size: 10.5px;
    font-weight: 700;
  }
  &__tab--active &__count { background: rgba(255, 255, 255, 0.28); }
}
</style>
