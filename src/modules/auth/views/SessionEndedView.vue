<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AuthLayout from '@/modules/auth/views/AuthLayout.vue'
import { LOGOUT_REASON_KEY } from '@/stores/auth'
import logoIcon from '@/assets/sentrava-logo-icon.svg'
import { IDLE_TIMEOUT_MS } from '@/modules/auth/utils/session'

// Shown right after the session ended on its own (idle or absolute limit, PRD 2.2).
// The user acknowledges it with OK and goes on to the login page.
const router = useRouter()
const route = useRoute()
const expired = route.query.reason === 'expired'
const minutes = IDLE_TIMEOUT_MS / 60_000
function goToLogin() { router.replace({ name: 'login' }) }
function onKey(e) { if (e.key === 'Enter') goToLogin() }

onMounted(() => {
  // The reason is explained here, so the login page should not repeat it.
  try { localStorage.removeItem(LOGOUT_REASON_KEY) } catch { /* ignore */ }
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <AuthLayout layout="centered">
    <div class="card" role="alertdialog" aria-labelledby="se-title" aria-describedby="se-text">
      <header class="head rise" style="--d: 80ms">
        <span class="brand"><img :src="logoIcon" class="brand__logo" width="28" height="28" alt="" aria-hidden="true" />SENTRAVA</span>
      </header>

      <div class="ended rise" style="--d: 140ms">
        <span class="ended__icon icon" aria-hidden="true">{{ expired ? 'lock_clock' : 'timer_off' }}</span>
        <h1 id="se-title" class="ended__title">{{ expired ? 'Session expired' : 'You were signed out' }}</h1>
        <p id="se-text" class="ended__text">
          <template v-if="expired">Your session has reached its time limit. For your security, please log in again.</template>
          <template v-else>
            You were inactive for {{ minutes }} minute{{ minutes === 1 ? '' : 's' }}, so we signed you out to keep your account safe.
            Please log in again to continue.
          </template>
        </p>
      </div>

      <form class="form form--login rise" style="--d: 220ms" novalidate @submit.prevent="goToLogin">
        <button type="submit" class="submit">OK</button>
      </form>
    </div>
  </AuthLayout>
</template>

<style scoped src="./auth.css"></style>
<style scoped>
.ended { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 8px 0 6px; text-align: center; }
.ended__icon { width: 56px; height: 56px; border-radius: 50%; background: var(--coral-600); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 30px; box-shadow: 0 14px 28px -14px rgba(204,20,32,.7); }
.ended__title { margin: 4px 0 0; font-size: var(--fs-3xl); font-weight: 800; color: var(--text-1); }
.ended__text { margin: 0; font-size: var(--fs-md); line-height: 1.6; color: var(--text-2); }
</style>
