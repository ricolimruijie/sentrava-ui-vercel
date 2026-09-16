<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
})

const label = computed(() => {
  const map = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', accepted: 'Accepted' }
  return map[props.status] ?? props.status
})
</script>

<template>
  <span class="status-badge" :class="`status-${status}`">{{ label }}</span>
</template>

<style scoped lang="scss">
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 100px;
  font-size: var(--text-xs);
  font-weight: 600;

  &.status-open        { background: #fef2f2; color: #DC2626; }
  &.status-in_progress { background: #eff6ff; color: #2563EB; }
  &.status-resolved    { background: #f0fdf4; color: #16A34A; }
  &.status-accepted    { background: #f9fafb; color: #6B7280; }
}
</style>
