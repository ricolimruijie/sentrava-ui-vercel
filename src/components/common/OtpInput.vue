<script setup>
import { ref, computed, onMounted } from 'vue'

// Six separate digit boxes (typing moves forward, Backspace/arrows move back and forth, paste fills all).
// v-model is the digits typed so far as a string; `enter` fires on Enter.
const props = defineProps({
  modelValue: { type: String, default: '' },
  length: { type: Number, default: 6 },
  autofocus: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'enter'])

const inputs = ref([])
const digits = computed(() => Array.from({ length: props.length }, (_, i) => props.modelValue[i] ?? ''))

function set(list) {
  emit('update:modelValue', list.join('').slice(0, props.length))
}
function focusAt(i) {
  inputs.value[Math.max(0, Math.min(i, props.length - 1))]?.focus()
}

function onInput(i, e) {
  const v = e.target.value.replace(/\D/g, '')
  const next = [...digits.value]
  if (!v) { next[i] = ''; e.target.value = ''; set(next); return }
  // A multi-digit value (autofill / paste into one box) spreads over the following boxes.
  v.slice(0, props.length - i).split('').forEach((d, k) => { next[i + k] = d })
  e.target.value = next[i]
  set(next)
  focusAt(i + v.length)
}
function onKeydown(i, e) {
  if (e.key === 'Backspace' && !digits.value[i] && i > 0) {
    const next = [...digits.value]
    next[i - 1] = ''
    set(next)
    focusAt(i - 1)
  } else if (e.key === 'ArrowLeft') focusAt(i - 1)
  else if (e.key === 'ArrowRight') focusAt(i + 1)
  else if (e.key === 'Enter') emit('enter')
}
function onPaste(e) {
  const v = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, props.length)
  if (!v) return
  e.preventDefault()
  emit('update:modelValue', v)
  focusAt(v.length)
}

onMounted(() => { if (props.autofocus) focusAt(0) })
defineExpose({ focus: () => focusAt(0) })
</script>

<template>
  <div class="otp" @paste="onPaste">
    <input
      v-for="(d, i) in digits"
      :key="i"
      :ref="(el) => (inputs[i] = el)"
      class="otp__digit"
      :value="d"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      :maxlength="length"
      :aria-label="`Digit ${i + 1}`"
      @input="onInput(i, $event)"
      @keydown="onKeydown(i, $event)"
      @focus="$event.target.select()"
    />
  </div>
</template>

<style scoped lang="scss">
.otp {
  display: flex;
  justify-content: center;
  gap: 12px;

  &__digit {
    width: 52px;
    height: 58px;
    padding: 0;
    text-align: center;
    border-radius: 12px;
    border: 1px solid var(--hairline);
    background: var(--surface-3);
    color: var(--glacia-ink);
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 22px;
    font-weight: 700;
    outline: none;
    caret-color: transparent; // no blinking cursor line inside the box

    // No transitions: the box simply takes the focus ring as the cursor moves on while typing.
    &:focus { border-color: #2563EB; }
  }
}

@media (max-width: 560px) {
  .otp { gap: 8px; }
  .otp__digit { width: 40px; height: 48px; font-size: 18px; }
}
</style>
