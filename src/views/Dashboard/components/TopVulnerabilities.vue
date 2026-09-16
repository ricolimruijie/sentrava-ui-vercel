<script setup>
import { IconChevronRight } from '@tabler/icons-vue'

defineProps({
  items:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

const sev = {
  critical: { label: 'Critical', color: '#dc2626', bg: 'rgba(220,38,38,0.10)'   },
  high:     { label: 'High',     color: '#ea580c', bg: 'rgba(234,88,12,0.10)'   },
  medium:   { label: 'Medium',   color: '#ca8a04', bg: 'rgba(202,138,4,0.10)'   },
  low:      { label: 'Low',      color: '#2563eb', bg: 'rgba(37,99,235,0.10)'   },
  info:     { label: 'Info',     color: '#64748b', bg: 'rgba(100,116,139,0.10)' },
}

function s(k) { return sev[k?.toLowerCase()] ?? { label: k, color: '#64748b', bg: 'rgba(100,116,139,0.10)' } }
</script>

<template>
  <div class="vuln card">
    <div class="vuln__head">
      <span class="card-title">Top Vulnerabilities</span>
      <span class="vuln__count">{{ items.length }} findings</span>
    </div>
    <p class="vuln__desc">Critical security weaknesses identified across your assets, prioritized by severity.</p>

    <div class="vuln__wrap">
      <table class="vtable">
        <thead>
          <tr>
            <th>#</th>
            <th>Vulnerability</th>
            <th>Asset</th>
            <th>Service</th>
            <th>Severity</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="vtable__empty">Loading…</td></tr>
          <tr v-else-if="!items.length"><td colspan="6" class="vtable__empty">No vulnerabilities found.</td></tr>
          <tr v-for="(item, i) in items" :key="item.id" class="vtable__row">
            <td class="vtable__num">{{ i + 1 }}</td>
            <td
              class="vtable__name"
              :style="{ borderLeft: `3px solid ${s(item.severity).color}`, paddingLeft: '10px' }"
            >{{ item.name }}</td>
            <td class="vtable__asset"><code>{{ item.affectedAsset }}</code></td>
            <td class="vtable__svc"><em>{{ item.services }}</em></td>
            <td>
              <span
                class="sev-badge"
                :style="{ background: s(item.severity).bg, color: s(item.severity).color }"
              >{{ s(item.severity).label }}</span>
            </td>
            <td>
              <button class="action-btn"><IconChevronRight :size="12" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.vuln {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__count {
    font-size: 11px;
    color: var(--glacia-ink-dim);
    font-weight: 500;
    background: var(--glacia-glass-fill-strong);
    border: 1px solid var(--glacia-glass-border);
    padding: 2px 8px;
    border-radius: var(--glacia-radius-pill);
  }

  &__desc {
    font-size: 12px;
    color: var(--glacia-ink-dim);
    line-height: 1.5;
    margin-bottom: 4px;
    opacity: 0.7;
  }

  &__wrap {
    border: 1px solid rgba(0,0,0,0.07);
    border-radius: var(--glacia-radius-sm);
    overflow: auto;
    flex: 1;
    background: rgba(255,255,255,0.40);
  }
}

.vtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  thead tr {
    position: sticky;
    top: 0;
    background: rgba(0,0,0,0.03);
    z-index: 1;
  }

  th {
    padding: 8px 10px;
    text-align: left;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--glacia-ink-dim);
    border-bottom: 1px solid rgba(0,0,0,0.07);
    white-space: nowrap;
  }

  td {
    padding: 9px 10px;
    border-bottom: 1px solid rgba(0,0,0,0.05);
    vertical-align: middle;
    color: var(--glacia-ink);
  }

  &__row:last-child td { border-bottom: none; }
  &__row:hover td { background: rgba(0,0,0,0.02); }

  &__empty {
    text-align: center;
    padding: 24px !important;
    color: var(--glacia-ink-dim);
  }

  &__num {
    width: 28px;
    color: var(--glacia-ink-dim);
    font-weight: 600;
    font-size: 11px;
  }

  &__name {
    font-weight: 500;
    max-width: 220px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__asset {
    code {
      background: rgba(0,0,0,0.06);
      padding: 1px 6px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 11px;
      color: var(--glacia-ink-dim);
      white-space: nowrap;
    }
  }

  &__svc {
    em {
      font-style: normal;
      font-size: 11px;
      color: var(--glacia-ink-dim);
      white-space: nowrap;
    }
  }
}

.sev-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: var(--glacia-radius-pill);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid rgba(0,0,0,0.08);

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
}

.action-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--glacia-red);
  color: #fff;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(255,37,41,0.35);
  transition: background 0.15s;

  &:hover { background: #e01e22; }
}
</style>
