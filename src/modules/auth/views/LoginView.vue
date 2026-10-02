<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore, LOGOUT_REASON_KEY } from '@/stores/auth'
import { SESSION_MESSAGES } from '@/modules/auth/utils/session'
import GlassField from '@/components/common/GlassField.vue'
import OtpInput from '@/components/common/OtpInput.vue'
import { sendTwoFactorEmail } from '@/modules/auth/services/authService'
import { maskEmail } from '@/utils/helpers'
import { useResendCooldown } from '@/composables/useResendCooldown'
import AuthLayout from '@/modules/auth/views/AuthLayout.vue'
import logoIcon from '@/assets/sentrava-logo-icon.svg'

// Login page — design and behavior from references/LoginPage.vue (animated
// coral visual, floating-label-free inputs with focus/error rings, shake on
// invalid submit, show/hide password, Turnstile placeholder, Logging in… →
// Logged in button states), wired to the real auth store.
const layout = 'centered' // 'split' | 'centered'
const motion = true
const turnstileVerified = true // wire to the Turnstile callback once it is real

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const focused = ref(null)
const errors = reactive({ email: '', password: '', form: '' })
const busy = ref(false)
const noData = ref(false) // demo: sign in with every page empty (works with any role)
const done = ref(false)
const shakeKey = ref(0)
let timer

// Two-factor step (shown after the password was accepted for an account with 2FA on):
// 'credentials' → 'code' (authenticator app) ⇄ 'email' (code sent to the user's email).
const step = ref('credentials')
const challenge = ref(null) // { challengeId, email }
const code = ref('')
const resentNotice = ref(false)
const cooldown = useResendCooldown(60)
const maskedEmail = computed(() => maskEmail(challenge.value?.email))

// Say why the user landed here when the session ended on its own (idle / expired).
{
  let reason = route.query.reason
  try { reason = reason || localStorage.getItem(LOGOUT_REASON_KEY) } catch { /* ignore */ }
  if (SESSION_MESSAGES[reason]) errors.form = SESSION_MESSAGES[reason]
  try { localStorage.removeItem(LOGOUT_REASON_KEY) } catch { /* ignore */ }
}

const isSplit = computed(() => layout === 'split')
const btnLabel = computed(() => (busy.value ? 'Logging in…' : done.value ? 'Logged in' : 'Log in'))
const verifyLabel = computed(() => (busy.value ? 'Verifying…' : done.value ? 'Logged in' : 'Verify'))

function clearError(field) { errors[field] = ''; errors.form = ''; done.value = false }

function validate() {
  const e = email.value.trim()
  errors.email = !e ? 'Email is required.' : !/^\S+@\S+\.\S+$/.test(e) ? 'Enter a valid email address.' : ''
  errors.password = password.value ? '' : 'Password is required.'
  return !errors.email && !errors.password
}

async function onSubmit() {
  errors.form = ''
  if (!validate()) { shakeKey.value++; return }
  busy.value = true
  try {
    const res = await auth.login(email.value.trim(), password.value, { dataMode: noData.value ? 'empty' : undefined })
    busy.value = false
    if (res.twoFactorRequired) {
      challenge.value = res
      code.value = ''
      step.value = 'code'
      return
    }
    finishLogin()
  } catch (e) {
    busy.value = false
    errors.form = e?.message ?? 'Invalid credentials. Please try again.'
    shakeKey.value++
  }
}

// Let the "Logged in" state show before leaving the page.
function finishLogin() {
  done.value = true
  timer = setTimeout(() => router.push(route.query.redirect ?? '/dashboard'), 650)
}

function backToLogin(message = '') {
  step.value = 'credentials'
  challenge.value = null
  code.value = ''
  password.value = ''
  cooldown.stop()
  resentNotice.value = false
  errors.form = typeof message === 'string' ? message : ''
}

