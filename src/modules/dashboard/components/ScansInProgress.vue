<script setup>
import { useRouter } from 'vue-router'
import { pushFromDashboard } from '@/utils/navOrigin'
import SkeletonCard from '@/components/common/SkeletonCard.vue'
import EmptyState   from '@/components/common/EmptyState.vue'
import ProgressBar  from 'primevue/progressbar'
import { formatRelativeTime } from '@/utils/helpers'
import { IconLoader2, IconGlobe, IconNetwork, IconWorldWww, IconCode } from '@tabler/icons-vue'

defineProps({
  items:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

const router = useRouter()

const typeIcon = {
  domain: IconGlobe, network: IconNetwork, webapp: IconWorldWww, source_code: IconCode,
}
function assetIcon(t) { return typeIcon[t] ?? IconLoader2 }
</script>

<template>
  <div class="card">
    <div class="panel-head">
      <h3 class="panel-title">Scans In Progress</h3>
      <span v-if="items.length && !loading" class="count-badge">{{ items.length }}</span>
    </div>

    <SkeletonCard v-if="loading" :rows="3" height="52px" />

    <EmptyState
      v-else-if="!items.length"
      title="No active scans"
      message="Start a scan to monitor progress here in real time."
      cta-label="Run a Scan"
      @cta="pushFromDashboard(router, '/scans/run')"
    >
      <template #icon><IconLoader2 :size="32" stroke-width="1.5" /></template>
    </EmptyState>

    <div v-else class="scan-list">
      <div v-for="scan in items" :key="scan.id" class="progress-item">
        <div class="progress-item__head">
          <div class="progress-item__icon">
            <component :is="assetIcon(scan.type)" :size="15" />
          </div>
          <div class="progress-item__info">
            <p class="progress-item__name">{{ scan.name }}</p>
            <p class="progress-item__target">{{ scan.target }}</p>
          </div>
          <span class="progress-item__pct">{{ scan.progress }}%</span>
        </div>
        <ProgressBar :value="scan.progress" class="scan-progress" />
        <p class="progress-item__meta">Started {{ formatRelativeTime(scan.startedAt) }}</p>
      </div>
    </div>
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
  gap: 8px;
  margin-bottom: 16px;
}

.panel-title {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text);
  flex: 1;
}

.count-badge {
  background: var(--color-primary-50);
  color: var(--color-primary);
  border-radius: 100px;
  padding: 2px 9px;
  font-size: var(--text-xs);
  font-weight: 700;
}

.scan-list { display: flex; flex-direction: column; gap: 16px; }

.progress-item {
  &__head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    background: var(--color-bg);
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  &__info { flex: 1; min-width: 0; }

  &__name {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__target {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__pct {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-primary);
    flex-shrink: 0;
  }

  &__meta {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-top: 4px;
  }
}

:deep(.scan-progress .p-progressbar) {
  height: 6px !important;
  border-radius: 3px;
}

:deep(.scan-progress .p-progressbar-value) {
  background: var(--color-primary) !important;
}
</style>
