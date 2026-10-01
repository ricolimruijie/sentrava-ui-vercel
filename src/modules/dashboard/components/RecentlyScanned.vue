<script setup>
import { useRouter } from 'vue-router'
import { pushFromDashboard } from '@/utils/navOrigin'
import SeverityBadge from '@/components/common/SeverityBadge.vue'
import SkeletonCard  from '@/components/common/SkeletonCard.vue'
import EmptyState    from '@/components/common/EmptyState.vue'
import { formatRelativeTime } from '@/utils/helpers'
import { IconGlobe, IconNetwork, IconWorldWww, IconCode, IconScanEye } from '@tabler/icons-vue'

const props = defineProps({
  items:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

const router = useRouter()

const typeIcon = {
  domain:      IconGlobe,
  network:     IconNetwork,
  webapp:      IconWorldWww,
  source_code: IconCode,
}

function assetIcon(type) { return typeIcon[type] ?? IconScanEye }
</script>

<template>
  <div class="panel card">
    <div class="panel__head">
      <h3 class="panel__title">Recently Scanned</h3>
    </div>

    <SkeletonCard v-if="loading" :rows="5" height="40px" />

    <EmptyState
      v-else-if="!items.length"
      title="No scans completed yet"
      message="Run your first scan to see results here."
      cta-label="Start a Scan"
      @cta="pushFromDashboard(router, '/scans/run')"
    >
      <template #icon><IconScanEye :size="32" stroke-width="1.5" /></template>
    </EmptyState>

    <ul v-else class="scan-list">
      <li v-for="item in items" :key="item.id" class="scan-item">
        <div class="scan-item__icon">
          <component :is="assetIcon(item.type)" :size="16" />
        </div>
        <div class="scan-item__info">
          <p class="scan-item__name">{{ item.name }}</p>
          <p class="scan-item__meta">{{ formatRelativeTime(item.scannedAt) }}</p>
        </div>
        <div class="scan-item__right">
          <SeverityBadge :severity="item.severity" small />
          <span class="scan-item__count">{{ item.findings }} findings</span>
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

.panel {
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  &__title {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
  }
}

.scan-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scan-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 6px;
  border-radius: var(--radius-sm);
  transition: background 0.13s;

  &:hover { background: var(--color-bg); }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--color-bg);
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-top: 1px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  &__count {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    white-space: nowrap;
  }
}
</style>
