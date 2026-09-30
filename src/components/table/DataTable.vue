<script setup>
import { computed } from 'vue'
import { usePagination } from '@/composables/usePagination'
import TablePagination from '@/components/table/TablePagination.vue'

const props = defineProps({
  // [{ key, label, width?, align?: 'left'|'center'|'right', mono?, truncate?, bold?, dim?, compact?, padLeft?, padRight? }]
  // key === '__index' renders the row number (1-based, across pages, zero-padded to 2 digits: 01, 02…) by default.
  columns: { type: Array, required: true },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  pageSize: { type: Number, default: 10 },
  emptyText: { type: String, default: 'No data.' },
  rowKey: { type: [String, Function], default: 'id' },
  // Optional row class: (row, index) => string | object — e.g. highlight rows.
  rowClass: { type: Function, default: null },
  // Hide the built-in footer — pair with a standalone <TablePagination>
  // bound to the exposed `pagination` when it must live elsewhere.
  hidePagination: { type: Boolean, default: false },
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
  // Explicit alignment always wins.
  if (col.align) style.textAlign = col.align
  // Compact columns (e.g. checkbox) drop cell padding so content fits.
  if (col.compact) {
    style.padding = 0
    if (!col.align) style.textAlign = 'center'
  }
  // Per-side overrides to fine-tune gutters between specific columns.
  if (col.padLeft) style.paddingLeft = col.padLeft
  if (col.padRight) style.paddingRight = col.padRight
  return style
}

// The row-number column and the trailing action-menu column only ever hold a
// couple of characters or a single icon button, so they're pinned to a fixed
// 32px regardless of what a caller passes — callers shouldn't need to think
// about sizing these two.
function colWidth(col) {
  if (col.key === '__index' || col.key === 'actions') {
    // A caller can ask for a wider row-number column (e.g. a "No." header that
    // must not truncate); anything narrower than the 32px minimum is ignored.
    const px = /^(\d+)px$/.exec(col.width ?? '')
    return px && Number(px[1]) > 32 ? col.width : '32px'
  }
  return col.width || null
}

defineExpose({ pagination })
</script>

<template>
  <div class="data-table">
    <div class="data-table__wrap">
      <table class="vtable">
        <colgroup>
          <col v-for="col in columns" :key="col.key" :style="colWidth(col) ? { width: colWidth(col) } : null" />
        </colgroup>
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" :style="cellStyle(col)">
              <slot :name="`header-${col.key}`">{{ col.label }}</slot>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td :colspan="columns.length" class="vtable__empty">Loading…</td></tr>
          <tr v-else-if="!pagedItems.length"><td :colspan="columns.length" class="vtable__empty">{{ emptyText }}</td></tr>
            <tr v-for="(row, i) in pagedItems" :key="keyFor(row, i)" class="vtable__row" :class="rowClass ? rowClass(row, pagination.offset.value + i) : null">
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
                <template v-if="col.key === '__index'">{{ String(pagination.offset.value + i + 1).padStart(2, '0') }}</template>
                <template v-else>{{ row[col.key] }}</template>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <TablePagination v-if="!hidePagination" :pagination="pagination">
      <template #info>
        <slot name="pagination-info" />
      </template>
    </TablePagination>
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
    overflow: hidden;
    text-overflow: ellipsis;
  }

  td {
    padding: 14px;
    border-bottom: 1px solid var(--glacia-glass-border);
    vertical-align: middle;
    color: var(--glacia-ink);
    font-size: 13px;
    font-weight: 500;
  }

  &__row:last-child td { border-bottom: none; }
  &__row:hover td { background: rgba(0, 0, 0, 0.02); }

  &__empty {
    text-align: center;
    padding: 28px !important;
    color: var(--glacia-ink-dim);
  }

  &__cell {
    // All body text renders in one unified font (13px / medium / ink) —
    // the mono/bold/dim flags are kept for API compatibility but no longer
    // alter the typeface, so every table matches across all pages.
    &--mono {
      font-family: inherit;
      font-size: inherit;
      font-weight: inherit;
      color: inherit;
    }

    &--truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &--bold {
      font-weight: 500;
    }

    &--dim {
      color: var(--glacia-ink);
    }
  }
}

</style>