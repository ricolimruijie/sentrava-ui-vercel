<script setup>
import { computed } from 'vue'
import { IconChevronRight } from '@tabler/icons-vue'

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
</script>

<template>
  <div class="vuln card">
    <div class="vuln__halo">
      <h2 class="vuln__title">Top Vulnerabilities</h2>
    </div>

    <div class="vuln__body">
      <p class="vuln__caption">Critical security weaknesses identified across your assets, prioritized by severity.</p>

      <div class="vuln__wrap">
        <table class="vtable">
          <thead>
            <tr>
              <th class="vtable__num">#</th>
              <th>Vulnerability</th>
              <th>Asset</th>
              <th>Service</th>
              <th class="text-center">Severity</th>
              <th class="vtable__arrow"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" class="vtable__empty">Loading…</td></tr>
            <tr v-else-if="!filteredItems.length"><td colspan="6" class="vtable__empty">No vulnerabilities found.</td></tr>
            <tr v-for="(item, i) in filteredItems" :key="item.id" class="vtable__row">
              <td class="vtable__num">{{ i + 1 }}</td>
              <td class="vtable__name">{{ item.name }}</td>
              <td class="vtable__asset">{{ item.affectedAsset }}</td>
              <td class="vtable__svc">{{ item.services }}</td>
              <td class="text-center">
                <span
                  class="sev-badge"
                  :style="{ background: s(item.severity).bg, color: s(item.severity).color }"
                >{{ s(item.severity).label }}</span>
              </td>
              <td class="vtable__arrow">
                <button type="button" class="arrow-btn"><IconChevronRight :size="11" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
    border: 1px solid var(--glacia-glass-border);
    border-radius: var(--glacia-radius-md);
    overflow: auto;
    flex: 1;
    min-height: 0;
    background: var(--glacia-glass-fill-strong);
  }
}

.vtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead tr {
    position: sticky;
    top: 0;
    background: rgba(15, 23, 42, 0.05);
    z-index: 1;
  }

  th {
    padding: 12px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--glacia-ink-dim);
    white-space: nowrap;
  }

  td {
    padding: 14px;
    border-bottom: 1px solid var(--glacia-glass-border);
    vertical-align: middle;
    color: var(--glacia-ink);
  }

  &__row:last-child td { border-bottom: none; }
  &__row:hover td { background: rgba(0, 0, 0, 0.02); }

  &__empty {
    text-align: center;
    padding: 28px !important;
    color: var(--glacia-ink-dim);
  }

  &__num {
    width: 32px;
    color: var(--glacia-ink-dim);
    font-weight: 500;
  }

  &__name {
    font-weight: 500;
    max-width: 240px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__asset {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 12px;
    color: var(--glacia-ink-dim);
    white-space: nowrap;
  }

  &__svc {
    color: var(--glacia-ink-dim);
    white-space: nowrap;
  }

  &__arrow {
    width: 40px;
  }
}

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

.arrow-btn {
  width: 22px;
  height: 22px;
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
