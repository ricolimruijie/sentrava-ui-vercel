<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { IconChevronDown, IconX } from '@tabler/icons-vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: null },
  options: { type: Array, required: true }, // [{ value, label }]
  placeholder: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

const rootRef = ref(null)
const open = ref(false)
const picking = ref(false)
const pickingValue = ref(null)

const selectedOption = computed(() => props.options.find((o) => o.value === props.modelValue) ?? null)
const displayLabel = computed(() => selectedOption.value?.label ?? props.placeholder)

function toggleOpen() {
  open.value = !open.value
}

function onIconClick() {
  if (selectedOption.value) {
    emit('update:modelValue', null)
    open.value = false
  } else {
    open.value = !open.value
  }
}

function pick(opt) {
  if (picking.value) return
  picking.value = true
  pickingValue.value = opt.value
  setTimeout(() => {
    emit('update:modelValue', opt.value)
    open.value = false
    picking.value = false
    pickingValue.value = null
  }, 320)
}

function handleClickOutside(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div ref="rootRef" class="filter-wrap">
    <button type="button" class="filter-trigger" @click="toggleOpen">
      <span class="filter-label" :class="{ 'filter-label--selected': !!selectedOption }">{{ displayLabel }}</span>
      <span class="filter-icon" @click.stop="onIconClick">
        <Transition name="icon-morph">
          <IconX v-if="selectedOption" key="x" :size="17" class="filter-icon__glyph" />
          <IconChevronDown
            v-else
            key="chevron"
            :size="17"
            class="filter-icon__glyph"
            :class="{ 'filter-icon__chevron--open': open }"
          />
        </Transition>
      </span>
    </button>

    <div v-show="open" class="filter-panel" :class="{ 'filter-panel--open': open }">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="filter-item"
        :class="{ 'filter-item--picking': pickingValue === opt.value }"
        @click="pick(opt)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.filter-wrap {
  position: relative;
  width: 220px;
  flex-shrink: 0;
}

.filter-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  width: 100%;
  height: 38px;
  padding: 0 18px;
  box-sizing: border-box;
  border-radius: 10px;
  border: 1px solid #D3DEE2;
  background: #fff;
  cursor: pointer;
  box-sizing: border-box;
  // Buttons default to text-align:center in the browser UA stylesheet,
  // which .filter-label would otherwise inherit.
  text-align: left;
  transition: border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: #AEBEC4;
    transform: translateY(-1px);
  }
}

.filter-label {
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 0.95rem;
  font-weight: 400;
  color: #849599;
  transition: color 0.15s ease;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &--selected {
    color: #101820;
    font-weight: 600;
  }
}

.filter-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  flex-shrink: 0;
  color: #849599;
  transition: color 0.15s ease;

  &:hover {
    color: #47565E;
  }

  &__glyph {
    transition: transform 0.2s ease;
  }

  &__chevron--open {
    transform: rotate(180deg);
  }
}

.icon-morph-enter-active,
.icon-morph-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.icon-morph-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}
.icon-morph-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}

.filter-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 220px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 16px 36px -8px rgba(16, 24, 32, 0.24);
  border: 1px solid #EAF0F2;
  padding: 10px;
  // Matches the app's dropdown/menu tier (see action-menu, user-menu) so it
  // always renders above page content — needed now that this component is
  // also used inside the sticky navbar (AppNavbar's Company-page filter),
  // where its old z-index:50 lost to unrelated page buttons.
  z-index: 200;
  box-sizing: border-box;
  transform-origin: top center;

  &--open {
    animation: filter-elastic-open 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease, padding-left 0.15s ease;
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 0.8rem;
  text-align: left;
  color: #101820;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    background: #F7FAFB;
    padding-left: 12px;
  }

  &--picking {
    animation: filter-pick-flash 0.32s ease;
  }
}

@keyframes filter-elastic-open {
  0%   { opacity: 0; transform: scale(0.9) translateY(-6px); }
  60%  { opacity: 1; transform: scale(1.03) translateY(0); }
  100% { transform: scale(1); }
}

@keyframes filter-pick-flash {
  0%   { background: transparent; transform: scale(1); }
  35%  { background: #EAF0F2; transform: scale(1.03); }
  100% { background: transparent; transform: scale(1); }
}
</style>
