<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import { IconChevronDown, IconCheck, IconAlertCircle } from '@tabler/icons-vue'

// GlassField — glass text field + dropdown with sheen/shake/pop animations.
// <GlassField v-model="name" label="Application name" placeholder="e.g. Customer Portal" required :maxlength="40" error-text="Application name is required" />
// <GlassField v-model="env" type="select" label="Environment" placeholder="Select an environment" required
//             :options="[{ label: 'Production', value: 'production' }, { label: 'Staging', value: 'staging' }]"
//             error-text="Choose an environment" />
const props = defineProps({
  modelValue: { type: [String, Number, Array, null], default: '' },
  multiple: { type: Boolean, default: false }, // select only: modelValue is an array; options render as checkboxes
  type: { type: String, default: 'text' }, // 'text' | 'select' | 'textarea'
  inputType: { type: String, default: 'text' }, // native <input> type, e.g. 'password', 'email' — ignored for 'select'/'textarea'
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
  options: { type: Array, default: () => [] }, // [{ label, value }]
  required: { type: Boolean, default: false },
  asterisk: { type: Boolean, default: false }, // show the red * without the empty-required error
  visibleRows: { type: Number, default: 5 }, // max dropdown rows visible before scrolling (42px each)
  maxlength: { type: Number, default: null },
  errorText: { type: String, default: 'This field is required' },
  invalid: { type: Boolean, default: false }, // force an error state for external validation (e.g. format checks) beyond emptiness
})
const emit = defineEmits(['update:modelValue', 'enter'])

const id = 'gf-' + Math.random().toString(36).slice(2, 8)
const focused = ref(false)
const open = ref(false)
const touched = ref(false)
const shaking = ref(false)
const hi = ref(0)
const sheen = ref(false)
const sheenKey = ref(0)

// The dropdown menu is teleported to <body> and positioned from the
// trigger's own bounding rect — sitting inside the modal's DOM would put it
// at the mercy of every scrollable/collapsible ancestor's overflow, which
// clips it the moment the modal (or a panel like a quota section) doesn't
// have room to spare below the trigger.
const triggerRef = ref(null)
const menuInnerRef = ref(null)
const menuStyle = ref({})
const menuMore = ref(false) // scroll cue: list has more rows below

function updateMenuMore() {
  const el = menuInnerRef.value
  if (!el) {
    menuMore.value = false
    return
  }
  menuMore.value = el.scrollHeight - el.scrollTop - el.clientHeight > 8
}
function onMenuScroll() {
  updateMenuMore()
}

function positionMenu() {
  const el = triggerRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  menuStyle.value = {
    position: 'fixed',
    top: `${r.bottom + 8}px`,
    left: `${r.left}px`,
    width: `${r.width}px`,
  }
}

// A scroll/resize while open would leave a `position: fixed` menu stranded
// away from its trigger — closing it matches how most native/popover
// selects behave rather than trying to track continuously. Scrolling the
// menu's own (capped, 5-row) option list fires a 'scroll' event too — that
// one must NOT close the menu, only a scroll of something else behind it.
function onWindowChange(e) {
  if (e.type === 'scroll' && menuInnerRef.value?.contains(e.target)) return
  open.value = false
}
function bindWindowClose() {
  window.addEventListener('scroll', onWindowChange, true)
  window.addEventListener('resize', onWindowChange)
}
function unbindWindowClose() {
  window.removeEventListener('scroll', onWindowChange, true)
  window.removeEventListener('resize', onWindowChange)
}
onBeforeUnmount(unbindWindowClose)

const selectedValues = computed(() => (props.multiple && Array.isArray(props.modelValue) ? props.modelValue : []))
const isChosen = (o) => (props.multiple ? selectedValues.value.includes(o.value) : o.value === props.modelValue)
const selected = computed(() => {
  if (!props.multiple) return props.options.find((o) => o.value === props.modelValue)
  const picked = props.options.filter((o) => selectedValues.value.includes(o.value))
  if (!picked.length) return undefined
  return { value: picked.map((o) => o.value).join('|'), label: picked.length > 2 ? `${picked.length} selected` : picked.map((o) => o.label).join(', ') }
})
const isEmpty = computed(() => (props.type === 'select' ? !selected.value : !String(props.modelValue || '').trim()))
const active = computed(() => (props.type === 'select' ? open.value : focused.value))
const hasError = computed(() => {
  // External rejection (e.g. malformed email) shows red immediately —
  // even while focused. Empty-required errors still wait for blur.
  if (props.invalid) return true
  if (active.value) return false
  if (!touched.value) return false
  return (props.required && isEmpty.value) || props.invalid
})

