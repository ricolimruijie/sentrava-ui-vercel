<script setup>
import { ref, computed } from 'vue'

// RelatedDomains — first related domain + a "+N" badge; hovering the badge
// shows every other related domain in a tooltip.
// <RelatedDomains :domains="['protergo.id', 'www.protergo.id', 'api.protergo.id']" />
const props = defineProps({
  domains: { type: Array, default: () => [] },
})

const first = computed(() => props.domains[0] ?? '—')
const others = computed(() => props.domains.slice(1))

// The tooltip opens to the right of the badge; it is teleported to <body> and positioned from the badge's rect so
// table cells (overflow: hidden for truncation) can't clip it.
const badgeRef = ref(null)
const open = ref(false)
const tipStyle = ref({})

function show() {
  const el = badgeRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  tipStyle.value = { top: `${r.top + r.height / 2}px`, left: `${r.right + 10}px` }
  open.value = true
}
function hide() {
  open.value = false
}
</script>

<template>
  <span class="rd">
    <span class="rd__name">{{ first }}</span>
    <span
      v-if="others.length"
      ref="badgeRef"
      class="rd__badge"
      tabindex="0"
      @mouseenter="show"
      @mouseleave="hide"
      @focus="show"
      @blur="hide"
    >+{{ others.length }}</span>

    <Teleport to="body">
      <div v-if="open" class="rd__tip" :style="tipStyle" role="tooltip">
        <span class="rd__tip-title">Also related to</span>
        <span v-for="d in others" :key="d" class="rd__tip-item">{{ d }}</span>
      </div>
    </Teleport>
  </span>
</template>

<style scoped lang="scss">
.rd {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  &__badge {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(255, 37, 41, 0.1);
    color: var(--glacia-red);
    font-size: 11.5px;
    font-weight: 700;
    line-height: 1.4;
    cursor: default;
    outline: none;

    &:hover,
    &:focus-visible { background: rgba(255, 37, 41, 0.18); }
  }

  &__tip {
    position: fixed;
    z-index: 1100;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--surface);
    color: var(--glacia-ink, var(--glacia-ink));
    border: 1px solid var(--glacia-glass-border, #E3E8EC);
    box-shadow: 0 12px 32px -8px rgba(16, 24, 32, 0.22);
    font-size: 12px;
    pointer-events: none;
    white-space: nowrap;

    &::before {
      content: '';
      position: absolute;
      left: -5px;
      top: 50%;
      width: 8px;
      height: 8px;
      background: var(--surface);
      border-bottom: 1px solid var(--glacia-glass-border, #E3E8EC);
      border-left: 1px solid var(--glacia-glass-border, #E3E8EC);
      transform: translateY(-50%) rotate(45deg);
    }
  }

  &__tip-title {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--glacia-ink-dim, #6c7a80);
  }

  &__tip-item {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 12px;
  }
}
</style>
