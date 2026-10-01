<script setup>
import { ref, computed, watch } from 'vue'
import { IconX, IconEye, IconEyeOff, IconRefresh, IconPencil, IconBroadcast, IconBroadcastOff } from '@tabler/icons-vue'
import ProbeBoxEditCredentialModal from './ProbeBoxEditCredentialModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // { id, name, location, status: 'online' | 'offline', lastSeen, integrationUrl, clientKey, secretKey }
  probe: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'update'])

function close() {
  emit('update:modelValue', false)
}

const isOnline = computed(() => props.probe?.status === 'online')

// "January 1 2026 8:00 AM"
function fmt(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).replace(',', '')
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} ${time}`
}

const lastSeen = ref('')
const editOpen = ref(false)
const showSecret = ref(false)
const checkState = ref('idle') // 'idle' | 'loading'
const form = ref({ integrationUrl: '', clientKey: '', secretKey: '' })

// Reopen fresh from the row being viewed.
watch(() => props.modelValue, (open) => {
  if (!open || !props.probe) return
  lastSeen.value = props.probe.lastSeen
  form.value = {
    integrationUrl: props.probe.integrationUrl ?? '',
    clientKey: props.probe.clientKey ?? '',
    secretKey: props.probe.secretKey ?? '',
  }
  editOpen.value = false
  showSecret.value = false
  checkState.value = 'idle'
})

function checkConnection() {
  if (checkState.value !== 'idle') return
  checkState.value = 'loading'
  setTimeout(() => {
    lastSeen.value = new Date().toISOString()
    checkState.value = 'idle'
    emit('update', { id: props.probe.id, lastSeen: lastSeen.value })
  }, 700)
}

// The Edit Credential modal saves the Integration URL.
function onCredentialSaved(patch) {
  form.value = { ...form.value, ...patch }
  emit('update', { id: props.probe.id, ...patch })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue && probe && !editOpen" class="modal-backdrop" @mousedown.self="close">
        <div class="pb-modal" role="dialog" aria-modal="true" aria-labelledby="pb-title">
          <header class="pb-modal__head">
            <h2 id="pb-title" class="pb-modal__title">Integration Overview</h2>
            <button type="button" class="pb-modal__close" aria-label="Close" @click="close">
              <IconX :size="20" />
            </button>
          </header>

          <div class="pb-modal__body">
            <div class="pb-name">
              <p class="pb-name__label">Integration Name</p>
              <p class="pb-name__value">{{ probe.location }}</p>
            </div>

            <div class="pb-status" :class="isOnline ? 'pb-status--online' : 'pb-status--offline'">
              <span class="pb-status__icon">
                <component :is="isOnline ? IconBroadcast : IconBroadcastOff" :size="24" />
              </span>
              <div class="pb-status__text">
                <p class="pb-status__title">{{ isOnline ? 'Probe box is online' : 'Probe box is offline' }}</p>
                <p class="pb-status__meta">Last check {{ fmt(lastSeen) }}</p>
              </div>
              <button type="button" class="pb-status__check" :disabled="checkState === 'loading'" @click="checkConnection">
                <span v-if="checkState === 'loading'" class="pb-spinner" />
                <template v-else><IconRefresh :size="14" /> Check</template>
              </button>
            </div>

            <hr class="pb-divider" />

            <div class="pb-creds__head">
              <h3 class="pb-creds__title">Credentials</h3>
              <button type="button" class="pb-edit" @click="editOpen = true">
                <IconPencil :size="16" /> Edit
              </button>
            </div>

            <div class="pb-form">
              <label class="pb-form__field">
                <span class="pb-form__label">Integration URL</span>
                <input
                  v-model="form.integrationUrl"
                  type="text"
                  class="create-modal__input create-modal__input--readonly"
                  readonly
                  spellcheck="false"
                />
              </label>
              <label class="pb-form__field">
                <span class="pb-form__label">Client Key</span>
                <input
                  v-model="form.clientKey"
                  type="text"
                  class="create-modal__input create-modal__input--readonly"
                  readonly
                  spellcheck="false"
                />
              </label>
              <label class="pb-form__field">
                <span class="pb-form__label">Secret Key</span>
                <span class="pb-form__wrap">
                  <input
                    v-model="form.secretKey"
                    :type="showSecret ? 'text' : 'password'"
                    class="create-modal__input create-modal__input--readonly"
                    readonly
                    spellcheck="false"
                  />
                  <button
                    type="button"
                    class="pb-form__eye"
                    :aria-label="showSecret ? 'Hide secret key' : 'Show secret key'"
                    @click.prevent="showSecret = !showSecret"
                  >
                    <component :is="showSecret ? IconEyeOff : IconEye" :size="18" />
                  </button>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <ProbeBoxEditCredentialModal v-model="editOpen" :probe="{ ...probe, integrationUrl: form.integrationUrl }" @saved="onCredentialSaved" />
</template>

<style scoped lang="scss">
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
.modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }

.pb-modal {
  width: 100%;
  max-width: 520px;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-radius: 24px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  overflow: hidden;
  animation: pb-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 28px;
    border-bottom: 1px solid rgba(var(--tint), 0.1);
    flex-shrink: 0;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__close {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgba(var(--tint), 0.12);
    background: var(--surface);
    color: var(--glacia-ink);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.13s;

    &:hover { background: rgba(var(--tint), 0.05); }
  }

  &__body {
    overflow-y: auto;
    padding: 22px 28px 28px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
}

@keyframes pb-bounce {
  0%   { opacity: 0; transform: scale(0.92) translateY(10px); }
  60%  { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
}

.pb-name {
  &__label {
    margin: 0 0 2px;
    font-size: 14px;
    font-weight: 600;
    color: var(--glacia-ink-dim);
  }

  &__value {
    margin: 0;
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 800;
    color: var(--glacia-ink);
  }
}

// Online / offline banner
.pb-status {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 20px;

  &--online { background: var(--green-soft); .pb-status__title, .pb-status__icon { color: #2f7d57; } }
  &--offline { background: #fdecec; .pb-status__title, .pb-status__icon { color: #b42323; } }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--surface);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__text { flex: 1; min-width: 0; }

  &__title {
    margin: 0;
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 17px;
    font-weight: 800;
  }

  &__meta {
    margin: 2px 0 0;
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  &__check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 72px;
    height: 34px;
    padding: 0 14px;
    border: none;
    border-radius: 999px;
    background: var(--surface);
    color: var(--glacia-ink);
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    transition: box-shadow 0.15s;

    &:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(16, 24, 32, 0.12); }
    &:disabled { cursor: default; }
  }
}

.pb-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(var(--tint), 0.2);
  border-top-color: var(--glacia-ink);
  border-radius: 50%;
  animation: pb-spin 0.7s linear infinite;
}

@keyframes pb-spin { to { transform: rotate(360deg); } }

.pb-divider {
  border: none;
  border-top: 1px solid rgba(var(--tint), 0.12);
  margin: 6px 0 0;
}

.pb-creds {
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 17px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }
}

.pb-edit {
  // Same size as the Create Company button.
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(var(--tint), 0.16);
  border-radius: 999px;
  background: var(--surface);
  color: var(--glacia-ink);
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover {
    background: rgba(255, 37, 41, 0.06);
    border-color: rgba(255, 37, 41, 0.35);
    color: var(--glacia-red);
  }
}

// Read-only credential inputs (same as the app's create-modal inputs)
.create-modal__input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid var(--glacia-glass-border);
  background: var(--surface);
  color: var(--glacia-ink);
  font-size: 14px;
  font-family: 'Manrope', 'Inter', sans-serif;
  outline: none;
  box-sizing: border-box;
  box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);
  transition: border-color 0.13s, box-shadow 0.13s;

  &--readonly {
    background: var(--surface-2);
    color: var(--glacia-ink-dim);
    cursor: default;

    &:focus {
      border-color: var(--glacia-glass-border);
      box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);
    }
  }
}

.pb-form {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--glacia-ink);
  }

  &__wrap {
    position: relative;
    display: block;

    .create-modal__input { padding-right: 44px; }
  }

  &__eye {
    position: absolute;
    top: 50%;
    right: 12px;
    transform: translateY(-50%);
    border: none;
    background: none;
    color: var(--glacia-ink-dim);
    cursor: pointer;
    display: inline-flex;
    padding: 4px;

    &:hover { color: var(--glacia-ink); }
  }
}
</style>
