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

<style scoped lang="scss" src="./DeleteTimelineModal.scss"></style>
