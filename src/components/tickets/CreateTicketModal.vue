<script setup>
import { ref, computed, watch } from 'vue'
import { IconX, IconCheck } from '@tabler/icons-vue'
import GlassField from '@/components/reusable/GlassField.vue'

// Create Ticket form — only offered to roles other than super admin.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
// `create` payload: { name, category, description }
const emit = defineEmits(['update:modelValue', 'create'])

const categoryOptions = [
  { value: 'Application & System Failures', label: 'Application & System Failures' },
  { value: 'General Enquiry',               label: 'General Enquiry' },
  { value: 'Others',                        label: 'Others' },
]

const name = ref('')
const category = ref(null)
const description = ref('')
const state = ref('idle') // 'idle' | 'loading' | 'saved'

const canSubmit = computed(() => !!name.value.trim() && !!category.value && !!description.value.trim())

watch(() => props.modelValue, (open) => {
  if (!open) return
  name.value = ''
  category.value = null
  description.value = ''
  state.value = 'idle'
})

function close() {
  emit('update:modelValue', false)
}

function submit() {
  if (!canSubmit.value || state.value !== 'idle') return
  state.value = 'loading'
  setTimeout(() => {
    emit('create', { name: name.value.trim(), category: category.value, description: description.value.trim() })
    state.value = 'saved'
    setTimeout(close, 700)
  }, 500)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" @mousedown.self="close">
        <div class="create-modal">
          <div class="create-modal__head">
            <h2 class="create-modal__title">Create Ticket</h2>
            <button type="button" class="create-modal__close" aria-label="Close" @click="close">
              <IconX :size="22" />
            </button>
          </div>

          <div class="create-modal__body">
            <div class="create-modal__group">
              <GlassField
                v-model="name"
                label="Ticket name"
                placeholder="input ticket name..."
                required
                error-text="Ticket name is required"
              />
              <GlassField
                v-model="category"
                type="select"
                label="Issue category"
                placeholder="select issue category..."
                :options="categoryOptions"
                required
                error-text="Choose an issue category"
              />
              <GlassField
                v-model="description"
                type="textarea"
                label="Description"
                placeholder="describe the issue..."
                required
                error-text="Description is required"
              />
            </div>
          </div>

          <div class="create-modal__actions">
            <button type="button" class="modal-btn modal-btn--cancel" @click="close">Cancel</button>
            <button
              type="button"
              class="modal-btn"
              :class="canSubmit
                ? { 'modal-btn--save': true, 'modal-btn--saved': state === 'saved' }
                : 'modal-btn--create'"
              :disabled="!canSubmit"
              @click="submit"
            >
              <span v-if="state === 'loading'" class="modal-btn__spinner" />
              <IconCheck v-else-if="state === 'saved'" :size="18" class="modal-btn__check" />
              <span v-else>Create</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
// ── Create Company modal ─────────────────────────────────────────────────────

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
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
  max-width: 540px;
  max-height: 88vh;
  overflow-y: auto;
  background: var(--surface);
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  padding: 28px;
  animation: create-modal-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  // Height is tweened by JS (animateModalHeight) whenever in-flow panels
  // open/close, so the modal grows and shrinks with its content.
  transition: height 0.38s cubic-bezier(0.4, 0, 0.2, 1);

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
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

  &__label {
    display: block;
    margin: 16px 0 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--glacia-ink);
  }

  &__desc {
    margin: 8px 0 0;
    font-size: 14px;
    line-height: 1.55;
    color: var(--glacia-ink);
  }

  &__required {
    color: var(--glacia-red);
    margin-left: 2px;
  }

  &__input {
    width: 100%;
    height: 54px;
    padding: 0 18px;
    border-radius: 14px;
    border: 0.5px solid var(--glacia-glass-border);
    background: var(--surface);
    color: var(--glacia-ink);
    font-size: 15px;
    font-family: 'Manrope', 'Inter', sans-serif;
    outline: none;
    box-sizing: border-box;
    box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);
    transition: border-color 0.13s, box-shadow 0.13s;

    &::placeholder {
      color: var(--glacia-ink-dim);
    }

    &:focus {
      border-color: #2563EB;
      box-shadow: 0 2px 6px rgba(16, 24, 32, 0.12);
    }
  }

  &__actions {
    display: flex;
    gap: 14px;
    margin-top: 22px;
  }
}

@keyframes create-modal-bounce {
  0%   { opacity: 0; transform: scale(0.92) translateY(10px); }
  60%  { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
}

.create-modal__body {
  // No height cap or scroll here — the modal shell itself tweens its height
  // to follow this content (see animateModalHeight).
  overflow-x: hidden;
  // Setting only overflow-x makes the browser auto-compute overflow-y as
  // "auto" (not "visible") per spec — which would clip a GlassField
  // dropdown menu wherever it overflows past this box. Keep it explicit.
  overflow-y: visible;
  // Room for the dropdown menus' shadow/focus ring without clipping.
  padding: 2px 2px 0;
  margin: 0 -2px;
}

.create-modal__group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
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

    &:hover {
      background: rgba(220, 38, 38, 0.12);
    }
  }

  &--save {
    background: #ff2e3a;
    color: #fff;
    box-shadow: 0 8px 20px -6px rgba(255, 46, 58, 0.4);

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }

    &:not(:disabled):not(.modal-btn--saved):hover {
      background: #e6212c;
    }
  }

  &--saved {
    background: #16a34a;
    box-shadow: 0 8px 20px -6px rgba(22, 163, 74, 0.4);
  }

  &--create {
    background: var(--glacia-glass-fill-strong);
    color: var(--glacia-ink);
    border: 1px solid var(--glacia-glass-border);

    &:disabled {
      color: var(--glacia-ink-dim);
      cursor: default;
    }

    &:not(:disabled):hover {
      background: rgba(255, 37, 41, 0.08);
      border-color: rgba(255, 37, 41, 0.3);
      color: var(--glacia-red);
    }
  }

  &__spinner {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 2px solid rgba(var(--glass-rgb), 0.4);
    border-top-color: #fff;
    animation: modal-btn-spin 0.7s linear infinite;
  }

  &__check {
    animation: modal-btn-pop 0.4s ease;
  }
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