// Controlled input: if the parent rejects/sanitizes the typed value (e.g. an
// IP field that only allows digits and dots) the model doesn't change, so
// Vue wouldn't re-render — put the DOM value back to the model ourselves.
function onInput(e) {
  const el = e.target
  emit('update:modelValue', el.value)
  nextTick(() => {
    const cur = props.modelValue == null ? '' : String(props.modelValue)
    if (el.value !== cur) el.value = cur
  })
}

function sweep() {
  sheenKey.value++
  sheen.value = true
}
function shake() {
  shaking.value = false
  requestAnimationFrame(() => { shaking.value = true })
}
function onFocus() {
  focused.value = true
  if (props.type !== 'select') sweep()
}
function onBlur() {
  focused.value = false
  unbindWindowClose()
  open.value = false
  touched.value = true
  if ((props.required && isEmpty.value) || props.invalid) shake()
}
function setOpen(o) {
  open.value = o
  if (o) {
    const i = props.options.findIndex((x) => isChosen(x))
    hi.value = i < 0 ? 0 : i
    sweep()
    positionMenu()
    bindWindowClose()
    // The list is capped to 5 visible rows and scrolls — jump straight to
    // the current selection instead of leaving it scrolled out of view.
    nextTick(() => {
      if (!menuInnerRef.value) return
      const rowTop = hi.value * 42
      menuInnerRef.value.scrollTop = Math.max(0, rowTop - 84)
      updateMenuMore()
    })
  } else {
    unbindWindowClose()
  }
}
function toggle() {
  setOpen(!open.value)
}
function choose(i) {
  const v = props.options[i].value
  touched.value = true
  if (props.multiple) {
    // Checkbox style: toggle the row and keep the menu open.
    const cur = selectedValues.value
    emit('update:modelValue', cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v])
    return
  }
  emit('update:modelValue', v)
  setOpen(false)
}
function onKey(e) {
  const n = props.options.length
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (!open.value) return setOpen(true)
    hi.value = (hi.value + (e.key === 'ArrowDown' ? 1 : -1) + n) % n
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    open.value ? choose(hi.value) : setOpen(true)
  } else if (e.key === 'Escape' && open.value) {
    e.preventDefault()
    setOpen(false)
  }
}
</script>

