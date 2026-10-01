<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'

const props = defineProps({
  layout: { type: String, default: 'centered' }, // 'split' | 'centered'
  motion: { type: Boolean, default: true },
  turnstileVerified: { type: Boolean, default: true }, // wire to your Turnstile callback
})
const emit = defineEmits(['submit', 'forgot-password'])

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const focused = ref(null)
const errors = reactive({ email: '', password: '' })
const busy = ref(false)
const done = ref(false)
const shakeKey = ref(0)
let timer

const isSplit = computed(() => props.layout === 'split')
const btnLabel = computed(() => (busy.value ? 'Logging in…' : done.value ? 'Logged in' : 'Log in'))

function clearError(field) { errors[field] = ''; done.value = false }

function validate() {
  const e = email.value.trim()
  errors.email = !e ? 'Email is required.' : !/^\S+@\S+\.\S+$/.test(e) ? 'Enter a valid email address.' : ''
  errors.password = password.value ? '' : 'Password is required.'
  return !errors.email && !errors.password
}

async function onSubmit() {
  if (!validate()) { shakeKey.value++; return }
  busy.value = true
  emit('submit', { email: email.value.trim(), password: password.value })
  // Demo only: replace with your auth call and set busy/done from the result
  clearTimeout(timer)
  timer = setTimeout(() => { busy.value = false; done.value = true }, 1400)
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="login" :class="{ 'login--split': isSplit, 'login--centered': !isSplit, 'login--still': !motion }">
    <div class="visual" aria-hidden="true">
      <div class="visual__base"></div>
      <span class="blob blob--1"></span>
      <span class="blob blob--2"></span>
      <span class="blob blob--3"></span>
      <span class="blob blob--4"></span>
      <span class="blob blob--5"></span>
      <div class="visual__shade"></div>

      <div v-if="isSplit" class="visual__content">
        <span class="brand-pill">SENTRAVA</span>
        <h2 class="visual__headline">Your Trusted Partner in Cybersecurity &amp; Asset Protection</h2>
      </div>
    </div>

    <div class="form-wrap">
      <div class="card">
        <header class="head rise" style="--d: 80ms">
          <span v-if="!isSplit" class="brand">SENTRAVA</span>
          <h1 class="title">Stay ahead of every threat</h1>
          <p class="subtitle">Log in to SENTRAVA to see every asset, every risk, and what to fix next.</p>
        </header>

        <form class="form rise" style="--d: 160ms" novalidate @submit.prevent="onSubmit">
          <div class="field">
            <label for="lg-email" class="label">Email</label>
            <div
              :key="'e' + (errors.email ? shakeKey : 0)"
              class="control"
              :class="{ 'is-focus': focused === 'email', 'is-error': errors.email }"
            >
              <span class="icon">mail</span>
              <input
                id="lg-email" v-model="email" type="email" autocomplete="email"
                placeholder="Enter email address"
                :aria-invalid="!!errors.email" aria-describedby="lg-email-err"
                @input="clearError('email')" @focus="focused = 'email'" @blur="focused = null"
              />
            </div>
            <span v-if="errors.email" id="lg-email-err" class="error"><span class="icon icon--sm">error</span>{{ errors.email }}</span>
          </div>

          <div class="field">
            <div class="label-row">
              <label for="lg-pass" class="label">Password</label>
              <a href="#" class="link" @click.prevent="emit('forgot-password')">Forgot Password</a>
            </div>
            <div
              :key="'p' + (errors.password ? shakeKey : 0)"
              class="control control--pass"
              :class="{ 'is-focus': focused === 'pass', 'is-error': errors.password }"
            >
              <span class="icon">lock</span>
              <input
                id="lg-pass" v-model="password" :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password" placeholder="Enter password"
                :aria-invalid="!!errors.password" aria-describedby="lg-pass-err"
                @input="clearError('password')" @focus="focused = 'pass'" @blur="focused = null"
              />
              <button
                type="button" class="eye"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >{{ showPassword ? 'visibility_off' : 'visibility' }}</button>
            </div>
            <span v-if="errors.password" id="lg-pass-err" class="error"><span class="icon icon--sm">error</span>{{ errors.password }}</span>
          </div>

          <!-- Replace with the real Cloudflare Turnstile widget -->
          <div class="turnstile">
            <slot name="turnstile">
              <span class="turnstile__check">check</span>
              <span class="turnstile__text">Success!</span>
              <span class="turnstile__brand"><b>CLOUDFLARE</b><small>Privacy · Help</small></span>
            </slot>
          </div>

          <button type="submit" class="submit" :class="{ 'is-done': done }" :disabled="busy || !turnstileVerified">
            <span v-if="busy" class="icon spin">progress_activity</span>
            <span v-else-if="done" class="icon">check</span>
            {{ btnLabel }}
          </button>
        </form>

        <p class="terms rise" style="--d: 240ms">
          By continuing, you agree to SENTRAVA's <a href="#" class="link">Terms</a> and <a href="#" class="link">Privacy Policy</a>.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Fonts: Plus Jakarta Sans + IBM Plex Mono + Material Symbols Outlined (load globally) */
.login {
  --coral-500: #FF2E3A; --coral-600: #E31724; --coral-700: #B7101C; --coral-800: #8A0C15; --coral-900: #5C070E;
  --ice-100: #F0F8FF; --ice-500: #63A5DE; --ice-700: #2B6AA1;
  --gray-50: #F7FAFB; --gray-100: #EAF0F2; --gray-200: #D3DEE2; --gray-400: #849599;
  --text-1: #101820; --text-2: #47565E; --text-3: #6C7A80;
  --critical: #C41E2A; --critical-tint: #FDE9EA; --success: #1FCB8B;
  --ease: cubic-bezier(.2, .8, .2, 1);

  position: relative;
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  background: #fff;
  color: var(--text-1);
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.login--split { padding: 16px; }

/* Visual */
.visual { position: relative; overflow: hidden; isolation: isolate; }
.login--split .visual { flex: 1 1 560px; min-height: 340px; border-radius: 16px; }
.login--centered .visual { position: absolute; inset: 0; }
.visual__base { position: absolute; inset: 0; background: radial-gradient(120% 90% at 20% 10%, var(--coral-500), var(--coral-700) 45%, var(--coral-900) 100%); }
.visual__shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(40,0,6,0) 45%, rgba(40,0,6,.55) 100%); }

