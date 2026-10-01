<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps({
  data:    { type: Object,  default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const chartData = computed(() => ({
  labels: props.data.labels ?? [],
  datasets: [
    { label: 'Avg (min)',  data: props.data.avgMinutes ?? [], backgroundColor: '#3B82F6', borderRadius: 6 },
    { label: 'P95 (min)',  data: props.data.p95Minutes ?? [], backgroundColor: '#BFDBFE', borderRadius: 6 },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
    tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${c.parsed.y} min` } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { ticks: { font: { size: 11 } } },
  },
}
</script>

<template>
  <div class="card">
    <h3 class="panel-title">Scan Duration Overview</h3>
    <template v-if="loading">
      <div class="skel" />
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
.chart-wrap { height: 200px; }
.skel {
  height: 200px;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--surface-3) 25%, var(--surface-3) 50%, var(--surface-3) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>
