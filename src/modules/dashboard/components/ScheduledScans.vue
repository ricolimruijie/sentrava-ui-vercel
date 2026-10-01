<script setup>
import { useRouter } from 'vue-router'
import { pushFromDashboard } from '@/utils/navOrigin'
import SkeletonCard from '@/components/common/SkeletonCard.vue'
import EmptyState   from '@/components/common/EmptyState.vue'
import { formatDate } from '@/utils/helpers'
import { IconCalendar, IconGlobe, IconNetwork, IconWorldWww, IconCode } from '@tabler/icons-vue'

defineProps({
  items:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})
const router = useRouter()

const typeIcon = {
  domain: IconGlobe, network: IconNetwork, webapp: IconWorldWww, source_code: IconCode,
}
function assetIcon(t) { return typeIcon[t] ?? IconCalendar }

const typeColors = {
  domain: '#3B82F6', network: '#7C3AED', webapp: '#0D9488', source_code: '#D97706',
}
function dotColor(t) { return typeColors[t] ?? '#6B7280' }
</script>

<template>
  <div class="card">
    <div class="panel-head">
      <h3 class="panel-title">Scheduled Scans</h3>
    </div>

    <SkeletonCard v-if="loading" :rows="3" height="48px" />

    <EmptyState
      v-else-if="!items.length"
      title="No scheduled scans"
      message="Automate your security posture by scheduling recurring scans."
      cta-label="Schedule a Scan"
      @cta="pushFromDashboard(router, '/scans/scheduled')"
    >
      <template #icon><IconCalendar :size="32" stroke-width="1.5" /></template>
    </EmptyState>

    <ul v-else class="sched-list">
      <li v-for="s in items" :key="s.id" class="sched-item">
        <span class="sched-item__dot" :style="{ background: dotColor(s.type) }" />
        <div class="sched-item__info">
          <p class="sched-item__name">{{ s.name }}</p>
          <p class="sched-item__schedule">{{ s.schedule }}</p>
        </div>
        <div class="sched-item__next">
          <p class="sched-item__next-label">Next run</p>
          <p class="sched-item__next-date">{{ formatDate(s.nextRun) }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 20px;
  box-shadow: var(--shadow-card);
}

.panel-head {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.panel-title {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text);
}

.sched-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }

.sched-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 6px;
  border-radius: var(--radius-sm);
  transition: background 0.13s;

  &:hover { background: var(--color-bg); }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__info { flex: 1; min-width: 0; }

  &__name {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__schedule {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-top: 1px;
  }

  &__next { text-align: right; flex-shrink: 0; }

  &__next-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-bottom: 1px;
  }

  &__next-date {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
  }
}
</style>
