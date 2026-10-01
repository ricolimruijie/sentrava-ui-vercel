<script setup>
import { ref, computed } from 'vue'
import { IconShieldLock, IconShieldCheck, IconCopy, IconCheck, IconDeviceMobile } from '@tabler/icons-vue'
import { useAuthStore } from '@/stores/auth'
import GlassField from '@/components/common/GlassField.vue'

const auth = useAuthStore()
const enabled = computed(() => auth.twoFAEnabled)

// view: 'status' | 'setup' (scan + verify) | 'confirm-off'
const view = ref('status')

// ── Setup (mock): a fake secret + decorative QR; any 6-digit code verifies. ──
const secret = 'JBSW Y3DP EHPK 3PXP'
const code = ref('')
const verifyState = ref('idle') // 'idle' | 'loading'
const copied = ref(false)
const codeValid = computed(() => /^\d{6}$/.test(code.value))
const codeError = computed(() => (code.value && !/^\d*$/.test(code.value) ? 'Digits only.' : code.value && code.value.length < 6 ? 'Enter all 6 digits.' : ''))

// Decorative QR-style grid (21 × 21) with the three finder squares — a real QR
// would be generated from the secret by the backend.
const SIZE = 21
const cells = computed(() => {
  const out = []
  let seed = 7
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  const inFinder = (x, y) => [[0, 0], [SIZE - 7, 0], [0, SIZE - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (inFinder(x, y)) continue
      if (rnd() > 0.52) out.push({ x, y })
    }
  }
  return out
})
const finders = [[0, 0], [SIZE - 7, 0], [0, SIZE - 7]]

function startSetup() {
  code.value = ''
  verifyState.value = 'idle'
  copied.value = false
  view.value = 'setup'
}
function cancel() {
  view.value = 'status'
}
function verify() {
  if (!codeValid.value || verifyState.value !== 'idle') return
  verifyState.value = 'loading'
  setTimeout(() => {
    auth.setTwoFactor(true)
    verifyState.value = 'idle'
    view.value = 'status'
  }, 700)
}
function turnOff() {
  auth.setTwoFactor(false)
  view.value = 'status'
}
async function copySecret() {
  try { await navigator.clipboard.writeText(secret.replace(/\s/g, '')) } catch { /* clipboard unavailable */ }
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}
</script>

<template>
  <div class="tf">
    <header class="sec-head">
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
        <button v-if="!enabled" type="button" class="tf__btn tf__btn--primary" @click="startSetup">Set up</button>
        <button v-else type="button" class="tf__btn tf__btn--ghost" @click="view = 'confirm-off'">Turn off</button>
      </div>
    </template>

    <!-- Turn off confirmation -->
    <template v-else-if="view === 'confirm-off'">
      <div class="tf__confirm">
        <div class="tf__confirm-title">Turn off two-factor authentication?</div>
        <p class="tf__confirm-desc">Your account will only be protected by your password. You can set it up again at any time.</p>
        <div class="tf__actions">
          <button type="button" class="tf__btn tf__btn--ghost" @click="cancel">Cancel</button>
          <button type="button" class="tf__btn tf__btn--danger" @click="turnOff">Turn off</button>
        </div>
      </div>
    </template>

    <!-- Setup -->
    <template v-else>
      <ol class="tf__steps">
        <li class="tf__step">
          <span class="tf__step-n">1</span>
          <div class="tf__step-body">
            <div class="tf__step-title">Scan this code with your authenticator app</div>
            <div class="tf__scan">
              <svg class="tf__qr" :viewBox="`-1 -1 ${SIZE + 2} ${SIZE + 2}`" role="img" aria-label="QR code placeholder">
                <rect :x="-1" :y="-1" :width="SIZE + 2" :height="SIZE + 2" fill="#fff" />
                <rect v-for="c in cells" :key="`${c.x}-${c.y}`" :x="c.x" :y="c.y" width="1" height="1" fill="#101820" />
                <g v-for="([fx, fy], i) in finders" :key="i">
                  <rect :x="fx" :y="fy" width="7" height="7" fill="#101820" />
                  <rect :x="fx + 1" :y="fy + 1" width="5" height="5" fill="#fff" />
                  <rect :x="fx + 2" :y="fy + 2" width="3" height="3" fill="#101820" />
                </g>
              </svg>
              <div class="tf__secret">
                <span class="tf__secret-label"><IconDeviceMobile :size="14" /> Can't scan? Enter this key instead</span>
                <div class="tf__secret-row">
                  <code class="tf__secret-key">{{ secret }}</code>
                  <button type="button" class="tf__copy" @click="copySecret">
                    <IconCheck v-if="copied" :size="14" /><IconCopy v-else :size="14" />
                    {{ copied ? 'Copied' : 'Copy' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </li>

        <li class="tf__step">
          <span class="tf__step-n">2</span>
          <div class="tf__step-body">
            <div class="tf__step-title">Enter the 6-digit code it shows</div>
            <div class="tf__code">
              <GlassField
                v-model="code"
                label="Verification code"
                placeholder="000000"
                :maxlength="6"
                required
                :invalid="!!codeError"
                :error-text="codeError || 'Enter the 6-digit code'"
                @enter="verify"
              />
            </div>
          </div>
        </li>
      </ol>

      <div class="tf__actions">
        <button type="button" class="tf__btn tf__btn--ghost" @click="cancel">Cancel</button>
        <button type="button" class="tf__btn tf__btn--primary" :disabled="!codeValid || verifyState !== 'idle'" @click="verify">
          <span v-if="verifyState === 'loading'" class="tf__spinner" />
          <span v-else>Verify and turn on</span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss" src="./TwoFactorSection.scss"></style>
