<script setup>
import { IconShieldSearch, IconWorld, IconNetwork, IconBrowser, IconCode } from '@tabler/icons-vue'

defineProps({
  data:    { type: Object,  default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const types = [
  { key: 'domain',     label: 'Domain Registered',          icon: IconWorld   },
  { key: 'network',    label: 'Network Registered',          icon: IconNetwork },
  { key: 'webapp',     label: 'Web Application Registered',  icon: IconBrowser },
  { key: 'sourceCode', label: 'Source Code Registered',      icon: IconCode    },
]
</script>

<template>
  <div class="tracker card">
    <h3 class="card-title">Asset Registered Tracker</h3>

    <div class="tracker__total">
      <div class="tracker__total-left">
        <div class="tracker__icon-wrap">
          <IconShieldSearch :size="18" color="#FF2529" />
        </div>
        <span class="tracker__total-label">Total Assets Inventory</span>
      </div>
      <span class="tracker__total-value">{{ data.total ?? 0 }}</span>
    </div>

    <div class="tracker__grid">
      <div v-for="t in types" :key="t.key" class="tracker__cell">
        <div class="tracker__cell-icon">
          <component :is="t.icon" :size="14" color="#FF2529" />
        </div>
        <div class="tracker__cell-info">
          <span class="tracker__cell-label">{{ t.label }}</span>
          <span class="tracker__cell-value">{{ data[t.key] ?? 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tracker {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--glacia-glass-fill-strong);
    border-radius: var(--glacia-radius-sm);
    padding: 12px 14px;
    border: 1px solid var(--glacia-glass-border);

    &-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    &-label {
      font-size: 12px;
      color: var(--glacia-ink-dim);
      font-weight: 500;
    }

    &-value {
      font-family: 'Manrope', 'Inter', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--glacia-ink);
    }
  }

  &__icon-wrap {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255,37,41,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  &__cell {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid var(--glacia-glass-border);
    border-radius: var(--glacia-radius-sm);
    padding: 10px 12px;
    background: var(--glacia-glass-fill-strong);

    &-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: rgba(255,37,41,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    &-label {
      font-size: 11px;
      color: var(--glacia-ink-dim);
      font-weight: 500;
      display: block;
      margin-bottom: 2px;
    }

    &-value {
      font-family: 'Manrope', 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: var(--glacia-ink);
      display: block;
      line-height: 1;
    }
  }
}
</style>
