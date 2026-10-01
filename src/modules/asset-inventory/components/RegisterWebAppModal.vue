<script setup>
import { ref, computed, watch } from 'vue'
import { IconCheck, IconX } from '@tabler/icons-vue'
import GlassField from '@/components/common/GlassField.vue'

// Register URL (web application) form. Emits `registered` with the new row; the page adds it to its list.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  ownerOptions: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'registered'])

const regWAOwner = ref(null)
const regWAName = ref('')
const regWAUrl = ref('')
const regWABasic = ref(false)
const regWAUser = ref('')
const regWAPass = ref('')
const regWAState = ref('idle') // 'idle' | 'loading' | 'saved'
const regWAUrlError = computed(() => {
  const u = regWAUrl.value.trim()
  if (!u) return ''
  if (!/^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(u)) return 'Please enter a valid URL (e.g., https://example.com)'
  return ''
})
const canRegisterWebapp = computed(() => {
  if (!regWAOwner.value || !regWAName.value.trim() || !regWAUrl.value.trim() || regWAUrlError.value) return false
  if (regWABasic.value && (!regWAUser.value.trim() || !regWAPass.value)) return false
  return true
})
function closeRegisterWebappModal() {
  emit('update:modelValue', false)
}
function selectRegWAOwner(value) {
  regWAOwner.value = value
}
function submitRegisterWebapp() {
  if (!canRegisterWebapp.value || regWAState.value !== 'idle') return
  regWAState.value = 'loading'
  setTimeout(() => {
    emit('registered', {
      appName: regWAName.value.trim(),
      url: regWAUrl.value.trim(),
      owner: regWAOwner.value,
      basicAuth: regWABasic.value ? 'Active' : 'Inactive',
      lastScanned: '-',
      tags: [],
      status: 'Scanning',
    })
    regWAState.value = 'saved'
    setTimeout(closeRegisterWebappModal, 700)
  }, 500)
}

// ── Register Network modal (RegisterNetworkModal) ──
const showRegisterNetworkModal = ref(false)
function onNetworkRegistered(row) {
  networks.value.unshift({ id: networks.value.length + 1, ...row })
}

// ── Register Domain modal (RegisterDomainModal) ──
const showRegisterModal = ref(false)
function onDomainRegistered(row) {
  assets.value.unshift({ id: assets.value.length + 1, ...row })
}

// Start every open with a clean form.
watch(() => props.modelValue, (open) => {
  if (!open) return
  regWAOwner.value = null
  regWAName.value = ''
  regWAUrl.value = ''
  regWABasic.value = false
  regWAUser.value = ''
  regWAPass.value = ''
  regWAState.value = 'idle'
})
</script>

<template>
<Teleport to="body">
  <Transition name="modal-fade">
    <div v-if="modelValue" class="modal-backdrop" @mousedown.self="closeRegisterWebappModal">
      <div class="create-modal">
        <div class="create-modal__head">
          <h2 class="create-modal__title">Register URL</h2>
          <button type="button" class="create-modal__close" aria-label="Close" @click="closeRegisterWebappModal">
            <IconX :size="20" />
          </button>
        </div>

        <div class="create-modal__body">
          <div class="create-modal__group">
            <GlassField
              type="select"
              label="Asset Owner"
              placeholder="Asset Owner"
              required
              :options="ownerOptions"
              :model-value="regWAOwner"
              @update:model-value="selectRegWAOwner"
              error-text="Asset Owner is required"
            />

            <GlassField
              v-model="regWAName"
              label="Application Name"
              placeholder="Application Name"
              required
              error-text="Application Name is required"
            />

            <GlassField
              v-model="regWAUrl"
              label="Input URL"
              placeholder="Input URL"
              required
              :invalid="!!regWAUrlError"
              :error-text="regWAUrlError || 'URL is required'"
            />
          </div>

          <div class="auth-block">
            <span class="auth-block__label">Authentication</span>
            <div class="basic-auth-card">
              <div class="basic-auth-card__row">
                <span class="basic-auth-card__title">Basic Authentication</span>
                <button
                  type="button"
                  class="toggle-switch"
                  :class="{ 'toggle-switch--on': regWABasic }"
                  role="switch"
                  :aria-checked="regWABasic"
                  @click="regWABasic = !regWABasic"
                >
                  <span class="toggle-switch__thumb" />
                </button>
              </div>
              <Transition name="dv-expand">
                <div v-if="regWABasic" class="basic-auth-card__fields">
                  <GlassField v-model="regWAUser" label="Username" placeholder="Username" required error-text="Username is required" />
                  <GlassField v-model="regWAPass" label="Password" placeholder="Password" input-type="password" required error-text="Password is required" />
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <div class="create-modal__actions">
          <button type="button" class="modal-btn modal-btn--cancel" @click="closeRegisterWebappModal">Cancel</button>
          <button
            type="button"
            class="modal-btn"
            :class="canRegisterWebapp ? { 'modal-btn--save': true, 'modal-btn--saved': regWAState === 'saved' } : 'modal-btn--create'"
            :disabled="!canRegisterWebapp"
            @click="submitRegisterWebapp"
          >
            <span v-if="regWAState === 'loading'" class="modal-btn__spinner" />
            <IconCheck v-else-if="regWAState === 'saved'" :size="18" class="modal-btn__check" />
            <span v-else>Register</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
</template>

<style scoped lang="scss" src="./RegisterWebAppModal.scss"></style>
