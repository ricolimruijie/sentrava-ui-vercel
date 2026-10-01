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

<style scoped lang="scss">
.sec-head {
  margin-bottom: 22px;

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__desc {
    margin: 4px 0 0;
    font-size: 13.5px;
    color: var(--glacia-ink-dim);
  }
}

.tf {
  &__card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 20px;
    border-radius: 16px;
    background: rgba(var(--glass-rgb), 0.55);
    border: 1px solid var(--glacia-glass-border);
  }

  &__icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__card--on &__icon { background: rgba(22, 163, 74, 0.12); color: #16a34a; }
  &__card--off &__icon { background: rgba(255, 37, 41, 0.1); color: var(--glacia-red); }

  &__card-text { flex: 1; min-width: 0; }

  &__card-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 800;
    color: var(--glacia-ink);
  }

  &__card-desc {
    margin: 4px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--glacia-ink-dim);
    max-width: 520px;
  }

  &__pill {
    padding: 3px 12px;
    border-radius: var(--glacia-radius-pill);
    font-size: 11.5px;
    font-weight: 700;

    &--on { background: rgba(22, 163, 74, 0.12); color: #16a34a; }
    &--off { background: rgba(100, 116, 139, 0.14); color: #64748b; }
  }

  &__btn {
    min-width: 110px;
    height: 40px;
    padding: 0 20px;
    border-radius: var(--glacia-radius-pill);
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, opacity 0.15s, border-color 0.15s;

    &--primary {
      border: 0;
      background: var(--glacia-red);
      color: #fff;
      box-shadow: 0 6px 20px rgba(255, 37, 41, 0.35);

      &:hover:not(:disabled) { background: #e01e22; }
    }

    &--ghost {
      border: 1px solid rgba(var(--tint), 0.16);
      background: var(--surface);
      color: var(--glacia-ink);

      &:hover { background: rgba(var(--tint), 0.04); }
    }

    &--danger {
      border: 0;
      background: #dc2626;
      color: #fff;

      &:hover { background: #b91c1c; }
    }

    &:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 22px;
  }

  &__confirm {
    padding: 20px;
    border-radius: 16px;
    background: rgba(220, 38, 38, 0.05);
    border: 1px solid rgba(220, 38, 38, 0.18);
  }

  &__confirm-title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 800;
    color: var(--glacia-ink);
  }

  &__confirm-desc {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  &__steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  &__step {
    display: flex;
    gap: 14px;
  }

  &__step-n {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 37, 41, 0.1);
    color: var(--glacia-red);
    font-size: 13px;
    font-weight: 800;
  }

  &__step-body { flex: 1; min-width: 0; }

  &__step-title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: var(--glacia-ink);
    margin: 3px 0 12px;
  }

  &__scan {
    display: flex;
    align-items: center;
    gap: 22px;
    flex-wrap: wrap;
  }

  &__qr {
    width: 168px;
    height: 168px;
    padding: 8px;
    box-sizing: border-box;
    border-radius: 14px;
    background: var(--surface);
    border: 1px solid rgba(var(--tint), 0.12);
  }

  &__secret { display: flex; flex-direction: column; gap: 8px; }

  &__secret-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: var(--glacia-ink-dim);
  }

  &__secret-row { display: flex; align-items: center; gap: 10px; }

  &__secret-key {
    padding: 9px 14px;
    border-radius: 10px;
    background: rgba(var(--tint), 0.05);
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 14px;
    letter-spacing: 0.06em;
    color: var(--glacia-ink);
  }

  &__copy {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 12px;
    border: 1px solid rgba(var(--tint), 0.14);
    border-radius: var(--glacia-radius-pill);
    background: var(--surface);
    font-size: 12.5px;
    font-weight: 600;
    color: var(--glacia-ink);
    cursor: pointer;

    &:hover { background: rgba(var(--tint), 0.04); }
  }

  &__code { max-width: 280px; }

  &__spinner {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid rgba(var(--glass-rgb), 0.45);
    border-top-color: #fff;
    animation: tf-spin 0.7s linear infinite;
  }
}

@keyframes tf-spin { to { transform: rotate(360deg); } }
</style>
