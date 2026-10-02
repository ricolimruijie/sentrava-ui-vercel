import { ref, computed, onUnmounted } from 'vue'

// Countdown for "Resend code" links: start() begins a cooldown, `ready` turns true when it ends.
// (Mock of the limit a real backend must enforce — the page timer alone can be bypassed.)
export function useResendCooldown(seconds = 60) {
  const left = ref(0)
  let tick = null

  function stop() {
    clearInterval(tick)
    left.value = 0
  }
  function start() {
    clearInterval(tick)
    left.value = seconds
    tick = setInterval(() => {
      left.value -= 1
      if (left.value <= 0) clearInterval(tick)
    }, 1000)
  }

  const ready = computed(() => left.value <= 0)
  const label = computed(() => `${Math.floor(left.value / 60)}:${String(left.value % 60).padStart(2, '0')}`)

  onUnmounted(() => clearInterval(tick))
  return { left, ready, label, start, stop }
}
