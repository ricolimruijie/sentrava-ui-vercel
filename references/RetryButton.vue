<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

const props = defineProps({
  date: { type: String, default: '7 Feb 2025 14:15' },
  loadingMs: { type: Number, default: 1400 },
  // Optional async handler; if provided, loading lasts until it resolves.
  onRetry: { type: Function, default: null },
})
const emit = defineEmits(['queued', 'cancel'])

const state = ref('idle') // idle | confirm | loading | done
let timer = null
onBeforeUnmount(() => clearTimeout(timer))

const isIdle = computed(() => state.value === 'idle')
const isConfirm = computed(() => state.value === 'confirm')
const isLoading = computed(() => state.value === 'loading')
const isDone = computed(() => state.value === 'done')

const status = computed(() => (isDone.value ? 'Queue' : isConfirm.value ? 'Retry this scan?' : 'Failed'))

function retry() { if (isIdle.value) state.value = 'confirm' }
function cancel() { if (isConfirm.value) { state.value = 'idle'; emit('cancel') } }
async function confirm() {
  if (!isConfirm.value) return
  state.value = 'loading'
  if (props.onRetry) {
    try { await props.onRetry(); state.value = 'done'; emit('queued') }
    catch { state.value = 'idle' }
  } else {
    clearTimeout(timer)
    timer = setTimeout(() => { state.value = 'done'; emit('queued') }, props.loadingMs)
  }
}
function reset() { clearTimeout(timer); state.value = 'idle' }
defineExpose({ reset })
</script>

<template>
  <div class="row" :class="`is-${state}`">
    <span class="dot" />
    <div class="text">
      <span class="date">{{ date }}</span>
      <span class="status">{{ status }}</span>
    </div>

    <div class="pill">
      <button class="sync" title="Retry scan" aria-label="Retry scan" :tabindex="isIdle ? 0 : -1" @click="retry">
        <span class="icon">sync</span>
      </button>
      <button class="ok" title="Confirm retry" aria-label="Confirm retry" :tabindex="isConfirm ? 0 : -1" :aria-busy="isLoading" @click="confirm">
        <span class="icon tick">check</span>
        <span class="spinner" />
      </button>
      <button class="no" title="Cancel retry" aria-label="Cancel retry" :tabindex="isConfirm ? 0 : -1" @click="cancel">
        <span class="icon">close</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Requires Coral/Ice tokens (colors.css, fonts.css) loaded globally. */
.row {
  position: relative; height: 64px; box-sizing: border-box; padding: 0 12px 0 40px;
  border-radius: 16px; background: #fff; display: flex; align-items: center; gap: 12px;
  font-family: var(--font-display); color: var(--text-1); transition: background 360ms ease;
}
.row.is-confirm, .row.is-loading { background: var(--gray-50); }
.row.is-done { background: var(--ice-100); }

.dot {
  position: absolute; left: 16px; top: 50%; margin-top: -6px; width: 12px; height: 12px;
  box-sizing: border-box; border-radius: 50%; background: var(--critical);
  border: 2px solid #fff; box-shadow: 0 0 0 1px var(--gray-200); transition: background 360ms ease;
}
.is-done .dot { background: var(--info); }

.text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.date { font-size: 15px; font-weight: 800; }
.status { font-size: 13px; color: var(--text-2); }

.icon {
  font-family: var(--font-icon); font-size: 18px; line-height: 1;
  font-feature-settings: "liga" 1;
}

.pill {
  position: relative; flex: none; width: 36px; height: 36px; border-radius: 999px;
  background: var(--critical-tint);
  transition: width 420ms cubic-bezier(.65,0,.35,1), background 300ms ease,
              opacity 260ms ease, transform 320ms cubic-bezier(.65,0,.35,1);
}
.is-confirm .pill { width: 76px; background: var(--gray-100); }
.is-loading .pill { background: transparent; }
.is-done .pill { background: transparent; opacity: 0; transform: scale(.4); }

.pill button {
  position: absolute; border: 0; padding: 0; border-radius: 999px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

.sync {
  left: 0; top: 0; width: 36px; height: 36px; background: transparent; color: var(--critical);
  transition: opacity 180ms ease, transform 360ms cubic-bezier(.65,0,.35,1);
}
.row:not(.is-idle) .sync { opacity: 0; transform: rotate(-180deg) scale(.4); pointer-events: none; }

.ok {
  left: 2px; top: 2px; width: 32px; height: 32px; background: var(--coral-500); color: #fff;
  box-shadow: 0 6px 14px -6px var(--coral-400);
  opacity: 0; transform: scale(.4); pointer-events: none;
  transition: opacity 220ms ease, transform 380ms cubic-bezier(.34,1.3,.64,1), background 200ms ease;
}
.is-confirm .ok { opacity: 1; transform: none; pointer-events: auto; transition-delay: 60ms; }
.is-confirm .ok:hover { background: var(--coral-600); }
.is-loading .ok { opacity: 1; transform: none; cursor: default; }

.tick { position: absolute; transition: opacity 180ms ease, transform 260ms cubic-bezier(.65,0,.35,1); }
.is-loading .tick { opacity: 0; transform: scale(.4); }

.spinner {
  position: absolute; left: 8px; top: 8px; width: 16px; height: 16px; box-sizing: border-box;
  border-radius: 50%; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff;
  animation: rb-spin 700ms linear infinite; opacity: 0; transition: opacity 200ms ease 120ms;
}
.is-loading .spinner { opacity: 1; }

.no {
  left: 42px; top: 2px; width: 32px; height: 32px; background: #fff; color: var(--text-2);
  box-shadow: 0 1px 3px rgba(16,24,32,.12);
  opacity: 0; transform: scale(.4); pointer-events: none;
  transition: opacity 200ms ease, transform 340ms cubic-bezier(.34,1.3,.64,1);
}
.is-confirm .no { opacity: 1; transform: none; pointer-events: auto; transition-delay: 140ms; }
.is-confirm .no:hover { color: var(--text-1); }
.is-loading .no { transform: translateX(-18px) scale(.3); }

@keyframes rb-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { * { transition-duration: 1ms !important; } }
</style>
