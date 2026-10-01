<script setup>
import { ref, watch } from 'vue'
import { IconX, IconCheck, IconBuildingSkyscraper } from '@tabler/icons-vue'

// Confirm-to-delete modal for a company (idle/loading/saved, auto-close).
// The parent applies the deletion on the `deleted` event.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  companyName: { type: String, default: '' },
  title: { type: String, default: 'Delete Company' },
  ackText: {
    type: String,
    default: 'I understand that this action is irreversible and will permanently delete the organization and all associated user accounts.',
  },
})
const emit = defineEmits(['update:modelValue', 'deleted'])

const confirmed = ref(false)
const state = ref('idle') // 'idle' | 'loading' | 'saved'

watch(() => props.modelValue, (open) => {
  if (open) {
    confirmed.value = false
    state.value = 'idle'
  }
})

function close() {
  emit('update:modelValue', false)
}

function submit() {
  if (!confirmed.value || state.value !== 'idle') return
  state.value = 'loading'
  setTimeout(() => {
    emit('deleted')
    state.value = 'saved'
    setTimeout(close, 700)
  }, 500)
}
</script>

<template>
  <div>
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modelValue" class="modal-backdrop" @mousedown.self="close">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">{{ title }}</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="close">
                <IconX :size="20" />
              </button>
            </div>

            <div class="delete-company__info">
              <span class="delete-company__icon" aria-hidden="true">
                <IconBuildingSkyscraper :size="36" />
              </span>
              <span class="delete-company__name">{{ companyName || '—' }}</span>
            </div>

            <label class="revoke-ack">
              <input v-model="confirmed" type="checkbox" class="revoke-ack__box" />
              <span>{{ ackText }}</span>
            </label>

            <div class="create-modal__actions">
              <button
                type="button"
                class="modal-btn"
                :class="confirmed
                  ? { 'modal-btn--save': true, 'modal-btn--saved': state === 'saved' }
                  : 'modal-btn--create'"
                :disabled="!confirmed"
                @click="submit"
              >
                <span v-if="state === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="state === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Delete</span>
              </button>
              <button type="button" class="modal-btn modal-btn--cancel" @click="close">Cancel</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss" src="./DeleteCompanyModal.scss"></style>
