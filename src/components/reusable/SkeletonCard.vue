<script setup>
defineProps({
  rows:   { type: Number, default: 3 },
  height: { type: String, default: '16px' },
})
</script>

<template>
  <div class="skeleton-card">
    <div v-for="i in rows" :key="i" class="skel-row" :style="{ height }" />
  </div>
</template>

<style scoped lang="scss">
.skeleton-card { display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }
.skel-row {
  background: linear-gradient(90deg, var(--surface-3) 25%, var(--surface-3) 50%, var(--surface-3) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
  &:nth-child(2n)   { width: 85%; }
  &:nth-child(3n+1) { width: 70%; }
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
