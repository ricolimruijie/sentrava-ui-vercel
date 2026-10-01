<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import GlassField from '@/components/reusable/GlassField.vue'
import AuthLayout from './AuthLayout.vue'

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

const isSplit = computed(() => layout === 'split')
const btnLabel = computed(() => (busy.value ? 'Logging in…' : done.value ? 'Logged in' : 'Log in'))

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
    await auth.login(email.value.trim(), password.value, { dataMode: noData.value ? 'empty' : undefined })
    busy.value = false
    done.value = true
    // Let the "Logged in" state show before leaving the page.
    timer = setTimeout(() => router.push(route.query.redirect ?? '/dashboard'), 650)
  } catch (e) {
    busy.value = false
    errors.form = e?.message ?? 'Invalid credentials. Please try again.'
    shakeKey.value++
  }
}

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
          <span v-if="!isSplit" class="brand">SENTRAVA</span>
          <h1 class="title">Stay ahead of every threat</h1>
          <p class="subtitle">
            Log in to SENTRAVA to see <strong class="hl">every asset</strong>, <strong class="hl">every risk</strong>, and <strong class="hl">what to fix next</strong> across your <strong class="hl hl--dark">environment</strong>.
          </p>
        </header>

        <form class="form rise" style="--d: 160ms" novalidate @submit.prevent="onSubmit">
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

        <p class="terms rise" style="--d: 240ms">
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
