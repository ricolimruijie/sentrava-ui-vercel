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

<style scoped lang="scss" src="./DatePicker.scss"></style>
