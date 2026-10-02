<script setup>
import { computed, ref } from 'vue'
import { IconChevronRight, IconShieldSearch } from '@tabler/icons-vue'
import VulnerabilityDetailModal from '@/components/common/VulnerabilityDetailModal.vue'

const props = defineProps({
  items:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

const filteredItems = computed(() => {
  const rank = { critical: 0, high: 1 }
  return (props.items ?? [])
    .filter((v) => ['critical', 'high'].includes((v.severity ?? '').toLowerCase()))
    .slice()
    .sort((a, b) => (rank[a.severity.toLowerCase()] ?? 2) - (rank[b.severity.toLowerCase()] ?? 2))
})

const sev = {
  critical: { label: 'Critical', color: '#dc2626', bg: 'rgba(220,38,38,0.12)'  },
  high:     { label: 'High',     color: '#ea580c', bg: 'rgba(234,88,12,0.12)'  },
  medium:   { label: 'Medium',   color: '#ca8a04', bg: 'rgba(202,138,4,0.14)'  },
  low:      { label: 'Low',      color: '#2563eb', bg: 'rgba(37,99,235,0.12)'  },
  info:     { label: 'Info',     color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
}

function s(k) { return sev[k?.toLowerCase()] ?? { label: k, color: '#64748b', bg: 'rgba(100,116,139,0.12)' } }

// Same cycle semantics as the detail views (WebAppDetailView).
const cyclePill = {
  Active:           { bg: '#fee2e2', color: '#dc2626' },
  Fixing:           { bg: '#fef3c7', color: '#b45309' },
  Mitigated:        { bg: '#dcfce7', color: '#16a34a' },
  Tolerated:        { bg: '#DFF3FC', color: '#1197C2' },
  'False Positive': { bg: '#ECEEF0', color: '#5C6470' },
}

const showDetailModal = ref(false)
const selectedFinding = ref(null)

function openDetail(item) {
  selectedFinding.value = { ...item, severity: item.severity?.toLowerCase(), component: item.affectedAsset, service: item.services }
  showDetailModal.value = true
}

function c(cycle) { return cyclePill[cycle] ?? { bg: '#ECEEF0', color: '#5C6470' } }
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

      <div v-else class="vuln__wrap">
        <table class="vtable">
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
    font-size: 13px;
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
    font-size: 13px;
    font-weight: 600;
    color: var(--glacia-ink);
  }
}

.vtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
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
    font-size: var(--text-xs);
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border);
    // Headers wrap (two lines at most) instead of being cut off.
    white-space: normal;
    overflow-wrap: normal;
    word-break: normal;
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
  &__row:hover td { background: var(--color-bg); }

  &__empty {
    text-align: center;
    padding: 28px !important;
    color: var(--glacia-ink-dim);
  }

  &__sev { width: 97px; }
  &__cycle { width: 134px; }
  &__arrow { width: 58px; }
}

.vtable th.text-center { text-align: center; }
.text-center { text-align: center; }

.sev-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: var(--glacia-radius-pill);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.cycle-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--glacia-radius-pill);
  font-size: 12px;
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

  &:hover { background: #e01e22; }
}
</style>
