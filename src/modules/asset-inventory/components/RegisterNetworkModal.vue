<script setup>
import { ref, computed, watch } from 'vue'
import { IconCheck, IconX } from '@tabler/icons-vue'
import GlassField from '@/components/common/GlassField.vue'

// Register Network form (IP Single / IP Range). Emits `registered` with the new row; the page adds it to its list.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  ownerOptions: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'registered'])

const regNetOwner = ref(null)
const regNetType = ref(null) // 'single' | 'range'
const regNetState = ref('idle') // 'idle' | 'loading' | 'saved'
const regNetIp = ref('')
const regNetRange = ref('')
// Set once Proceed is clicked while the IP fields are still empty — only
// then do the inline "required" errors show, matching the reference (the
// button itself stays enabled once Owner + Type are picked; it's the IP
// fields that block the actual submit).
const regNetAttempted = ref(false)
const ipTypeOptions = [
  { value: 'single', label: 'IP Single' },
  { value: 'range',  label: 'IP Range' },
]
// Owner + Type alone gate whether Proceed is clickable at all.
const canRegisterNetwork = computed(() => !!regNetOwner.value && !!regNetType.value)
const isValidIpAddress = (v) => /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(v.trim())
const isValidCidrRange = (v) => /^\d{1,2}$/.test(v.trim()) && Number(v.trim()) >= 0 && Number(v.trim()) <= 32
const regNetIpError = computed(() => {
  if (!regNetAttempted.value) return ''
  if (!regNetIp.value.trim()) return 'IP Address is required'
  if (!isValidIpAddress(regNetIp.value)) return 'Enter a valid IP address, e.g. 1.xx.34.82'
  return ''
})
const regNetRangeError = computed(() => {
  if (!regNetAttempted.value || regNetType.value !== 'range') return ''
  if (!regNetRange.value.trim()) return 'Range is required'
  if (!isValidCidrRange(regNetRange.value)) return 'Enter a valid range, e.g. 24'
  return ''
})

function closeRegisterNetworkModal() {
  emit('update:modelValue', false)
}
function selectRegNetOwner(value) {
  regNetOwner.value = value
}
function selectRegNetType(value) {
  regNetType.value = value
  regNetIp.value = ''
  regNetRange.value = ''
  regNetAttempted.value = false
}
function onRegNetIpInput(e) {
  const cleaned = e.target.value.replace(/[^0-9.]/g, '')
  regNetIp.value = cleaned
  if (e.target.value !== cleaned) e.target.value = cleaned
}
function onRegNetRangeInput(e) {
  const cleaned = e.target.value.replace(/[^0-9]/g, '')
  regNetRange.value = cleaned
  if (e.target.value !== cleaned) e.target.value = cleaned
}
function submitRegisterNetwork() {
  if (!canRegisterNetwork.value || regNetState.value !== 'idle') return
  regNetAttempted.value = true
  if (regNetIpError.value || regNetRangeError.value) return
  regNetState.value = 'loading'
  setTimeout(() => {
    const endpoint = regNetType.value === 'single' ? regNetIp.value.trim() : `${regNetIp.value.trim()}/${regNetRange.value.trim()}`
    emit('registered', {
      endpoint,
      endpointType: regNetType.value === 'single' ? 'IP Single' : 'CIDR',
      owner: regNetOwner.value,
      lastScanned: '-',
      tags: [],
      status: 'Scanning',
    })
    regNetState.value = 'saved'
    setTimeout(closeRegisterNetworkModal, 700)
  }, 500)
}

// Start every open with a clean form.
watch(() => props.modelValue, (open) => {
  if (!open) return
  regNetOwner.value = null
  regNetType.value = null
  regNetState.value = 'idle'
  regNetIp.value = ''
  regNetRange.value = ''
  regNetAttempted.value = false
})
</script>

<template>
<Teleport to="body">
  <Transition name="modal-fade">
    <div v-if="modelValue" class="modal-backdrop" @mousedown.self="closeRegisterNetworkModal">
      <div class="create-modal">
        <div class="create-modal__head">
          <h2 class="create-modal__title">Register Network</h2>
          <button type="button" class="create-modal__close" aria-label="Close" @click="closeRegisterNetworkModal">
            <IconX :size="20" />
          </button>
        </div>

        <div class="create-modal__body create-modal__group">
          <GlassField
            type="select"
            label="Asset Owner"
            placeholder="Asset Owner"
            required
            :options="ownerOptions"
            :model-value="regNetOwner"
            @update:model-value="selectRegNetOwner"
            error-text="Asset Owner is required"
          />

          <GlassField
            type="select"
            label="IP Address Type"
            placeholder="IP Address Type"
            required
            :options="ipTypeOptions"
            :model-value="regNetType"
            @update:model-value="selectRegNetType"
            error-text="IP Address Type is required"
          />

          <Transition name="dv-expand">
            <div v-if="regNetType === 'single'" class="ip-field-gap">
              <GlassField
                :model-value="regNetIp"
                @update:model-value="(v) => onRegNetIpInput({ target: { value: v } })"
                label="IP Address"
                placeholder="Input IP Address"
                required
                :invalid="!!regNetIpError"
                :error-text="regNetIpError || 'IP Address is required'"
              />
              <p v-if="!regNetIpError" class="field-hint">Example: 1.xx.34.82</p>
            </div>
            <div v-else-if="regNetType === 'range'" class="ip-range-row ip-field-gap">
              <div class="ip-range-row__field">
                <GlassField
                  :model-value="regNetIp"
                  @update:model-value="(v) => onRegNetIpInput({ target: { value: v } })"
                  label="IP Address"
                  placeholder="IP Address"
                  required
                  :invalid="!!regNetIpError"
                  :error-text="regNetIpError || 'IP Address is required'"
                />
                <p v-if="!regNetIpError" class="field-hint">Example: 1.xx.34.0</p>
              </div>
              <span class="ip-range-row__sep">/</span>
              <div class="ip-range-row__field">
                <GlassField
                  :model-value="regNetRange"
                  @update:model-value="(v) => onRegNetRangeInput({ target: { value: v } })"
                  label="Range"
                  placeholder="Range"
                  required
                  :invalid="!!regNetRangeError"
                  :error-text="regNetRangeError || 'Range is required'"
                />
                <p v-if="!regNetRangeError" class="field-hint">Example: 24</p>
              </div>
            </div>
          </Transition>
        </div>

        <div class="create-modal__actions">
          <button type="button" class="modal-btn modal-btn--cancel" @click="closeRegisterNetworkModal">Cancel</button>
          <button
            type="button"
            class="modal-btn"
            :class="canRegisterNetwork ? { 'modal-btn--save': true, 'modal-btn--saved': regNetState === 'saved' } : 'modal-btn--create'"
            :disabled="!canRegisterNetwork"
            @click="submitRegisterNetwork"
          >
            <span v-if="regNetState === 'loading'" class="modal-btn__spinner" />
            <IconCheck v-else-if="regNetState === 'saved'" :size="18" class="modal-btn__check" />
            <span v-else>Proceed</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
</template>

<style scoped lang="scss" src="./RegisterNetworkModal.scss"></style>
