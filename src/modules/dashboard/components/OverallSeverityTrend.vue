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


const serviceNames = [
  { key: 'di', label: 'Domain Inspection' },
  { key: 'n',  label: 'Network' },
  { key: 'wa', label: 'Web Application' },
  { key: 'sc', label: 'Source Code' },
]

// Tooltip state, driven by Chart.js through `externalTooltip`.
const tip = ref({ visible: false, x: 0, y: 0, flip: false })
const CHART_H = 320
const TIP_HALF_H = 96 // keeps the card inside the chart vertically

function externalTooltip({ chart, tooltip }) {
  const point = tooltip.dataPoints?.[0]
  if (tooltip.opacity === 0 || !point) {
    tip.value = { ...tip.value, visible: false }
    return
  }
  const sev = series[point.datasetIndex]
  const total = point.raw
  const b = activeYearData.value.services?.[sev.key]?.[point.dataIndex]
  tip.value = {
    visible: true,
    // Open to the right of the dot, flipping left past the chart's midpoint.
    flip: tooltip.caretX > chart.width * 0.6,
    x: tooltip.caretX,
    y: Math.min(Math.max(tooltip.caretY, TIP_HALF_H), CHART_H - TIP_HALF_H),
    month: point.label,
    year: selectedYear.value,
    sev: sev.label,
    color: sev.color,
    total,
    rows: b
      ? serviceNames.map((sv) => ({ ...sv, value: b[sv.key], pct: total ? Math.round((b[sv.key] / total) * 100) : 0 }))
      : [],
  }
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'nearest', intersect: false },
  plugins: {
    legend: { display: false },
    // Custom HTML tooltip (see `tip` below) — the built-in canvas one can't
    // lay out a per-service breakdown nicely.
    tooltip: { enabled: false, external: externalTooltip },
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

        <div
          class="sev-tip"
          :class="{ 'sev-tip--on': tip.visible, 'sev-tip--flip': tip.flip }"
          :style="{ left: `${tip.x}px`, top: `${tip.y}px`, '--tip-color': tip.color }"
          aria-hidden="true"
        >
          <div class="sev-tip__head">
            <span class="sev-tip__period">{{ tip.month }} {{ tip.year }}</span>
            <span class="sev-tip__sev">
              <span class="sev-tip__dot" />
              {{ tip.sev }}
            </span>
          </div>
          <div class="sev-tip__total">
            <strong>{{ tip.total }}</strong>
            <span>total findings</span>
          </div>
          <ul v-if="tip.rows?.length" class="sev-tip__rows">
            <li v-for="r in tip.rows" :key="r.key" class="sev-tip__row">
              <span class="sev-tip__name">{{ r.label }}</span>
              <span class="sev-tip__val">{{ r.value }}</span>
              <span class="sev-tip__bar"><span :style="{ width: `${r.pct}%` }" /></span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./OverallSeverityTrend.scss"></style>
