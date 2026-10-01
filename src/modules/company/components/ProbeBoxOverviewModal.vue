<script setup>
import { formatLongDateTimeCompact } from '@/utils/helpers'
import { ref, computed, watch } from 'vue'
import { IconX, IconEye, IconEyeOff, IconRefresh, IconPencil, IconBroadcast, IconBroadcastOff } from '@tabler/icons-vue'
import ProbeBoxEditCredentialModal from '@/modules/company/components/ProbeBoxEditCredentialModal.vue'

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
                <p class="pb-status__meta">Last check {{ formatLongDateTimeCompact(lastSeen) }}</p>
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

<style scoped lang="scss" src="./ProbeBoxOverviewModal.scss"></style>
