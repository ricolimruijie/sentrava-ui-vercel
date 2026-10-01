<script setup>
import { computed } from 'vue'
import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-vue'
import { formatNumber } from '@/utils/helpers'

const props = defineProps({
  label:     { type: String,  required: true },
  value:     { type: Number,  required: true },
  change:    { type: Number,  default: 0 },
  changePct: { type: Number,  default: 0 },
  icon:      { type: Object,  default: null },
  loading:   { type: Boolean, default: false },
})

const direction = computed(() => {
  if (props.change > 0) return 'up'
  if (props.change < 0) return 'down'
  return 'neutral'
})

const trendIcon = computed(() => ({
  up:      IconTrendingUp,
  down:    IconTrendingDown,
  neutral: IconMinus,
}[direction.value]))

const absChangePct = computed(() => Math.abs(props.changePct).toFixed(1))
</script>

<template>
  <div class="stat-card" :class="{ 'stat-card--loading': loading }">
    <template v-if="loading">
      <div class="stat-card__skeleton">
        <div class="skel skel--label" />
        <div class="skel skel--value" />
        <div class="skel skel--trend" />
      </div>
    </template>
    <template v-else>
      <p class="stat-card__label">{{ label }}</p>
      <div class="stat-card__value">{{ formatNumber(value) }}</div>
      <div class="stat-card__trend" :class="`trend--${direction}`">
        <component :is="trendIcon" :size="14" />
        <span>{{ absChangePct }}%</span>
        <span class="trend__period">vs last month</span>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.stat-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;

  &__label {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__value {
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--color-text);
    line-height: 1;
  }

  &__trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-xs);
    font-weight: 600;

    .trend__period {
      font-weight: 400;
      color: var(--color-text-muted);
    }
  }
}

.trend--up      { color: #16A34A; }
.trend--down    { color: #DC2626; }
.trend--neutral { color: var(--color-text-muted); }

// skeleton pulse
.stat-card__skeleton { display: flex; flex-direction: column; gap: 10px; }
.skel {
  background: linear-gradient(90deg, var(--surface-3) 25%, #e0e0e0 50%, var(--surface-3) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
  &--label { height: 14px; width: 55%; }
  &--value { height: 30px; width: 40%; }
  &--trend { height: 12px; width: 70%; }
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
