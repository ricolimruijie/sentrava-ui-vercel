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

<style scoped lang="scss">
.rep-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 24px;
}

.rep-fade-enter-active { transition: opacity 0.15s ease; }
.rep-fade-leave-active { transition: opacity 0.22s ease; }
.rep-fade-enter-from,
.rep-fade-leave-to { opacity: 0; }

.rep-modal {
  width: 100%;
  max-width: 640px;
  max-height: 80vh;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--glacia-glass-border);
    flex-shrink: 0;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__subject {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 4px 0 0;
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  &__close {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid var(--glacia-glass-border);
    background: #fff;
    color: var(--glacia-ink);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.13s;

    &:hover { background: rgba(15, 23, 42, 0.05); }
  }

  &__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 18px 24px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

// ── Summary card ───────────────────────────────────────────────────────────
.rep-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;

  // Reputation score card — sits apart from the engine stat tiles below it.
  &__info {
    background: #f8fafb;
    border-radius: 18px;
    padding: 18px 22px;
    min-width: 0;
  }

  &__label {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--glacia-ink-dim);
  }

  &__score {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 2px 0 4px;
  }

  &__pct {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 34px;
    font-weight: 800;
    line-height: 1.1;
    color: var(--glacia-ink);
  }

  &__tone {
    padding: 3px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
  }

  &__text {
    margin: 0;
    font-size: 13px;
    color: var(--glacia-ink);
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
}

.rep-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 2px;
  background: #f8fafb;
  border-radius: 14px;
  padding: 14px 12px;

  &__label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--glacia-ink-dim);
  }

  &__value {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--glacia-ink);
  }
}

// ── Engine results ─────────────────────────────────────────────────────────
.rep-results {
  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 14px;
    margin-bottom: 12px;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 17px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.rep-tabs {
  display: inline-flex;
  padding: 4px;
  gap: 2px;
  border: 1px solid var(--glacia-glass-border);
  border-radius: 999px;
  background: #f8fafb;

  &__item {
    border: none;
    background: transparent;
    border-radius: 999px;
    padding: 6px 12px;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    color: var(--glacia-ink-dim);
    cursor: pointer;
    transition: background 0.13s, color 0.13s, box-shadow 0.13s;

    &--active {
      background: #fff;
      color: var(--glacia-ink);
      box-shadow: 0 1px 3px rgba(16, 24, 32, 0.15);
    }
  }

  &__count {
    margin-left: 4px;
    font-weight: 500;
    color: var(--glacia-ink-dim);
  }
}

.rep-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--glacia-glass-border);
  border-radius: 16px;
  // Fixed to 10 collapsed rows (46px + 1px divider each, plus the 2px border)
  // so the modal keeps its size on every tab, even an empty one; the rest is
  // reached by scrolling the list.
  height: calc(47px * 10 + 2px);
  overflow-y: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb {
    background: rgba(15, 23, 42, 0.15);
    border-radius: 999px;
  }
  &::-webkit-scrollbar-track { background: transparent; }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 28px;
    text-align: center;
    font-size: 14px;
    color: var(--glacia-ink-dim);
  }
}

.rep-row {
  border-bottom: 1px solid var(--glacia-glass-border);

  &:last-child { border-bottom: none; }

  &--failed { background: #fbeaea; }
  &--open:not(&--failed) { background: #f8fafb; }

  &__head {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 46px;
    box-sizing: border-box;
    padding: 12px 16px;
    border: none;
    background: transparent;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  &__icon {
    flex-shrink: 0;
    &--failed { color: #c0392b; }
    &--passed { color: #4caf6d; }
  }

  &__name {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--glacia-ink);
  }

  &__status {
    font-size: 13px;
    font-weight: 700;

    &--failed { color: #c0392b; }
    &--passed {
      color: #2f7d57;
      background: #e3f5e8;
      padding: 3px 12px;
      border-radius: 999px;
    }
  }

  &__chevron {
    flex-shrink: 0;
    color: var(--glacia-ink-dim);
    transition: transform 0.18s ease;

    .rep-row--open & { transform: rotate(180deg); }
  }

  &__detail {
    // Cards start at the row's left edge (under the status icon) and share
    // the row as two equal, equally tall columns.
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    align-items: stretch;
    padding: 0 16px 16px;
  }
}

.rep-card {
  background: #fff;
  border: 1px solid var(--glacia-glass-border);
  border-radius: 20px;
  padding: 14px 16px;
  min-width: 0;

  &--solution { border-color: #c0392b; }

  &__label {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--glacia-ink-dim);

    .rep-card--solution & { color: #c0392b; }
  }

  &__text {
    margin: 0;
    font-size: 13px;
    line-height: 1.55;
    color: var(--glacia-ink);
  }
}

@media (max-width: 720px) {
  .rep-row__detail {
    grid-template-columns: 1fr;
  }
}
</style>
