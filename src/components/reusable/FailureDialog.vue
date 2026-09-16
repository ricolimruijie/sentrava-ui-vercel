<script setup>
import { IconCircleX } from '@tabler/icons-vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

defineProps({
  visible: { type: Boolean, required: true },
  title:   { type: String,  default: 'Something went wrong' },
  message: { type: String,  default: 'An unexpected error occurred. Please try again.' },
  label:   { type: String,  default: 'Close' },
})
defineEmits(['update:visible', 'close'])
</script>

<template>
  <Dialog
    :visible="visible"
    :closable="false"
    :modal="true"
    :style="{ width: '380px' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <template #header>
      <div class="failure-header">
        <div class="failure-header__icon">
          <IconCircleX :size="20" />
        </div>
        <span class="failure-header__title">{{ title }}</span>
      </div>
    </template>

    <p class="dialog-body">{{ message }}</p>

    <template #footer>
      <div style="display:flex;justify-content:flex-end;">
        <Button :label="label" severity="danger" @click="$emit('close'); $emit('update:visible', false)" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped lang="scss">
.failure-header {
  display: flex;
  align-items: center;
  gap: 12px;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #fef2f2;
    color: #DC2626;
    flex-shrink: 0;
  }

  &__title {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text);
  }
}

.dialog-body {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  padding: 4px 0 8px;
}
</style>
