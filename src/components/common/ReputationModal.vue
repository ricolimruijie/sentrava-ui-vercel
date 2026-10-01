<script setup>
import { ref, computed, watch } from 'vue'
import { IconX, IconWorld, IconChevronDown, IconCircleX, IconCircleCheck } from '@tabler/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Domain Reputation' },
  // Domain or IP the score describes.
  subject: { type: String, default: '' },
  // [{ id, name, status: 'Passed' | 'Failed', description, solution }]
  engines: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}

const total = computed(() => props.engines.length)
const failedCount = computed(() => props.engines.filter((e) => e.status === 'Failed').length)
const passedCount = computed(() => total.value - failedCount.value)
const score = computed(() => (total.value ? Math.round((passedCount.value / total.value) * 100) : 0))
const noun = computed(() => (props.title.startsWith('IP') ? 'IP address' : 'domain'))

const tone = computed(() => {
  if (score.value >= 80) return { label: 'Strong', color: '#63C892', bg: '#E8F7EF', fg: '#2F7D57' }
  if (score.value >= 50) return { label: 'Fair', color: '#F2B84B', bg: '#FDF3DC', fg: '#A26A00' }
  return { label: 'Weak', color: '#E5645F', bg: '#FDE8E8', fg: '#B42323' }
})

const summary = computed(() => {
  const n = failedCount.value
  if (!n) return `No reputation engine flagged this ${noun.value}.`
  return `${n} reputation engine${n === 1 ? '' : 's'} flagged this ${noun.value}. Follow ${n === 1 ? 'its solution' : 'their solutions'} to request delisting.`
})

// ── Engine list ────────────────────────────────────────────────────────────
const tab = ref('all')
const open = ref(new Set())

const tabs = computed(() => [
  { key: 'all', label: 'All', count: total.value },
  { key: 'Failed', label: 'Failed', count: failedCount.value },
  { key: 'Passed', label: 'Passed', count: passedCount.value },
])

const visible = computed(() => {
  let list = props.engines
  if (tab.value !== 'all') list = list.filter((e) => e.status === tab.value)
  return list
})

function toggle(id) {
  const next = new Set(open.value)
  next.has(id) ? next.delete(id) : next.add(id)
  open.value = next
}

// Reopen fresh each time, with the first failed engine expanded.
watch(() => props.modelValue, (v) => {
  if (!v) return
  tab.value = 'all'
  const first = props.engines.find((e) => e.status === 'Failed')
  open.value = new Set(first ? [first.id] : [])
})
</script>

<template>
  <Teleport to="body">
    <Transition name="rep-fade">
      <div v-if="modelValue" class="rep-backdrop" @mousedown.self="close">
        <div class="rep-modal" role="dialog" aria-modal="true" aria-labelledby="rep-modal-title">
          <header class="rep-modal__head">
            <div class="rep-modal__heading">
              <h2 id="rep-modal-title" class="rep-modal__title">{{ title }}</h2>
              <p class="rep-modal__subject"><IconWorld :size="18" /> {{ subject }}</p>
            </div>
            <button type="button" class="rep-modal__close" aria-label="Close" @click="close">
              <IconX :size="20" />
            </button>
          </header>

          <div class="rep-modal__body">
            <section class="rep-summary">
              <div class="rep-summary__info">
                <p class="rep-summary__label">Reputation score</p>
                <div class="rep-summary__score">
                  <span class="rep-summary__pct">{{ score }}%</span>
                  <span class="rep-summary__tone" :style="{ background: tone.bg, color: tone.fg }">{{ tone.label }}</span>
                </div>
                <p class="rep-summary__text">{{ summary }}</p>
              </div>

              <div class="rep-summary__stats">
                <div class="rep-stat">
                  <span class="rep-stat__label">Total Engine</span>
                  <span class="rep-stat__value">{{ total }}</span>
                </div>
                <div class="rep-stat">
                  <span class="rep-stat__label">Engine Passed</span>
                  <span class="rep-stat__value">{{ passedCount }}</span>
                </div>
                <div class="rep-stat">
                  <span class="rep-stat__label">Engine Failed</span>
                  <span class="rep-stat__value">{{ failedCount }}</span>
                </div>
              </div>
            </section>

            <section class="rep-results">
              <div class="rep-results__bar">
                <h3 class="rep-results__title">Engine Result</h3>
                <div class="rep-results__controls">
                  <div class="rep-tabs" role="tablist">
                    <button
                      v-for="t in tabs"
                      :key="t.key"
                      type="button"
                      role="tab"
                      class="rep-tabs__item"
                      :class="{ 'rep-tabs__item--active': tab === t.key }"
                      :aria-selected="tab === t.key"
                      @click="tab = t.key"
                    >
                      {{ t.label }} <span class="rep-tabs__count">{{ t.count }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <ul class="rep-list">
                <li
                  v-for="e in visible"
                  :key="e.id"
                  class="rep-row"
                  :class="{ 'rep-row--failed': e.status === 'Failed', 'rep-row--open': open.has(e.id) }"
                >
                  <button type="button" class="rep-row__head" :aria-expanded="open.has(e.id)" @click="toggle(e.id)">
                    <IconCircleX v-if="e.status === 'Failed'" :size="22" class="rep-row__icon rep-row__icon--failed" />
                    <IconCircleCheck v-else :size="22" class="rep-row__icon rep-row__icon--passed" />
                    <span class="rep-row__name">{{ e.name }}</span>
                    <span class="rep-row__status" :class="e.status === 'Failed' ? 'rep-row__status--failed' : 'rep-row__status--passed'">{{ e.status }}</span>
                    <IconChevronDown :size="20" class="rep-row__chevron" />
                  </button>

                  <div v-if="open.has(e.id)" class="rep-row__detail">
                    <div class="rep-card">
                      <p class="rep-card__label">Description</p>
                      <p class="rep-card__text">{{ e.description }}</p>
                    </div>
                    <div class="rep-card" :class="{ 'rep-card--solution': e.status === 'Failed' }">
                      <p class="rep-card__label">Solution</p>
                      <p class="rep-card__text">{{ e.solution }}</p>
                    </div>
                  </div>
                </li>
                <li v-if="!visible.length" class="rep-list__empty">No engines found.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss" src="./ReputationModal.scss"></style>
