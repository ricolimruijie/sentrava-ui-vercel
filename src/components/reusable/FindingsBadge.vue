<script setup>
import { ref, computed } from 'vue'

// FindingsBadge — grey count badge for a "Total Findings" cell. Hovering it
// shows a tooltip with the count for every severity.
// <FindingsBadge :total="100" :counts="{ critical: 2, high: 9, medium: 21, low: 14, info: 6 }" />
const props = defineProps({
  total: { type: [Number, String], default: 0 },
  counts: { type: Object, default: () => ({}) },
  // Same badge, but no breakdown tooltip (e.g. a failed scan showing "-").
  noTip: { type: Boolean, default: false },
})

const LEVELS = [
  { key: 'critical', label: 'Critical', color: '#B91C1C' },
  { key: 'high', label: 'High', color: '#EF4444' },
  { key: 'medium', label: 'Medium', color: '#F59E0B' },
  { key: 'low', label: 'Low', color: '#22C55E' },
  { key: 'info', label: 'Info', color: '#38BDF8' },
]
const rows = computed(() => LEVELS.map((l) => ({ ...l, count: props.counts?.[l.key] ?? 0 })))

// Opens to the right of the badge. Teleported to <body> and placed from the badge's rect so table cells
// (overflow: hidden) can't clip it.
const badgeRef = ref(null)
const open = ref(false)
const tipStyle = ref({})

function show() {
  const el = badgeRef.value
  if (!el || props.noTip) return
  const r = el.getBoundingClientRect()
  tipStyle.value = { top: `${r.top + r.height / 2}px`, left: `${r.right + 10}px` }
  open.value = true
}
function hide() {
  open.value = false
}
</script>

<template>
  <span
    ref="badgeRef"
    class="fb"
    tabindex="0"
    @mouseenter="show"
    @mouseleave="hide"
    @focus="show"
    @blur="hide"
  >
    {{ total }}
    <Teleport to="body">
      <div v-if="open" class="fb__tip" :style="tipStyle" role="tooltip">
        <span class="fb__tip-title">Findings by severity</span>
        <span v-for="r in rows" :key="r.key" class="fb__row">
          <i class="fb__dot" :style="{ background: r.color }" />
          <span class="fb__label">{{ r.label }}</span>
          <b class="fb__count">{{ r.count }}</b>
        </span>
      </div>
    </Teleport>
  </span>
</template>

<style scoped lang="scss">
.fb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px; // same width as a two-digit count, so a "-" badge lines up
  height: 28px;
  padding: 0 9px;
  border-radius: 8px;
  background: #ECEEF0;
  border: 1px solid #d8dee4;
  color: #5C6470;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: default;
  outline: none;

  &:hover,
  &:focus-visible { background: #E2E6EA; }

  &__tip {
    position: fixed;
    z-index: 1100;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 170px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #fff;
    color: var(--glacia-ink, #101820);
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
      background: #fff;
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

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__label { flex: 1; }

  &__count {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-weight: 700;
  }
}
</style>
