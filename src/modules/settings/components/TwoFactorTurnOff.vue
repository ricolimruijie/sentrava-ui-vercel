<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { IconArrowLeft } from '@tabler/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { maskEmail } from '@/utils/helpers'
import { useResendCooldown } from '@/composables/useResendCooldown'
import GlassField from '@/components/common/GlassField.vue'
import OtpInput from '@/components/common/OtpInput.vue'

// Turning 2FA off takes two proofs (mock): the account password, then a 6-digit code — from the
// authenticator app, or (when the user can't reach it) one sent to their email.
// `done` fires once the code is accepted (the parent turns 2FA off); `cancel` returns to the status card.
const emit = defineEmits(['done', 'cancel'])

const auth = useAuthStore()
const DEMO_PASSWORD = 'demo'

const step = ref('password') // 'password' | 'code' | 'email'
const password = ref('')
const passwordError = ref('')
const code = ref('')
const state = ref('idle') // 'idle' | 'loading'
let timer = null

// Email codes can be re-sent only after a cooldown.
const cooldown = useResendCooldown(60)
const resentNotice = ref(false)
function resend() {
  if (!cooldown.ready.value) return
  code.value = ''
  resentNotice.value = true
  cooldown.start()
  setTimeout(() => { resentNotice.value = false }, 2500)
}

const maskedEmail = computed(() => maskEmail(auth.user?.email))
const canContinue = computed(() => (step.value === 'password' ? !!password.value : code.value.length === 6) && state.value === 'idle')

function later(fn, ms) {
  state.value = 'loading'
  timer = setTimeout(() => { state.value = 'idle'; fn() }, ms)
}

function checkPassword() {
  if (!canContinue.value) return
  passwordError.value = ''
  later(() => {
    if (password.value !== DEMO_PASSWORD) { passwordError.value = 'Incorrect password.'; return }
    step.value = 'code'
  }, 600)
}
function checkCode() {
  if (!canContinue.value) return
  later(() => emit('done'), 700) // mock: any 6-digit code is accepted
}
const submit = () => (step.value === 'password' ? checkPassword() : checkCode())

function useEmail() { code.value = ''; step.value = 'email'; resentNotice.value = false; cooldown.start() }
function useApp() { code.value = ''; step.value = 'code'; cooldown.stop() }

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div class="tf__confirm tf__confirm--neutral">
    <!-- 1. Password -->
    <template v-if="step === 'password'">
      <div class="tf__confirm-title">Confirm your password</div>
      <p class="tf__confirm-desc">For your security, enter your password before turning off two-factor authentication.</p>
      <div class="tf__code tf__code--spaced">
        <GlassField
          v-model="password"
          input-type="password"
          revealable
          label="Password"
          placeholder="Enter your password"
          required
          :invalid="!!passwordError"
          :error-text="passwordError || 'Enter your password'"
          @enter="submit"
        />
      </div>
    </template>

    <!-- 2. Code from the authenticator app / 2b. code sent to email -->
    <template v-else>
      <div class="tf__confirm-title">{{ step === 'code' ? 'Enter your verification code' : 'Check your email' }}</div>
      <p class="tf__confirm-desc">
        {{ step === 'code'
          ? 'Enter the 6-digit code shown in your authenticator app.'
          : `We sent a 6-digit code to ${maskedEmail}. Enter it below.` }}
      </p>
      <div class="tf__otp">
        <OtpInput :key="step" v-model="code" autofocus @enter="submit" />
      </div>
      <p v-if="step === 'code'" class="tf__alt">
        Don't have access to your Authenticator app,
        <button type="button" class="tf__link tf__link--inline" @click="useEmail">click here</button>
      </p>
      <template v-else>
        <p class="tf__alt">
          Didn't get the email?
          <button type="button" class="tf__link tf__link--inline" :disabled="!cooldown.ready.value" @click="resend">{{ cooldown.ready.value ? 'Resend code' : `Resend code in ${cooldown.label.value}` }}</button>
        </p>
        <p v-if="resentNotice" class="tf__sent" role="status">A new code has been sent to {{ maskedEmail }}.</p>
      </template>
      <button v-if="step === 'email'" type="button" class="tf__link tf__link--plain" @click="useApp"><IconArrowLeft :size="15" /> Use your Authenticator app instead</button>
    </template>

    <div class="tf__actions">
      <button type="button" class="tf__btn tf__btn--ghost" :disabled="state === 'loading'" @click="emit('cancel')">Cancel</button>
      <button
        type="button"
        class="tf__btn"
        :class="step === 'password' ? 'tf__btn--primary' : 'tf__btn--danger'"
        :disabled="!canContinue"
        @click="submit"
      >
        <span v-if="state === 'loading'" class="tf__spinner" />
        <span v-else>{{ step === 'password' ? 'Continue' : 'Turn off' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./TwoFactorSection.scss"></style>
<style scoped lang="scss">
.tf__otp { margin-top: 18px; }

.tf__sent {
  margin: 8px 0 0;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #16a34a;
}

.tf__alt {
  margin: 16px 0 0;
  text-align: center;
  font-size: 13.5px;
  color: var(--glacia-ink-dim);
}

.tf__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 16px auto 0;
  padding: 0 2px 2px;
  border: 0;
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--glacia-red);
  cursor: pointer;
  // Same hover as "View all" in the dashboard Ticket Feed: an underline draws in from the left.
  background-color: transparent;
  background-image: linear-gradient(currentColor, currentColor);
  background-size: 0% 2px;
  background-repeat: no-repeat;
  background-position: left calc(100% - 2px);
  transition: background-size 0.25s ease, color 0.15s ease;

  &:hover:not(:disabled) { background-size: 100% 2px; color: #e01e22; }
  &:disabled { opacity: 0.6; cursor: default; }

  &--inline { display: inline; margin: 0; font-size: inherit; }

  // Back link: normal text color instead of the red call-to-action color.
  &--plain { color: var(--glacia-ink); &:hover:not(:disabled) { color: var(--glacia-ink); } }
}

.tf__confirm { display: flex; flex-direction: column; }
</style>
