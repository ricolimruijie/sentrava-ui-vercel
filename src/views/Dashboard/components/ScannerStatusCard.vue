<script setup>
import { computed } from 'vue'
import { IconDeviceDesktop } from '@tabler/icons-vue'

const props = defineProps({
  data: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const isConnected = computed(() => props.data.status === 'connected')

const lastCheckDisplay = computed(() => {
  if (!props.data.lastCheck) return '—'
  const d = new Date(props.data.lastCheck)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    + ' '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
})

const overtime = computed(() => props.data.overtime ?? [])
</script>

<template>
  <div class="scanner-status card">
    <div class="scanner-status__head">
      <h3 class="card-title scanner-status__title">{{ data.title ?? 'Scanner Status' }}</h3>
      <button class="btn-check-status">Check Status</button>
    </div>

    <div class="scanner-status__info">
      <div class="scanner-status__icon">
        <IconDeviceDesktop :size="20" color="#fff" />
      </div>
      <div class="scanner-status__details">
        <div class="scanner-status__details-top">
          <span class="scanner-status__label">Network Scanner Status</span>
          <span
            class="status-badge"
            :class="isConnected ? 'status-badge--connected' : 'status-badge--disconnected'"
          >
            {{ isConnected ? 'Connected' : 'Disconnected' }}
          </span>
        </div>
        <span class="scanner-status__last-check">Last check: {{ lastCheckDisplay }}</span>
      </div>
    </div>

    <div class="scanner-status__overtime">
      <span class="scanner-status__overtime-label">Probe Box Status Overtime</span>
      <div class="overtime-dots">
        <span
          v-for="(online, i) in overtime"
          :key="i"
          class="dot"
          :class="online ? 'dot--on' : 'dot--off'"
          :title="online ? 'Online' : 'Offline'"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.scanner-status {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  &__title {
    font-size: var(--text-sm) !important;
  }

  &__info {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: rgba(255,255,255,0.50);
    border-radius: var(--glacia-radius-sm);
    padding: 12px;
    border: 1px solid rgba(0,0,0,0.07);
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #1e293b;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__details {
    flex: 1;
    min-width: 0;
  }

  &__details-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 3px;
    flex-wrap: wrap;
  }

  &__label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--glacia-ink);
  }

  &__last-check {
    font-size: 11px;
    color: var(--glacia-ink-dim);
  }

  &__overtime {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  &__overtime-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--glacia-ink-dim);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.7;
  }
}

.btn-check-status {
  padding: 5px 12px;
  background: var(--glacia-red);
  color: #fff;
  border: none;
  border-radius: var(--glacia-radius-pill);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(255,37,41,0.35);
  transition: background 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    background: #e01e22;
    box-shadow: 0 6px 18px rgba(255,37,41,0.45);
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--glacia-radius-pill);
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;

  &--connected    { background: rgba(22,163,74,0.12); color: #16a34a; }
  &--disconnected { background: rgba(220,38,38,0.10); color: var(--glacia-sev-critical); }
}

.overtime-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;

  &--on  { background: #22c55e; box-shadow: 0 0 5px rgba(34,197,94,0.5); }
  &--off { background: var(--glacia-sev-critical); opacity: 0.6; }
}
</style>
