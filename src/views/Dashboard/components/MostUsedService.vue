<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps({
  data:    { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

const COLORS = ['#FF2529', '#3B82F6', '#0D9488', '#D97706', '#7C3AED']

const chartData = computed(() => ({
  labels: props.data.map(d => d.label),
  datasets: [{
    data: props.data.map(d => d.scans),
    backgroundColor: COLORS,
    borderRadius: 8,
    borderSkipped: false,
  }],
}))

const chartOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (c) => ` ${c.parsed.x} scans` } },
  },
  scales: {
    x: { grid: { color: '#f0f0f0' }, ticks: { font: { size: 11 } } },
    y: { grid: { display: false },   ticks: { font: { size: 11 } } },
  },
}
</script>

<template>
  <div class="card">
    <h3 class="panel-title">Most Used Service</h3>

    <template v-if="loading">
      <div class="skel skel--chart" />
    </template>

    <div v-else class="chart-wrap">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 20px;
  box-shadow: var(--shadow-card);
}
.panel-title { font-size: var(--text-base); font-weight: 700; color: var(--color-text); margin-bottom: 16px; }
.chart-wrap { height: 180px; }
.skel {
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 8px;
  &--chart { height: 180px; }
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>
