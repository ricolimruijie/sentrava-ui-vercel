<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { IconTrash, IconX, IconCheck } from '@tabler/icons-vue'

// Shared hold-to-delete confirmation (delete a domain / network / application /
// repository / scan timeline). Tick the box, then press and hold Delete; the parent
// does the actual removal on `confirm` and this shows the "deleted" state afterwards.
// `closed` fires once the modal has been dismissed.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, required: true },          // "Delete domain"
  subject: { type: String, default: '' },           // what is being deleted (bold, shown under the title)
  icon: { type: [Object, Function], default: null }, // icon shown next to the subject
  message: { type: String, required: true },        // text after the subject: "and its scan history will be ..."
  doneTitle: { type: String, required: true },      // "Domain deleted"
  above: { type: Boolean, default: false },         // sit above other modals
})
const emit = defineEmits(['update:modelValue', 'confirm', 'closed'])

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
  emit('closed')
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
    <div v-if="modelValue" class="modal-backdrop" :class="{ 'modal-backdrop--above': above }" @mousedown.self="close">
      <div class="del-modal" role="dialog" aria-modal="true" aria-labelledby="del-title">
        <div class="del-stack">
          <div class="del-panel" :class="{ 'del-hidden': state === 'saved' }">
            <div class="del-head">
              <span class="del-tile" :class="{ 'del-tile--acked': acked }">
                <IconTrash :size="22" />
              </span>
              <div class="del-titles">
                <span id="del-title" class="del-title">{{ title }}</span>
                <span class="del-repo">
                  <component :is="icon" v-if="icon" :size="14" class="del-repo__icon" /><span class="del-ellip">{{ subject }}</span>
                </span>
              </div>
              <button type="button" class="del-close" aria-label="Close" @click="close">
                <IconX :size="18" />
              </button>
            </div>

            <p class="del-body">
              <strong>{{ subject }}</strong> {{ message }}
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
            <span class="del-done__title">{{ doneTitle }}</span>
            <span class="del-done__body"><span class="del-mono">{{ subject }}</span> has been removed.</span>
            <button type="button" class="del-btn del-btn--cancel del-done__btn" @click="close">Done</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>

</template>

<style scoped lang="scss" src="./HoldToDeleteModal.scss"></style>
