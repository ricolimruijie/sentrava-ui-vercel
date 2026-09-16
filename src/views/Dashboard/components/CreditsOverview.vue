<script setup>
import { computed } from 'vue'
import { Doughnut, Bar } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { IconCoin } from '@tabler/icons-vue'
import { formatNumber } from '@/utils/helpers'

ChartJS.register(ArcElement, Tooltip, CategoryScale, LinearScale, BarElement)

const props = defineProps({
  data:    { type: Object,  default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const donutData = computed(() => ({
  labels: ['Used', 'Remaining'],
  datasets: [{
    data: [props.data.used ?? 0, props.data.remaining ?? 0],
    backgroundColor: ['#FF2529', '#f0f0f0'],
    borderWidth: 0,
  }],
}))

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed.toLocaleString()}` } },
  },
}

const barData = computed(() => ({
  labels: props.data.monthlyUsage?.map(m => m.month) ?? [],
  datasets: [{
    data: props.data.monthlyUsage?.map(m => m.used) ?? [],
    backgroundColor: '#FF252960',
    hoverBackgroundColor: '#FF2529',
    borderRadius: 6,
  }],
}))

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.parsed.y.toLocaleString()} credits` } } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { ticks: { font: { size: 10 }, callback: (v) => formatNumber(v) } },
  },
}

const usedPct = computed(() =>
  props.data.purchased
    ? Math.round((props.data.used / props.data.purchased) * 100)
    : 0
)
</script>

<template>
  <div class="card">
    <div class="panel-head">
      <IconCoin :size="18" class="panel-icon" />
      <h3 class="panel-title">Credits Overview</h3>
    </div>

    <template v-if="loading">
      <div class="skel skel--donut" />
    </template>

    <template v-else>
      <div class="credits-layout">
        <div class="donut-wrap">
          <div class="donut-chart">
            <Doughnut :data="donutData" :options="donutOptions" />
            <div class="donut-center">
              <span class="donut-center__pct">{{ usedPct }}%</span>
              <span class="donut-center__label">used</span>
            </div>
          </div>
        </div>

        <div class="credit-stats">
          <div class="cstat">
            <span class="cstat__label">Purchased</span>
            <span class="cstat__value">{{ (data.purchased ?? 0).toLocaleString() }}</span>
          </div>
          <div class="cstat">
            <span class="cstat__label">Used</span>
            <span class="cstat__value text-danger">{{ (data.used ?? 0).toLocaleString() }}</span>
          </div>
          <div class="cstat">
            <span class="cstat__label">Remaining</span>
            <span class="cstat__value text-success">{{ (data.remaining ?? 0).toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <p class="monthly-label">Monthly Usage</p>
      <div class="bar-wrap">
        <Bar :data="barData" :options="barOptions" />
      </div>
    </template>
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

.panel-head { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.panel-icon { color: var(--color-text-secondary); }
.panel-title { font-size: var(--text-base); font-weight: 700; color: var(--color-text); }

.credits-layout {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.donut-wrap {
  flex-shrink: 0;
  width: 110px;
}

.donut-chart {
  position: relative;
  width: 110px;
  height: 110px;
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  &__pct {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text);
    line-height: 1;
  }

  &__label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
}

.credit-stats { flex: 1; display: flex; flex-direction: column; gap: 10px; }

.cstat {
  display: flex;
  justify-content: space-between;
  align-items: center;

  &__label { font-size: var(--text-sm); color: var(--color-text-secondary); }
  &__value { font-size: var(--text-sm); font-weight: 700; color: var(--color-text); }
}

.text-danger  { color: #DC2626; }
.text-success { color: #16A34A; }

.monthly-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.bar-wrap { height: 100px; }

.skel--donut {
  height: 200px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>
