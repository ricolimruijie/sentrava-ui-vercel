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

// Date + time picker card — implements the `references/Date Time Picker
// 46d.dc.html` design in SentraVA tokens: calendar with a sliding glass
// pill behind the selected day, a 15-minute-step time slider with a drag
// bubble, and an Apply/Cancel footer.
const props = defineProps({
  modelValue: { type: String, default: '' }, // 'YYYY-MM-DD HH:mm'
  min: { type: String, default: '' },        // 'YYYY-MM-DD' — earlier days disabled
  open: { type: Boolean, default: false },
  placeholder: { type: String, default: 'select date & time...' },
})
const emit = defineEmits(['update:modelValue', 'toggle', 'select'])

const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const pad = (x) => String(x).padStart(2, '0')

function parseValue(value) {
  const m = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.exec(value ?? '')
  const now = new Date()
  if (!m) {
    const rounded = Math.round((now.getHours() * 60 + now.getMinutes()) / 15) * 15
    const total = Math.min(rounded, 1439)
    return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate(), h: Math.floor(total / 60), mi: total % 60 }
  }
  const [datePart, timePart] = value.split(' ')
  const [y, mo, d] = datePart.split('-').map(Number)
  const [h = 0, mi = 0] = (timePart ?? '00:00').split(':').map(Number)
  return { y, m: mo - 1, d, h, mi }
}

function toISO(t) {
  return `${t.y}-${pad(t.m + 1)}-${pad(t.d)} ${pad(t.h)}:${pad(t.mi)}`
}

const today = new Date()
const viewY = ref(today.getFullYear())
const viewM = ref(today.getMonth())
const temp = ref(parseValue(''))

// Opening the panel starts from the committed value when there is one.
watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  temp.value = parseValue(props.modelValue)
  viewY.value = temp.value.y
  viewM.value = temp.value.m
  drag.value = false
  nextTick(movePill)
})

// Counters re-trigger the alternating animations (same a/b trick as the reference).
const navN = ref(0)
const navDir = ref(1)
const pickN = ref(0)
const timeN = ref(0)

const monthLabel = computed(() => `${MN[viewM.value]} ${viewY.value}`)

const firstDow = computed(() => new Date(viewY.value, viewM.value, 1).getDay())
const daysInMonth = computed(() => new Date(viewY.value, viewM.value + 1, 0).getDate())
const cells = computed(() => [
  ...Array.from({ length: firstDow.value }, () => null),
  ...Array.from({ length: daysInMonth.value }, (_, i) => i + 1),
])

function dayISO(day) {
  return `${viewY.value}-${pad(viewM.value + 1)}-${pad(day)}`
}

function isDisabled(day) {
  return !!props.min && dayISO(day) < props.min
}

function isSelected(day) {
  const t = temp.value
  return t.y === viewY.value && t.m === viewM.value && t.d === day
}

function shiftMonth(delta) {
  const d = new Date(viewY.value, viewM.value + delta, 1)
  viewY.value = d.getFullYear()
  viewM.value = d.getMonth()
  const last = new Date(viewY.value, viewM.value + 1, 0).getDate()
  temp.value = { ...temp.value, y: viewY.value, m: viewM.value, d: Math.min(temp.value.d, last) }
  navDir.value = delta > 0 ? 1 : -1
  navN.value += 1
  nextTick(movePill)
}

function shiftYear(delta) {
  shiftMonth(delta * 12)
}

function selectDay(day) {
  if (isDisabled(day)) return
  temp.value = { ...temp.value, y: viewY.value, m: viewM.value, d: day }
  pickN.value += 1
  nextTick(movePill)
}

// ── Sliding glass pill behind the selected day ─────────────────────────────
const gridRef = ref(null)
const pill = ref({ left: '0%', top: '0px', opacity: 0 })

