<script setup>
import { IconBuilding, IconAt, IconMail, IconShield } from '@tabler/icons-vue'

defineProps({
  data:    { type: Object,  default: () => ({}) },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <div class="account card">
    <div class="account__banner">
      <span class="account__banner-label">Account ID</span>
      <IconShield :size="20" color="#fff" />
    </div>

    <div class="account__avatar">
      <IconBuilding :size="34" color="#FF2529" />
    </div>

    <div class="account__body">
      <h2 class="account__name">{{ data.fullName ?? '—' }}</h2>
      <p class="account__company">{{ data.company ?? '—' }}</p>
      <span class="account__role-pill">{{ data.role ?? '—' }}</span>

      <div class="account__divider" />

      <div class="account__fields">
        <div class="field">
          <span class="field__left">
            <IconAt :size="16" class="field__icon" />
            <span class="field__label">Username</span>
          </span>
          <span class="field__value">{{ data.username ?? '—' }}</span>
        </div>
        <div class="field">
          <span class="field__left">
            <IconMail :size="16" class="field__icon" />
            <span class="field__label">Email</span>
          </span>
          <span class="field__value">{{ data.email ?? '—' }}</span>
        </div>
      </div>

      <div class="account__twofa" :class="data.twoFAEnabled ? 'on' : 'off'">
        <span class="account__twofa-left">
          <IconShield :size="16" />
          <span>Two-factor authentication</span>
        </span>
        <span class="account__twofa-status">{{ data.twoFAEnabled ? 'Active' : 'Inactive' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.account {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;

  // Matches Asset Inventory / Integration Connection's fixed height.
  height: 405px;

  &__banner {
    height: 116px;
    flex-shrink: 0;
    padding: 18px 20px;
    background: linear-gradient(135deg, #F2635D 0%, #D6332C 100%);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  &__banner-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #fff;
  }

  &__avatar {
    position: absolute;
    top: 116px;
    left: 50%;
    width: 72px;
    height: 72px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: linear-gradient(135deg, #FDECEB 0%, #F8CFCD 100%);
    border: 4px solid var(--glacia-bg-elevated);
    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    min-height: 0;
    text-align: center;
    background: var(--glacia-bg-elevated);
    padding: 46px 22px 12px;
  }

  &__name {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 19px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__company {
    margin: 2px 0 0;
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  &__role-pill {
    margin-top: 8px;
    padding: 5px 16px;
    border-radius: var(--glacia-radius-pill);
    background: rgba(255, 37, 41, 0.1);
    color: var(--glacia-red);
    font-size: 12px;
    font-weight: 700;
  }

  &__divider {
    align-self: stretch;
    height: 0;
    margin: 8px 0;
    border-top: 1px dashed rgba(15, 23, 42, 0.16);
  }

  &__fields {
    align-self: stretch;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__twofa {
    align-self: stretch;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 8px;
    padding: 9px 14px;
    border-radius: var(--glacia-radius-sm);

    &-left {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--glacia-ink);
    }

    &-status {
      font-size: 13px;
      font-weight: 800;
    }

    &.on {
      background: rgba(22, 163, 74, 0.1);
      color: #16a34a;

      .account__twofa-status { color: #16a34a; }
    }

    &.off {
      background: rgba(220, 38, 38, 0.08);
      color: var(--glacia-sev-critical);

      .account__twofa-status { color: var(--glacia-sev-critical); }
    }
  }
}

.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 14px;
  border-radius: var(--glacia-radius-sm);

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  &__icon {
    color: var(--glacia-ink-dim);
    opacity: 0.8;
    flex-shrink: 0;
  }

  &__label {
    font-size: 13px;
    color: var(--glacia-ink-dim);
    font-weight: 500;
  }

  &__value {
    font-size: 14px;
    font-weight: 700;
    color: var(--glacia-ink);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 55%;
  }
}
</style>