<template>
  <div class="gf" :class="{ 'is-active': active, 'is-error': hasError, 'is-open': open, 'is-shake': shaking }">
    <label class="gf__label" :for="id" :id="id + '-label'">{{ label }}<span v-if="required || asterisk" class="gf__req">*</span></label>

    <div class="gf__wrap">
      <!-- Textarea -->
      <div v-if="type === 'textarea'" class="gf__box gf__box--area">
        <span class="gf__sheen" :class="{ run: sheen }" :key="sheenKey"></span>
        <textarea
          :id="id"
          class="gf__input gf__input--area"
          :value="modelValue"
          :maxlength="maxlength"
          :placeholder="placeholder"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
          @keyup.enter="emit('enter')"
        ></textarea>
        <span v-if="maxlength" class="gf__count">{{ (modelValue || '').length }}/{{ maxlength }}</span>
      </div>

      <!-- Text -->
      <div v-else-if="type !== 'select'" class="gf__box">
        <span class="gf__sheen" :class="{ run: sheen }" :key="sheenKey"></span>
        <input
          :id="id"
          class="gf__input"
          :type="inputType"
          :value="modelValue"
          :maxlength="maxlength"
          :placeholder="placeholder"
          autocomplete="off"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
          @keyup.enter="emit('enter')"
        />
        <span v-if="maxlength" class="gf__count">{{ (modelValue || '').length }}/{{ maxlength }}</span>
      </div>

      <!-- Select -->
      <template v-else>
        <button
          :id="id"
          ref="triggerRef"
          type="button"
          class="gf__box gf__box--select"
          aria-haspopup="listbox"
          :aria-expanded="open"
          :aria-labelledby="id + '-label'"
          @click="toggle"
          @blur="onBlur"
          @keydown="onKey"
        >
          <span class="gf__sheen" :class="{ run: sheen }" :key="sheenKey"></span>
          <span class="gf__value" :class="{ 'has-value': selected }" :key="selected ? selected.value : 'ph'">{{ selected ? selected.label : placeholder }}</span>
          <IconChevronDown :size="18" class="gf__chev" />
        </button>
        <Teleport to="body">
          <div v-if="open" class="gf__menu" role="listbox" :aria-multiselectable="multiple || undefined" :style="menuStyle">
            <div
              class="gf__menu-inner"
              ref="menuInnerRef"
              :style="{ maxHeight: (visibleRows * 42) + 'px' }"
              @scroll="onMenuScroll"
            >
              <span class="gf__ind" :style="{ transform: `translateY(${hi * 42}px)` }"></span>
              <div
                v-for="(o, i) in options"
                :key="o.value"
                class="gf__opt"
                role="option"
                :aria-selected="isChosen(o)"
                :style="{ animationDelay: i * 35 + 'ms' }"
                @mouseenter="hi = i"
                @mousedown.prevent="choose(i)"
              >
                <span v-if="multiple" class="gf__cb" :class="{ 'is-on': isChosen(o) }"><IconCheck v-if="isChosen(o)" :size="12" :stroke="3" /></span>
                <span>{{ o.label }}</span>
                <IconCheck v-if="!multiple && isChosen(o)" :size="16" class="gf__check" />
              </div>
            </div>
            <div v-show="menuMore" class="gf__more" aria-hidden="true">
              <IconChevronDown :size="16" />
            </div>
          </div>
        </Teleport>
      </template>
    </div>

    <div class="gf__error" role="alert">
      <IconAlertCircle v-if="hasError" :size="14" class="gf__error-icon" />
      {{ hasError ? errorText : '' }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.gf {
  --gf-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --gf-border: #AEBEC4;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-family: 'Manrope', 'Inter', sans-serif;
  color: var(--glacia-ink, var(--glacia-ink));
}

.gf__label {
  font-size: 14px;
  font-weight: 700;
}
.gf__req {
  color: var(--color-critical, #dc2626);
  margin-left: 3px;
}

.gf__wrap {
  position: relative;
}

.gf__box {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 44px;
  padding: 0 16px;
  box-sizing: border-box;
  border-radius: var(--glacia-radius-sm, 12px);
  border: 1px solid var(--gf-border, var(--hairline-strong));
  background: var(--glacia-glass-fill, rgba(var(--glass-rgb), 0.6));
  backdrop-filter: blur(var(--glacia-blur-sm, 14px)) saturate(160%);
  -webkit-backdrop-filter: blur(var(--glacia-blur-sm, 14px)) saturate(160%);
  box-shadow: inset 0 1px 0 var(--glacia-glass-highlight, rgba(var(--glass-rgb), 0.95)), 0 10px 24px -14px rgba(16, 24, 32, 0.2);
  font: inherit;
  color: inherit;
  text-align: left;
  outline: none;
  transition: border-color 200ms ease, box-shadow 280ms ease;
}
.gf__box--area {
  height: auto;
  align-items: flex-start;
  padding: 12px 16px;
}
.gf__box--select {
  padding: 0 12px 0 16px;
  cursor: pointer;
}
.gf:not(.is-active):not(.is-error) .gf__box:hover {
  border-color: #849599;
}
.is-active .gf__box {
  border-color: #2563EB;
  box-shadow: inset 0 1px 0 var(--glacia-glass-highlight, rgba(var(--glass-rgb), 0.95));
}
.is-error .gf__box {
  border-color: var(--color-critical, #dc2626);
  box-shadow: inset 0 1px 0 var(--glacia-glass-highlight, rgba(var(--glass-rgb), 0.95));
}
.is-shake .gf__box {
  animation: gf-shake 380ms ease both;
}

.gf__input {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 14px;
  color: var(--glacia-ink, var(--glacia-ink));
}
.gf__input--area {
  height: 88px;
  resize: none;
  padding-top: 2px;
  font-family: inherit;
}
.gf__input::placeholder {
  color: var(--glacia-ink-dim, #6c7a80);
}

.gf__count {
  position: relative;
  flex: none;
  align-self: flex-end;
  font-family: 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--glacia-ink-dim, #6c7a80);
  opacity: 0;
  transition: opacity 200ms ease;
}
.is-active .gf__count {
  opacity: 1;
}

.gf__value {
  position: relative;
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: var(--glacia-ink-dim, #6c7a80);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gf__value.has-value {
  color: var(--glacia-ink, var(--glacia-ink));
  animation: gf-row 240ms var(--gf-ease) both;
}

.gf__chev {
  position: relative;
  flex: none;
  color: var(--glacia-ink-dim, #6c7a80);
  transition: transform 340ms var(--gf-ease);
}
.is-open .gf__chev {
  transform: rotate(180deg);
}

.gf__sheen {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: var(--glacia-radius-sm, 12px);
  pointer-events: none;
}
.gf__sheen::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 45%;
  background: linear-gradient(100deg, transparent, rgba(var(--glass-rgb), 0.75), transparent);
  transform: translateX(-120%);
}
.gf__sheen.run::before {
  animation: gf-sweep 900ms ease-out both;
}

.gf__error {
  max-height: 0;
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: 12px;
  color: var(--color-critical, #dc2626);
  opacity: 0;
  overflow: hidden;
  transform: translateY(-4px);
  transition: opacity 200ms ease, transform 280ms var(--gf-ease), max-height 280ms var(--gf-ease);
}
.is-error .gf__error {
  max-height: 48px; // room for a two-line message in narrow fields
  opacity: 1;
  transform: none;
}
.gf__error-icon {
  flex: none;
  margin-top: 1px;
}

.gf__menu {
  // Base position is a fallback only — teleported to <body> and actually
  // positioned via the inline `menuStyle` (position: fixed + top/left/width
  // from the trigger's own bounding rect), so it can never be clipped by a
  // scrollable/collapsible modal ancestor.
  position: fixed;
  z-index: 1000;
  padding: 6px;
  border-radius: var(--glacia-radius-md, 20px);
  border: 1px solid var(--glacia-glass-border, rgba(var(--glass-rgb), 0.75));
  background: var(--surface);
  box-shadow: inset 0 1px 0 var(--glacia-glass-highlight, rgba(var(--glass-rgb), 0.95)), 0 12px 32px -8px rgba(16, 24, 32, 0.2);
  transform-origin: 50% 0;
  animation: gf-pop 280ms var(--gf-ease) both;
}
.gf__menu-inner {
  position: relative;
  // Cap to `visibleRows` visible options (42px rows, default 5) via the
  // inline max-height — longer lists scroll internally instead of stretching
  // the menu down the page. The menu is teleported + position: fixed, so it
  // never affects the modal's height.
  max-height: 210px;
  overflow-y: auto;
  scrollbar-width: thin;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--tint), 0.18); border-radius: 999px; }
  &::-webkit-scrollbar-track { background: transparent; }
}
.gf__ind {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 42px;
  border-radius: 10px;
  background: rgba(var(--tint), 0.05);
  transition: transform 260ms var(--gf-ease);
}
.gf__opt {
  position: relative;
  height: 42px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  animation: gf-row 280ms var(--gf-ease) both;
}
.gf__opt span {
  flex: 1;
}
.gf__opt[aria-selected='true'] {
  color: var(--color-primary-dark, #cc1f23);
  font-weight: 700;
}
.gf__opt .gf__cb {
  flex: none;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  // The menu is teleported to <body>, outside .gf, so --gf-border isn't defined here.
  border: 1.5px solid #8A9BA3;
  background: var(--surface);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 140ms ease, border-color 140ms ease;
  &.is-on { background: var(--color-primary, #ff2529); border-color: var(--color-primary, #ff2529); }
}
.gf__opt .gf__cb + span { flex: 1; }
.gf__check {
  flex: none;
  color: var(--color-primary, #ff2529);
  animation: gf-check 300ms var(--gf-ease) both;
}

// Animated "more below" scroll cue — floats over the menu's bottom edge
// while the 5-row-capped list still has rows hidden below. Hides itself
// once scrolled to the bottom.
.gf__more {
  position: absolute;
  left: 50%;
  bottom: 2px;
  color: var(--glacia-ink-dim, #6c7a80);
  pointer-events: none;
  animation: gf-more-bounce 1.2s ease-in-out infinite;
}
@keyframes gf-more-bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.85; }
  50% { transform: translateX(-50%) translateY(4px); opacity: 1; }
}

@keyframes gf-sweep {
  from { transform: translateX(-120%); }
  to { transform: translateX(260%); }
}
@keyframes gf-pop {
  from { opacity: 0; transform: scale(0.94) translateY(-6px); }
}
@keyframes gf-row {
  from { opacity: 0; transform: translateY(-4px); }
}
@keyframes gf-check {
  from { opacity: 0; transform: scale(0.8); }
}
@keyframes gf-shake {
  0%, 100% { transform: none; }
  20% { transform: translateX(-7px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(2px); }
}

@media (prefers-reduced-motion: reduce) {
  .gf *, .gf *::before {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
  }
}
</style>
