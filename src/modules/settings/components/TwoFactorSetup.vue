<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { IconCheck, IconCopy } from '@tabler/icons-vue'
import OtpInput from '@/components/common/OtpInput.vue'

// Two-factor setup, shown on the Settings page (mock): a fake secret + decorative QR; any 6-digit code verifies.
// `done` fires once the code is accepted (the parent turns 2FA on); `cancel` returns to the status card.
const emit = defineEmits(['done', 'cancel'])

const secret = 'SJEU8TY3J8G6SHY5'
const code = ref('')
const state = ref('idle') // 'idle' | 'loading' | 'saved'
const copyState = ref('idle') // 'idle' | 'loading' | 'copied'
let timer = null

const canSubmit = computed(() => code.value.length === 6 && state.value === 'idle')

// Decorative QR-style grid (25 × 25) with the three finder squares — a real QR comes from the backend.
const SIZE = 25
const finders = [[0, 0], [SIZE - 7, 0], [0, SIZE - 7]]
const cells = computed(() => {
  const out = []
  let seed = 11
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  const inFinder = (x, y) => finders.some(([fx, fy]) => x >= fx - 1 && x < fx + 8 && y >= fy - 1 && y < fy + 8)
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!inFinder(x, y) && rnd() > 0.5) out.push({ x, y })
  return out
})

function close() {
  if (state.value === 'idle') emit('cancel')
}

function submit() {
  if (!canSubmit.value) return
  state.value = 'loading'
  timer = setTimeout(() => {
    state.value = 'saved'
    timer = setTimeout(() => {
      emit('done')
    }, 800)
  }, 700)
}

async function copySecret() {
  if (copyState.value !== 'idle') return
  copyState.value = 'loading'
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(secret)
  } catch { /* clipboard unavailable — not critical */ }
  await new Promise((r) => setTimeout(r, 400))
  copyState.value = 'copied'
  setTimeout(() => { copyState.value = 'idle' }, 1600)
}

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div class="tfa">
    <h2 class="tfa__title">Set up Two-Factor Authentication (2FA)</h2>
    <p class="tfa__desc">Each time you log in, in addition to your password, you'll use an authentication app to generate a one-time code.</p>

    <h3 class="tfa__h">Scan QR code</h3>
    <p class="tfa__desc">Scan the QR code below or manually enter the secret key into your authentication app.</p>
    <div class="tfa-box tfa-scan">
      <svg class="tfa-qr" :viewBox="`-1 -1 ${SIZE + 2} ${SIZE + 2}`" role="img" aria-label="QR code placeholder">
        <rect :x="-1" :y="-1" :width="SIZE + 2" :height="SIZE + 2" fill="#fff" />
        <rect v-for="c in cells" :key="`${c.x}-${c.y}`" :x="c.x" :y="c.y" width="1" height="1" fill="#101820" />
        <g v-for="([fx, fy], i) in finders" :key="i">
          <rect :x="fx" :y="fy" width="7" height="7" fill="#101820" />
          <rect :x="fx + 1" :y="fy + 1" width="5" height="5" fill="#fff" />
          <rect :x="fx + 2" :y="fy + 2" width="3" height="3" fill="#101820" />
        </g>
      </svg>
      <div class="tfa-secret">
        <p class="tfa-secret__label">Can't scan QR code?<br />Enter the secret key below:</p>
        <div class="tfa-secret__key">{{ secret }}</div>
        <button type="button" class="tfa-copy" :class="{ 'tfa-copy--done': copyState === 'copied' }" @click="copySecret">
          <span v-if="copyState === 'loading'" class="tfa-copy__spinner" />
          <IconCheck v-else-if="copyState === 'copied'" :size="17" />
          <IconCopy v-else :size="17" />
          {{ copyState === 'copied' ? 'Copied' : 'Copy code' }}
        </button>
      </div>
    </div>

    <h3 class="tfa__h">Get verification code</h3>
    <p class="tfa__desc">Enter the six-digit code that you see in the app.</p>
    <div class="tfa-box">
    <OtpInput v-model="code" autofocus @enter="submit" />
  </div>

  <div class="tfa__actions">
      <button type="button" class="modal-btn modal-btn--cancel" :disabled="state !== 'idle'" @click="close">Cancel</button>
      <button
        type="button"
        class="modal-btn"
        :class="canSubmit || state !== 'idle'
          ? { 'modal-btn--save': true, 'modal-btn--saved': state === 'saved' }
          : 'modal-btn--create'"
        :disabled="!canSubmit"
        @click="submit"
      >
        <span v-if="state === 'loading'" class="modal-btn__spinner" />
        <IconCheck v-else-if="state === 'saved'" :size="18" class="modal-btn__check" />
        <span v-else>Proceed</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./TwoFactorSetup.scss"></style>
