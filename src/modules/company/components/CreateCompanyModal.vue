<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { IconX, IconCheck } from '@tabler/icons-vue'
import DatePicker from '@/components/common/DatePicker.vue'
import GlassField from '@/components/common/GlassField.vue'

// The Create Company form (name, billing model, per-module quotas, optional
// activation dates). Shared by the navbar's "Create Company" button and the
// "Create sub company" action — only the title differs.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Create Company' },
})
const emit = defineEmits(['update:modelValue', 'created'])

// ── Create Company modal ─────────────────────────────────────────────────────
const newCompanyName = ref('')
const billingModel = ref(null)
const domainQuota = ref(null)
const networkQuota = ref(null)
const webappQuota = ref(null)
const sourceQuota = ref(null)
const createCompanyState = ref('idle') // 'idle' | 'loading' | 'saved'
const createStep = ref('form') // 'form' | 'activation' — contract flow is two steps
const activationEnabled = ref(false)
const activationDate = ref('')
const expirationDate = ref('')

// Which of the modal's dropdown fields is currently open (only one at a time).
// Rendered inline, right below its own trigger — it pushes the rest of the
// form (and the Cancel/Next row) down rather than floating over it.
const openFieldMenu = ref(null)

const billingOptions = [
  { value: 'contract', label: 'Contract Based' },
  { value: 'credit',   label: 'Credit Based' },
]

const quotaOptions = [
  { value: 'unlimited', label: 'Unlimited' },
  { value: '1',  label: '1 scan / month' },
  { value: '2',  label: '2 scans / month' },
  { value: '3',  label: '3 scans / month' },
  { value: '4',  label: '4 scans / month' },
  { value: '5',  label: '5 scans / month' },
  { value: '6',  label: '6 scans / month' },
  { value: '7',  label: '7 scans / month' },
  { value: '8',  label: '8 scans / month' },
  { value: '9',  label: '9 scans / month' },
  { value: '10', label: '10 scans / month' },
  { value: '11', label: '11 scans / month' },
  { value: '12', label: '12 scans / month' },
]

// Only Contract Based needs the per-module quotas set up front — Credit
// Based is pay-as-you-go, so those fields don't apply and stay hidden.
const showQuotaFields = computed(() => billingModel.value === 'contract')

const canCreateCompany = computed(() => {
  if (!newCompanyName.value.trim() || !billingModel.value) return false
  if (showQuotaFields.value) {
    return !!(domainQuota.value && networkQuota.value && webappQuota.value && sourceQuota.value)
  }
  return true
})

// Step 2 (contract only): toggle off → Save stays active; toggle on → both
// dates required and expiration must not precede activation.
const canSaveActivation = computed(() => {
  if (!activationEnabled.value) return true
  if (!activationDate.value || !expirationDate.value) return false
  return expirationDate.value >= activationDate.value
})

function resetForm() {
  newCompanyName.value = ''
  billingModel.value = null
  domainQuota.value = null
  networkQuota.value = null
  webappQuota.value = null
  sourceQuota.value = null
  createStep.value = 'form'
  activationEnabled.value = false
  activationDate.value = ''
  expirationDate.value = ''
  openFieldMenu.value = null
  createCompanyState.value = 'idle'
  // Fresh open always starts at natural height.
  if (createModalEl.value) createModalEl.value.style.height = ''
  }

function closeCreateCompanyModal() {
  emit('update:modelValue', false)
  openFieldMenu.value = null
  if (createModalEl.value) {
    if (createModalEl.value._releaseTimer) clearTimeout(createModalEl.value._releaseTimer)
    createModalEl.value.style.height = ''
  }
}

function toggleFieldMenu(key) {
  animateModalHeight(() => {
    openFieldMenu.value = openFieldMenu.value === key ? null : key
  })
}

// The modal tweens its own height to follow in-flow panels: lock to the
// current height, apply the DOM change, measure the new natural height,
// then release back to auto once the tween finishes.
const createModalEl = ref(null)

function animateModalHeight(mutate) {
  const modal = createModalEl.value
  if (!modal) {
    mutate()
    return
  }
  if (modal._releaseTimer) clearTimeout(modal._releaseTimer)
  modal.style.height = `${modal.offsetHeight}px`
  mutate()
  nextTick(() => {
    requestAnimationFrame(() => {
      const target = Math.min(modal.scrollHeight, Math.floor(window.innerHeight * 0.88))
      // Already at the target height — no transition will run (and none is
      // needed), so release immediately instead of stranding a pixel height.
      if (Math.abs(target - modal.offsetHeight) < 2) {
        modal.style.height = ''
        return
      }
      modal.style.height = `${target}px`
      // Safety net: a skipped transitionend (interrupted tween, throttled
      // frames) must never leave a stale pixel height behind.
      modal._releaseTimer = setTimeout(() => {
        modal.style.height = ''
      }, 500)
    })
  })
}

