<script setup>
import { IconBuilding } from '@tabler/icons-vue'

defineProps({
  data:    { type: Object,  default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const fields = [
  { key: 'fullName', label: 'Full name' },
  { key: 'username', label: 'Username'  },
  { key: 'email',    label: 'Email'     },
  { key: 'role',     label: 'Role'      },
]
</script>

<template>
  <div class="account card">
    <h3 class="card-title">Account Overview</h3>

    <div class="account__company">
      <div class="account__company-icon">
        <IconBuilding :size="20" color="#FF2529" />
      </div>
      <span class="account__company-name">{{ data.company ?? '—' }}</span>
    </div>

    <div class="account__divider" />

    <div class="account__fields">
      <div v-for="f in fields" :key="f.key" class="field">
        <span class="field__label">{{ f.label }}</span>
        <span class="field__value">{{ data[f.key] ?? '—' }}</span>
      </div>
    </div>

    <div class="account__divider" />

    <div class="account__twofa">
      <span class="account__twofa-label">Two-factor authentication (2FA)</span>
      <span class="twofa-badge" :class="data.twoFAEnabled ? 'on' : 'off'">
        {{ data.twoFAEnabled ? 'Active' : 'Inactive' }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.account {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__company {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0 6px;
  }

  &__company-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255,37,41,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__company-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--glacia-ink);
    line-height: 1.4;
  }

  &__divider {
    height: 1px;
    background: var(--glacia-glass-border);
    margin: 2px 0;
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__twofa {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 2px;
  }

  &__twofa-label {
    font-size: 11px;
    color: var(--glacia-ink-dim);
    font-weight: 500;
  }
}

.field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;

  &__label {
    font-size: 11px;
    color: var(--glacia-ink-dim);
    font-weight: 500;
    opacity: 0.7;
  }

  &__value {
    font-size: 12px;
    font-weight: 600;
    color: var(--glacia-ink);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 60%;
  }
}

.twofa-badge {
  padding: 2px 10px;
  border-radius: var(--glacia-radius-pill);
  font-size: 11px;
  font-weight: 600;

  &.on  { background: rgba(22,163,74,0.12); color: #16a34a; }
  &.off { background: rgba(220,38,38,0.10); color: var(--glacia-sev-critical); }
}
</style>
