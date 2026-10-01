<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { IconTrash, IconCalendar, IconX, IconCheck } from '@tabler/icons-vue'

// Shared "Delete timeline" confirmation for the asset detail pages. Same hold-to-delete
// pattern as the other delete modals: tick the box, then press and hold Delete. The
// parent removes the scan on `confirm`; this shows the "deleted" state afterwards.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  scanLabel: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'confirm'])

const state = ref('idle') // 'idle' | 'loading' | 'saved'
const acked = ref(false)
const holding = ref(false)
let holdTimer = null
let doneTimer = null

const ready = computed(() => acked.value && state.value === 'idle')
const buttonLabel = computed(() => {
  if (state.value === 'loading') return 'Deleting…'
  if (!acked.value) return 'Delete'
  return holding.value ? 'Keep holding…' : 'Hold to delete'
})
const hint = computed(() => {
  if (!acked.value && state.value === 'idle') return 'Tick the box above to enable Delete'
  if (ready.value && !holding.value) return 'Press and hold, or hold Enter'
  return ''
})

// Start fresh every time the modal opens.
watch(() => props.modelValue, (open) => {
  if (!open) return
  state.value = 'idle'
  acked.value = false
  holding.value = false
})

function close() {
  if (state.value === 'loading') return
  clearTimeout(holdTimer)
  holding.value = false
  emit('update:modelValue', false)
  state.value = 'idle'
  acked.value = false
}
function toggleAck() {
  if (state.value !== 'idle') return
  acked.value = !acked.value
  holding.value = false
}
function doDelete() {
  clearTimeout(holdTimer)
  holding.value = false
  state.value = 'loading'
  doneTimer = setTimeout(() => {
    emit('confirm')
    state.value = 'saved'
  }, 1200)
}
function holdStart() {
  if (!ready.value) return
  holding.value = true
  clearTimeout(holdTimer)
  holdTimer = setTimeout(doDelete, 1000)
}
function holdEnd() {
  if (holding.value) {
    clearTimeout(holdTimer)
    holding.value = false
  }
}
function keyDown(e) {
  if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
    e.preventDefault()
    holdStart()
  }
}
function keyUp(e) {
  if (e.key === 'Enter' || e.key === ' ') holdEnd()
}
onUnmounted(() => {
  clearTimeout(holdTimer)
  clearTimeout(doneTimer)
})
</script>

<template>
<Teleport to="body">
  <Transition name="modal-fade">
    <div v-if="modelValue" class="modal-backdrop modal-backdrop--above" @mousedown.self="close">
      <div class="del-modal" role="dialog" aria-modal="true" aria-labelledby="del-tl-title">
        <div class="del-stack">
          <div class="del-panel" :class="{ 'del-hidden': state === 'saved' }">
            <div class="del-head">
              <span class="del-tile" :class="{ 'del-tile--acked': acked }">
                <IconTrash :size="22" />
              </span>
              <div class="del-titles">
                <span id="del-tl-title" class="del-title">Delete timeline</span>
                <span class="del-repo">
                  <IconCalendar :size="14" class="del-repo__icon" /><span class="del-ellip">{{ scanLabel }}</span>
                </span>
              </div>
              <button type="button" class="del-close" aria-label="Close" @click="close">
                <IconX :size="18" />
              </button>
            </div>

            <p class="del-body">
              <strong>{{ scanLabel }}</strong> and its results will be removed from the timeline immediately.
              Once deleted, you won't be able to view or restore this scan.
            </p>

            <button
              type="button"
              class="del-ack"
              :class="{ 'del-ack--on': acked }"
              role="checkbox"
              :aria-checked="acked"
              @click="toggleAck"
            >
              <span class="del-box"><IconCheck :size="16" class="del-tick" /></span>
              <span class="del-ack__text">This action is permanent and cannot be undone.</span>
            </button>

            <div class="del-actions">
              <button type="button" class="del-btn del-btn--cancel" @click="close">Cancel</button>
              <button
                type="button"
                class="del-btn del-btn--delete"
                :class="{ 'is-ready': ready, 'is-holding': holding, 'is-deleting': state === 'loading' }"
                :aria-disabled="!ready"
                @pointerdown="holdStart"
                @pointerup="holdEnd"
                @pointerleave="holdEnd"
                @keydown="keyDown"
                @keyup="keyUp"
              >
                <span class="del-fill" aria-hidden="true" />
                <span class="del-label"><span v-if="state === 'loading'" class="del-spinner" aria-hidden="true" />{{ buttonLabel }}</span>
              </button>
            </div>
            <span class="del-hint">{{ hint }}</span>
          </div>

          <div class="del-panel del-done" :class="{ 'is-shown': state === 'saved' }">
            <span class="del-done__icon"><IconCheck :size="28" /></span>
            <span class="del-done__title">Timeline deleted</span>
            <span class="del-done__body"><span class="del-mono">{{ scanLabel }}</span> has been removed.</span>
            <button type="button" class="del-btn del-btn--cancel del-done__btn" @click="close">Done</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>

