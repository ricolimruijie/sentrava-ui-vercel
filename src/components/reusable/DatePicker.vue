<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import {
  IconCalendarMonth,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-vue'
import { formatDate } from '@/utils/helpers'

const props = defineProps({
  modelValue: { type: String, default: '' }, // 'YYYY-MM-DD'
  min: { type: String, default: '' },        // 'YYYY-MM-DD' — earlier days disabled
  open: { type: Boolean, default: false },
  placeholder: { type: String, default: 'select date...' },
})
const emit = defineEmits(['update:modelValue', 'toggle', 'select'])

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth()) // 0-based

// Opening the panel starts from the chosen date when there is one,
// otherwise from the current month.
watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  const parsed = parseISO(props.modelValue)
  viewYear.value = parsed?.y ?? today.getFullYear()
  viewMonth.value = parsed?.m ?? today.getMonth()
  nextTick(movePill)
})

function parseISO(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso ?? '')) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return { y, m: m - 1, d }
}

function toISO(day) {
  const mm = String(viewMonth.value + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${viewYear.value}-${mm}-${dd}`
}

const display = computed(() => (props.modelValue ? formatDate(props.modelValue) : ''))

const monthLabel = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1)
    .toLocaleString('en-US', { month: 'long', year: 'numeric' }),
)

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// Leading blanks + days of the viewed month.
const cells = computed(() => {
  const firstDow = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  return [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
})

function isDisabled(day) {
  return !!props.min && toISO(day) < props.min
}

function shiftMonth(delta) {
  const d = new Date(viewYear.value, viewMonth.value + delta, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
  nextTick(movePill)
}
function shiftYear(delta) {
  viewYear.value += delta
  nextTick(movePill)
}

function selectDay(day) {
  if (isDisabled(day)) return
  emit('update:modelValue', toISO(day))
  emit('select', toISO(day))
  pickN.value += 1
  nextTick(movePill)
}

// ── Sliding glass pill behind the selected day (same as DateTimePicker) ────
const gridRef = ref(null)
const pill = ref({ left: '0px', top: '0px', opacity: 0 })
const pickN = ref(0)

function movePill() {
  const parsed = parseISO(props.modelValue)
  if (!parsed || parsed.y !== viewYear.value || parsed.m !== viewMonth.value) {
    pill.value = { ...pill.value, opacity: 0 }
    return
  }
  // Measure the selected cell so the number sits dead-center in the pill.
  const el = gridRef.value?.querySelector(`[data-day="${parsed.d}"]`)
  if (!el) {
    pill.value = { ...pill.value, opacity: 0 }
    return
  }
  pill.value = { left: `${el.offsetLeft}px`, top: `${el.offsetTop}px`, opacity: 1 }
}
</script>

<template>
  <div class="form-select date-picker">
    <button v-show="!open" type="button" class="form-select__trigger" @click="emit('toggle')">
      <span :class="{ 'form-select__trigger-text--placeholder': !modelValue }">
        {{ display || placeholder }}
      </span>
      <IconCalendarMonth :size="18" class="date-picker__icon" />
    </button>

    <div class="select-panel" :class="{ open }">
      <div class="form-select__inline-menu form-select__inline-menu--calendar">
        <div class="calendar__title">Select Date</div>

        <div class="calendar__nav">
          <div class="calendar__nav-btns">
            <button type="button" class="calendar__nav-btn" aria-label="Previous year" @click="shiftYear(-1)">
              <IconChevronsLeft :size="16" />
            </button>
            <button type="button" class="calendar__nav-btn" aria-label="Previous month" @click="shiftMonth(-1)">
              <IconChevronLeft :size="16" />
            </button>
          </div>
          <div class="calendar__month">{{ monthLabel }}</div>
          <div class="calendar__nav-btns">
            <button type="button" class="calendar__nav-btn" aria-label="Next month" @click="shiftMonth(1)">
              <IconChevronRight :size="16" />
            </button>
            <button type="button" class="calendar__nav-btn" aria-label="Next year" @click="shiftYear(1)">
              <IconChevronsRight :size="16" />
            </button>
          </div>
        </div>

        <div class="calendar__divider" />

        <div class="calendar__week">
          <span
            v-for="(day, i) in weekdays"
            :key="day"
            class="calendar__weekday"
            :class="{ 'calendar__weekday--sun': i === 0 }"
          >
            {{ day }}
          </span>
        </div>

        <div ref="gridRef" class="calendar__grid">
          <div
            class="calendar__pill"
            :class="pickN ? (pickN % 2 ? 'calendar__pill--glide-a' : 'calendar__pill--glide-b') : ''"
            :style="{ left: pill.left, top: pill.top, opacity: pill.opacity }"
          />
          <template v-for="(day, i) in cells" :key="i">
            <span v-if="day === null" class="calendar__blank" />
            <button
              v-else
              type="button"
              class="calendar__day"
              :data-day="day"
              :class="{ 'calendar__day--selected': toISO(day) === modelValue }"
              :disabled="isDisabled(day)"
              @click="selectDay(day)"
            >
              {{ day }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// Self-contained trigger/panel styling — mirrors the AppNavbar dropdowns.
// (Scoped CSS in the parent can't reach this child component, so these live
// here instead of being inherited.)
.form-select {
  position: relative;

  &__trigger {
    width: 100%;
    height: 44px;
    padding: 0 12px 0 16px;
    border-radius: var(--glacia-radius-sm, 12px);
    border: 1px solid #AEBEC4;
    background: var(--glacia-glass-fill, rgba(255, 255, 255, 0.6));
    backdrop-filter: blur(var(--glacia-blur-sm, 14px)) saturate(160%);
    -webkit-backdrop-filter: blur(var(--glacia-blur-sm, 14px)) saturate(160%);
    box-shadow: inset 0 1px 0 var(--glacia-glass-highlight, rgba(255, 255, 255, 0.95)), 0 10px 24px -14px rgba(16, 24, 32, 0.2);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    cursor: pointer;
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 14px;
    color: var(--glacia-ink);
    text-align: left;
    transition: border-color 200ms ease, box-shadow 280ms ease;

    &:hover {
      border-color: #849599;
    }
  }

  &__trigger-text--placeholder {
    color: var(--glacia-ink-dim);
  }

  &__inline-menu {
    margin-top: 10px;
    padding: 8px;
    border-radius: 16px;
    border: 0.5px solid var(--glacia-glass-border);
    background: #fff;
    max-height: 260px;
    overflow-y: auto;
  }
}

// Same open/close animation as the other dropdowns: in-flow panel that the
// modal height follows.
.select-panel {
  // `clip` (with a small margin) instead of `hidden` — same collapsing
  // behavior, but it won't flat-cut the selection pill's border/shadow if a
  // selected day ever sits right at the panel's edge. See DateTimePicker.vue
  // for the fuller writeup of why this matters.
  overflow: hidden; // fallback for browsers without `clip` support
  overflow: clip;
  overflow-clip-margin: 8px;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.22s ease,
    margin-top 0.32s cubic-bezier(0.4, 0, 0.2, 1);

  &.open {
    max-height: 520px;
    opacity: 1;
    margin-top: 10px;
  }
}

.date-picker__icon {
  flex-shrink: 0;
  color: var(--glacia-ink-dim);
}

.form-select__inline-menu--calendar {
  max-height: none;
  margin-top: 0;
  padding: 20px;
}

.calendar__title {
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 800;
  color: var(--glacia-ink);
}

.calendar__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.calendar__nav-btns {
  display: flex;
  align-items: center;
  gap: 2px;
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

  &:hover {
    background: rgba(255, 37, 41, 0.08);
  }
}

.calendar__month {
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: var(--glacia-ink);
}

.calendar__divider {
  height: 1px;
  background: var(--glacia-glass-border);
  margin: 12px 0;
}

.calendar__week,
.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
}

.calendar__grid {
  position: relative;
  row-gap: 3px;
}

.calendar__pill {
  position: absolute;
  z-index: 0;
  pointer-events: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--glacia-glass-fill-strong);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255, 37, 41, 0.3);
  box-shadow: inset 0 1px 0 var(--glacia-glass-highlight), 0 6px 16px -6px rgba(255, 46, 58, 0.45);
  box-sizing: border-box;
  transition: left 0.5s cubic-bezier(0.3, 1.35, 0.5, 1), top 0.5s cubic-bezier(0.3, 1.35, 0.5, 1), opacity 0.2s ease;

  // Alternating classes replay the stretch without remounting (remounting
  // would jump straight to the new spot and skip the slide transition).
  &--glide-a { animation: dt-glide-a 0.5s; }
  &--glide-b { animation: dt-glide-b 0.5s; }
}

.calendar__weekday {
  font-size: 13px;
  font-weight: 700;
  color: var(--glacia-ink);
  padding: 6px 0;

  &--sun {
    color: var(--glacia-sev-critical);
  }
}

.calendar__day {
  width: 36px;
  height: 36px;
  justify-self: center;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--glacia-ink);
  font-size: 14px;
  font-weight: 500;
  font-family: 'Manrope', 'Inter', sans-serif;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;

  &--selected {
    background: transparent;
    color: #b91c1c;
    font-weight: 700;
    animation: dt-pop 0.34s;
  }

  &:disabled {
    color: #cbd5e1;
    cursor: default;
  }
}

.calendar__blank {
  height: 36px;
}

@keyframes dt-glide-a {
  0% { transform: scale(1, 1); }
  30% { transform: scale(1.18, 0.86); animation-timing-function: ease-out; }
  70% { transform: scale(0.95, 1.05); }
  100% { transform: scale(1, 1); }
}
@keyframes dt-glide-b {
  0% { transform: scale(1, 1); }
  30% { transform: scale(1.18, 0.86); animation-timing-function: ease-out; }
  70% { transform: scale(0.95, 1.05); }
  100% { transform: scale(1, 1); }
}
@keyframes dt-pop {
  0% { transform: scale(0.8); animation-timing-function: cubic-bezier(0.3, 1.5, 0.5, 1); }
  60% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
</style>
