<script setup>
import { ref, computed, watch } from 'vue'
import Select from 'primevue/select'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip } from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip)

const props = defineProps({
  data:    { type: Object,  default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const series = [
  { key: 'critical', label: 'Critical', color: '#B91C1C' },
  { key: 'high',     label: 'High',     color: '#EA580C' },
  { key: 'medium',   label: 'Medium',   color: '#F5A623' },
  { key: 'low',      label: 'Low',      color: '#22C55E' },
  { key: 'info',     label: 'Info',     color: '#3B82C4' },
]

const years = computed(() => props.data.years ?? [])
const selectedYear = ref(props.data.years?.[0])

// keep the selection valid if the available years change (e.g. mock data reload)
watch(years, (ys) => {
  if (ys.length && !ys.includes(selectedYear.value)) selectedYear.value = ys[0]
})

const activeYearData = computed(() => props.data.byYear?.[selectedYear.value] ?? {})

const chartData = computed(() => ({
  labels: props.data.months ?? [],
  datasets: series.map((s) => ({
    label: s.label,
    data: activeYearData.value[s.key] ?? [],
    borderColor: s.color,
    backgroundColor: s.color,
    pointBackgroundColor: s.color,
    pointBorderColor: '#fff',
    pointBorderWidth: 1.5,
    pointRadius: 4,
    pointHoverRadius: 5,
    borderWidth: 2,
    borderDash: [6, 4],
    tension: 0.4,
    fill: false,
  })),
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'nearest', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#fff',
      titleColor: '#0F172A',
      bodyColor: '#0F172A',
      borderColor: 'rgba(15, 23, 42, 0.08)',
      borderWidth: 1,
      padding: 10,
      boxPadding: 4,
      usePointStyle: true,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94A3B8', font: { size: 11, weight: '600' } },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(15, 23, 42, 0.06)' },
      ticks: { color: '#94A3B8', font: { size: 11 }, maxTicksLimit: 5 },
    },
  },
}
</script>

<template>
  <div class="severity-trend card">
    <div class="severity-trend__halo">
      <div class="severity-trend__head">
        <div class="severity-trend__heading">
          <h2 class="severity-trend__title">Overall Severity</h2>
          <Select
            v-model="selectedYear"
            :options="years"
            class="severity-trend__year-select"
          />
        </div>

        <div class="severity-trend__controls">
          <div class="severity-trend__legend">
            <span v-for="s in series" :key="s.key" class="legend-pill">
              <span class="legend-pill__dot" :style="{ background: s.color }" />
              {{ s.label }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="severity-trend__body">
      <div v-if="loading" class="severity-trend__empty">Loading…</div>
      <div v-else class="severity-trend__chart">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.severity-trend {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;

  &__halo {
    padding: 20px 22px 16px;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 21px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  &__legend {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__year-select {
    width: 100px;
    height: 42px;
    font-size: 14px;
    align-items: center;
  }

  &__body {
    padding: 0 22px 22px;
  }

  &__chart {
    height: 320px;
  }

  &__empty {
    height: 320px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--glacia-ink-dim);
    font-size: 13px;
  }
}

.legend-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--glacia-radius-pill);
  border: 1px solid var(--glacia-glass-border);
  background: var(--glacia-glass-fill-strong);
  font-size: 14px;
  font-weight: 500;
  color: var(--glacia-ink);
  white-space: nowrap;

  &__dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
  }
}
</style>
