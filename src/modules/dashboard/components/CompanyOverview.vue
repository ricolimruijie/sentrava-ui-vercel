<script setup>
import { computed } from 'vue'
import { IconUsers, IconShield, IconUser } from '@tabler/icons-vue'

const props = defineProps({
  data:    { type: Object,  default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const roles = computed(() => [
  { key: 'admin',   label: 'Admins',   icon: IconShield, color: '#7C3AED', count: props.data.byRole?.admin  ?? 0 },
  { key: 'member',  label: 'Members',  icon: IconUser,   color: '#0D9488', count: props.data.byRole?.member  ?? 0 },
])

const total = computed(() => props.data.totalUsers ?? 0)

function pct(count) {
  return total.value ? Math.round((count / total.value) * 100) : 0
}
</script>

<template>
  <div class="card">
    <div class="panel-head">
      <IconUsers :size="18" class="panel-icon" />
      <h3 class="panel-title">Company Overview</h3>
    </div>

    <template v-if="loading">
      <div class="skel-group">
        <div class="skel skel--wide" />
        <div class="skel skel--med" />
        <div class="skel skel--med" />
        <div class="skel skel--med" />
      </div>
    </template>

    <template v-else>
      <div class="total-users">
        <span class="total-users__count">{{ total }}</span>
        <span class="total-users__label">Total Users</span>
      </div>

      <div class="role-list">
        <div v-for="r in roles" :key="r.key" class="role-row">
          <div class="role-row__left">
            <div class="role-row__icon" :style="{ background: r.color + '18', color: r.color }">
              <component :is="r.icon" :size="14" />
            </div>
            <span class="role-row__label">{{ r.label }}</span>
          </div>
          <div class="role-row__right">
            <span class="role-row__count">{{ r.count }}</span>
            <div class="role-bar">
              <div class="role-bar__fill" :style="{ width: pct(r.count) + '%', background: r.color }" />
            </div>
          </div>
        </div>
      </div>
    </template>
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
.panel-title { font-size: var(--text-base); font-weight: 700; color: var(--color-text); }

.total-users {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;

  &__count {
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--color-text);
  }

  &__label {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
}

.role-list { display: flex; flex-direction: column; gap: 10px; }

.role-row {
  display: flex;
  align-items: center;
  gap: 10px;

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 90px;
    flex-shrink: 0;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    flex-shrink: 0;
  }

  &__label {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  &__right {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__count {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
    width: 26px;
    text-align: right;
    flex-shrink: 0;
  }
}

.role-bar {
  flex: 1;
  height: 6px;
  background: var(--color-bg);
  border-radius: 3px;
  overflow: hidden;

  &__fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
  }
}

// skeleton
.skel-group { display: flex; flex-direction: column; gap: 10px; }
.skel {
  background: linear-gradient(90deg, var(--surface-3) 25%, var(--surface-3) 50%, var(--surface-3) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
  height: 14px;
  &--wide { width: 100%; height: 36px; }
  &--med  { width: 80%; }
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>
