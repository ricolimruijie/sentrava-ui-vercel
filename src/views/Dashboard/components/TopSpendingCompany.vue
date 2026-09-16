<script setup>
import SkeletonCard from '@/components/reusable/SkeletonCard.vue'
import { IconBuilding } from '@tabler/icons-vue'

const props = defineProps({
  items:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

const maxSpend = (items) => Math.max(...items.map(i => i.creditsUsed), 1)
</script>

<template>
  <div class="card">
    <div class="panel-head">
      <IconBuilding :size="18" class="panel-icon" />
      <h3 class="panel-title">Top Spending Companies</h3>
    </div>

    <SkeletonCard v-if="loading" :rows="5" height="36px" />

    <ul v-else class="company-list">
      <li v-for="(c, i) in items" :key="c.id" class="company-item">
        <span class="company-item__rank">#{{ i + 1 }}</span>
        <div class="company-item__info">
          <p class="company-item__name">{{ c.name }}</p>
          <div class="spend-bar">
            <div
              class="spend-bar__fill"
              :style="{ width: (c.creditsUsed / maxSpend(items) * 100) + '%' }"
            />
          </div>
        </div>
        <div class="company-item__stats">
          <span class="company-item__credits">{{ c.creditsUsed.toLocaleString() }}</span>
          <span class="company-item__scans">{{ c.scans }} scans</span>
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

.panel-head { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.panel-icon { color: var(--color-text-secondary); }
.panel-title { font-size: var(--text-base); font-weight: 700; color: var(--color-text); }

.company-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }

.company-item {
  display: flex;
  align-items: center;
  gap: 10px;

  &__rank {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-muted);
    width: 22px;
    flex-shrink: 0;
  }

  &__info { flex: 1; min-width: 0; }

  &__name {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__stats {
    text-align: right;
    flex-shrink: 0;
  }

  &__credits {
    display: block;
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-primary);
  }

  &__scans {
    display: block;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
}

.spend-bar {
  height: 4px;
  background: var(--color-bg);
  border-radius: 2px;
  overflow: hidden;

  &__fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: 2px;
    transition: width 0.5s ease;
  }
}
</style>