function releaseModalHeight(e) {
  if (e.propertyName !== 'height') return
  if (createModalEl.value) createModalEl.value.style.height = ''
}

function toggleActivation() {
  animateModalHeight(() => {
    activationEnabled.value = !activationEnabled.value
  })
}

// Billing model drives whether the quota-panel section is shown at all, so
// picking it still needs to tween the modal's height open/shut; the quota
// fields themselves are plain GlassField selects now (floating menus don't
// push the layout, so they need no special handling).
function onBillingModelChange(value) {
  animateModalHeight(() => {
    billingModel.value = value
    // Switching away from Contract Based clears any quotas already chosen —
    // they're hidden and no longer part of the payload.
    if (value !== 'contract') {
      domainQuota.value = null
      networkQuota.value = null
      webappQuota.value = null
      sourceQuota.value = null
    }
  })
}

// Calendar picks funnel through here so choosing a new activation date can
// also drop an expiration date it would invalidate.
function selectDate(field, iso) {
  animateModalHeight(() => {
    if (field === 'activationDate') {
      activationDate.value = iso
      if (expirationDate.value && expirationDate.value < iso) expirationDate.value = ''
    } else {
      expirationDate.value = iso
    }
    openFieldMenu.value = null
  })
}

function submitCreateCompany() {
  if (!canCreateCompany.value || createCompanyState.value !== 'idle') return
  // Contract flow continues to the activation step instead of saving here.
  if (showQuotaFields.value) {
    animateModalHeight(() => {
      activationEnabled.value = false
      activationDate.value = ''
      expirationDate.value = ''
      createStep.value = 'activation'
    })
    return
  }
  createCompanyState.value = 'loading'
  setTimeout(() => {
    // stub — wire up to a real create-company API call when it exists
    console.info(props.title, {
      name: newCompanyName.value.trim(),
      billingModel: billingModel.value,
      quotas: null,
      activation: null,
    })
    createCompanyState.value = 'saved'
    emit('created')
    setTimeout(closeCreateCompanyModal, 700)
  }, 500)
}

function submitActivation() {
  if (!canSaveActivation.value || createCompanyState.value !== 'idle') return
  createCompanyState.value = 'loading'
  setTimeout(() => {
    // stub — wire up to a real create-company API call when it exists
    console.info(props.title, {
      name: newCompanyName.value.trim(),
      billingModel: billingModel.value,
      quotas: { domain: domainQuota.value, network: networkQuota.value, webapp: webappQuota.value, source: sourceQuota.value },
      activation: activationEnabled.value
        ? { activationDate: activationDate.value, expirationDate: expirationDate.value }
        : null,
    })
    createCompanyState.value = 'saved'
    emit('created')
    setTimeout(closeCreateCompanyModal, 700)
  }, 500)
}

// Fresh form each time the modal opens.
watch(() => props.modelValue, (open) => {
  if (open) resetForm()
})

