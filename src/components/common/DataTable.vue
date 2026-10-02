<script setup>
import { computed } from 'vue'
import { usePagination } from '@/composables/usePagination'
import TablePagination from '@/components/common/TablePagination.vue'
import { IconInbox } from '@tabler/icons-vue'

const props = defineProps({
  // [{ key, label, kind?, width?, align?: 'left'|'center'|'right', mono?, truncate?, bold?, dim? }]
  //
  // Two kinds of columns (see the table rules in the README):
  //  - Fixed-format columns (dates, status, severity, counts, IDs, No, Action ...) have an explicit
  //    px `width` sized to their widest content, and never change with the window.
  //  - Text-heavy columns (names, targets, descriptions ...) have NO width: they split whatever is left
  //    equally, and anything longer than its column is cut off with an ellipsis (full text in a tooltip).
  // `kind` marks the three special columns whose width is set here, not by the caller:
  //  'index' (row number, 52px; pass a wider px width only if the table can reach 1000+ rows),
  //  'check' (row checkbox, 48px) and 'action' (the button(s) column, 76px).
  // key === '__index' renders the row number (1-based, across pages, zero-padded to 2 digits: 01, 02…).
  columns: { type: Array, required: true },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  pageSize: { type: Number, default: 10 },
  emptyText: { type: String, default: 'No data.' },
  // Icon shown above the empty text (a tabler icon component); defaults to an inbox.
  emptyIcon: { type: [Object, Function], default: null },
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

const INDEX_W = 52     // "No" header + up to 3 digits
const CHECK_W = 48     // 18px checkbox + padding
const ACTION_W = 76    // wide enough for the "ACTION" header (47px) + padding; the 30px button fits easily
const TEXT_MIN_W = 130 // narrowest a text-heavy column may get before the table scrolls sideways (fits the longest header word, "VULNERABILITY")

const kindOf = (col) => col.kind ?? (col.key === '__index' ? 'index' : null)

// Column widths live only on <colgroup><col> (the CSS-authoritative source for table-layout:fixed).
// Text-heavy columns return null so they share the leftover space equally.
function colWidth(col) {
  const kind = kindOf(col)
  if (kind === 'index') {
    const px = /^(\d+)px$/.exec(col.width ?? '')
    return px && Number(px[1]) > INDEX_W ? col.width : `${INDEX_W}px`
  }
  if (kind === 'check') return `${CHECK_W}px`
  if (kind === 'action') return `${ACTION_W}px`
  return col.width || null
}

// The table never squeezes its text columns below TEXT_MIN_W: on a narrow screen it scrolls
// sideways inside its wrapper instead. (This is a minimum for the whole table, not a column width.)
const minTableWidth = computed(() => {
  let total = 0
  for (const col of props.columns) {
    const w = colWidth(col)
    total += w ? parseInt(w, 10) : TEXT_MIN_W
  }
  return total
})

// Alignment is the only per-column style: cell padding is the same everywhere (14px each side).
function cellStyle(col) {
  return col.align ? { textAlign: col.align } : null
}

// Native tooltip with the full text for plain-text cells (slotted cells add their own title).
function titleFor(col, row) {
  const v = row[col.key]
  return v == null || v === '' ? null : String(v)
}

// Tooltip with the full text for anything cut off with "...": on hover, the innermost truncated element
// under the pointer gets a native title (works for nested content too: names, avatar + text, chips...).
function onBodyOver(e) {
  let el = e.target
  while (el && el.tagName !== 'TBODY') {
    if (el.scrollWidth > el.clientWidth + 1) {
      const text = el.textContent.trim()
      if (text && !el.title) el.title = text
      return
    }
    el = el.parentElement
  }
}

defineExpose({ pagination })
</script>

<template>
  <div class="data-table">
    <div class="data-table__wrap">
      <table class="vtable" :style="{ minWidth: `${minTableWidth}px` }">
        <colgroup>
          <col v-for="col in columns" :key="col.key" :style="colWidth(col) ? { width: colWidth(col) } : null" />
        </colgroup>
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" :style="cellStyle(col)">
              <slot :name="`header-${col.key}`"><span class="vtable__th-text">{{ col.label }}</span></slot>
            </th>
          </tr>
        </thead>
        <tbody @mouseover="onBodyOver">
          <tr v-if="loading"><td :colspan="columns.length" class="vtable__empty">Loading…</td></tr>
          <tr v-else-if="!pagedItems.length">
            <td :colspan="columns.length" class="vtable__empty">
              <div class="vtable__empty-state">
                <span class="vtable__empty-icon"><component :is="emptyIcon || IconInbox" :size="30" stroke-width="1.6" /></span>
                <span class="vtable__empty-text">{{ emptyText }}</span>
              </div>
            </td>
          </tr>
            <tr v-for="(row, i) in pagedItems" :key="keyFor(row, i)" class="vtable__row" :class="rowClass ? rowClass(row, pagination.offset.value + i) : null">
            <td
              v-for="col in columns"
              :key="col.key"
              :style="cellStyle(col)"
              :title="$slots[`cell-${col.key}`] ? null : titleFor(col, row)"
              :class="{
                'vtable__cell--index': kindOf(col) === 'index',
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
    background: rgba(var(--tint), 0.05);
    z-index: 1;
  }

  // One cell padding for every cell and header: 14px each side.
  th {
    padding: 12px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    line-height: 1.3;
    color: var(--glacia-ink-dim);
    vertical-align: middle;
  }

  // Headers are never cut off with "...": they wrap onto a second line (the column widths are sized
  // so two lines are always enough). Whole words only.
  &__th-text {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    white-space: normal;
    overflow-wrap: normal;
    word-break: normal;
  }

  // Anything longer than its column is cut off on a single line with "...".
  td {
    padding: 14px;
    border-bottom: 1px solid var(--glacia-glass-border);
    vertical-align: middle;
    color: var(--glacia-ink);
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // Nested cell content. Wrappers may shrink (min-width: 0) and their text is cut with "..." on one line;
  // badges, counters and buttons keep their size and are never cut off.
  td :deep(.cell-tags) { display: flex; align-items: center; gap: 6px; flex-wrap: nowrap; min-width: 0; }
  td :deep(.cell-tags .dv-tag) { flex: 0 1 auto; min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  td :deep(.cell-tags .tag-more),
  td :deep(.cell-tags .tag-add),
  td :deep(.cell-tags button) { flex: none; }
  td :deep(.member-cell) { min-width: 0; }
  td :deep(.member-avatar) { flex: none; }
  td :deep(.member-cell__text) { min-width: 0; flex: 1 1 auto; }
  td :deep(.member-cell__name),
  td :deep(.member-cell__username),
  td :deep(.vuln-by__name),
  td :deep(.vuln-by__email),
  td :deep(.ticket-name),
  td :deep(.ticket-name__title) { min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  td :deep(.vuln-by) { min-width: 0; }
  td :deep(.rd) { max-width: 100%; }

  // Row numbers: digits of equal width so they line up down the column.
  &__cell--index { font-variant-numeric: tabular-nums; }

  &__row:last-child td { border-bottom: none; }
  &__row:hover td { background: rgba(0, 0, 0, 0.02); }

  &__empty {
    text-align: center;
    padding: 28px !important;
    color: var(--glacia-ink-dim);
  }

  // Same empty state as the dashboard cards: icon in a dashed circle + a line of text.
  &__empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 220px;
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