function movePill() {
  const t = temp.value
  if (t.y !== viewY.value || t.m !== viewM.value) {
    pill.value = { ...pill.value, opacity: 0 }
    return
  }
  // Measure the selected cell so the number sits dead-center in the pill —
  // percentage arithmetic drifts because it ignores the grid gaps.
  const el = gridRef.value?.querySelector(`[data-day="${t.d}"]`)
  if (el) {
    pill.value = { left: `${el.offsetLeft}px`, top: `${el.offsetTop}px`, opacity: 1 }
    return
  }
  const idx = firstDow.value + t.d - 1
  const col = idx % 7
  const row = Math.floor(idx / 7)
  pill.value = {
    left: `calc(${(col * 100 / 7).toFixed(3)}% + ${(100 / 14).toFixed(3)}% - 18px)`,
    top: `${30 + row * 39}px`,
    opacity: 1,
  }
}

// ── Time slider (15-minute steps) ────────────────────────────────────────────
const trackRef = ref(null)
const drag = ref(false)
let downActive = false
let downTimer = null

const timeLabel = computed(() => `${pad(temp.value.h)}:${pad(temp.value.mi)}`)
const dateShort = computed(() => {
  const t = temp.value
  return `${WD[new Date(t.y, t.m, t.d).getDay()]}, ${t.d} ${MN[t.m].slice(0, 3)}`
})
const pct = computed(() => ((temp.value.h * 60 + temp.value.mi) / 1425) * 100)

function setFromClientX(clientX) {
  const el = trackRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width))
  const v = Math.round(p * 95) * 15
  temp.value = { ...temp.value, h: Math.floor(v / 60), mi: v % 60 }
  timeN.value += 1
}

function tDown(e) {
  trackRef.value?.setPointerCapture?.(e.pointerId)
  setFromClientX(e.clientX)
  downActive = true
  clearTimeout(downTimer)
  downTimer = setTimeout(() => { if (downActive) drag.value = true }, 120)
}

function tMove(e) {
  if (!downActive) return
  const before = `${temp.value.h}:${temp.value.mi}`
  setFromClientX(e.clientX)
  if (!drag.value && `${temp.value.h}:${temp.value.mi}` !== before) drag.value = true
  if (!drag.value) drag.value = true
}

function tUp() {
  downActive = false
  clearTimeout(downTimer)
  drag.value = false
}

function tKey(e) {
  const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 15
    : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -15 : 0
  if (!d) return
  e.preventDefault()
  const v = Math.max(0, Math.min(1425, temp.value.h * 60 + temp.value.mi + d))
  temp.value = { ...temp.value, h: Math.floor(v / 60), mi: v % 60 }
  timeN.value += 1
}

// ── Footer ───────────────────────────────────────────────────────────────────
const display = computed(() => {
  if (!props.modelValue) return ''
  const t = parseValue(props.modelValue)
  return `${WD[new Date(t.y, t.m, t.d).getDay()]}, ${t.d} ${MN[t.m].slice(0, 3)} ${t.y} · ${pad(t.h)}:${pad(t.mi)}`
})

function apply() {
  emit('update:modelValue', toISO(temp.value))
  emit('select', toISO(temp.value))
}

function cancel() {
  temp.value = parseValue(props.modelValue)
  emit('toggle')
}
</script>