.blob { position: absolute; aspect-ratio: 1; }
.blob--1 { left: -12%; top: -14%; width: 58%; background: linear-gradient(150deg, #FF5A3C, var(--coral-600)); box-shadow: 0 50px 90px -20px rgba(60,0,8,.55); animation: morphA 22s ease-in-out infinite; }
.blob--2 { right: -18%; top: -10%; width: 62%; background: linear-gradient(200deg, var(--coral-700), var(--coral-800)); box-shadow: 0 50px 90px -20px rgba(60,0,8,.55); animation: morphB 26s ease-in-out infinite; }
.blob--3 { left: 26%; top: 22%; width: 52%; background: linear-gradient(160deg, var(--coral-600), var(--coral-700)); box-shadow: 0 60px 100px -20px rgba(50,0,6,.6); animation: morphC 20s ease-in-out infinite; }
.blob--4 { right: -14%; bottom: -18%; width: 56%; background: linear-gradient(330deg, #FF4A2E, var(--coral-500)); box-shadow: 0 -40px 90px -20px rgba(60,0,8,.5); animation: morphB 24s ease-in-out -8s infinite; }
.blob--5 { left: -16%; bottom: -24%; width: 60%; background: linear-gradient(30deg, #3E070B, var(--coral-900)); box-shadow: 0 -40px 90px -20px rgba(30,0,4,.6); animation: morphA 28s ease-in-out -12s infinite; }
.login--still .blob { animation-play-state: paused; }

.visual__content { position: relative; height: 100%; min-height: inherit; box-sizing: border-box; padding: 40px 44px; display: flex; flex-direction: column; justify-content: space-between; gap: 40px; color: #fff; }
.brand-pill { align-self: flex-start; display: inline-flex; align-items: center; height: 40px; padding: 0 18px; border-radius: 999px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.28); box-shadow: inset 0 1px 0 rgba(255,255,255,.35); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%); font-size: 16px; font-weight: 800; letter-spacing: 1px; }
.visual__headline { margin: 0; max-width: 560px; font-size: clamp(32px, 3.6vw, 52px); line-height: 1.05; font-weight: 800; letter-spacing: -1.2px; text-wrap: balance; animation: rise 700ms var(--ease) 200ms both; }

/* Form */
.form-wrap { display: flex; align-items: center; justify-content: center; box-sizing: border-box; padding: 40px 24px; }
.login--split .form-wrap { flex: 1 1 440px; }
.login--centered .form-wrap { position: relative; flex: 1; min-height: 100vh; padding: 40px 20px; }

.card { width: 100%; display: flex; flex-direction: column; }
.login--split .card { max-width: 420px; gap: 30px; }
.login--centered .card { max-width: 440px; box-sizing: border-box; gap: 28px; padding: 36px; border-radius: 16px; background: rgba(255,255,255,.86); border: 1px solid rgba(255,255,255,.6); box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 40px 80px -30px rgba(40,0,6,.55); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%); }

.head { display: flex; flex-direction: column; gap: 8px; }
.brand { margin-bottom: 6px; font-size: 16px; font-weight: 800; letter-spacing: 1px; color: var(--coral-600); }
.title { margin: 0; font-size: 34px; line-height: 1.1; font-weight: 800; letter-spacing: -.8px; text-wrap: balance; }
.subtitle { margin: 0; font-size: 14.5px; line-height: 1.5; color: var(--text-2); }

.form { display: flex; flex-direction: column; gap: 18px; }
.field { display: flex; flex-direction: column; gap: 7px; }
.label-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.label { font-size: 13.5px; font-weight: 700; }

.control { display: flex; align-items: center; gap: 10px; height: 50px; padding: 0 16px; border-radius: 16px; background: #fff; border: 1px solid var(--gray-200); box-shadow: 0 1px 2px rgba(16,24,32,.05); transition: box-shadow 160ms ease, border-color 160ms ease; }
.control--pass { padding-right: 6px; }
.control .icon { color: var(--gray-400); }
.control.is-focus { border: 1.5px solid var(--ice-700); box-shadow: 0 0 0 4px var(--ice-100); }
.control.is-focus .icon { color: var(--ice-700); }
.control.is-error { border: 1.5px solid var(--critical); box-shadow: 0 0 0 4px var(--critical-tint); animation: shake 300ms ease; }
.control.is-error .icon { color: var(--critical); }
.control input { flex: 1; min-width: 0; border: 0; outline: 0; background: none; font: inherit; font-size: 15px; color: var(--text-1); }
.control input::placeholder { color: var(--gray-400); }

.eye { flex: none; width: 38px; height: 38px; border-radius: 999px; border: 0; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: 'Material Symbols Outlined'; font-size: 20px; color: var(--text-3); }
.eye:hover { background: var(--gray-50); color: var(--text-1); }

.error { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--critical); }

.icon { flex: none; font-family: 'Material Symbols Outlined'; font-size: 20px; line-height: 1; }
.icon--sm { font-size: 15px; }

.turnstile { display: flex; align-items: center; gap: 12px; min-height: 62px; padding: 0 14px; border-radius: 16px; background: var(--gray-50); border: 1px solid var(--gray-100); }
.turnstile__check { flex: none; width: 28px; height: 28px; border-radius: 50%; background: var(--success); color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Material Symbols Outlined'; font-size: 18px; }
.turnstile__text { flex: 1; font-size: 14px; font-weight: 600; }
.turnstile__brand { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.turnstile__brand b { font-size: 11px; font-weight: 800; letter-spacing: 1.2px; color: var(--text-2); }
.turnstile__brand small { font-size: 10.5px; color: var(--text-3); }

.submit { height: 52px; margin-top: 4px; border-radius: 999px; border: 0; background: var(--coral-600); color: #fff; font: inherit; font-size: 15.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 14px 28px -14px rgba(204,20,32,.7); transition: background 160ms ease; }
.submit:hover:not(:disabled) { background: var(--coral-700); }
.submit:disabled { cursor: default; }
.submit.is-done { background: var(--success); }
.spin { animation: spin 900ms linear infinite; }

.terms { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--text-3); text-align: center; text-wrap: pretty; }
.link { color: var(--coral-700); font-weight: 700; text-decoration: none; }
.link:hover { color: var(--coral-800); text-decoration: underline; }
.label-row .link { font-size: 13px; }
.terms .link { font-weight: inherit; }

.rise { animation: rise 600ms var(--ease) var(--d, 0ms) both; }

@keyframes morphA { 0%,100% { border-radius: 58% 42% 63% 37% / 45% 55% 45% 55%; transform: translate(0,0) rotate(0) } 50% { border-radius: 40% 60% 38% 62% / 60% 38% 62% 40%; transform: translate(4%,6%) rotate(18deg) } }
@keyframes morphB { 0%,100% { border-radius: 42% 58% 35% 65% / 58% 40% 60% 42%; transform: translate(0,0) rotate(0) } 50% { border-radius: 63% 37% 56% 44% / 40% 62% 38% 60%; transform: translate(-5%,-4%) rotate(-22deg) } }
@keyframes morphC { 0%,100% { border-radius: 50% 50% 40% 60% / 40% 60% 50% 50%; transform: translate(0,0) scale(1) } 50% { border-radius: 36% 64% 60% 40% / 62% 36% 64% 38%; transform: translate(3%,-6%) scale(1.06) } }
@keyframes rise { from { opacity: 0; transform: translateY(12px) } }
@keyframes spin { to { transform: rotate(360deg) } }
@keyframes shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-5px) } 75% { transform: translateX(5px) } }

@media (prefers-reduced-motion: reduce) {
  .blob, .rise, .visual__headline, .control.is-error { animation: none; }
}
</style>
