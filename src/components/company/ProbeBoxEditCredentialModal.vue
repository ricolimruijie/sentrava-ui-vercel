<script setup>
import { ref, computed, watch } from 'vue'
import { IconX, IconCheck } from '@tabler/icons-vue'
import GlassField from '@/components/reusable/GlassField.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // { location, integrationUrl }
  probe: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const url = ref('')
const state = ref('idle') // 'idle' | 'loading' | 'saved'

const original = computed(() => props.probe?.integrationUrl ?? '')
// Save unlocks only once there is a non-empty, changed URL.
const canSave = computed(() => {
  const v = url.value.trim()
  return !!v && v !== original.value && state.value === 'idle'
})

watch(() => props.modelValue, (open) => {
  if (!open) return
  url.value = original.value
  state.value = 'idle'
})

function close() {
  emit('update:modelValue', false)
}

function save() {
  if (!canSave.value) return
  state.value = 'loading'
  setTimeout(() => {
    emit('saved', { integrationUrl: url.value.trim() })
    state.value = 'saved'
    setTimeout(close, 700)
  }, 500)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue && probe" class="modal-backdrop" @mousedown.self="close">
        <div class="create-modal" role="dialog" aria-modal="true" aria-labelledby="pb-edit-title">
          <div class="create-modal__head">
            <h2 id="pb-edit-title" class="create-modal__title">Edit Probe Box Credential</h2>
            <button type="button" class="create-modal__close" aria-label="Close" @click="close">
              <IconX :size="20" />
            </button>
          </div>

          <div class="create-modal__info">
            <p class="create-modal__info-label">Integration Name</p>
            <p class="create-modal__info-value">{{ probe.location }}</p>
          </div>

          <hr class="create-modal__divider" />

          <GlassField
            v-model="url"
            label="Integration URL"
            placeholder="https://your-integration.example.com"
            required
            error-text="Integration URL is required"
            @enter="save"
          />

          <div class="create-modal__actions">
            <button type="button" class="modal-btn modal-btn--cancel" @click="close">Cancel</button>
            <button
              type="button"
              class="modal-btn"
              :class="canSave || state !== 'idle'
                ? { 'modal-btn--save': true, 'modal-btn--saved': state === 'saved' }
                : 'modal-btn--create'"
              :disabled="!canSave"
              @click="save"
            >
              <span v-if="state === 'loading'" class="modal-btn__spinner" />
              <IconCheck v-else-if="state === 'saved'" :size="18" class="modal-btn__check" />
              <span v-else>Save</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
// Same modal look as the rest of the app (create-modal / modal-btn).
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 310;
  padding: 20px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.create-modal {
  width: 100%;
  max-width: 480px;
  background: var(--surface);
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  padding: 28px;
  animation: create-modal-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 26px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__close {
    width: 32px;
    height: 32px;
    border-radius: var(--glacia-radius-sm);
    border: none;
    background: none;
    color: var(--glacia-ink-dim);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.13s, color 0.13s;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--glacia-ink);
    }
  }

  &__info-label {
    font-size: 13px;
    color: var(--glacia-ink-dim);
    margin: 0 0 4px;
  }

  &__info-value {
    font-size: 15px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__divider {
    border: none;
    border-top: 1px solid rgba(var(--tint), 0.12);
    margin: 16px 0 20px;
  }

  &__actions {
    display: flex;
    gap: 14px;
    margin-top: 20px;
  }
}

@keyframes create-modal-bounce {
  0%   { opacity: 0; transform: scale(0.92) translateY(10px); }
  60%  { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
}

.modal-btn {
  flex: 1;
  height: 52px;
  border-radius: 14px;
  border: none;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Manrope', 'Inter', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.13s, opacity 0.13s;

  &--cancel {
    background: rgba(220, 38, 38, 0.06);
    color: var(--glacia-sev-critical);

    &:hover { background: rgba(220, 38, 38, 0.12); }
  }

  &--create {
    background: var(--glacia-glass-fill-strong);
    color: var(--glacia-ink);
    border: 1px solid var(--glacia-glass-border);

    &:disabled {
      color: var(--glacia-ink-dim);
      cursor: default;
    }
  }

  &--save {
    background: #ff2e3a;
    color: #fff;
    box-shadow: 0 8px 20px -6px rgba(255, 46, 58, 0.4);

    &:disabled { cursor: default; }

    &:not(:disabled):not(.modal-btn--saved):hover { background: #e6212c; }
  }

  &--saved {
    background: #16a34a;
    box-shadow: 0 8px 20px -6px rgba(22, 163, 74, 0.4);
  }

  &__spinner {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 2px solid rgba(var(--glass-rgb), 0.4);
    border-top-color: #fff;
    animation: modal-btn-spin 0.7s linear infinite;
  }

  &__check { animation: modal-btn-pop 0.4s ease; }
}

@keyframes modal-btn-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes modal-btn-pop {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}
</style>
