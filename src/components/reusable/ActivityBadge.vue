<script setup>
import { computed } from 'vue'
import { activityColor, activityLabel } from '@/utils/helpers'

const props = defineProps({
  category: { type: String, required: true },
})

const color = computed(() => activityColor(props.category))
const label = computed(() => activityLabel(props.category))
</script>

<template>
  <span class="activity-badge" :style="{ background: `${color}18`, color }">{{ label }}</span>
</template>

<style scoped lang="scss">
.activity-badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 100px;
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;
}
</style>
