<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { post } from '@/utils/request'
import GlassField from '@/components/reusable/GlassField.vue'
import AuthLayout from './AuthLayout.vue'

// Forgot password — same look as the login page. The user enters the email
// address linked to their account; we always answer "check your inbox" (never
// revealing whether the address has an account).
const layout = 'centered' // 'split' | 'centered'
const motion = true

const router = useRouter()
const route  = useRoute()

const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const errors = reactive({ email: '', form: '' })
const busy = ref(false)
const sent = ref(false)
const resent = ref(false)
const shakeKey = ref(0)
let timer

const btnLabel = computed(() => (busy.value ? 'Sending…' : 'Send reset link'))

function clearError() { errors.email = ''; errors.form = '' }

// Same live email check as the Invite User field: a malformed address turns the
// field red as soon as something is typed, not only after submitting.
const EMAIL_RE = /^\S+@\S+\.\S+$/
const liveEmailError = computed(() => {
  const v = email.value.trim()
  return v && !EMAIL_RE.test(v) ? 'Enter a valid email address.' : ''
})
const emailError = computed(() => errors.email || liveEmailError.value)

function validate() {
  const e = email.value.trim()
  errors.email = !e ? 'Email is required.' : !EMAIL_RE.test(e) ? 'Enter a valid email address.' : ''
  return !errors.email
}

async function send() {
  await post('/auth/forgot-password', { email: email.value.trim() })
}

async function onSubmit() {
  errors.form = ''
  if (!validate()) { shakeKey.value++; return }
  busy.value = true
  try {
    await send()
    sent.value = true
  } catch (e) {
    errors.form = e?.message ?? 'Something went wrong. Please try again.'
    shakeKey.value++
  } finally {
    busy.value = false
  }
}

async function resend() {
  if (busy.value) return
  busy.value = true
  try {
    await send()
    resent.value = true
    clearTimeout(timer)
    timer = setTimeout(() => { resent.value = false }, 3500)
  } finally {
    busy.value = false
  }
}

function useAnotherEmail() {
  sent.value = false
  resent.value = false
}

function backToLogin() {
  router.push({ name: 'login' })
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <AuthLayout :layout="layout" :motion="motion">
    <div class="card">
      <header class="head rise" style="--d: 80ms">
        <span class="brand">SENTRAVA</span>
        <h1 class="title">Forgot your password?</h1>
        <p v-if="!sent" class="subtitle">
          Enter the <strong class="hl">email address</strong> linked to your account and we'll send you a
          <strong class="hl hl--dark">link to reset your password</strong>.
        </p>
        <p v-else class="subtitle">
          If an account exists for <strong class="hl hl--dark">{{ email.trim() }}</strong>, a
          <strong class="hl">reset link</strong> is on its way. It can take a minute to arrive.
        </p>
      </header>

      <form v-if="!sent" class="form rise" style="--d: 160ms" novalidate @submit.prevent="onSubmit">
        <div :key="'e' + (errors.email ? shakeKey : 0)" class="fld" :class="{ 'fld--shake': errors.email }">
          <GlassField
            v-model="email"
            label="Email"
            placeholder="Enter email address"
            input-type="email"
            required
            :invalid="!!emailError"
            :error-text="emailError || 'Email is required.'"
            @update:model-value="clearError"
            @enter="onSubmit"
          />
        </div>

        <span v-if="errors.form" class="error" role="alert"><span class="icon icon--sm">error</span>{{ errors.form }}</span>

        <button type="submit" class="submit" :disabled="busy">
          <span v-if="busy" class="icon spin">progress_activity</span>
          {{ btnLabel }}
        </button>
      </form>

      <div v-else class="sent rise" style="--d: 120ms">
        <span class="sent__icon icon" aria-hidden="true">mark_email_read</span>
        <p class="sent__title">Check your inbox</p>
        <p class="sent__hint">
          Didn't get it?
          <button type="button" class="sent__link" :disabled="busy" @click="resend">Resend the link</button>
          or
          <button type="button" class="sent__link" @click="useAnotherEmail">use another email</button>.
        </p>
        <span v-if="resent" class="sent__note" role="status">Link sent again.</span>
      </div>

      <a href="#" class="link back rise" style="--d: 240ms" @click.prevent="backToLogin">
        <span class="icon icon--sm">arrow_back</span>Back to login
      </a>
    </div>
  </AuthLayout>
</template>

<style scoped src="./auth.css"></style>
<style scoped>
/* Forgot-password-only pieces (shared look lives in auth.css). */
.back { display: inline-flex; align-items: center; justify-content: center; gap: 6px; align-self: center; font-size: 13px; }
.sent { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 8px 0 2px; text-align: center; }
.sent__icon { width: 56px; height: 56px; border-radius: 50%; background: var(--success); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 30px; box-shadow: 0 14px 28px -14px rgba(31,203,139,.8); }
.sent__title { margin: 4px 0 0; font-size: 17px; font-weight: 800; color: var(--text-1); }
.sent__hint { margin: 0; font-size: 13px; line-height: 1.6; color: var(--text-2); }
.sent__link { border: 0; background: none; padding: 0; font: inherit; font-weight: 700; color: var(--coral-700); cursor: pointer; }
.sent__link:hover:not(:disabled) { color: var(--coral-800); text-decoration: underline; }
.sent__link:disabled { opacity: .5; cursor: default; }
.sent__note { font-size: 12.5px; font-weight: 600; color: var(--success); }
</style>