<template>
  <div class="form-select dt-picker">
    <button v-show="!open" type="button" class="form-select__trigger" @click="emit('toggle')">
      <span :class="{ 'form-select__trigger-text--placeholder': !modelValue }">
        {{ display || placeholder }}
      </span>
      <IconCalendarMonth :size="18" class="dt-picker__icon" />
    </button>

    <div class="select-panel" :class="{ open }">
      <div class="dt-card">
        <div class="dt-section">
          <div class="dt-row">
            <span class="dt-label">Date</span>
            <span class="dt-pill" :key="`d${pickN}${navN}`">{{ dateShort }}</span>
          </div>

          <div class="dt-nav">
            <div class="dt-nav__btns">
              <button type="button" class="dt-nav__btn" aria-label="Previous year" @click="shiftYear(-1)">
                <IconChevronsLeft :size="16" />
              </button>
              <button type="button" class="dt-nav__btn" aria-label="Previous month" @click="shiftMonth(-1)">
                <IconChevronLeft :size="16" />
              </button>
            </div>
            <span class="dt-nav__month" :key="`m${navN}`">{{ monthLabel }}</span>
            <div class="dt-nav__btns">
              <button type="button" class="dt-nav__btn" aria-label="Next month" @click="shiftMonth(1)">
                <IconChevronRight :size="16" />
              </button>
              <button type="button" class="dt-nav__btn" aria-label="Next year" @click="shiftYear(1)">
                <IconChevronsRight :size="16" />
              </button>
            </div>
          </div>

          <div class="dt-gridwrap">
            <div
              ref="gridRef"
              class="dt-grid"
              :key="`g${navN}`"
              :class="navN ? (navDir > 0 ? 'dt-grid--slide-l' : 'dt-grid--slide-r') : ''"
            >
              <div
                class="dt-pillmark"
                :class="pickN ? (pickN % 2 ? 'dt-pillmark--glide-a' : 'dt-pillmark--glide-b') : ''"
                :style="{ left: pill.left, top: pill.top, opacity: pill.opacity }"
              />
              <span
                v-for="(w, i) in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']"
                :key="w"
                class="dt-weekday"
                :class="{ 'dt-weekday--sun': i === 0 }"
              >{{ w }}</span>
              <template v-for="(day, i) in cells" :key="i">
                <span v-if="day === null" class="dt-blank" />
                <button
                  v-else
                  type="button"
                  class="dt-day"
                  :data-day="day"
                  :class="{ 'dt-day--selected': isSelected(day) }"
                  :disabled="isDisabled(day)"
                  @click="selectDay(day)"
                >{{ day }}</button>
              </template>
            </div>
          </div>
        </div>

        <div class="dt-divider" />

        <div class="dt-timeblock">
          <div class="dt-row">
            <span class="dt-label">Time</span>
            <span class="dt-pill" :key="`t${timeN}`">{{ timeLabel }}</span>
          </div>

          <div
            ref="trackRef"
            class="dt-track"
            @pointerdown="tDown"
            @pointermove="tMove"
            @pointerup="tUp"
            @pointercancel="tUp"
          >
            <div class="dt-track__rail">
              <div class="dt-track__fill" :style="{ width: `${pct}%`, transitionDuration: drag ? '0s' : '0.45s' }" />
            </div>
            <div class="dt-track__ticks">
              <span v-for="i in 5" :key="i" />
            </div>
            <div
              class="dt-thumbpos"
              :style="{ left: `${pct}%`, transitionDuration: drag ? '0s' : '0.45s' }"
            >
              <div class="dt-bubble" :class="{ 'dt-bubble--visible': drag }">
                <span class="dt-bubble__text">{{ timeLabel }}</span>
              </div>
              <div
                class="dt-thumb"
                :class="{ 'dt-thumb--drag': drag }"
                tabindex="0"
                role="slider"
                aria-label="Time"
                aria-valuemin="0"
                aria-valuemax="1425"
                :aria-valuenow="temp.h * 60 + temp.mi"
                :aria-valuetext="timeLabel"
                @keydown="tKey"
              >
                <div class="dt-thumb__dot" />
              </div>
            </div>
          </div>
          <div class="dt-scalelabels">
            <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
          </div>
        </div>

        <div class="dt-foot">
          <div class="dt-foot__spacer" />
          <div class="dt-foot__btns">
            <button type="button" class="dt-btn dt-btn--secondary" @click="cancel">Cancel</button>
            <button type="button" class="dt-btn dt-btn--primary" @click="apply">Apply</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./DateTimePicker.scss"></style>
