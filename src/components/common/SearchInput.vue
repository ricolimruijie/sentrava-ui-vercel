<script setup>
import { ref, watch, nextTick } from 'vue'
import { IconSearch } from '@tabler/icons-vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search…' },
  width: { type: String, default: '240px' },
})
const emit = defineEmits(['update:modelValue'])

// Starts expanded when a value already exists (e.g. restored from a route
// query) — a collapsed icon would otherwise hide an active search silently.
const open = ref(!!props.modelValue)
const inputRef = ref(null)

watch(() => props.modelValue, (v) => { if (v) open.value = true })

function setOpen(next) {
  open.value = next
  if (next) nextTick(() => inputRef.value?.focus())
}

function onIconClick() {
  setOpen(!open.value)
}
function onBlur() {
  if (!props.modelValue) setOpen(false)
}
function onKeydown(e) {
  if (e.key === 'Escape') {
    emit('update:modelValue', '')
    inputRef.value?.blur()
    setOpen(false)
  }
}
function onGlobalKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    setOpen(true)
  }
}
</script>

<template>
  <div class="search" :class="{ 'is-open': open }" :style="{ '--search-w': width }" @keydown.window="onGlobalKeydown">
    <button type="button" class="search__icon" aria-label="Search" :aria-expanded="open" @click="onIconClick">
      <IconSearch :size="16" />
    </button>
    <input
      ref="inputRef"
      class="search__input"
      type="search"
      :placeholder="placeholder"
      :value="modelValue"
      :tabindex="open ? 0 : -1"
      @input="emit('update:modelValue', $event.target.value)"
      @blur="onBlur"
      @keydown="onKeydown"
    />
  </div>
</template>

<style scoped lang="scss">
.search {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 36px;
  max-width: 100%;
  box-sizing: border-box;
  padding: 8px;
  border: 1px solid var(--glacia-glass-border, var(--hairline));
  border-radius: 999px;
  background: var(--glacia-glass-fill-strong, var(--surface-2));
  overflow: hidden;
  flex-shrink: 0;
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);

  &.is-open {
    width: var(--search-w);
  }
}

.search__icon {
  flex: none;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--glacia-ink-dim, #6C7A80);
  transition: color 0.15s ease;

  &:hover { color: var(--glacia-ink, var(--glacia-ink)); }
}

.search__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 13px;
  color: var(--glacia-ink, var(--glacia-ink));
  opacity: 0;
  transition: opacity 0.15s ease;

  &::placeholder { color: var(--glacia-ink-dim, #6C7A80); }

  // Chrome/Safari draw a native cancel (×) button on type="search" once it
  // has a value — hide it since the pill's own collapse/Escape covers that.
  &::-webkit-search-cancel-button { -webkit-appearance: none; }
}
.search.is-open .search__input {
  opacity: 1;
  transition-delay: 0.08s;
}

@media (prefers-reduced-motion: reduce) {
  .search, .search__input { transition: none; }
}
</style>
