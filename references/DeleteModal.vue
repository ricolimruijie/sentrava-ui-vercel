<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },            // v-model:open
  repoName: { type: String, default: 'protergo-cyber-security' },
  requireHold: { type: Boolean, default: true },
  holdMs: { type: Number, default: 1000 },
  deleteMs: { type: Number, default: 1200 },           // used only when onDelete is not provided
  onDelete: { type: Function, default: null },         // optional async; loading lasts until it resolves
})
const emit = defineEmits(['update:open', 'deleted', 'cancel'])

const ack = ref(false)
const phase = ref('form') // form | deleting | done
const holding = ref(false)
let tHold = null, tDel = null

const isForm = computed(() => phase.value === 'form')
const isDeleting = computed(() => phase.value === 'deleting')
const isDone = computed(() => phase.value === 'done')
const ready = computed(() => ack.value && isForm.value)

const label = computed(() => {
  if (isDeleting.value) return 'Deleting…'
  if (!ack.value || !props.requireHold) return 'Delete'
  return holding.value ? 'Keep holding…' : 'Hold to delete'
})
const hint = computed(() => {
  if (!ack.value && isForm.value) return 'Tick the box above to enable Delete'
  if (ready.value && props.requireHold && !holding.value) return 'Press and hold, or hold Enter'
  return ''
})

watch(() => props.open, v => {
  if (v) { ack.value = false; phase.value = 'form'; holding.value = false }
})
onBeforeUnmount(() => { clearTimeout(tHold); clearTimeout(tDel) })

function close() {
  if (isDeleting.value) return
  clearTimeout(tHold); holding.value = false
  if (isForm.value) emit('cancel')
  emit('update:open', false)
}
function toggleAck() { if (isForm.value) { ack.value = !ack.value; holding.value = false } }

async function doDelete() {
  clearTimeout(tHold); holding.value = false
  phase.value = 'deleting'
  if (props.onDelete) {
    try { await props.onDelete(); phase.value = 'done'; emit('deleted') }
    catch { phase.value = 'form' }
  } else {
    tDel = setTimeout(() => { phase.value = 'done'; emit('deleted') }, props.deleteMs)
  }
}
function holdStart() {
  if (!ready.value || !props.requireHold) return
  holding.value = true
  clearTimeout(tHold)
  tHold = setTimeout(doDelete, props.holdMs)
}
function holdEnd() { if (holding.value) { clearTimeout(tHold); holding.value = false } }
function onKeyDown(e) {
  if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); holdStart() }
}
function onKeyUp(e) { if (e.key === 'Enter' || e.key === ' ') holdEnd() }
function onClickDelete() { if (ready.value && !props.requireHold) doDelete() }
</script>

<template>
  <Teleport to="body">
    <div class="dr-root" :class="{ 'is-open': open }" @keydown.esc="close">
      <div class="scrim" @click="close" />

      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="dr-title">
        <div class="stack">
          <!-- Form -->
          <div class="panel form" :class="{ hidden: isDone }">
            <div class="head">
              <span class="icon-tile" :class="{ acked: ack }">
                <span class="icon">{{ ack ? 'delete_forever' : 'delete' }}</span>
              </span>
              <div class="titles">
                <span id="dr-title" class="title">Delete repository</span>
                <span class="repo"><span class="icon small">folder</span><span class="ellip">{{ repoName }}</span></span>
              </div>
              <button class="close" title="Close" aria-label="Close" @click="close"><span class="icon">close</span></button>
            </div>

            <p class="body">
              <strong>{{ repoName }}</strong> and its scan history will be removed immediately.
              Once deleted, you won't be able to view or restore its findings.
            </p>

            <button class="ack" :class="{ on: ack }" role="checkbox" :aria-checked="ack" @click="toggleAck">
              <span class="box"><span class="icon tick">check</span></span>
              <span class="ack-text">This action is permanent and cannot be undone.</span>
            </button>

            <div class="actions">
              <button class="btn cancel" @click="close">Cancel</button>
              <button
                class="btn delete"
                :class="{ ready, holding, deleting: isDeleting }"
                :aria-disabled="!ready"
                :style="{ '--hold-ms': holdMs + 'ms' }"
                @pointerdown="holdStart" @pointerup="holdEnd" @pointerleave="holdEnd"
                @keydown="onKeyDown" @keyup="onKeyUp" @click="onClickDelete"
              >
                <span class="fill" />
                <span class="label"><span v-if="isDeleting" class="spinner" />{{ label }}</span>
              </button>
            </div>
            <span class="hint">{{ hint }}</span>
          </div>

          <!-- Done -->
          <div class="panel done" :class="{ shown: isDone }">
            <span class="done-icon"><span class="icon">check</span></span>
            <span class="done-title">Repository deleted</span>
            <span class="done-body"><span class="mono">{{ repoName }}</span> has been removed.</span>
            <button class="btn cancel done-btn" @click="close">Done</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Requires Coral/Ice tokens (colors.css, fonts.css) loaded globally. */
.dr-root { position: fixed; inset: 0; z-index: 1000; pointer-events: none; font-family: var(--font-display); color: var(--text-1); }
.dr-root.is-open { pointer-events: auto; }

.scrim { position: absolute; inset: 0; background: rgba(16,24,32,.32); backdrop-filter: blur(6px); opacity: 0; transition: opacity 320ms ease; }
.is-open .scrim { opacity: 1; }

