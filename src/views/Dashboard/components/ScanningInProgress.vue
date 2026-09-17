<script setup>
import { computed } from 'vue'

const props = defineProps({
  items:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

const typeStyle = {
  'Domain Inspection': { color: '#0369a1', bg: 'rgba(14,165,233,0.14)'  },
  'Network':           { color: '#1d4ed8', bg: 'rgba(59,130,246,0.14)' },
  'Web Application':   { color: '#059669', bg: 'rgba(5,150,105,0.14)'  },
  'Source Code':       { color: '#c2410c', bg: 'rgba(234,88,12,0.14)'  },
}

function ts(type) { return typeStyle[type] ?? { color: '#64748b', bg: 'rgba(100,116,139,0.14)' } }

// Only scans that are still running belong in this list — a finished scan is
// removed outright rather than shown in a "done" state.
const runningItems = computed(() => props.items.filter((i) => i.status === 'running'))
</script>

<template>
  <div class="scanning card">
    <div class="scanning__halo">
      <h2 class="scanning__title">Scanning in Progress</h2>
    </div>

    <div class="scanning__body">
      <p class="scanning__caption">Finished scans disappear from this list automatically.</p>

      <div v-if="loading" class="scanning__empty">Loading…</div>
      <div v-else-if="!runningItems.length" class="scanning__empty">No active scans.</div>

      <TransitionGroup v-else name="srow" tag="div" class="scanning__list">
        <div v-for="item in runningItems" :key="item.id" class="srow">
          <div class="srow__top">
            <span class="srow__target">{{ item.target }}</span>
            <span
              class="srow__type"
              :style="{ color: ts(item.type).color, background: ts(item.type).bg }"
            >{{ item.type }}</span>
          </div>
          <div class="srow__track">
            <div class="srow__bar" />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped lang="scss">
.scanning {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow: hidden;

  &__halo {
    padding: 20px 22px 16px;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 22px 22px;
  }

  &__caption {
    margin: 0;
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
    min-height: 0;
    max-height: 458px; // ~6 rows (68px each + 10px gap) before scrolling kicks in
    overflow-y: auto;
    padding-right: 2px;
  }

  &__empty {
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: var(--glacia-ink-dim);
  }
}

.srow {
  border: 1px solid var(--glacia-glass-border);
  border-radius: 14px;
  background: var(--glacia-glass-fill-strong);
  padding: 14px 16px;
  max-height: 200px;
  flex-shrink: 0;
  overflow: hidden;

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
  }

  &__target {
    font-size: 15px;
    font-weight: 700;
    color: var(--glacia-ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__type {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: var(--glacia-radius-pill);
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__track {
    position: relative;
    width: 100%;
    height: 5px;
    border-radius: var(--glacia-radius-pill);
    background: rgba(15, 23, 42, 0.08);
    overflow: hidden;
  }

  &__bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 40%;
    height: 100%;
    border-radius: var(--glacia-radius-pill);
    background: #2E6FA3;
    animation: srow-indeterminate 1.6s ease-in-out infinite;
  }
}

// list transition: finished scans fade + collapse out instead of jumping
.srow-move,
.srow-leave-active {
  transition: opacity 0.32s ease, max-height 0.32s ease, margin 0.32s ease, padding 0.32s ease, border-width 0.32s ease;
}

.srow-enter-active {
  transition: opacity 0.32s ease;
}

.srow-enter-from {
  opacity: 0;
}

.srow-leave-active {
  position: relative;
}

.srow-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: -10px;
  border-width: 0;
}

@keyframes srow-indeterminate {
  0%   { left: -40%; }
  100% { left: 100%; }
}
</style>
