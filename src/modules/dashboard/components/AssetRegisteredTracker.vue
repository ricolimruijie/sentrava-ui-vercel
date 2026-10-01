<script setup>
import { IconWorld, IconNetwork, IconBrowser, IconCode } from '@tabler/icons-vue'

const props = defineProps({
  data:    { type: Object,  default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const types = [
  { key: 'domain',     label: 'Domain Registered',         icon: IconWorld   },
  { key: 'network',    label: 'Network Registered',         icon: IconNetwork },
  { key: 'webapp',     label: 'Web Application Registered', icon: IconBrowser },
  { key: 'sourceCode', label: 'Source Code Registered',     icon: IconCode    },
]
</script>

<template>
  <div class="tracker card">
    <div class="tracker__total">
      <div class="tracker__total-header">
        <span class="tracker__total-label">Total Assets Inventory</span>
        <span class="tracker__badge">
          <span class="tracker__badge-dot"></span>
          {{ types.length }} categories
        </span>
      </div>
      <span class="tracker__total-value">{{ props.data.total ?? 0 }}</span>
    </div>

    <div class="tracker__grid">
      <div v-for="t in types" :key="t.key" class="tracker__cell">
        <div class="tracker__cell-icon">
          <component :is="t.icon" :size="20" color="#FF2529" />
        </div>
        <div class="tracker__cell-info">
          <span class="tracker__cell-label">{{ t.label }}</span>
          <span class="tracker__cell-value">{{ props.data[t.key] ?? 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tracker {
  display: flex;
  flex-direction: column;
  gap: 14px;
  // Matches Integration Connection's height with every row collapsed. Fixed
  // rather than grid-stretched, so it doesn't move when that card's
  // accordion rows open/close.
  min-height: 405px;

  &__total {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
    gap: 12px;
    background: var(--glacia-glass-fill-strong);
    border: 1px solid var(--glacia-glass-border);
    border-radius: var(--glacia-radius-md);
    padding: 20px 22px;

    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 170px;
      height: 170px;
      border-radius: 50%;
      filter: blur(48px);
      opacity: 0.45;
      z-index: -1;
    }

    &::before {
      top: -60px;
      left: -60px;
      background: #5AA2F0;
    }

    &::after {
      bottom: -70px;
      right: -60px;
      background: #FF7A7D;
    }

    &-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    &-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--glacia-ink-dim);
    }

    &-value {
      font-family: 'Manrope', 'Inter', sans-serif;
      font-size: 42px;
      font-weight: 800;
      color: var(--glacia-ink);
      line-height: 1;
    }
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    padding: 6px 14px;
    border-radius: var(--glacia-radius-pill);
    background: rgba(74, 144, 226, 0.14);
    color: #2C6FCB;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }

  &__badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #2C6FCB;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    flex-shrink: 0;
    gap: 10px;
  }

  &__cell {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 100px;
    border: 1px solid var(--glacia-glass-border);
    border-radius: var(--glacia-radius-sm);
    padding: 14px;
    background: var(--glacia-glass-fill-strong);
  }

  &__cell-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(255, 37, 41, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__cell-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__cell-label {
    display: flex;
    align-items: center;
    min-height: 32px;
    font-size: 12px;
    font-weight: 500;
    color: var(--glacia-ink-dim);
    line-height: 1.3;
  }

  &__cell-value {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--glacia-ink);
    line-height: 1;
  }
}
</style>
