<script setup>
import { computed } from 'vue'
import { SEVERITY_COLORS } from '@/utils/constants'

const props = defineProps({
  severity: { type: String, required: true },
  small:    { type: Boolean, default: false },
})

const color = computed(() => SEVERITY_COLORS[props.severity] ?? '#6B7280')
const label = computed(() => props.severity.charAt(0).toUpperCase() + props.severity.slice(1))
</script>

<template>
  <span class="severity-badge" :class="[`sev-${severity}`, { 'severity-badge--sm': small }]">
    {{ label }}
  </span>
</template>

<style scoped lang="scss">
.severity-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 100px;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;

  &--sm { padding: 1px 7px; font-size: 0.6rem; }

  &.sev-critical { background: #fef2f2; color: #DC2626; }
  &.sev-high     { background: #fff7ed; color: #EA580C; }
  &.sev-medium   { background: #fffbeb; color: #D97706; }
  &.sev-low      { background: #eff6ff; color: #2563EB; }
  &.sev-info     { background: var(--surface-2); color: var(--ink-3); }
}
</style>
