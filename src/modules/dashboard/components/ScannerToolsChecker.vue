<script setup>
import { formatDayMonthYear } from '@/utils/helpers'
import { IconWorld, IconNetwork, IconBrowser, IconCode } from '@tabler/icons-vue'

defineProps({
  tools:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

const palette = {
  domain:  { color: '#6366F1', bg: '#EEF2FF', icon: IconWorld   },
  network: { color: '#0EA5E9', bg: '#F0F9FF', icon: IconNetwork },
  webapp:  { color: '#10B981', bg: '#F0FDF4', icon: IconBrowser },
  source:  { color: '#F59E0B', bg: '#FFFBEB', icon: IconCode    },
}
function cfg(id) { return palette[id] ?? palette.domain }
</script>

<template>
  <div class="checker card">
    <span class="card-title">Scanner Tools Checker</span>

    <div class="checker__grid">
      <div
        v-for="tool in tools"
        :key="tool.id"
        class="sc-card"
        :style="{ '--accent': cfg(tool.id).color }"
      >
        <div class="sc-card__top">
          <div class="sc-card__icon" :style="{ background: cfg(tool.id).bg }">
            <component :is="cfg(tool.id).icon" :size="14" :color="cfg(tool.id).color" />
          </div>
          <span class="sc-card__badge" :class="tool.status === 'active' ? 'sc-card__badge--on' : 'sc-card__badge--off'">
            <span class="sc-card__pulse" :class="{ 'sc-card__pulse--active': tool.status === 'active' }" />
            {{ tool.status === 'active' ? 'Active' : 'Offline' }}
          </span>
        </div>

        <p class="sc-card__name">{{ tool.name }}</p>
        <p class="sc-card__meta">{{ tool.engine }} · {{ formatDayMonthYear(tool.lastCheck) }}</p>

        <div class="sc-card__dots">
          <span
            v-for="(on, i) in (tool.overtime ?? [])"
            :key="i"
            class="odot"
            :class="on ? 'odot--on' : 'odot--off'"
          />
        </div>
      </div>

      <div v-if="!tools.length && !loading" class="checker__empty">No scanner data.</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.checker {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  &__empty {
    grid-column: 1 / -1;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #94A3B8;
  }
}

.sc-card {
  background: var(--surface-2);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color .15s, box-shadow .15s;

  &:hover {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 8%, transparent);
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  &__icon {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 600;

    &--on  { background: #DCFCE7; color: #16A34A; }
    &--off { background: #FEE2E2; color: #DC2626; }
  }

  &__pulse {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #DC2626;
    flex-shrink: 0;

    &--active {
      background: #16A34A;
      animation: pulse-dot 1.8s ease-in-out infinite;
    }
  }

  &__name {
    font-size: 11px;
    font-weight: 600;
    color: var(--glacia-ink);
    line-height: 1.3;
  }

  &__meta {
    font-size: 10px;
    color: #94A3B8;
  }

  &__dots {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-wrap: wrap;
    margin-top: 2px;
  }
}

.odot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;

  &--on  { background: #22C55E; }
  &--off { background: #EF4444; }
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,.5); }
  70%       { box-shadow: 0 0 0 5px rgba(22,163,74,0); }
}
</style>