</template>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 20px;
}
.modal-backdrop--above { z-index: 500; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

// ── Delete timeline modal (same hold-to-delete as Delete repository) ──────
.del-modal {
  width: min(460px, calc(100% - 40px));
  box-sizing: border-box;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--glacia-glass-border);
  box-shadow: 0 40px 80px -30px rgba(16, 24, 32, 0.5);
  overflow: hidden;
  animation: del-modal-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes del-modal-bounce {
  0%   { opacity: 0; transform: scale(0.92) translateY(10px); }
  60%  { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
}

.del-stack {
  display: grid;
}

.del-panel {
  grid-area: 1 / 1;
}

.del-panel:not(.del-done) {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  transition: opacity 260ms ease, transform 360ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.del-hidden {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
  pointer-events: none;
}

.del-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.del-tile {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: rgba(220, 38, 38, 0.08);
  color: var(--glacia-sev-critical);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 420ms cubic-bezier(0.34, 1.5, 0.64, 1);

  &--acked {
    transform: rotate(-8deg) scale(1.06);
  }
}

.del-titles {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 2px;
}

.del-title {
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 20px;
  line-height: 1.25;
  font-weight: 800;
  color: var(--glacia-ink);
}

.del-repo {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--glacia-ink-dim);

  &__icon {
    flex-shrink: 0;
  }
}

.del-ellip {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.del-close {
  flex: none;
  width: 36px;
  height: 36px;
  border: 0;
  padding: 0;
  border-radius: 999px;
  background: var(--surface-3);
  color: var(--glacia-ink-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 160ms ease;

  &:hover {
    background: var(--surface-3);
  }
}

.del-body {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--glacia-ink-dim);

  strong {
    color: var(--glacia-ink);
    font-weight: 700;
  }
}

.del-ack {
  font: inherit;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--hairline);
  background: var(--surface);
  transition: background 260ms ease, border-color 260ms ease;

  &--on {
    border-color: var(--glacia-sev-critical);
    background: rgba(220, 38, 38, 0.06);
  }

  &__text {
    font-size: 14px;
    font-weight: 600;
    color: var(--glacia-ink);
    transition: color 220ms ease;
  }

  &--on &__text {
    color: var(--glacia-sev-critical);
  }
}

.del-box {
  flex: none;
  position: relative;
  width: 22px;
  height: 22px;
  box-sizing: border-box;
  border-radius: 7px;
  border: 1.5px solid var(--hairline-strong);
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 200ms ease, border-color 200ms ease;
}

.del-ack--on .del-box {
  border-color: var(--glacia-sev-critical);
  background: var(--glacia-sev-critical);
}

.del-tick {
  color: #fff;
  opacity: 0;
  transform: scale(0.3);
  transition: opacity 160ms ease, transform 320ms cubic-bezier(0.34, 1.6, 0.64, 1);
}

.del-ack--on .del-tick {
  opacity: 1;
  transform: scale(1);
}

.del-actions {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 12px;
  padding-top: 4px;
}

.del-btn {
  height: 48px;
  border-radius: 16px;
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &--cancel {
    border: 1px solid var(--hairline);
    background: var(--surface);
    color: var(--glacia-ink);
    transition: background 160ms ease;

    &:hover {
      background: var(--surface-3);
    }
  }

  &--delete {
    position: relative;
    overflow: hidden;
    border: 0;
    background: var(--surface-3);
    color: #94a3b8;
    cursor: not-allowed;
    user-select: none;
    touch-action: none;
    transition: background 260ms ease, color 260ms ease, box-shadow 260ms ease, transform 160ms ease;

    &.is-ready,
    &.is-deleting {
      background: var(--glacia-sev-critical);
      color: #fff;
    }

    &.is-ready {
      cursor: pointer;
      box-shadow: 0 10px 24px -10px rgba(220, 38, 38, 0.6);
    }

    &.is-holding {
      transform: scale(0.98);
    }
  }
}

.del-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: #a8161f;
  transition: width 260ms ease-out;
}

.is-holding .del-fill {
  width: 100%;
  transition: width 1000ms linear;
}

.is-deleting .del-fill {
  width: 100%;
  transition: none;
}

.del-label {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
}

.del-spinner {
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  border-radius: 50%;
  border: 2px solid rgba(var(--glass-rgb), 0.35);
  border-top-color: #fff;
  animation: del-spin 700ms linear infinite;
}

.del-hint {
  font-size: 12.5px;
  color: var(--glacia-ink-dim);
  text-align: right;
  margin-top: -8px;
  min-height: 18px;
}

.del-done {
  padding: 40px 24px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  opacity: 0;
  transform: translateY(12px);
  pointer-events: none;
  transition: opacity 300ms ease 120ms, transform 420ms cubic-bezier(0.2, 0.9, 0.25, 1) 120ms;

  &.is-shown {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(22, 163, 74, 0.12);
    color: #16a34a;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: scale(0.4);
    transition: transform 520ms cubic-bezier(0.34, 1.6, 0.64, 1) 220ms;
  }

  &.is-shown &__icon {
    transform: scale(1);
  }

  &__title {
    font-size: 20px;
    font-weight: 800;
    color: var(--glacia-ink);
  }

  &__body {
    font-size: 14px;
    line-height: 1.6;
    color: var(--glacia-ink-dim);
  }

  &__btn {
    margin-top: 10px;
    height: 44px;
    padding: 0 24px;
  }
}

.del-mono {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-weight: 600;
  color: var(--glacia-ink);
}

@keyframes del-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .del-modal,
  .del-modal * {
    transition-duration: 1ms !important;
    animation-duration: 1ms !important;
  }
}
</style>
