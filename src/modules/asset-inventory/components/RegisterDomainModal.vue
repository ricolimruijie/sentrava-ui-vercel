<script setup>
import { ref, computed, watch } from 'vue'
import { IconCheck, IconX } from '@tabler/icons-vue'
import GlassField from '@/components/common/GlassField.vue'

// Register Domain form. Emits `registered` with the new row; the page adds it to its list.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  ownerOptions: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'registered'])

const registerOwner = ref(null)
const registerDomain = ref('')
const registerState = ref('idle') // 'idle' | 'loading' | 'saved'
const canProceedRegister = computed(() => {
  const d = registerDomain.value.trim()
  const domainOk = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d)
  return !!registerOwner.value && domainOk
})
const registerDomainError = computed(() => {
  const d = registerDomain.value.trim()
  if (!d) return ''
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d)) return 'Please enter a valid domain (e.g., example.com)'
  return ''
})
function closeRegisterModal() {
  emit('update:modelValue', false)
}
function selectRegisterOwner(value) {
  registerOwner.value = value
}
function submitRegister() {
  if (!canProceedRegister.value || registerState.value !== 'idle') return
  registerState.value = 'loading'
  setTimeout(() => {
    emit('registered', {
      domain: registerDomain.value.trim(),
      owner: registerOwner.value,
      lastScanned: '-',
      status: 'Scanning',
    })
    registerState.value = 'saved'
    setTimeout(closeRegisterModal, 700)
  }, 500)
}

// Start every open with a clean form.
watch(() => props.modelValue, (open) => {
  if (!open) return
  registerOwner.value = null
  registerDomain.value = ''
  registerState.value = 'idle'
})
</script>

<template>
<Teleport to="body">
  <Transition name="modal-fade">
    <div v-if="modelValue" class="modal-backdrop" @mousedown.self="closeRegisterModal">
      <div class="create-modal">
        <div class="create-modal__head">
          <h2 class="create-modal__title">Register Domain</h2>
          <button type="button" class="create-modal__close" aria-label="Close" @click="closeRegisterModal">
            <IconX :size="20" />
          </button>
        </div>
        <p class="create-modal__desc">Once the domain is registered, it will go through scanning to discover and find all endpoints that are related to the domain.</p>

        <div class="create-modal__body create-modal__group">
          <GlassField
            type="select"
            label="Asset Owner"
            placeholder="Asset Owner"
            required
            :options="ownerOptions"
            :model-value="registerOwner"
            @update:model-value="selectRegisterOwner"
            error-text="Asset Owner is required"
          />

          <GlassField
            v-model="registerDomain"
            label="Domain"
            placeholder="Input Domain"
            required
            :invalid="!!registerDomainError"
            :error-text="registerDomainError || 'Domain is required'"
          />
        </div>

        <div class="create-modal__actions">
          <button type="button" class="modal-btn modal-btn--cancel" @click="closeRegisterModal">Cancel</button>
          <button
            type="button"
            class="modal-btn"
            :class="canProceedRegister ? { 'modal-btn--save': true, 'modal-btn--saved': registerState === 'saved' } : 'modal-btn--create'"
            :disabled="!canProceedRegister"
            @click="submitRegister"
          >
            <span v-if="registerState === 'loading'" class="modal-btn__spinner" />
            <IconCheck v-else-if="registerState === 'saved'" :size="18" class="modal-btn__check" />
            <span v-else>Register</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
</template>

<style scoped lang="scss" src="./RegisterDomainModal.scss"></style>