// A dropdown closed by an outside click still tweens the modal height shut.
function handleClickOutside(e) {
  if (e.target.closest('.form-select')) return
  const modalFields = ['activationDate', 'expirationDate']
  if (props.modelValue && modalFields.includes(openFieldMenu.value)) {
    animateModalHeight(() => {
      openFieldMenu.value = null
    })
  } else {
    openFieldMenu.value = null
  }
}
onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" @mousedown.self="closeCreateCompanyModal">
        <div ref="createModalEl" class="create-modal" @transitionend.self="releaseModalHeight">
          <div class="create-modal__head">
            <h2 class="create-modal__title">{{ title }}</h2>
            <button type="button" class="create-modal__close" aria-label="Close" @click="closeCreateCompanyModal">
              <IconX :size="22" />
            </button>
          </div>

          <div class="create-modal__body">
            <template v-if="createStep === 'form'">
            <div class="create-modal__group">
              <GlassField
                v-model="newCompanyName"
                label="Company name"
                placeholder="input company name..."
                required
                error-text="Company name is required"
              />

              <GlassField
                :model-value="billingModel"
                type="select"
                label="Billing model"
                placeholder="select billing model..."
                :options="billingOptions"
                required
                error-text="Choose a billing model"
                @update:model-value="onBillingModelChange"
              />

              <div class="quota-panel" :class="{ 'quota-panel--open': showQuotaFields }">
                <div class="quota-stagger-item" :class="{ 'quota-stagger-item--animate': showQuotaFields }">
                  <GlassField
                    v-model="domainQuota"
                    type="select"
                    label="Domain inspection scan quota for one month"
                    placeholder="select quota"
                    :options="quotaOptions"
                    required
                    error-text="Domain inspection quota is required"
                  />
                </div>

                <div class="quota-stagger-item" :class="{ 'quota-stagger-item--animate': showQuotaFields }">
                  <GlassField
                    v-model="networkQuota"
                    type="select"
                    label="Network scan quota for one month"
                    placeholder="select quota"
                    :options="quotaOptions"
                    required
                    error-text="Network scan quota is required"
                  />
                </div>

                <div class="quota-stagger-item" :class="{ 'quota-stagger-item--animate': showQuotaFields }">
                  <GlassField
                    v-model="webappQuota"
                    type="select"
                    label="Web application scan quota for one month"
                    placeholder="select quota"
                    :options="quotaOptions"
                    required
                    error-text="Web application scan quota is required"
                  />
                </div>

                <div class="quota-stagger-item" :class="{ 'quota-stagger-item--animate': showQuotaFields }">
                  <GlassField
                    v-model="sourceQuota"
                    type="select"
                    label="Source code scan quota for one month"
                    placeholder="select quota"
                    :options="quotaOptions"
                    required
                    error-text="Source code scan quota is required"
                  />
                </div>
              </div>
            </div>
            </template>

            <template v-else>
              <p class="create-modal__desc">Activate your company account now to start using all features right away. Not ready yet? You can set it up later.</p>
              <div class="activation-card">
                <div class="activation-card__row">
                  <div class="activation-card__text">
                    <div class="activation-card__title">Set up company account activation</div>
                    <div class="activation-card__desc">This setup can be configured later in the company section.</div>
                  </div>
                  <button
                    type="button"
                    class="toggle-switch"
                    :class="{ 'toggle-switch--on': activationEnabled }"
                    role="switch"
                    :aria-checked="activationEnabled"
                    @click="toggleActivation"
                  >
                    <span class="toggle-switch__thumb" />
                  </button>
                </div>
                <Transition name="form-select-fade">
                  <div v-if="activationEnabled" class="activation-card__dates">
                    <div class="activation-card__divider" />
                    <label class="create-modal__label">Company account activation date<span class="create-modal__required">*</span></label>
                    <DatePicker
                      v-model="activationDate"
                      :open="openFieldMenu === 'activationDate'"
                      @toggle="toggleFieldMenu('activationDate')"
                      @select="selectDate('activationDate', $event)"
                    />
                    <label class="create-modal__label">Company account expiration date<span class="create-modal__required">*</span></label>
                    <DatePicker
                      v-model="expirationDate"
                      :open="openFieldMenu === 'expirationDate'"
                      :min="activationDate || undefined"
                      @toggle="toggleFieldMenu('expirationDate')"
                      @select="selectDate('expirationDate', $event)"
                    />
                  </div>
                </Transition>
              </div>
            </template>
          </div>

          <div class="create-modal__actions">
            <button type="button" class="modal-btn modal-btn--cancel" @click="closeCreateCompanyModal">Cancel</button>
            <button
              v-if="createStep === 'form'"
              type="button"
              class="modal-btn"
              :class="canCreateCompany
                ? { 'modal-btn--save': true, 'modal-btn--saved': createCompanyState === 'saved' }
                : 'modal-btn--create'"
              :disabled="!canCreateCompany"
              @click="submitCreateCompany"
            >
              <span v-if="createCompanyState === 'loading'" class="modal-btn__spinner" />
              <IconCheck v-else-if="createCompanyState === 'saved'" :size="18" class="modal-btn__check" />
              <span v-else>{{ showQuotaFields ? 'Next' : 'Save' }}</span>
            </button>
            <button
              v-else
              type="button"
              class="modal-btn"
              :class="canSaveActivation
                ? { 'modal-btn--save': true, 'modal-btn--saved': createCompanyState === 'saved' }
                : 'modal-btn--create'"
              :disabled="!canSaveActivation"
              @click="submitActivation"
            >
              <span v-if="createCompanyState === 'loading'" class="modal-btn__spinner" />
              <IconCheck v-else-if="createCompanyState === 'saved'" :size="18" class="modal-btn__check" />
              <span v-else>Save</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss" src="./CreateCompanyModal.scss"></style>
