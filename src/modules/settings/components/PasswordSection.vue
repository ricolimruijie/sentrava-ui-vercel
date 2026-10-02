<script setup>
import { ref, computed } from 'vue'
import { IconCircleCheck, IconCircle } from '@tabler/icons-vue'
import GlassField from '@/components/common/GlassField.vue'

// Mock mode: the current password is checked against the demo password and the change isn't stored
// (the login mock always accepts `demo`). A real backend would verify and update it server side.
const DEMO_PASSWORD = 'demo'

const current = ref('')
const next = ref('')
const confirm = ref('')
const state = ref('idle') // 'idle' | 'loading' | 'done'
const currentError = ref('')

const rules = computed(() => [
  { label: 'At least 8 characters', ok: next.value.length >= 8 },
  { label: 'An uppercase and a lowercase letter', ok: /[a-z]/.test(next.value) && /[A-Z]/.test(next.value) },
  { label: 'A number', ok: /\d/.test(next.value) },
  { label: 'Different from your current password', ok: !!next.value && next.value !== current.value },
])
const strongEnough = computed(() => rules.value.every((r) => r.ok))
const mismatch = computed(() => !!confirm.value && confirm.value !== next.value)
const canSubmit = computed(() => !!current.value && strongEnough.value && !!confirm.value && !mismatch.value && state.value !== 'loading')

function reset() {
  current.value = next.value = confirm.value = ''
  currentError.value = ''
}

function submit() {
  if (!canSubmit.value) return
  currentError.value = ''
  state.value = 'loading'
  setTimeout(() => {
    if (current.value !== DEMO_PASSWORD) {
      currentError.value = 'Your current password is incorrect.'
      state.value = 'idle'
      return
    }
    reset()
    state.value = 'done'
  }, 700)
}
</script>

<template>
  <div class="tf pw">
    <header class="sec-head">
      <h2 class="sec-head__title">Change password</h2>
      <p class="sec-head__desc">Choose a strong password you don't use anywhere else.</p>
    </header>

    <div v-if="state === 'done'" class="pw__success" role="status">
      <IconCircleCheck :size="20" /> Your password has been changed.
    </div>

    <form class="pw__form" @submit.prevent="submit" @input="state === 'done' && (state = 'idle')">
      <GlassField
        v-model="current"
        input-type="password"
        revealable
        label="Current password"
        placeholder="Enter your current password"
        required
        :invalid="!!currentError"
        :error-text="currentError || 'Enter your current password'"
        @enter="submit"
      />
      <GlassField
        v-model="next"
        input-type="password"
        revealable
        label="New password"
        placeholder="Enter a new password"
        required
        @enter="submit"
      />

      <ul class="pw__rules" aria-label="Password requirements">
        <li v-for="r in rules" :key="r.label" class="pw__rule" :class="{ 'pw__rule--ok': r.ok }">
          <IconCircleCheck v-if="r.ok" :size="15" /><IconCircle v-else :size="15" />
          {{ r.label }}
        </li>
      </ul>

      <GlassField
        v-model="confirm"
        input-type="password"
        revealable
        label="Confirm new password"
        placeholder="Re-enter the new password"
        required
        :invalid="mismatch"
        :error-text="mismatch ? 'Passwords do not match.' : 'Confirm your new password'"
        @enter="submit"
      />

      <div class="tf__actions">
        <button type="button" class="tf__btn tf__btn--ghost" :disabled="state === 'loading'" @click="reset">Clear</button>
        <button type="submit" class="tf__btn tf__btn--primary" :disabled="!canSubmit">
          <span v-if="state === 'loading'" class="tf__spinner" />
          <span v-else>Change password</span>
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped lang="scss" src="./TwoFactorSection.scss"></style>
<style scoped lang="scss">
.pw {
  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 420px;
  }

  &__rules {
    list-style: none;
    margin: -4px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__rule {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    color: var(--glacia-ink-dim);

    &--ok { color: #16a34a; }
  }

  &__success {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 420px;
    margin-bottom: 16px;
    padding: 12px 14px;
    border-radius: 12px;
    background: rgba(22, 163, 74, 0.1);
    color: #16a34a;
    font-size: 13.5px;
    font-weight: 600;
  }
}
</style>
