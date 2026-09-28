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

<style scoped lang="scss">
// Trigger mirrors the AppNavbar dropdowns (same as DatePicker).
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
}

.select-panel {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.22s ease,
    margin-top 0.32s cubic-bezier(0.4, 0, 0.2, 1);

  &.open {
    max-height: 640px;
    opacity: 1;
    margin-top: 10px;
  }
}

.dt-picker__icon {
  flex-shrink: 0;
  color: var(--glacia-ink-dim);
}

// ── Card ───────────────────────────────────────────────────────────────────
.dt-card {
  background: #fff;
  border-radius: 16px;
  border: 0.5px solid var(--glacia-glass-border);
  box-shadow: 0 20px 44px -14px rgba(16, 24, 32, 0.28);
  font-family: 'Manrope', 'Inter', sans-serif;
  padding: 16px 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.dt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

// .dt-section isn't a flex column like .dt-timeblock, so its Date row needs
// its own gap below it before the month nav starts.
.dt-section > .dt-row {
  margin-bottom: 14px;
}

.dt-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--glacia-ink);
}

.dt-pill {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: #b91c1c;
  background: #fff1f1;
  padding: 3px 10px;
  border-radius: 999px;
  display: inline-block;
  animation: dt-bump 0.2s ease;
}

// ── Calendar ───────────────────────────────────────────────────────────────
.dt-section {
  border: 1px solid #e8eef2;
  border-radius: 16px;
  padding: 14px 16px 16px;
  background: #fbfcfd;
}

.dt-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 0 10px;

  &__btns {
    display: flex;
    gap: 2px;
  }

  &__btn {
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--glacia-ink);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;

    &:hover {
      background: rgba(15, 23, 42, 0.05);
    }
  }

  &__month {
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--glacia-ink);
    animation: dt-fade 0.3s ease;
  }
}

.dt-gridwrap {
  // Only needs to clip the month-change slide animation horizontally.
  // Pairing overflow-x:hidden with overflow-y:visible doesn't work — per the
  // CSS overflow spec, a 'hidden'/'visible' pair forces the 'visible' side
  // to compute as 'auto', turning this into a real (if empty) scroll
  // container. Its scrollHeight can then tick a pixel or two past
  // clientHeight mid-animation (the selection pill's glide keyframes
  // briefly overshoot via `scale()`), which was enough to flash a
  // scrollbar track — worse the further the jump between rows, since a
  // bigger jump means a bigger overshoot. `overflow: clip` clips without
  // ever establishing a scroll container, so no scrollbar can appear no
  // matter how far the pill travels; overflow-clip-margin keeps the pill's
  // border/shadow from being cut off near the edges.
  overflow: hidden; // fallback for browsers without `clip` support
  overflow: clip;
  overflow-clip-margin: 8px;
}

.dt-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  row-gap: 3px;
  column-gap: 4px;
  position: relative;

  &--slide-l { animation: dt-slide-l 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
  &--slide-r { animation: dt-slide-r 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
}

.dt-pillmark {
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

.dt-weekday {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--glacia-ink);
  height: 28px;
  line-height: 28px;
  margin-bottom: 2px;
  position: relative;
  z-index: 1;

  &--sun {
    color: #e01e22;
  }
}

.dt-blank {
  visibility: hidden;
  height: 36px;
}

.dt-day {
  width: 36px;
  height: 36px;
  justify-self: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--glacia-ink);
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;

  &--selected {
    color: #b91c1c;
    font-weight: 700;
    animation: dt-pop 0.34s;
  }

  &:disabled {
    color: #cbd5e1;
    cursor: default;
  }
}

.dt-divider {
  height: 1px;
  background: #f1f5f9;
}

// ── Time slider ────────────────────────────────────────────────────────────
.dt-timeblock {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid #e8eef2;
  border-radius: 16px;
  padding: 12px 16px 14px;
  background: #fbfcfd;
}

