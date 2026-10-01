<script setup>
import { ref, computed, watch } from 'vue'
import { IconX, IconCheck } from '@tabler/icons-vue'
import GlassField from '@/components/common/GlassField.vue'

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

<style scoped lang="scss" src="./CreateTicketModal.scss"></style>
