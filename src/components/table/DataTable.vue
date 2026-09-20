<script setup>
import { computed } from 'vue'
import { usePagination } from '@/composables/usePagination'

const props = defineProps({
  // [{ key, label, width?, align?: 'left'|'center'|'right', mono?, truncate?, bold?, dim? }]
  // key === '__index' renders the row number (1-based, across pages) by default.
  columns: { type: Array, required: true },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  pageSize: { type: Number, default: 10 },
  emptyText: { type: String, default: 'No data.' },
  rowKey: { type: [String, Function], default: 'id' },
})

const pagination = usePagination({ pageSize: props.pageSize })

const pagedItems = computed(() => {
  pagination.setTotal(props.items.length)
  // Re-clamp if the item count shrank (filter/delete) while on a later page.
  if (pagination.page.value > pagination.totalPages.value) {
    pagination.goTo(pagination.totalPages.value || 1)
  }
  const start = pagination.offset.value
  return props.items.slice(start, start + pagination.pageSize.value)
})

function keyFor(row, i) {
  return typeof props.rowKey === 'function' ? props.rowKey(row) : row[props.rowKey] ?? i
}

// Column widths live only on <colgroup><col> (the CSS-authoritative source for
// table-layout:fixed) — that keeps a given px/% width rendering identically
// regardless of the table's other columns, instead of being subject to
// table-layout:fixed's implementation-specific leftover-space redistribution
// when widths are set redundantly on first-row cells too.
function cellStyle(col) {
  const style = {}
  if (col.align) style.textAlign = col.align
  return style
}

// Compact page list: 1, 2, 3 … secondToLast, last — with the current page
// pulled in (and an extra ellipsis) if it isn't already covered.
const pageList = computed(() => {
  const total = pagination.totalPages.value
  const current = pagination.page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const keep = new Set([1, 2, 3, total - 1, total, current])
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const out = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) out.push('…')
    out.push(p)
    prev = p
  }
  return out
})

defineExpose({ pagination })
</script>

<template>
  <div class="data-table">
    <div class="data-table__wrap">
      <table class="vtable">
        <colgroup>
          <col v-for="col in columns" :key="col.key" :style="col.width ? { width: col.width } : null" />
        </colgroup>
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" :style="cellStyle(col)">
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td :colspan="columns.length" class="vtable__empty">Loading…</td></tr>
          <tr v-else-if="!pagedItems.length"><td :colspan="columns.length" class="vtable__empty">{{ emptyText }}</td></tr>
          <tr v-for="(row, i) in pagedItems" :key="keyFor(row, i)" class="vtable__row">
            <td
              v-for="col in columns"
              :key="col.key"
              :style="cellStyle(col)"
              :class="{
                'vtable__cell--mono': col.mono,
                'vtable__cell--truncate': col.truncate,
                'vtable__cell--bold': col.bold,
                'vtable__cell--dim': col.dim,
              }"
            >
              <slot :name="`cell-${col.key}`" :row="row" :index="pagination.offset.value + i">
                <template v-if="col.key === '__index'">{{ pagination.offset.value + i + 1 }}.</template>
                <template v-else>{{ row[col.key] }}</template>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="pagination.totalPages.value > 1" class="data-table__pagination">
      <button type="button" class="page-nav" :disabled="pagination.page.value === 1" @click="pagination.prevPage()">
        Previous
      </button>

      <template v-for="(p, idx) in pageList" :key="`${p}-${idx}`">
        <span v-if="p === '…'" class="page-ellipsis">…</span>
        <button
          v-else
          type="button"
          class="page-num"
          :class="{ 'page-num--active': p === pagination.page.value }"
          @click="pagination.goTo(p)"
        >
          {{ p }}
        </button>
      </template>

      <button
        type="button"
        class="page-nav"
        :disabled="pagination.page.value === pagination.totalPages.value"
        @click="pagination.nextPage()"
      >
        Next
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.data-table {
  display: flex;
  flex-direction: column;

  &__wrap {
    border: 1px solid var(--glacia-glass-border);
    border-radius: var(--glacia-radius-md);
    overflow: auto;
    background: var(--glacia-glass-fill-strong);
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    margin-top: 16px;
    flex-wrap: wrap;
  }
}

.vtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;

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

  &__cell {
    &--mono {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 12px;
      color: var(--glacia-ink-dim);
    }

    &--truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &--bold {
      font-weight: 600;
    }

    &--dim {
      color: var(--glacia-ink-dim);
    }
  }
}

.page-nav,
.page-num {
  height: 34px;
  border-radius: var(--glacia-radius-pill);
  border: 1px solid var(--glacia-glass-border);
  background: var(--glacia-glass-fill-strong);
  color: var(--glacia-ink-dim);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.13s, color 0.13s, border-color 0.13s;

  &:hover:not(:disabled) {
    background: rgba(255, 37, 41, 0.08);
    color: var(--glacia-red);
    border-color: rgba(255, 37, 41, 0.3);
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
}

// Fixed widths so the bar never reflows — page numbers stay a stable
// square whether they're 1 or 2 digits, and Previous/Next match each other.
.page-num {
  width: 34px;
  padding: 0;
}

.page-nav {
  width: 92px;
  padding: 0 10px;
}

.page-num--active {
  background: var(--glacia-red);
  color: #fff;
  border-color: var(--glacia-red);
}

.page-ellipsis {
  padding: 0 4px;
  color: var(--glacia-ink-dim);
}
</style>
