<script setup>
import { computed, ref } from 'vue'
import { IconChevronRight, IconShieldSearch } from '@tabler/icons-vue'
import VulnerabilityDetailModal from '@/components/common/VulnerabilityDetailModal.vue'
import { useColumnWidths } from '@/composables/useColumnWidths'

const props = defineProps({
  items:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

// Column widths follow the same rules as every table (components/common/tableLayout.js): Severity and
// Vulnerability Cycle are fixed-format, the three text columns are capped at a realistic long value, the
// arrow column is constant.
const wrapRef = ref(null)
const COLS = [
  { kind: 'text', base: 130, max: 280 },
  { kind: 'text', base: 130, max: 260 },
  { kind: 'text', base: 130, max: 260 },
  { kind: 'fixed', base: 112 },
  { kind: 'fixed', base: 148 },
  { kind: 'action', base: 58 },
]
const { widths, minWidth } = useColumnWidths(wrapRef, () => COLS)
const colStyle = (i) => (widths.value ? { width: `${widths.value[i]}px` } : COLS[i].kind === 'text' ? null : { width: `${COLS[i].base}px` })

const filteredItems = computed(() => {
  const rank = { critical: 0, high: 1 }
  return (props.items ?? [])
    .filter((v) => ['critical', 'high'].includes((v.severity ?? '').toLowerCase()))
    .slice()
    .sort((a, b) => (rank[a.severity.toLowerCase()] ?? 2) - (rank[b.severity.toLowerCase()] ?? 2))
})

const sev = Object.fromEntries(['critical', 'high', 'medium', 'low', 'info'].map((k) => [k, {
  label: k[0].toUpperCase() + k.slice(1),
  color: `var(--sev-${k}-ink)`,
  bg: `color-mix(in srgb, var(--glacia-sev-${k}) 13%, transparent)`,
}]))

function s(k) { return sev[k?.toLowerCase()] ?? { label: k, color: 'var(--sev-info-ink)', bg: 'color-mix(in srgb, var(--glacia-sev-info) 13%, transparent)' } }

// Same cycle semantics as the detail views (WebAppDetailView).
const cyclePill = {
  Active:           { bg: 'var(--red-tint)', color: 'var(--red-ink)' },
  Fixing:           { bg: 'var(--amber-tint)', color: 'var(--amber-ink)' },
  Mitigated:        { bg: 'var(--green-tint)', color: 'var(--green-ink)' },
  Tolerated:        { bg: 'var(--cyan-tint)', color: 'var(--cyan-ink)' },
  'False Positive': { bg: 'var(--surface-3)', color: 'var(--ink-3)' },
}

const showDetailModal = ref(false)
const selectedFinding = ref(null)

function openDetail(item) {
  selectedFinding.value = { ...item, severity: item.severity?.toLowerCase(), component: item.affectedAsset, service: item.services }
  showDetailModal.value = true
}

function c(cycle) { return cyclePill[cycle] ?? { bg: 'var(--surface-3)', color: 'var(--ink-3)' } }
</script>

<template>
  <div class="vuln card">
    <div class="vuln__halo">
      <h2 class="vuln__title">Top Vulnerabilities</h2>
    </div>

    <div class="vuln__body">
      <p class="vuln__caption">Critical security weaknesses identified across your assets, prioritized by severity.</p>

      <div v-if="!loading && !filteredItems.length" class="vuln__empty">
        <span class="vuln__empty-icon"><IconShieldSearch :size="30" stroke-width="1.6" /></span>
        <span class="vuln__empty-text">No vulnerabilities found</span>
      </div>

      <div v-else ref="wrapRef" class="vuln__wrap">
        <table class="vtable" :style="{ minWidth: `${minWidth}px` }">
          <colgroup><col v-for="(c, i) in COLS" :key="i" :style="colStyle(i)" /></colgroup>
          <thead>
            <tr>
              <th>Vulnerability</th>
              <th>Asset</th>
              <th>Service</th>
              <th class="text-center vtable__sev">Severity</th>
              <th class="text-center vtable__cycle">Vulnerability Cycle</th>
              <th class="vtable__arrow"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" class="vtable__empty">Loading…</td></tr>
            <tr v-for="item in filteredItems" :key="item.id" class="vtable__row">
              <td class="vtable__name" :title="item.name">{{ item.name }}</td>
              <td class="vtable__asset" :title="item.affectedAsset">{{ item.affectedAsset }}</td>
              <td class="vtable__svc" :title="item.services">{{ item.services }}</td>
                <td class="text-center vtable__sev">
                  <span
                    class="sev-badge"
                    :style="{ background: s(item.severity).bg, color: s(item.severity).color }"
                  >{{ s(item.severity).label }}</span>
                </td>
                <td class="text-center vtable__cycle">
                  <span
                    class="cycle-pill"
                    :style="{ background: c(item.cycle).bg, color: c(item.cycle).color }"
                  >{{ item.cycle }}</span>
                </td>
              <td class="vtable__arrow">
                <button type="button" class="arrow-btn" aria-label="View vulnerability details" @click="openDetail(item)"><IconChevronRight :size="11" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <VulnerabilityDetailModal v-model="showDetailModal" :item="selectedFinding" summary-strip hide-line-of-code hide-code-snippet />
  </div>
</template>

<style scoped lang="scss">
.vuln {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;

  &__halo {
    padding: 20px 22px 16px;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
    min-height: 0;
    padding: 0 22px 22px;
  }

  &__caption {
    margin: 0;
    font-size: var(--fs-md);
    color: var(--glacia-ink-dim);
  }

  &__wrap {
    overflow: auto;
    flex: 1;
    min-height: 0;
    background: none;
  }

  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 20px;
    text-align: center;
  }

  &__empty-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 2px dashed rgba(var(--tint), 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--glacia-ink-dim);
  }

  &__empty-text {
    font-size: var(--fs-md);
    font-weight: 600;
    color: var(--glacia-ink);
  }
}

.vtable {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-md);
  // Same rules as every other table (see DataTable): fixed layout, 14px cell padding, fixed-format
  // columns (severity, cycle, arrow) have an explicit px width, text columns share the rest and are
  // cut off with "...".
  table-layout: fixed;

  thead tr {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  th {
    text-align: left;
    padding: 6px 14px;
    font-size: var(--fs-xs);
    font-weight: 600;
    line-height: 1.3;
    color: var(--glacia-ink-dim);
    border-bottom: 1px solid var(--glacia-glass-border);
    // Headers stay on one line and are never cut off.
    white-space: nowrap;
    overflow: visible;
  }

  td {
    padding: 14px;
    border-bottom: 1px solid var(--glacia-glass-border);
    vertical-align: middle;
    color: var(--glacia-ink);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__row:last-child td { border-bottom: none; }
  &__row:hover td { background: var(--glacia-bg); }

  &__empty {
    text-align: center;
    padding: 28px !important;
    color: var(--glacia-ink-dim);
  }

}

.vtable th.text-center { text-align: center; }
.text-center { text-align: center; }

.sev-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: var(--glacia-radius-pill);
  font-size: var(--fs-sm);
  font-weight: 700;
  white-space: nowrap;
}

.cycle-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--glacia-radius-pill);
  font-size: var(--fs-sm);
  font-weight: 700;
  white-space: nowrap;
}

.arrow-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--glacia-red);
  color: #fff;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(255, 37, 41, 0.35);
  transition: background 0.15s;

  &:hover { background: var(--red-hover); }
}
</style>
