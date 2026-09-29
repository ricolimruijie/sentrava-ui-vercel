<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => [
      { id: 'activation', icon: 'power_settings_new', label: 'Start activation date' },
      { id: 'quota', icon: 'description', label: 'Quota information' },
      { id: 'company', icon: 'account_tree', label: 'Company configuration', submenu: true },
    ],
  },
})
const emit = defineEmits(['select'])

const state = ref('closed') // 'closed' | 'open' | 'closing'
const root = ref(null)
const filterId = `lm-goo-${Math.random().toString(36).slice(2, 8)}`
const CLOSE_MS = 440
let timer

function open() {
  clearTimeout(timer)
  state.value = 'open'
}
function close() {
  if (state.value !== 'open') return
  state.value = 'closing'
  timer = setTimeout(() => (state.value = 'closed'), CLOSE_MS)
}
function toggle() {
  state.value === 'open' ? close() : open()
}
function select(item) {
  emit('select', item)
  close()
}

const onDocClick = (e) => { if (root.value && !root.value.contains(e.target)) close() }
const onKey = (e) => { if (e.key === 'Escape') close() }
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="root" class="lm" :class="{ 'is-open': state === 'open', 'is-closing': state === 'closing' }">
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <defs>
        <filter :id="filterId">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" />
        </filter>
      </defs>
    </svg>

    <div class="lm-goo" :style="{ filter: `url(#${filterId}) drop-shadow(0 18px 24px rgba(16,24,32,.18))` }">
      <span class="lm-dot" />
      <div v-if="state !== 'closed'" class="lm-shape" />
    </div>

    <button class="lm-btn" aria-haspopup="menu" :aria-expanded="state === 'open'" @click="toggle">
      <span class="icon">more_vert</span>
    </button>

    <div v-if="state !== 'closed'" class="lm-list" role="menu">
      <button v-for="item in props.items" :key="item.id" class="lm-item" role="menuitem" @click="select(item)">
        <span class="icon">{{ item.icon }}</span>
        <span class="lm-label">{{ item.label }}</span>
        <span v-if="item.submenu" class="icon lm-chev">chevron_right</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Fonts (add once in index.html):
   https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700&family=Material+Symbols+Outlined */
.lm {
  --coral-500: #FF2E3A; --coral-600: #E6212D; --coral-400: #FF5C66;
  --gray-50: #F4F7FA; --text-1: #101820; --text-3: #6B7785;
  position: relative; width: 60px; height: 60px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.icon { font-family: 'Material Symbols Outlined'; font-size: 22px; line-height: 1; }

.lm-btn {
  position: absolute; left: 0; top: 0; z-index: 2;
  width: 60px; height: 60px; border: 0; border-radius: 999px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: var(--coral-500); color: #fff;
  box-shadow: 0 10px 28px -8px var(--coral-400);
  transition: background 160ms ease;
}
.lm-btn:hover { background: var(--coral-600); }

.lm-goo { position: absolute; left: 0; top: 0; width: 380px; height: 230px; pointer-events: none; }
.lm-dot { position: absolute; left: 0; top: 0; width: 60px; height: 60px; border-radius: 50%; background: var(--coral-500); }

.lm-shape, .lm-list {
  position: absolute; left: 50px; top: 0; width: 304px; height: 184px;
  border-radius: 24px; transform-origin: -20px 30px; /* button centre */
}
.lm-shape { background: #fff; }
.lm-list { z-index: 1; box-sizing: border-box; padding: 8px; display: flex; flex-direction: column; }

.lm-item {
  display: flex; align-items: center; gap: 14px; height: 56px; padding: 0 16px;
  border: 0; border-radius: 16px; background: none; cursor: pointer; text-align: left;
  font: inherit; font-size: 16px; font-weight: 500; color: var(--text-1);
  transition: background 160ms ease;
}
.lm-item:hover { background: var(--gray-50); }
.lm-label { flex: 1; }
.lm-chev { font-size: 20px; color: var(--text-3); }

.is-open .lm-shape    { animation: lm-grow 760ms cubic-bezier(.3,.8,.35,1) both, lm-tint 760ms ease both; }
.is-open .lm-list     { animation: lm-grow 760ms cubic-bezier(.3,.8,.35,1) both, lm-show 760ms ease both; }
.is-closing .lm-shape { animation: lm-close 440ms cubic-bezier(.55,0,.8,.4) both, lm-tint 440ms ease reverse both; }
.is-closing .lm-list  { animation: lm-close 440ms cubic-bezier(.55,0,.8,.4) both, lm-show 440ms ease reverse both; pointer-events: none; }

@keyframes lm-grow  { 0% { transform: scale(.06,.1) } 45% { transform: scale(1.05,.94) } 65% { transform: scale(.97,1.04) } 82% { transform: scale(1.01,.99) } 100% { transform: scale(1) } }
@keyframes lm-close { 0% { transform: scale(1) } 100% { transform: scale(.06,.1) } }
@keyframes lm-tint  { 0%, 30% { background-color: var(--coral-500) } 100% { background-color: #fff } }
@keyframes lm-show  { 0%, 28% { opacity: 0 } 70%, 100% { opacity: 1 } }

@media (prefers-reduced-motion: reduce) {
  .lm-shape, .lm-list { animation-duration: 1ms !important; }
}
</style>
