<script setup>
import { ref, computed } from 'vue'
import { IconShieldLock, IconShieldCheck } from '@tabler/icons-vue'
import { useAuthStore } from '@/stores/auth'
import GlassField from '@/components/common/GlassField.vue'
import TwoFactorSetup from './TwoFactorSetup.vue'
import TwoFactorTurnOff from './TwoFactorTurnOff.vue'

const auth = useAuthStore()
const enabled = computed(() => auth.twoFAEnabled)

// view: 'status' | 'password' (re-enter password) | 'setup' (QR + verification code) | 'turn-off' (password, then code)
const view = ref('status')

// ── Password check before setup (mock: the demo password; a real backend verifies it server side) ──
const DEMO_PASSWORD = 'demo'
const password = ref('')
const passwordError = ref('')
const passwordState = ref('idle') // 'idle' | 'loading'

function askPassword() {
  password.value = ''
  passwordError.value = ''
  passwordState.value = 'idle'
  view.value = 'password'
}
function checkPassword() {
  if (!password.value || passwordState.value !== 'idle') return
  passwordError.value = ''
  passwordState.value = 'loading'
  setTimeout(() => {
    passwordState.value = 'idle'
    if (password.value !== DEMO_PASSWORD) {
      passwordError.value = 'Incorrect password.'
      return
    }
    password.value = ''
    view.value = 'setup'
  }, 600)
}

function cancel() {
  view.value = 'status'
}
function setupDone() {
  auth.setTwoFactor(true)
  view.value = 'status'
}
function turnOff() {
  auth.setTwoFactor(false)
  view.value = 'status'
}
</script>

<template>
  <div class="tf">
    <header v-if="view !== 'setup'" class="sec-head">
      <h2 class="sec-head__title">Two-factor authentication</h2>
      <p class="sec-head__desc">Add a second step at sign-in so a stolen password alone can't open your account.</p>
    </header>

    <!-- Status -->
    <template v-if="view === 'status'">
      <div class="tf__card" :class="enabled ? 'tf__card--on' : 'tf__card--off'">
        <span class="tf__icon">
          <IconShieldCheck v-if="enabled" :size="26" />
          <IconShieldLock v-else :size="26" />
        </span>
        <div class="tf__card-text">
          <div class="tf__card-title">
            Authenticator app
            <span class="tf__pill" :class="enabled ? 'tf__pill--on' : 'tf__pill--off'">{{ enabled ? 'Active' : 'Inactive' }}</span>
          </div>
          <p class="tf__card-desc">
            {{ enabled
              ? 'Your account asks for a 6-digit code from your authenticator app each time you sign in.'
              : 'Use an authenticator app (Google Authenticator, Authy, 1Password…) to generate a sign-in code.' }}
          </p>
        </div>
        <button v-if="!enabled" type="button" class="tf__btn tf__btn--primary" @click="askPassword">Set up</button>
        <button v-else type="button" class="tf__btn tf__btn--ghost" @click="view = 'turn-off'">Turn off</button>
      </div>
    </template>

    <!-- Confirm password -->
    <template v-else-if="view === 'password'">
      <div class="tf__confirm tf__confirm--neutral">
        <div class="tf__confirm-title">Confirm your password</div>
        <p class="tf__confirm-desc">For your security, enter your password before setting up two-factor authentication.</p>
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
            @enter="checkPassword"
          />
        </div>
        <div class="tf__actions">
          <button type="button" class="tf__btn tf__btn--ghost" @click="cancel">Cancel</button>
          <button type="button" class="tf__btn tf__btn--primary" :disabled="!password || passwordState !== 'idle'" @click="checkPassword">
            <span v-if="passwordState === 'loading'" class="tf__spinner" />
            <span v-else>Continue</span>
          </button>
        </div>
      </div>
    </template>

    <!-- Turn off: password, then a 6-digit code -->
    <TwoFactorTurnOff v-else-if="view === 'turn-off'" @done="turnOff" @cancel="cancel" />

    <!-- Setup -->
    <TwoFactorSetup v-else-if="view === 'setup'" @done="setupDone" @cancel="cancel" />
  </div>
</template>

<style scoped lang="scss" src="./TwoFactorSection.scss"></style>
