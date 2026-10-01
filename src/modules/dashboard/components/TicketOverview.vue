<script setup>
import { computed } from 'vue'
import { IconTicket } from '@tabler/icons-vue'

const props = defineProps({
  data:    { type: Object,  default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const items = computed(() => [
  { key: 'open',        label: 'Open',        count: props.data.open        ?? 0, color: '#DC2626', bg: '#fef2f2' },
  { key: 'in_progress', label: 'In Progress', count: props.data.in_progress ?? 0, color: '#2563EB', bg: '#eff6ff' },
  { key: 'resolved',    label: 'Resolved',    count: props.data.resolved    ?? 0, color: '#16A34A', bg: '#f0fdf4' },
])
</script>

<template>
  <div class="card">
    <div class="panel-head">
      <IconTicket :size="18" class="panel-icon" />
      <h3 class="panel-title">Ticket Overview</h3>
      <span v-if="!loading && data.total" class="total-pill">{{ data.total }} total</span>
    </div>

    <template v-if="loading">
      <div class="skel-grid">
        <div v-for="i in 3" :key="i" class="skel-box" />
      </div>
    </template>

    <div v-else class="ticket-grid">
      <div
        v-for="item in items"
        :key="item.key"
        class="ticket-box"
        :style="{ background: item.bg, borderColor: item.color + '30' }"
      >
        <span class="ticket-box__count" :style="{ color: item.color }">{{ item.count }}</span>
        <span class="ticket-box__label" :style="{ color: item.color }">{{ item.label }}</span>
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
.panel-icon { color: var(--color-text-secondary); }
.panel-title { font-size: var(--text-base); font-weight: 700; color: var(--color-text); flex: 1; }
.total-pill {
  font-size: var(--text-xs);
  font-weight: 600;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  padding: 2px 8px;
  border-radius: 100px;
}

.ticket-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.ticket-box {
  border: 1px solid;
  border-radius: var(--radius-md);
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;

  &__count {
    font-size: var(--text-2xl);
    font-weight: 700;
    line-height: 1;
  }

  &__label {
    font-size: var(--text-xs);
    font-weight: 600;
    opacity: 0.8;
  }
}

.skel-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.skel-box {
  height: 72px;
  border-radius: var(--radius-md);
  background: linear-gradient(90deg, var(--surface-3) 25%, var(--surface-3) 50%, var(--surface-3) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>
