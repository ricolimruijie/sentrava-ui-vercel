<script setup>
import { computed } from 'vue'

// Standalone pagination footer driven by a usePagination() object — the same
// footer DataTable renders internally. Lets callers place pagination outside
// the table (e.g. below an outer card) via DataTable's `hide-pagination`.
const props = defineProps({
  pagination: { type: Object, required: true },
})

// Compact page list: 1, 2, 3 … secondToLast, last — with the current page
// pulled in (and an extra ellipsis) if it isn't already covered.
const pageList = computed(() => {
  const total = props.pagination.totalPages.value
  const current = props.pagination.page.value
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
</script>

<template>
  <div class="table-pagination">
    <div class="table-pagination__info">
      <slot name="info" />
    </div>

    <div class="table-pagination__controls">
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
        :disabled="pagination.totalPages.value <= 1 || pagination.page.value === pagination.totalPages.value"
        @click="pagination.nextPage()"
      >
        Next
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;

  &__info {
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-left: auto;
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
