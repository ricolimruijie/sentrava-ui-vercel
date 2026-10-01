<script setup>
import { IconInbox } from '@tabler/icons-vue'

defineProps({
  title:   { type: String, default: 'Nothing here yet' },
  message: { type: String, default: '' },
  ctaLabel:{ type: String, default: '' },
})
defineEmits(['cta'])
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <slot name="icon">
        <IconInbox :size="32" stroke-width="1.5" />
      </slot>
    </div>
    <p class="empty-state__title">{{ title }}</p>
    <p v-if="message" class="empty-state__message">{{ message }}</p>
    <button v-if="ctaLabel" class="empty-state__cta" @click="$emit('cta')">
      {{ ctaLabel }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  text-align: center;

  &__icon {
    color: var(--color-text-muted);
    margin-bottom: 4px;
  }

  &__title {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  &__message {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    max-width: 220px;
    line-height: 1.5;
  }

  &__cta {
    margin-top: 4px;
    padding: 7px 18px;
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: var(--color-primary-dark); }
  }
}
</style>
