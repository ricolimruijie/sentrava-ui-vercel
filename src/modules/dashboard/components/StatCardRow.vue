<script setup>
import StatCard from '@/components/common/StatCard.vue'

defineProps({
  stats:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <div class="stat-row">
    <template v-if="loading">
      <StatCard
        v-for="i in 6" :key="i"
        label="" :value="0" loading
      />
    </template>
    <template v-else>
      <StatCard
        v-for="s in stats"
        :key="s.id"
        :label="s.label"
        :value="s.value"
        :change="s.change"
        :changePct="s.changePct"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.stat-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @include below($bp-xl) {
    grid-template-columns: repeat(3, 1fr);
  }

  @include below($bp-lg) {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
