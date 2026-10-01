<script setup>
import { ref, computed, watch } from 'vue'
import { IconX, IconCheck } from '@tabler/icons-vue'

// "Download Report" modal: pick which rows to include per filter group (all
// start unchecked), see how many rows are selected, then Download. The parent
// turns the selected rows into a file on the `download` event.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Download Report' },
  description: { type: String, default: 'Choose which entries to include in the export.' },
  noun: { type: String, default: 'entries' },
  rows: { type: Array, default: () => [] },
  // [{ key: <row field>, label, options: [{ value, label }] }] — shown as columns.
  groups: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'download'])

const selected = ref({})
const state = ref('idle') // 'idle' | 'loading'

watch(() => props.modelValue, (open) => {
  if (!open) return
  selected.value = Object.fromEntries(props.groups.map((g) => [g.key, []]))
  state.value = 'idle'
})

function toggle(key, value) {
  const cur = selected.value[key] ?? []
  selected.value = { ...selected.value, [key]: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value] }
}
function selectAll(g) {
  selected.value = { ...selected.value, [g.key]: g.options.map((o) => o.value) }
}

// Each option's own count (across all rows, not the current selection) and a
// mini bar sized relative to the busiest option in its own column.
const counts = computed(() =>
  Object.fromEntries(props.groups.map((g) => [g.key, Object.fromEntries(g.options.map((o) => [o.value, props.rows.filter((r) => r[g.key] === o.value).length]))])),
)
const maxes = computed(() =>
  Object.fromEntries(props.groups.map((g) => [g.key, Math.max(1, ...Object.values(counts.value[g.key]))])),
)
const chosen = computed(() =>
  props.rows.filter((r) => props.groups.every((g) => (selected.value[g.key] ?? []).includes(r[g.key]))),
)

function close() {
  emit('update:modelValue', false)
}

function submit() {
  if (!chosen.value.length || state.value !== 'idle') return
  state.value = 'loading'
  setTimeout(() => {
    emit('download', chosen.value)
    state.value = 'idle'
    close()
  }, 600)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" @mousedown.self="close">
        <div class="rep-modal">
          <div class="rep-modal__head">
            <div>
              <h2 class="rep-modal__title">{{ title }}</h2>
              <p class="rep-modal__desc">{{ description }}</p>
            </div>
            <button type="button" class="rep-modal__close" aria-label="Close" @click="close">
              <IconX :size="18" />
            </button>
          </div>

          <div class="rep-modal__grid">
            <template v-for="(g, gi) in groups" :key="g.key">
              <div v-if="gi > 0" class="rep-modal__divider" aria-hidden="true" />
              <div class="rep-modal__col">
                <div class="rep-modal__col-head">
                  <p class="rep-modal__label">{{ g.label }}</p>
                  <button type="button" class="rep-modal__selectall" @click="selectAll(g)">Select all</button>
                </div>
                <div class="rep-modal__opts">
                  <label v-for="o in g.options" :key="o.value" class="rep-check">
                    <input
                      type="checkbox"
                      class="rep-check__input"
                      :checked="(selected[g.key] ?? []).includes(o.value)"
                      @change="toggle(g.key, o.value)"
                    />
                    <span class="rep-check__box" aria-hidden="true"><IconCheck :size="12" class="rep-check__icon" /></span>
                    <span class="rep-check__text">{{ o.label }}</span>
                    <span class="rep-check__bar">
                      <span
                        class="rep-check__bar-fill"
                        :class="{ 'rep-check__bar-fill--on': (selected[g.key] ?? []).includes(o.value) }"
                        :style="{ width: (counts[g.key][o.value] / maxes[g.key] * 100) + '%' }"
                      />
                    </span>
                    <span class="rep-check__count">{{ counts[g.key][o.value] }}</span>
                  </label>
                </div>
              </div>
            </template>
          </div>

          <div class="rep-modal__footer">
            <p class="rep-modal__count"><b>{{ chosen.length }}</b> of {{ rows.length }} {{ noun }} selected</p>
            <div class="rep-modal__progress">
              <span
                class="rep-modal__progress-fill"
                :style="{ width: (rows.length ? chosen.length / rows.length * 100 : 0) + '%' }"
              />
            </div>

            <div class="rep-modal__actions">
              <button type="button" class="rep-btn rep-btn--cancel" @click="close">Cancel</button>
              <button
                type="button"
                class="rep-btn rep-btn--download"
                :class="{ 'rep-btn--busy': state === 'loading' }"
                :disabled="!chosen.length || state !== 'idle'"
                @click="submit"
              >
                <span v-if="state === 'loading'" class="rep-btn__spinner" />
                <span v-else>Download</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss" src="./ReportDownloadModal.scss"></style>
