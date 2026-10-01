<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  IconX, IconCheck, IconWorld, IconNetwork, IconBrowser, IconCode,
  IconInfoCircle, IconPlus, IconMinus, IconCalendarMonth, IconChevronLeft, IconChevronRight,
} from '@tabler/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // [{ key: 'domain' | 'network' | 'webapp' | 'source', label, count, used, remaining, additional, validity }]
  rows: { type: Array, default: () => [] },
})
// `save` payload: { service, mode: 'one-time' | 'recurring', amount, start, end }
// — `start` is the first day of the start month (ISO); `end` is the last day of
// the end month, or null for a recurring quota that runs until cancelled.
const emit = defineEmits(['update:modelValue', 'save'])

const icons = { domain: IconWorld, network: IconNetwork, webapp: IconBrowser, source: IconCode }

// Quota is billed and reset monthly, so everything here works in whole months
// ('YYYY-MM') rather than day ranges.
const pad = (n) => String(n).padStart(2, '0')
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const ym = (y, m0) => `${y}-${pad(m0 + 1)}`
const nowYM = () => { const d = new Date(); return ym(d.getFullYear(), d.getMonth()) }
const splitYM = (v) => v.split('-').map(Number)
const monthLong = (v) => { const [y, m] = splitYM(v); return `${MONTHS[m - 1]} ${y}` }
const firstDayISO = (v) => `${v}-01`
function lastDayISO(v) {
  const [y, m] = splitYM(v)
  return `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}`
}
// "Oct 31, 2026"
function shortDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`
}

// ── Form state ───────────────────────────────────────────────────────────
const service = ref('domain')
const mode = ref('one-time') // 'one-time' | 'recurring'
const amount = ref(1)
const startMonth = ref('') // 'YYYY-MM' — "Effective month" (one-time) / "Start month" (recurring)
const endMonth = ref('')   // 'YYYY-MM' — recurring only
const untilCancelled = ref(false) // recurring with no end month
const state = ref('idle') // 'idle' | 'loading' | 'saved'

const current = computed(() => props.rows.find((r) => r.key === service.value) ?? props.rows[0] ?? null)
const usedPct = computed(() => (current.value?.count ? Math.min(100, Math.round((current.value.used / current.value.count) * 100)) : 0))
const afterTotal = computed(() => (current.value?.remaining ?? 0) + amount.value)

const recurring = computed(() => mode.value === 'recurring')
const canSave = computed(() =>
  !!current.value && amount.value >= 1 && !!startMonth.value &&
  (!recurring.value || untilCancelled.value || !!endMonth.value),
)

// Last day the extra quota is valid (null = until cancelled / not chosen yet).
const validUntil = computed(() => {
  if (!startMonth.value) return null
  if (!recurring.value) return lastDayISO(startMonth.value)
  if (untilCancelled.value) return null
  return endMonth.value ? lastDayISO(endMonth.value) : null
})

// Wording for the "After saving" line, once enough is chosen.
const scheduleText = computed(() => {
  if (!startMonth.value) return ''
  if (!recurring.value) return ` for ${monthLong(startMonth.value)}.`
  if (untilCancelled.value) return ` every month from ${monthLong(startMonth.value)} until cancelled.`
  if (!endMonth.value) return ''
  // Start and end in the same month is just that one month — "every month"
  // would read oddly for a single month.
  return endMonth.value === startMonth.value
    ? ` for ${monthLong(startMonth.value)}.`
    : ` every month from ${monthLong(startMonth.value)} to ${monthLong(endMonth.value)}.`
})

watch(() => props.modelValue, (open) => {
  if (!open) return
  service.value = props.rows[0]?.key ?? 'domain'
  mode.value = 'one-time'
  amount.value = 1
  state.value = 'idle'
  pickerFor.value = ''
  // Nothing chosen until the user picks — Save stays disabled until then.
  startMonth.value = ''
  endMonth.value = ''
  untilCancelled.value = false
})

function setMode(m) {
  mode.value = m
  pickerFor.value = ''
  if (m === 'one-time') {
    // A one-time quota covers exactly one month.
    endMonth.value = ''
    untilCancelled.value = false
  }
}

function toggleUntilCancelled() {
  untilCancelled.value = !untilCancelled.value
  if (untilCancelled.value) {
    endMonth.value = ''
    if (pickerFor.value === 'end') pickerFor.value = ''
  }
}

function step(delta) {
  amount.value = Math.max(1, Math.min(9999, (Number(amount.value) || 0) + delta))
}
function onAmountInput(e) {
  const n = parseInt(String(e.target.value).replace(/\D/g, ''), 10)
  amount.value = Number.isFinite(n) ? Math.max(1, Math.min(9999, n)) : 1
  e.target.value = amount.value
}

function close() {
  emit('update:modelValue', false)
}

function save() {
  if (!canSave.value || state.value !== 'idle') return
  state.value = 'loading'
  setTimeout(() => {
    emit('save', {
      service: service.value,
      mode: mode.value,
      amount: amount.value,
      start: firstDayISO(startMonth.value),
      end: validUntil.value,
    })
    state.value = 'saved'
    setTimeout(close, 700)
  }, 500)
}

// ── Month picker — same panel design as the reusable DatePicker (title,
// chevron nav, in-flow fold-open panel), with a 3 × 4 grid of months.
const pickerFor = ref('') // '' (closed) | 'start' | 'end'
const pickerOpen = computed(() => !!pickerFor.value)
const viewYear = ref(new Date().getFullYear())
const monthCells = MONTHS.map((name, i) => ({ i, label: name.slice(0, 3) }))

function openPicker(which) {
  if (pickerFor.value === which) {
    pickerFor.value = ''
    return
  }
  pickerFor.value = which
  const v = which === 'end' ? (endMonth.value || startMonth.value) : startMonth.value
  viewYear.value = v ? splitYM(v)[0] : new Date().getFullYear()
}
function shiftYear(delta) {
  viewYear.value += delta
}

// Earliest month each field accepts: not in the past, and the end month can't
// precede the start month.
function minMonth(which) {
  const now = nowYM()
  return which === 'end' && startMonth.value && startMonth.value > now ? startMonth.value : now
}
const isDisabled = (i) => ym(viewYear.value, i) < minMonth(pickerFor.value)

function monthClass(i) {
  const v = ym(viewYear.value, i)
  const hasRange = recurring.value && startMonth.value && endMonth.value
  return {
    'aq-month--selected': v === startMonth.value || (recurring.value && v === endMonth.value),
    'aq-month--in': !!hasRange && v > startMonth.value && v < endMonth.value,
  }
}

function pickMonth(i) {
  if (isDisabled(i)) return
  const v = ym(viewYear.value, i)
  if (pickerFor.value === 'start') {
    startMonth.value = v
    // Keep the end month valid if the start moved past it.
    if (endMonth.value && endMonth.value < v) endMonth.value = ''
  } else {
    endMonth.value = v
  }
  // Let the pick register visually before the panel folds away.
  setTimeout(() => { pickerFor.value = '' }, 260)
}

const pickerHint = computed(() => {
  if (pickerFor.value === 'end') return 'Choose the last month it applies'
  return recurring.value ? 'Choose the month it starts' : 'Choose the month it applies to'
})

function handleOutside(e) {
  if (pickerOpen.value && !e.target.closest('.aq-date, .aq-cal')) pickerFor.value = ''
}
function handleKey(e) {
  if (e.key !== 'Escape' || !props.modelValue) return
  if (pickerOpen.value) pickerFor.value = ''
  else close()
}
onMounted(() => {
  document.addEventListener('mousedown', handleOutside)
  document.addEventListener('keydown', handleKey)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', handleOutside)
  document.removeEventListener('keydown', handleKey)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" @mousedown.self="close">
        <div class="aq-modal" role="dialog" aria-modal="true" aria-labelledby="aq-title">
          <header class="aq-modal__head">
            <div>
              <h2 id="aq-title" class="aq-modal__title">Assign a quota configuration</h2>
              <p class="aq-modal__sub">Select and apply predefined quota configuration to the company account.</p>
            </div>
            <button type="button" class="aq-modal__close" aria-label="Close" @click="close">
              <IconX :size="20" />
            </button>
          </header>

          <div class="aq-modal__body">
            <div class="aq-label">Service<span class="aq-req">*</span></div>
            <div class="aq-services" role="radiogroup" aria-label="Service">
              <button
                v-for="r in rows"
                :key="r.key"
                type="button"
                role="radio"
                :aria-checked="service === r.key"
                class="aq-service"
                :class="{ 'aq-service--on': service === r.key }"
                @click="service = r.key"
              >
                <span class="aq-service__name"><component :is="icons[r.key]" :size="18" /> {{ r.label }}</span>
                <span class="aq-service__rem">{{ r.remaining }} remaining</span>
              </button>
            </div>

            <div v-if="current" class="aq-current">
              <div class="aq-current__row">
                <span class="aq-current__label">Current quota</span>
                <span class="aq-current__big">{{ current.remaining }}</span>
                <span class="aq-current__unit">remaining</span>
                <span class="aq-current__used">{{ current.used }} / {{ current.count }} used</span>
                <span v-if="startMonth && (validUntil || (recurring && untilCancelled))" class="aq-current__pill">
                  <IconPlus :size="13" /> {{ amount }}
                  <b>{{ validUntil ? `until ${shortDate(validUntil)}` : 'every month' }}</b>
                </span>
              </div>
              <div class="aq-current__bar"><i :style="{ width: usedPct + '%' }" /></div>
              <div class="aq-current__after">
                <IconInfoCircle :size="20" />
                <span>
                  After saving:
                  <b class="aq-mono">{{ current.remaining }} + {{ amount }} = {{ afterTotal }}</b>
                  <template v-if="scheduleText">{{ scheduleText }}</template>
                </span>
              </div>
            </div>

            <div class="aq-setas">
              <div class="aq-label aq-label--inline">Additional set as<span class="aq-req">*</span></div>
              <div class="aq-seg" role="radiogroup" aria-label="Additional set as">
                <button
                  type="button"
                  role="radio"
                  :aria-checked="mode === 'one-time'"
                  class="aq-seg__opt"
                  :class="{ 'aq-seg__opt--on': mode === 'one-time' }"
                  @click="setMode('one-time')"
                >One-Time <small>1 month</small></button>
                <button
                  type="button"
                  role="radio"
                  :aria-checked="mode === 'recurring'"
                  class="aq-seg__opt"
                  :class="{ 'aq-seg__opt--on': mode === 'recurring' }"
                  @click="setMode('recurring')"
                >Recurring <small>Every month</small></button>
              </div>
            </div>

            <div class="aq-fields">
              <div class="aq-field aq-field--amount">
                <div class="aq-label">Monthly quota to add<span class="aq-req">*</span></div>
                <div class="aq-stepper">
                  <button type="button" class="aq-stepper__btn" aria-label="Decrease" :disabled="amount <= 1" @click="step(-1)">
                    <IconMinus :size="18" />
                  </button>
                  <input
                    class="aq-stepper__input"
                    inputmode="numeric"
                    aria-label="Monthly quota to add"
                    :value="amount"
                    @input="onAmountInput"
                    @keydown.up.prevent="step(1)"
                    @keydown.down.prevent="step(-1)"
                  />
                  <button type="button" class="aq-stepper__btn" aria-label="Increase" @click="step(1)">
                    <IconPlus :size="18" />
                  </button>
                </div>
              </div>

              <div class="aq-field aq-field--date">
                <div class="aq-label">{{ recurring ? 'Start month' : 'Effective month' }}<span class="aq-req">*</span></div>
                <button type="button" class="aq-date" :class="{ 'aq-date--open': pickerFor === 'start' }" @click="openPicker('start')">
                  <span v-if="startMonth">{{ monthLong(startMonth) }}</span>
                  <span v-else class="aq-date__ph">select month...</span>
                  <IconCalendarMonth :size="22" />
                </button>
              </div>
            </div>

            <div v-if="recurring" class="aq-fields aq-fields--end">
              <div class="aq-field">
                <div class="aq-label">Until cancelled</div>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="untilCancelled"
                  class="aq-until"
                  :class="{ 'aq-until--on': untilCancelled }"
                  @click="toggleUntilCancelled"
                >
                  <span class="aq-until__track"><i /></span>
                  <span class="aq-until__text">{{ untilCancelled ? 'No end date' : 'Set an end' }}</span>
                </button>
              </div>
              <div class="aq-field">
                <div class="aq-label">End month<span v-if="!untilCancelled" class="aq-req">*</span></div>
                <button
                  type="button"
                  class="aq-date"
                  :class="{ 'aq-date--open': pickerFor === 'end' }"
                  :disabled="untilCancelled"
                  @click="openPicker('end')"
                >
                  <span v-if="endMonth && !untilCancelled">{{ monthLong(endMonth) }}</span>
                  <span v-else class="aq-date__ph">{{ untilCancelled ? 'no end month' : 'select month...' }}</span>
                  <IconCalendarMonth :size="22" />
                </button>
              </div>
            </div>

            <div class="aq-cal" :class="{ open: pickerOpen }">
              <div class="aq-cal__menu">
                <div class="calendar__title">{{ pickerFor === 'end' ? 'Select End Month' : recurring ? 'Select Start Month' : 'Select Month' }}</div>

                <div class="calendar__nav">
                  <button type="button" class="calendar__nav-btn" aria-label="Previous year" @click="shiftYear(-1)">
                    <IconChevronLeft :size="16" />
                  </button>
                  <div class="calendar__month">{{ viewYear }}</div>
                  <button type="button" class="calendar__nav-btn" aria-label="Next year" @click="shiftYear(1)">
                    <IconChevronRight :size="16" />
                  </button>
                </div>

                <div class="calendar__divider" />

                <div class="aq-months">
                  <button
                    v-for="m in monthCells"
                    :key="m.i"
                    type="button"
                    class="aq-month"
                    :class="monthClass(m.i)"
                    :disabled="isDisabled(m.i)"
                    @click="pickMonth(m.i)"
                  >{{ m.label }}</button>
                </div>

                <p class="calendar__hint">{{ pickerHint }}</p>
              </div>
            </div>
          </div>

          <footer class="aq-modal__foot">
            <button type="button" class="aq-btn aq-btn--cancel" @click="close">Cancel</button>
            <button
              type="button"
              class="aq-btn aq-btn--save"
              :class="{ 'aq-btn--saved': state === 'saved' }"
              :disabled="!canSave"
              @click="save"
            >
              <span v-if="state === 'loading'" class="aq-btn__spinner" />
              <IconCheck v-else-if="state === 'saved'" :size="20" />
              <span v-else>Save</span>
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}

.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }

.aq-modal {
  width: 100%;
  max-width: 740px;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  animation: aq-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 24px 16px;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    flex-shrink: 0;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__sub {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--glacia-ink-dim);
  }

  &__close {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1px solid rgba(15, 23, 42, 0.12);
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
    padding: 18px 24px 8px;
    overflow-y: auto;
  }

  &__foot {
    display: flex;
    gap: 12px;
    padding: 14px 24px 18px;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    flex-shrink: 0;
  }
}

.aq-label {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--glacia-ink);
  margin-bottom: 8px;

  &--inline { margin-bottom: 0; }
}
.aq-req { color: #c42b2b; margin-left: 1px; }
.aq-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }

// ── Service chips
.aq-services {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.aq-service {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 11px 10px;
  text-align: left;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: #fff;
  cursor: pointer;
  min-width: 0;
  transition: border-color 0.13s, background 0.13s, box-shadow 0.13s;

  &:hover { border-color: rgba(47, 93, 143, 0.5); }

  &__name {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    font-weight: 700;
    color: var(--glacia-ink);
    white-space: nowrap;

    svg { color: #2f5d8f; flex-shrink: 0; }
  }

  &__rem {
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    color: var(--glacia-ink-dim);
  }

  &--on {
    border-color: #2f5d8f;
    background: #f3f7fc;
    box-shadow: 0 0 0 1px #2f5d8f inset;
  }
}

// ── Current quota card
.aq-current {
  margin-top: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f5f8fb;

  &__row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px 10px;
  }

  &__label { font-size: 14px; font-weight: 700; color: var(--glacia-ink-dim); }
  &__big {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
    color: var(--glacia-ink);
  }
  &__unit { font-size: 15px; color: var(--glacia-ink-dim); }
  &__used {
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  &__pill {
    margin-left: auto;
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 999px;
    background: #e7eef7;
    color: #24456d;
    font-size: 13px;
    font-weight: 600;

    b { font-weight: 700; }
  }

  &__bar {
    height: 8px;
    margin: 12px 0;
    border-radius: 999px;
    background: #d5dde4;
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: #2f5d8f;
      transition: width 0.25s ease;
    }
  }

  &__after {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    font-size: 14px;
    color: var(--glacia-ink-dim);

    svg { color: #2f5d8f; flex-shrink: 0; }
    b { color: var(--glacia-ink); font-weight: 800; }
  }
}

// ── One-time / recurring segmented control
.aq-setas {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin: 16px 0 12px;
}
.aq-seg {
  display: inline-flex;
  padding: 4px;
  border-radius: 999px;
  background: #f3f5f8;
  border: 1px solid rgba(15, 23, 42, 0.06);

  &__opt {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    padding: 9px 18px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--glacia-ink-dim);
    cursor: pointer;
    transition: background 0.15s, color 0.15s, box-shadow 0.15s;

    small { font-size: 13px; font-weight: 500; color: inherit; opacity: 0.85; }

    &--on {
      background: #fff;
      color: var(--glacia-ink);
      box-shadow: 0 2px 8px rgba(16, 24, 32, 0.12);
    }
  }
}

// ── Amount + date fields
.aq-fields {
  display: grid;
  grid-template-columns: 188px 1fr;
  gap: 16px;
  padding-bottom: 16px;
}
.aq-field { position: relative; min-width: 0; }

.aq-stepper {
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 6px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: #fff;

  &__btn {
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 50%;
    background: #f1f4f7;
    color: var(--glacia-ink);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.13s;

    &:hover:not(:disabled) { background: #e5eaf0; }
    &:disabled { color: rgba(15, 23, 42, 0.3); cursor: not-allowed; }
  }

  &__input {
    flex: 1;
    min-width: 0;
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    text-align: center;
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 17px;
    font-weight: 700;
    color: var(--glacia-ink);
  }
}

.aq-date {
  width: 100%;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 16px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: #fff;
  font-family: inherit;
  font-size: 15px;
  color: var(--glacia-ink);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.13s, box-shadow 0.13s;

  svg { color: var(--glacia-ink-dim); flex-shrink: 0; }
  &:hover { border-color: rgba(47, 93, 143, 0.5); }
  &--open { border-color: #2f5d8f; box-shadow: 0 0 0 3px rgba(47, 93, 143, 0.12); }
  &__ph { color: var(--glacia-ink-dim); }
  &:disabled { background: #f5f7fa; cursor: not-allowed; &:hover { border-color: rgba(15, 23, 42, 0.14); } }
}

// ── Month picker — same panel design as the reusable DatePicker: an in-flow
// panel that folds open (the modal grows with it).
.aq-cal {
  // One solid color for picked months and the months between them.
  --aq-range: #ffe5e6;

  overflow: hidden; // fallback for browsers without `clip` support
  overflow: clip;
  overflow-clip-margin: 8px;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.22s ease,
    margin-top 0.32s cubic-bezier(0.4, 0, 0.2, 1);

  &.open {
    max-height: 420px;
    opacity: 1;
    margin-top: -4px;
    margin-bottom: 16px;
  }

  &__menu {
    padding: 14px 14px 12px;
    border-radius: 16px;
    border: 0.5px solid var(--glacia-glass-border);
    background: #fff;
  }
}

.calendar__title {
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 800;
  color: var(--glacia-ink);
}

.calendar__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.calendar__nav-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--glacia-ink);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.13s;

  &:hover { background: rgba(255, 37, 41, 0.08); }
}

.calendar__month {
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--glacia-ink);
}

.calendar__divider {
  height: 1px;
  background: var(--glacia-glass-border);
  margin: 8px 0 10px;
}

.calendar__hint {
  margin: 8px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--glacia-ink-dim);
}

.aq-months {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.aq-month {
  height: 40px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--glacia-ink);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover:not(:disabled):not(.aq-month--selected) { background: rgba(15, 23, 42, 0.05); }

  &--in { background: var(--aq-range); }

  &--selected {
    background: var(--aq-range);
    border-color: rgba(255, 37, 41, 0.4);
    box-shadow: 0 6px 16px -8px rgba(255, 46, 58, 0.45);
    color: #b91c1c;
    font-weight: 800;
  }

  &:disabled {
    color: #cbd5e1;
    cursor: not-allowed;
  }
}

// ── "Until cancelled" switch (recurring)
.aq-fields--end { padding-top: 0; }

.aq-until {
  width: 100%;
  height: 52px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: #fff;
  font-family: inherit;
  font-size: 14px;
  color: var(--glacia-ink);
  cursor: pointer;
  transition: border-color 0.13s, background 0.13s;

  &:hover { border-color: rgba(47, 93, 143, 0.5); }

  &__track {
    position: relative;
    width: 38px;
    height: 22px;
    border-radius: 999px;
    background: #cfd6de;
    flex-shrink: 0;
    transition: background 0.18s;

    i {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgba(16, 24, 32, 0.25);
      transition: transform 0.18s cubic-bezier(0.3, 1.3, 0.5, 1);
    }
  }

  &__text { white-space: nowrap; }

  &--on {
    border-color: #2f5d8f;
    background: #f3f7fc;

    .aq-until__track { background: #2f5d8f; }
    .aq-until__track i { transform: translateX(16px); }
  }
}

// ── Footer buttons
.aq-btn {
  flex: 1;
  height: 52px;
  border-radius: 26px;
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, opacity 0.15s, box-shadow 0.15s;

  &--cancel {
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.14);
    color: var(--glacia-ink);

    &:hover { background: rgba(15, 23, 42, 0.04); }
  }

  &--save {
    border: 0;
    background: var(--glacia-red);
    color: #fff;
    box-shadow: 0 6px 18px rgba(255, 37, 41, 0.28);

    &:hover:not(:disabled) { background: #e01e22; }
    &:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
  }

  &--saved { background: #16a34a !important; }

  &__spinner {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2.5px solid rgba(255, 255, 255, 0.45);
    border-top-color: #fff;
    animation: aq-spin 0.7s linear infinite;
  }
}

@keyframes aq-spin { to { transform: rotate(360deg); } }
@keyframes aq-bounce {
  0% { transform: scale(0.94); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@media (max-width: 720px) {
  .aq-services { grid-template-columns: repeat(2, 1fr); }
  .aq-fields { grid-template-columns: 1fr; }
}
</style>
