<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconChevronRight, IconTicket } from '@tabler/icons-vue'
import { pushFromDashboard } from '@/utils/navOrigin'
import { formatShortDate } from '@/utils/helpers'
import { useColumnWidths } from '@/composables/useColumnWidths'

const router = useRouter()

const props = defineProps({
  items:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

// Only the 8 latest tickets (items arrive oldest-first).
const visibleItems = computed(() => (props.items ?? []).slice(-8))

// Column widths follow the same rules as every table (components/common/tableLayout.js): Date and Ticket
// Status are fixed-format, Ticket Name and Category are text columns capped at a realistic long value, the
// arrow column is constant.
const wrapRef = ref(null)
const COLS = [
  { kind: 'fixed', base: 150 },
  { kind: 'text', base: 130, max: 280 },
  { kind: 'text', base: 130, max: 250 },
  { kind: 'fixed', base: 113 },
  { kind: 'action', base: 58 },
]
const { widths, minWidth } = useColumnWidths(wrapRef, () => COLS)
const colStyle = (i) => (widths.value ? { width: `${widths.value[i]}px` } : COLS[i].kind === 'text' ? null : { width: `${COLS[i].base}px` })

function goTickets() {
  pushFromDashboard(router, '/tickets')
}

function goTicket(item) {
  pushFromDashboard(router, `/tickets/${item.ticketId}`)
}
</script>

<template>
  <div class="tickets card">
    <div class="tickets__halo">
      <h2 class="tickets__title">Ticket Feed</h2>
      <button type="button" class="tickets__viewall" @click="goTickets">View all</button>
    </div>

    <div class="tickets__body">
      <p class="tickets__caption">Latest support and security tickets raised by your team, grouped by category.</p>

      <div v-if="!loading && !visibleItems.length" class="tickets__empty">
        <span class="tickets__empty-icon"><IconTicket :size="30" stroke-width="1.6" /></span>
        <span class="tickets__empty-text">No tickets</span>
      </div>

      <div v-else ref="wrapRef" class="tickets__wrap">
        <table class="ttable" :style="{ minWidth: `${minWidth}px` }">
          <colgroup><col v-for="(c, i) in COLS" :key="i" :style="colStyle(i)" /></colgroup>
          <thead>
            <tr>
              <th class="ttable__date">Date</th>
              <th class="ttable__name">Ticket Name</th>
              <th class="ttable__cat">Category</th>
              <th class="ttable__status">Ticket Status</th>
              <th class="ttable__arrow"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="4" class="ttable__empty">Loading…</td></tr>
            <tr v-for="item in visibleItems" :key="item.id">
              <td class="ttable__date">{{ formatShortDate(item.date) }}</td>
              <td class="ttable__name" :title="item.name">{{ item.name }}</td>
              <td class="ttable__cat" :title="item.label">{{ item.label }}</td>
              <td class="ttable__status">
                <span class="status-pill" :class="item.status === 'resolved' ? 'resolved' : 'open'">
                  {{ item.status === 'resolved' ? 'Resolved' : 'Open' }}
                </span>
              </td>
              <td class="ttable__arrow">
                <button type="button" class="arrow-btn" aria-label="View ticket" @click="goTicket(item)"><IconChevronRight :size="11" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tickets {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;

  &__halo {
    padding: 20px 22px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__viewall {
    border: none;
    background-color: transparent;
    background-image: linear-gradient(currentColor, currentColor);
    background-size: 0% 2px;
    background-repeat: no-repeat;
    background-position: left calc(100% - 2px);
    padding: 4px 2px 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--glacia-red);
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background-size 0.25s ease, color 0.15s ease;

    &:hover {
      background-size: 100% 2px;
      color: #e01e22;
    }
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 22px 22px;
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

  &__caption {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  &__wrap {
    overflow: visible;
  }
}

.ttable {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;

  // Same rules as every other table (see DataTable): 14px cell padding, fixed-format columns have an
  // explicit px width, text columns (name, category) share the rest and are cut off with "...".
  th {
    text-align: left;
    padding: 6px 14px;
    font-size: var(--text-xs);
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border);
    // Headers stay on one line and are never cut off.
    white-space: nowrap;
    overflow: visible;
  }

  td {
    padding: 9px 14px;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    font-weight: 500;
    color: var(--glacia-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  tr:last-child td { border-bottom: none; }

  tr:hover td { background: var(--color-bg); }

  &__status { text-align: center; }

  &__empty {
    text-align: center;
    padding: 24px !important;
    color: var(--glacia-ink-dim);
  }
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--glacia-radius-pill);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;

  &.open {
    background: rgba(234, 88, 12, 0.12);
    color: #ea580c;
  }

  &.resolved {
    background: rgba(22, 163, 74, 0.12);
    color: #16a34a;
  }
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