async function onVerify() {
  if (busy.value || done.value) return
  errors.form = ''
  if (code.value.length !== 6) { errors.form = 'Enter the 6-digit code.'; shakeKey.value++; return }
  busy.value = true
  try {
    await auth.verifyTwoFactor(challenge.value.challengeId, code.value)
    busy.value = false
    finishLogin()
  } catch (e) {
    busy.value = false
    // A locked account or an expired sign-in can't be retried here: back to the password step.
    if (e?.code === 'ACCOUNT_LOCKED' || e?.code === 'CHALLENGE_EXPIRED') { backToLogin(e.message); return }
    errors.form = e?.message ?? 'Invalid verification code'
    code.value = ''
    shakeKey.value++
  }
}

async function sendEmailCode({ resend = false } = {}) {
  if (resend && !cooldown.ready.value) return
  try {
    await sendTwoFactorEmail(challenge.value.challengeId)
  } catch (e) {
    backToLogin(e?.message ?? 'This sign-in has expired. Please log in again.')
    return
  }
  code.value = ''
  errors.form = ''
  cooldown.start()
  resentNotice.value = resend
  if (resend) setTimeout(() => { resentNotice.value = false }, 2500)
}
async function useEmail() { step.value = 'email'; await sendEmailCode() }
function useApp() { step.value = 'code'; code.value = ''; errors.form = ''; cooldown.stop(); resentNotice.value = false }

function forgotPassword() {
  // Carry over whatever email was typed so the next page starts filled in.
  router.push({ name: 'forgot-password', query: email.value.trim() ? { email: email.value.trim() } : {} })
}