.dt-track {
  position: relative;
  height: 36px;
  margin-top: 22px;
  cursor: pointer;
  touch-action: none;
  user-select: none;

  &__rail {
    position: absolute;
    left: 0;
    right: 0;
    top: 15px;
    height: 6px;
    border-radius: 999px;
    background: #f1f5f9;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: 999px;
    background: var(--glacia-red);
    transition-property: width;
    transition-timing-function: cubic-bezier(0.3, 1.35, 0.5, 1);
  }

  &__ticks {
    position: absolute;
    left: 0;
    right: 0;
    top: 26px;
    display: flex;
    justify-content: space-between;
    padding: 0 1px;

    span {
      width: 1px;
      height: 5px;
      background: #e2e8f0;
    }
  }
}

.dt-thumbpos {
  position: absolute;
  top: 0;
  width: 0;
  height: 36px;
  transition-property: left;
  transition-timing-function: cubic-bezier(0.3, 1.35, 0.5, 1);
}

.dt-bubble {
  position: absolute;
  bottom: 44px;
  left: -30px;
  width: 60px;
  display: flex;
  justify-content: center;
  opacity: 0;
  margin-bottom: -6px;
  transition: opacity 0.2s ease, margin-bottom 0.3s cubic-bezier(0.3, 1.5, 0.5, 1);
  pointer-events: none;

  &--visible {
    opacity: 1;
    margin-bottom: 0;
  }

  &__text {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 0.78rem;
    font-weight: 600;
    color: #fff;
    background: #0f172a;
    padding: 3px 8px;
    border-radius: 999px;
  }
}

.dt-thumb {
  position: absolute;
  top: 4px;
  left: -14px;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--glacia-glass-fill-strong);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255, 37, 41, 0.3);
  box-shadow: inset 0 1px 0 var(--glacia-glass-highlight), 0 6px 16px -6px rgba(255, 46, 58, 0.5);
  box-sizing: border-box;
  outline: none;
  transition: width 0.3s cubic-bezier(0.3, 1.5, 0.5, 1), height 0.3s cubic-bezier(0.3, 1.5, 0.5, 1),
    left 0.3s cubic-bezier(0.3, 1.5, 0.5, 1), top 0.3s cubic-bezier(0.3, 1.5, 0.5, 1);

  &--drag {
    width: 40px;
    height: 22px;
    left: -20px;
    top: 7px;
  }

  &__dot {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 8px;
    height: 8px;
    margin: -4px 0 0 -4px;
    border-radius: 999px;
    background: var(--glacia-red);
  }
}

.dt-scalelabels {
  display: flex;
  justify-content: space-between;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.68rem;
  color: var(--glacia-ink-dim);
}

// ── Footer ─────────────────────────────────────────────────────────────────
.dt-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-top: 6px;

  &__spacer {
    flex: 1;
  }

  &__btns {
    display: flex;
    gap: 8px;
  }
}

.dt-btn {
  height: 40px;
  padding: 0 18px;
  border-radius: 12px;
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;

  &--secondary {
    background: var(--glacia-glass-fill-strong);
    border: 1px solid var(--glacia-glass-border);
    color: var(--glacia-ink);
  }

  &--primary {
    background: var(--glacia-red);
    border: none;
    color: #fff;
    box-shadow: 0 6px 20px rgba(255, 37, 41, 0.35);

    &:hover {
      background: #e01e22;
    }
  }
}

@keyframes dt-slide-l { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
@keyframes dt-slide-r { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: none; } }
@keyframes dt-fade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@keyframes dt-pop {
  0% { transform: scale(0.8); animation-timing-function: cubic-bezier(0.3, 1.5, 0.5, 1); }
  60% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
@keyframes dt-bump {
  0% { transform: scale(1); }
  40% { transform: scale(1.08); }
  100% { transform: scale(1); }
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

@media (prefers-reduced-motion: reduce) {
  .dt-card * { transition: none !important; animation: none !important; }
}
</style>
