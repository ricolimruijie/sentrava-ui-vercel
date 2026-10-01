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

<style scoped lang="scss" src="./GlassField.scss"></style>