.modal {
  position: absolute; top: 50%; left: 50%; width: min(460px, calc(100% - 40px)); box-sizing: border-box;
  border-radius: 16px; background: #fff; border: 1px solid var(--gray-100);
  box-shadow: 0 40px 80px -30px rgba(16,24,32,.5); overflow: hidden;
  opacity: 0; transform: translate(-50%, calc(-50% + 16px)) scale(.96);
  transition: opacity 280ms ease, transform 460ms cubic-bezier(.2,.9,.25,1);
}
.is-open .modal { opacity: 1; transform: translate(-50%, -50%) scale(1); }

.stack { display: grid; }
.panel { grid-area: 1 / 1; }

.icon { font-family: var(--font-icon); font-size: 20px; line-height: 1; font-feature-settings: "liga" 1; }
.icon.small { font-size: 16px; color: var(--text-3); }
.mono { font-family: var(--font-mono); font-weight: 600; color: var(--text-1); }

/* Form panel */
.form { padding: 24px; display: flex; flex-direction: column; gap: 18px; transition: opacity 260ms ease, transform 360ms cubic-bezier(.2,.8,.2,1); }
.form.hidden { opacity: 0; transform: translateY(-10px) scale(.98); pointer-events: none; }

.head { display: flex; align-items: flex-start; gap: 14px; }
.icon-tile {
  flex: none; width: 44px; height: 44px; border-radius: 16px; background: var(--critical-tint); color: var(--critical);
  display: flex; align-items: center; justify-content: center; transition: transform 420ms cubic-bezier(.34,1.5,.64,1);
}
.icon-tile .icon { font-size: 24px; }
.icon-tile.acked { transform: rotate(-8deg) scale(1.06); }
.titles { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; padding-top: 2px; }
.title { font-size: 22px; line-height: 1.25; font-weight: 800; }
.repo { display: flex; align-items: center; gap: 6px; min-width: 0; font-family: var(--font-mono); font-size: 13.5px; font-weight: 600; color: var(--text-2); }
.ellip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.close {
  flex: none; width: 36px; height: 36px; border: 0; padding: 0; border-radius: 999px; background: var(--gray-50); color: var(--text-2);
  cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 160ms ease;
}
.close:hover { background: var(--gray-100); }

.body { margin: 0; font-size: 15px; line-height: 1.6; color: var(--text-2); text-wrap: pretty; }
.body strong { color: var(--text-1); font-weight: 700; }

.ack {
  font: inherit; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 12px; padding: 14px 16px;
  border-radius: 16px; border: 1px solid var(--gray-200); background: #fff; transition: background 260ms ease, border-color 260ms ease;
}
.ack.on { border-color: var(--critical); background: var(--critical-tint); }
.box {
  flex: none; position: relative; width: 22px; height: 22px; box-sizing: border-box; border-radius: 7px;
  border: 1.5px solid var(--gray-300); background: #fff; display: flex; align-items: center; justify-content: center;
  transition: background 200ms ease, border-color 200ms ease;
}
.ack.on .box { border-color: var(--critical); background: var(--critical); }
.tick { font-size: 18px; color: #fff; opacity: 0; transform: scale(.3); transition: opacity 160ms ease, transform 320ms cubic-bezier(.34,1.6,.64,1); }
.ack.on .tick { opacity: 1; transform: scale(1); }
.ack-text { font-size: 14.5px; font-weight: 600; color: var(--text-1); transition: color 220ms ease; }
.ack.on .ack-text { color: var(--critical); }

.actions { display: grid; grid-template-columns: 1fr 1.4fr; gap: 12px; padding-top: 4px; }
.btn { height: 48px; border-radius: 16px; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
.cancel { border: 1px solid var(--gray-200); background: #fff; color: var(--text-1); transition: background 160ms ease; }
.cancel:hover { background: var(--gray-50); }

.delete {
  position: relative; overflow: hidden; border: 0; background: var(--gray-100); color: var(--text-3); cursor: not-allowed;
  user-select: none; touch-action: none;
  transition: background 260ms ease, color 260ms ease, box-shadow 260ms ease, transform 160ms ease;
}
.delete.ready, .delete.deleting { background: var(--critical); color: #fff; }
.delete.ready { cursor: pointer; box-shadow: 0 10px 24px -10px rgba(196,30,42,.6); }
.delete.holding { transform: scale(.98); }
.fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: #A8161F; transition: width 260ms ease-out; }
.delete.holding .fill { width: 100%; transition: width var(--hold-ms) linear; }
.delete.deleting .fill { width: 100%; transition: none; }
.label { position: relative; display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; }
.spinner {
  width: 16px; height: 16px; box-sizing: border-box; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; animation: dr-spin 700ms linear infinite;
}
.hint { font-size: 12.5px; color: var(--text-3); text-align: right; margin-top: -8px; min-height: 18px; }

/* Done panel */
.done {
  padding: 40px 24px 28px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center;
  opacity: 0; transform: translateY(12px); pointer-events: none;
  transition: opacity 300ms ease 120ms, transform 420ms cubic-bezier(.2,.9,.25,1) 120ms;
}
.done.shown { opacity: 1; transform: none; pointer-events: auto; }
.done-icon {
  width: 56px; height: 56px; border-radius: 50%; background: var(--success-tint); color: var(--success);
  display: flex; align-items: center; justify-content: center; transform: scale(.4);
  transition: transform 520ms cubic-bezier(.34,1.6,.64,1) 220ms;
}
.done-icon .icon { font-size: 30px; }
.done.shown .done-icon { transform: scale(1); }
.done-title { font-size: 20px; font-weight: 800; }
.done-body { font-size: 14px; line-height: 1.6; color: var(--text-2); }
.done-btn { margin-top: 10px; height: 44px; padding: 0 24px; }

@keyframes dr-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { * { transition-duration: 1ms !important; animation-duration: 1ms !important; } }
</style>