// Demo role shortcuts (static mode only)
const IS_STATIC = import.meta.env.VITE_IS_STATIC === 'true'
const demoAccounts = [
  { label: 'Super Admin', email: 'superadmin@sentra.io', password: 'demo' },
  { label: 'Admin',       email: 'admin@acme.com',       password: 'demo' },
  { label: 'Member',      email: 'member@acme.com',      password: 'demo' },
]
function useDemo(account) {
  email.value = account.email
  password.value = account.password
  onSubmit()
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <AuthLayout :layout="layout" :motion="motion">
      <div class="card">
        <header class="head rise" style="--d: 80ms">
          <div class="head__top">
            <span v-if="!isSplit" class="brand"><img :src="logoIcon" class="brand__logo" width="28" height="28" alt="" aria-hidden="true" />SENTRAVA</span>
            <button v-if="step !== 'credentials'" type="button" class="back" @click="backToLogin"><span class="icon icon--sm">arrow_back</span>Back to log in</button>
          </div>
          <template v-if="step === 'credentials'">
          <h1 class="title">Stay ahead of every threat</h1>
          <p class="subtitle">
            Log in to SENTRAVA to see <strong class="hl">every asset</strong>, <strong class="hl">every risk</strong>, and <strong class="hl">what to mitigate next</strong> across your <strong class="hl hl--dark">environment</strong>.
          </p>
          </template>
        </header>

        <form v-if="step === 'credentials'" class="form rise" style="--d: 160ms" novalidate @submit.prevent="onSubmit">
          <div :key="'e' + (errors.email ? shakeKey : 0)" class="fld" :class="{ 'fld--shake': errors.email }">
            <GlassField
              v-model="email"
              label="Email"
              placeholder="Enter email address"
              input-type="email"
              required
              :invalid="!!errors.email"
              :error-text="errors.email || 'Email is required.'"
              @update:model-value="clearError('email')"
              @enter="onSubmit"
            />
          </div>

          <div :key="'p' + (errors.password ? shakeKey : 0)" class="fld fld--pass" :class="{ 'fld--shake': errors.password }">
            <GlassField
              v-model="password"
              label="Password"
              placeholder="Enter password"
              :input-type="showPassword ? 'text' : 'password'"
              required
              :invalid="!!errors.password"
              :error-text="errors.password || 'Password is required.'"
              @update:model-value="clearError('password')"
              @enter="onSubmit"
            />
            <a href="#" class="link fld__forgot" @click.prevent="forgotPassword">Forgot Password</a>
            <button
              type="button" class="eye"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >{{ showPassword ? 'visibility' : 'visibility_off' }}</button>
          </div>

          <span v-if="errors.form" class="error" role="alert"><span class="icon icon--sm">error</span>{{ errors.form }}</span>

          <button type="submit" class="submit" :class="{ 'is-done': done }" :disabled="busy || done || !turnstileVerified">
            <span v-if="busy" class="icon spin">progress_activity</span>
            <span v-else-if="done" class="icon">check</span>
            {{ btnLabel }}
          </button>

          <!-- Replace with the real Cloudflare Turnstile widget -->
          <div class="turnstile">
            <slot name="turnstile">
              <span class="turnstile__check">check</span>
              <span class="turnstile__text">Success!</span>
              <span class="turnstile__brand"><b>CLOUDFLARE</b><small>Privacy · Help</small></span>
            </slot>
          </div>
        </form>

        <!-- Two-factor step -->
        <form v-else class="form rise" novalidate @submit.prevent="onVerify">
          <div class="tfa">
            <h2 class="tfa__title">{{ step === 'code' ? 'Two-factor authentication' : 'Check your email' }}</h2>
            <p class="tfa__desc">
              {{ step === 'code'
                ? 'Enter the 6-digit code shown in your authenticator app.'
                : `We sent a 6-digit code to ${maskedEmail}. Enter it below.` }}
            </p>
          </div>

          <div :key="'c' + (errors.form ? shakeKey : 0)" class="fld" :class="{ 'fld--shake': errors.form }">
            <OtpInput :key="step" v-model="code" autofocus @enter="onVerify" />
          </div>

          <span v-if="errors.form" class="error" role="alert"><span class="icon icon--sm">error</span>{{ errors.form }}</span>

          <button type="submit" class="submit submit--sm" :class="{ 'is-done': done }" :disabled="busy || done">
            <span v-if="busy" class="icon spin">progress_activity</span>
            <span v-else-if="done" class="icon">check</span>
            {{ verifyLabel }}
          </button>

          <p v-if="step === 'code'" class="tfa__alt">
            Don't have access to your Authenticator app,
            <button type="button" class="tfa__link" @click="useEmail">click here</button>
          </p>
          <template v-else>
            <p class="tfa__alt">
              Didn't get the email?
              <button type="button" class="tfa__link" :disabled="!cooldown.ready.value" @click="sendEmailCode({ resend: true })">{{ cooldown.ready.value ? 'Resend code' : `Resend code in ${cooldown.label.value}` }}</button>
            </p>
            <p v-if="resentNotice" class="tfa__sent" role="status">A new code has been sent to {{ maskedEmail }}.</p>
            <button type="button" class="tfa__plain" @click="useApp"><span class="icon icon--sm">arrow_back</span>Use your Authenticator app instead</button>
          </template>
          <p v-if="IS_STATIC" class="tfa__demo">Demo: the code is 123456</p>
        </form>

        <p v-if="step === 'credentials'" class="terms rise" style="--d: 240ms">
          By continuing, you agree to SENTRAVA's <a href="#" class="link">Terms</a> and <a href="#" class="link">Privacy Policy</a>.
        </p>
      </div>
      <div v-if="IS_STATIC" class="card card--demo rise" style="--d: 320ms">
        <div class="demo__label"><span>Quick demo</span></div>
        <button
          type="button" role="switch" :aria-checked="noData" class="demo__switch" :class="{ 'is-on': noData }"
          @click="noData = !noData"
        >
          <span class="demo__track"><i /></span>
          <span class="demo__switch-text">Show every page with no data</span>
        </button>
        <div class="demo__row">
          <button v-for="acc in demoAccounts" :key="acc.email" type="button" class="demo__btn" @click="useDemo(acc)">
            {{ acc.label }}
          </button>
        </div>
      </div>
  </AuthLayout>
</template>

<style scoped src="./auth.css"></style>
