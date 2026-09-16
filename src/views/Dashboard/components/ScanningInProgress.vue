<script setup>
import { IconChevronRight } from '@tabler/icons-vue'

defineProps({
  items:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

const dotColor = { running: '#ea580c', queued: '#16a34a', paused: '#64748b' }

const typeStyle = {
  'Domain Inspection': { color: '#7c3aed', bg: 'rgba(124,58,237,0.10)'  },
  'Network':           { color: '#0369a1', bg: 'rgba(3,105,161,0.10)'   },
  'Web Application':   { color: '#059669', bg: 'rgba(5,150,105,0.10)'   },
  'Source Code':       { color: '#b45309', bg: 'rgba(180,83,9,0.10)'    },
}

function ts(type) { return typeStyle[type] ?? { color: '#64748b', bg: 'rgba(100,116,139,0.10)' } }
</script>

<template>
  <div class="scanning card">
    <div class="scanning__head">
      <span class="card-title">Scanning in Progress</span>
      <span class="scanning__badge">
        {{ items.filter(i => i.status === 'running').length }} running
      </span>
    </div>

    <div class="scanning__list">
      <div v-if="loading" class="scanning__empty">Loading…</div>
      <div v-else-if="!items.length" class="scanning__empty">No active scans.</div>

      <div v-for="item in items" :key="item.id" class="srow">
        <span class="srow__dot" :style="{ background: dotColor[item.status] ?? '#94A3B8' }" />
        <div class="srow__body">
          <div class="srow__top">
            <span class="srow__target">{{ item.target }}</span>
            <span
              class="srow__type"
              :style="{ color: ts(item.type).color, background: ts(item.type).bg }"
            >{{ item.type }}</span>
          </div>
          <span class="srow__meta">{{ item.date }} · at {{ item.executedAt }}</span>
        </div>
        <button class="arrow-btn"><IconChevronRight :size="11" /></button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.scanning {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__badge {
    font-size: 11px;
    font-weight: 600;
    color: var(--glacia-sev-high);
    background: rgba(255,157,46,0.15);
    border: 1px solid rgba(255,157,46,0.25);
    padding: 2px 8px;
    border-radius: var(--glacia-radius-pill);
  }

  &__list {
    border: 1px solid rgba(0,0,0,0.07);
    border-radius: var(--glacia-radius-sm);
    overflow: hidden;
    flex: 1;
    background: rgba(255,255,255,0.40);
  }

  &__empty {
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: var(--glacia-ink-dim);
  }
}

.srow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  transition: background 0.13s;

  &:last-child { border-bottom: none; }
  &:hover { background: rgba(0,0,0,0.02); }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 6px currentColor;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 3px;
  }

  &__target {
    font-size: 12px;
    font-weight: 600;
    color: var(--glacia-ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__type {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: var(--glacia-radius-pill);
    white-space: nowrap;
    flex-shrink: 0;
    border: 1px solid rgba(0,0,0,0.08);
  }

  &__meta {
    font-size: 10px;
    color: var(--glacia-ink-dim);
  }
}

.arrow-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--glacia-red);
  color: #fff;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(255,37,41,0.35);
  transition: background 0.15s;

  &:hover { background: #e01e22; }
}
</style>
