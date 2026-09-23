<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { IconChevronDown, IconX, IconCheck } from '@tabler/icons-vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: null },
  options: { type: Array, required: true }, // [{ value, label }]
  placeholder: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

const rootRef = ref(null)
const open = ref(false)

const selectedOption = computed(() => props.options.find((o) => o.value === props.modelValue) ?? null)
const hasValue = computed(() => !!selectedOption.value)
const displayValue = computed(() => selectedOption.value?.label ?? props.placeholder)

function toggleOpen() {
  open.value = !open.value
}

function onChevronClick() {
  if (hasValue.value) {
    emit('update:modelValue', null)
    open.value = false
  } else {
    toggleOpen()
  }
}

function pick(opt) {
  emit('update:modelValue', opt.value)
  open.value = false
}

function handleClickOutside(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) open.value = false
}
function handleKeydown(e) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div ref="rootRef" class="dd" :class="{ 'is-open': open, 'has-value': hasValue }">
    <button type="button" class="dd__trigger" aria-haspopup="listbox" :aria-expanded="open" @click="toggleOpen">
      <span class="dd__text">
        <span class="dd__title">{{ placeholder }}</span>
        <span class="dd__value">{{ displayValue }}</span>
      </span>
      <span class="dd__chev" @click.stop="onChevronClick">
        <IconChevronDown :size="18" class="dd__chev-icon dd__chev-down" />
        <IconX :size="18" class="dd__chev-icon dd__chev-clear" />
      </span>
    </button>

    <div class="dd__menu" role="listbox">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="dd__opt"
        role="option"
        :aria-selected="opt.value === modelValue"
        @click="pick(opt)"
      >
        <span>{{ opt.label }}</span>
        <IconCheck :size="14" class="dd__opt-check" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dd {
  position: relative;
  width: 260px;
  flex-shrink: 0;
  font-family: 'Manrope', 'Inter', sans-serif;
}

.dd__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 10px 18px;
  box-sizing: border-box;
  border: 1px solid #D3DEE2;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  font: inherit;
  box-shadow: 0 2px 6px -2px rgba(16, 24, 32, 0.08);
  transition: background 0.18s ease, padding 0.22s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s ease;
}
.dd:not(.has-value) .dd__trigger:hover {
  background: rgba(255, 37, 41, 0.06);
  border-color: #AEBEC4;
}
.dd.has-value .dd__trigger {
  padding-top: 6px;
  padding-bottom: 6px;
}

.dd__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.dd__title {
  font-size: 10.5px;
  font-weight: 700;
  line-height: 13px;
  color: #849599;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  max-height: 0;
  opacity: 0;
  transform: translateY(6px);
  transition: max-height 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s ease, transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.dd.has-value .dd__title {
  max-height: 13px;
  opacity: 1;
  transform: none;
}

.dd__value {
  font-size: 0.82rem;
  line-height: 18px;
  color: #849599;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s ease;
}
.dd.has-value .dd__value {
  color: #101820;
}

.dd__chev {
  position: relative;
  width: 18px;
  height: 18px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dd__chev-icon {
  position: absolute;
  inset: 0;
  color: #849599;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, color 0.15s ease;
}
.dd__chev:hover .dd__chev-icon { color: #47565E; }
.dd__chev-down {
  transform: rotate(0) scale(1);
  opacity: 1;
}
.dd__chev-clear {
  transform: rotate(-90deg) scale(0.5);
  opacity: 0;
}
.dd.is-open .dd__chev-down { transform: rotate(180deg); }
.dd.has-value .dd__chev-down { transform: rotate(90deg) scale(0.5); opacity: 0; }
.dd.has-value .dd__chev-clear { transform: none; opacity: 1; }

.dd__menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  min-width: 260px;
  z-index: 200;
  display: none;
  padding: 6px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 16px 36px -10px rgba(16, 24, 32, 0.24);
  border: 1px solid #EAF0F2;
  box-sizing: border-box;
}
.dd.is-open .dd__menu { display: block; }

.dd__opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-radius: 9px;
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
  color: #101820;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.15s ease;

  &:hover {
    transform: scale(1.015);
    box-shadow: 0 4px 12px -4px rgba(16, 24, 32, 0.14);
  }
  &[aria-selected="true"] {
    background: rgba(255, 37, 41, 0.06);
  }
}
.dd__opt-check {
  flex: none;
  color: var(--glacia-red, #ff2529);
  visibility: hidden;
}
.dd__opt[aria-selected="true"] .dd__opt-check {
  visibility: visible;
}

.dd.is-open .dd__opt {
  animation: dd-fan-in 0.2s ease-out both;
}
.dd.is-open .dd__opt:nth-child(2) { animation-delay: 0.05s; }
.dd.is-open .dd__opt:nth-child(3) { animation-delay: 0.1s; }
.dd.is-open .dd__opt:nth-child(4) { animation-delay: 0.15s; }
.dd.is-open .dd__opt:nth-child(5) { animation-delay: 0.2s; }

@keyframes dd-fan-in {
  from { opacity: 0; transform: translateY(-4px) scale(0.97); }
  to   { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .dd * { transition: none !important; animation: none !important; }
}
</style>
