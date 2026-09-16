<script setup>
import { IconAlertTriangle } from '@tabler/icons-vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

defineProps({
  visible:     { type: Boolean, required: true },
  title:       { type: String,  default: 'Are you sure?' },
  message:     { type: String,  default: 'This action cannot be undone.' },
  confirmLabel:{ type: String,  default: 'Confirm' },
  cancelLabel: { type: String,  default: 'Cancel' },
  danger:      { type: Boolean, default: false },
  loading:     { type: Boolean, default: false },
})
defineEmits(['update:visible', 'confirm', 'cancel'])
</script>

<template>
  <Dialog
    :visible="visible"
    :closable="false"
    :modal="true"
    :style="{ width: '400px' }"
    :pt="{ root: { class: 'sentra-dialog' } }"
    @update:visible="$emit('update:visible', $event)"
  >
    <template #header>
      <div class="dialog-header">
        <div class="dialog-header__icon" :class="{ 'dialog-header__icon--danger': danger }">
          <IconAlertTriangle :size="20" />
        </div>
        <span class="dialog-header__title">{{ title }}</span>
      </div>
    </template>

    <p class="dialog-body">{{ message }}</p>

    <template #footer>
      <div class="dialog-footer">
        <Button
          :label="cancelLabel"
          severity="secondary"
          outlined
          @click="$emit('cancel'); $emit('update:visible', false)"
        />
        <Button
          :label="confirmLabel"
          :loading="loading"
          :class="danger ? 'p-button-danger' : ''"
          @click="$emit('confirm')"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped lang="scss">
.dialog-header {
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
    background: #fffbeb;
    color: #D97706;
    flex-shrink: 0;

    &--danger {
      background: #fef2f2;
      color: #DC2626;
    }
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
