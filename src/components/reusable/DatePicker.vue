<script setup>
import { ref, computed, watch } from 'vue'
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
}
function shiftYear(delta) {
  viewYear.value += delta
}

function selectDay(day) {
  if (isDisabled(day)) return
  emit('update:modelValue', toISO(day))
  emit('select', toISO(day))
}
</script>

<template>
  <div class="form-select date-picker">
    <button type="button" class="form-select__trigger" @click="emit('toggle')">
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

        <div class="calendar__grid">
          <template v-for="(day, i) in cells" :key="i">
            <span v-if="day === null" class="calendar__blank" />
            <button
              v-else
              type="button"
              class="calendar__day"
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
    height: 54px;
    padding: 0 18px;
    border-radius: 14px;
    border: 0.5px solid var(--glacia-glass-border);
    background: #fff;
    box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    cursor: pointer;
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 15px;
    color: var(--glacia-ink);
    text-align: left;
    transition: border-color 0.13s, box-shadow 0.13s;

    &:hover {
      border-color: var(--glacia-ink-dim);
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
  overflow: hidden;
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
  height: 38px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--glacia-ink);
  font-size: 14px;
  font-weight: 500;
  font-family: 'Manrope', 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.13s, color 0.13s;

  &:not(:disabled):hover {
    background: rgba(255, 37, 41, 0.08);
  }

  &--selected {
    background: var(--glacia-red);
    color: #fff;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(255, 37, 41, 0.4);
  }

  &:disabled {
    color: #cbd5e1;
    cursor: default;
  }
}
</style>
