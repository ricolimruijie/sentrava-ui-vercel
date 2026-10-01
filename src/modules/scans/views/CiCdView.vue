<script setup>
import { useRole } from '@/composables/useRole'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getScanHistory } from '@/modules/scans/services/scansService'
import { formatShortDate, formatShortDateTime } from '@/utils/helpers'
import { useFetch } from '@/composables/useFetch'
import DataTable from '@/components/common/DataTable.vue'
import FilterDropdown from '@/components/common/FilterDropdown.vue'
import GlassField from '@/components/common/GlassField.vue'
import { IconDotsVertical, IconArrowUpRight, IconTrash, IconX, IconCheck, IconTag, IconLogs } from '@tabler/icons-vue'

const { can } = useRole()

const router = useRouter()
const { data, loading } = useFetch(() => getScanHistory())

const tableRef = ref(null)

const columns = [
  { key: '__index', label: '#', width: '52px', dim: true },
  { key: 'dateTime', label: 'Date and Time', width: '20%', dim: true, truncate: true },
  { key: 'repository', label: 'Repository', width: '24%', dim: true, truncate: true},
  { key: 'branch', label: 'Branch', width: '20%', dim: true, truncate: true},
  { key: 'scanId', label: 'Scan ID', width: '12%', dim: true, truncate: true },
  { key: 'status', label: 'Scanning status', width: '15%', align: 'center' },
  { key: 'action', label: 'Action', width: '76px', align: 'center' },
]

const statusMeta = {
  Queue:     { label: 'Queue',     color: '#0c4a6e', bg: '#e0f2fe' },
  Scanning:  { label: 'Scanning',  color: '#F79009', bg: '#fef3c7' },
  Completed: { label: 'Completed', color: '#16a34a', bg: '#dcfce7' },
  Failed:    { label: 'Failed',    color: '#dc2626', bg: '#fee2e2' },
  Waiting:   { label: 'Waiting',   color: '#6b21a8', bg: '#f3e8ff' },
}

// Legacy lowercase values map onto the same five types.
const legacyStatus = { completed: 'Completed', failed: 'Failed', running: 'Scanning' }

function s(status) {
  const key = legacyStatus[status] ?? status
  return statusMeta[key] ?? { label: status, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' }
}

// Date matches the Last Modified column (e.g. "Mon, 10 Feb 2025"), plus 24h time.
// ── Scanning status filter ───────────────────────────────────────────────────
const statusOptions = [
  { value: 'Queue',     label: 'Queue' },
  { value: 'Scanning',  label: 'Scanning' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Failed',    label: 'Failed' },
  { value: 'Waiting',   label: 'Waiting' },
]
const statusFilter = ref(null)

const filteredData = computed(() => {
  const list = data.value ?? []
  if (!statusFilter.value) return list
  return list.filter((r) => (legacyStatus[r.status] ?? r.status) === statusFilter.value)
})

watch(statusFilter, () => tableRef.value?.pagination.goTo(1))

// Action menu — teleported to <body> and positioned from the clicked
// button's rect, so it can never be clipped by the table's scroll container.
const openMenuId = ref(null)
const menuPos = ref({ top: 0, left: 0 })

function toggleMenu(item, event) {
  if (openMenuId.value === item.id) {
    openMenuId.value = null
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  menuPos.value = { top: rect.bottom + 6, left: rect.right - 176 }
  openMenuId.value = item.id
}

function closeMenu() {
  openMenuId.value = null
}

function viewDetail(item) {
  closeMenu()
  router.push(`/scans/history/${item.id}/vulnerabilities`)
}

// ── Manage Tags modal ──────────────────────────────────────────────────────
const tagColors = [
  { swatch: '#F26D6D', bg: '#FDE8E8', fg: '#E03131' }, { swatch: '#F2994A', bg: '#FDEEE0', fg: '#E8590C' },
  { swatch: '#F2C94C', bg: '#FCF3D6', fg: '#A67C00' }, { swatch: '#A8BD3A', bg: '#F1F5D6', fg: '#6B8E00' },
  { swatch: '#4CAF6D', bg: '#E3F5E8', fg: '#2F9E52' }, { swatch: '#3DBFA8', bg: '#DEF7F0', fg: '#12967D' },
  { swatch: '#3DC6F2', bg: '#DFF3FC', fg: '#1197C2' }, { swatch: '#7C93F0', bg: '#E6E9FC', fg: '#5C6BC0' },
  { swatch: '#E896BB', bg: '#FBE6F0', fg: '#C2255C' }, { swatch: '#B69AE8', bg: '#F0E6FB', fg: '#7C3FC4' },
  { swatch: '#9AA5B1', bg: '#ECEEF0', fg: '#5C6470' },
]

const showTagModal = ref(false)
const tagItem = ref(null)
const newTagText = ref('')
const tagState = ref('idle') // 'idle' | 'loading' | 'saved'

function manageTags(item) {
  closeMenu()
  tagItem.value = item
  newTagText.value = ''
  tagState.value = 'idle'
  showTagModal.value = true
}

function closeTagModal() {
  showTagModal.value = false
  tagItem.value = null
  newTagText.value = ''
  tagState.value = 'idle'
}

function tagColorFor(label) {
  for (const run of data.value ?? []) {
    const found = (run.tags || []).find((t) => t.label.toLowerCase() === label.toLowerCase())
    if (found) return found.colorId
  }
  const used = new Set()
  for (const run of data.value ?? []) (run.tags || []).forEach((t) => used.add(t.colorId))
  for (let i = 0; i < tagColors.length; i++) {
    if (!used.has(i)) return i
  }
  return label.length % tagColors.length
}

function addTag() {
  const label = newTagText.value.trim()
  if (!label || !tagItem.value) return
  tagItem.value.tags = tagItem.value.tags || []
  if (tagItem.value.tags.some((t) => t.label.toLowerCase() === label.toLowerCase())) {
    newTagText.value = ''
    return
  }
  tagItem.value.tags.push({ label, colorId: tagColorFor(label) })
  newTagText.value = ''
}

function removeTag(label) {
  if (!tagItem.value) return
  tagItem.value.tags = (tagItem.value.tags || []).filter((t) => t.label !== label)
}

function saveTags() {
  if (tagState.value !== 'idle') return
  tagState.value = 'loading'
  setTimeout(() => {
    tagState.value = 'saved'
    setTimeout(closeTagModal, 700)
  }, 500)
}

// ── Delete Log modal ─────────────────────────────────────────────────────────
const showDeleteModal = ref(false)
const deletingItem = ref(null)
const deleteAcknowledged = ref(false)
const deleteState = ref('idle') // 'idle' | 'loading' | 'saved'

function deleteRun(item) {
  closeMenu()
  deletingItem.value = item
  deleteAcknowledged.value = false
  deleteState.value = 'idle'
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deletingItem.value = null
  deleteAcknowledged.value = false
  deleteState.value = 'idle'
}

function confirmDelete() {
  if (!deletingItem.value || !deleteAcknowledged.value || deleteState.value !== 'idle') return
  deleteState.value = 'loading'
  setTimeout(() => {
    data.value = (data.value ?? []).filter((r) => r.id !== deletingItem.value.id)
    tableRef.value?.pagination.goTo(tableRef.value.pagination.page.value) // re-clamp in case the last page just emptied out
    deleteState.value = 'saved'
    setTimeout(closeDeleteModal, 700)
  }, 500)
}

function handleClickOutside(e) {
  if (!e.target.closest('.action-menu, .action-btn')) closeMenu()
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div class="cicd">
    <h1 class="cicd__title">Continuous Integration / Continuous Development</h1>

    <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scanning status" />

    <DataTable
      ref="tableRef"
      :columns="columns"
      :items="filteredData"
      :loading="loading"
      empty-text="No pipeline runs yet." :empty-icon="IconLogs"
    >
      <template #cell-dateTime="{ row }">{{ formatShortDateTime(row.dateTime) }}</template>
      <template #cell-scanId="{ row }">{{ row.id }}</template>
      <template #cell-status="{ row }">
        <span class="status-pill" :style="{ background: s(row.status).bg, color: s(row.status).color }">
          {{ s(row.status).label }}
        </span>
      </template>
      <template #cell-action="{ row }">
        <button
          type="button"
          class="action-btn"
          aria-label="Actions"
          @click.stop="toggleMenu(row, $event)"
        >
          <IconDotsVertical :size="16" />
        </button>
      </template>
    </DataTable>

    <Teleport to="body">
      <div v-if="openMenuId" class="action-menu" :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }">
        <button type="button" class="action-menu__item" @click="viewDetail((data ?? []).find((i) => i.id === openMenuId))">
          <IconArrowUpRight :size="15" />
          See Detail
        </button>
        <button type="button" class="action-menu__item" @click="manageTags((data ?? []).find((i) => i.id === openMenuId))">
          <IconTag :size="15" />
          Manage Tags
        </button>
        <button
          v-if="can('delete_scan')"
          type="button"
          class="action-menu__item action-menu__item--danger"
          @click="deleteRun((data ?? []).find((i) => i.id === openMenuId))"
        >
          <IconTrash :size="15" />
          Delete
        </button>
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showTagModal" class="modal-backdrop" @mousedown.self="closeTagModal">
          <div class="tag-modal">
            <div class="tag-modal__head">
              <h2 class="tag-modal__title">Manage Tags</h2>
              <button type="button" class="tag-modal__close" aria-label="Close" @click="closeTagModal">
                <IconX :size="22" />
              </button>
            </div>

            <p class="tag-modal__sub">{{ tagItem?.repository }} · {{ tagItem?.id }}</p>

            <div class="tag-modal__current">
              <span
                v-for="t in tagItem?.tags || []"
                :key="t.label"
                class="dv-tag"
                :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }"
              >
                {{ t.label }}
                <button type="button" class="dv-tag__x" aria-label="Remove tag" @click="removeTag(t.label)">×</button>
              </span>
              <span v-if="!(tagItem?.tags || []).length" class="tag-modal__empty">No tags yet — add one below.</span>
            </div>

            <div class="tag-modal__create">
              <GlassField
                v-model="newTagText"
                label="New tag"
                placeholder="New tag name"
                class="tag-modal__input"
                @keydown.enter="addTag"
              />
              <button type="button" class="tag-modal__add" :disabled="!newTagText.trim()" @click="addTag">Add</button>
            </div>

            <div class="tag-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeTagModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="{ 'modal-btn--save': true, 'modal-btn--saved': tagState === 'saved' }"
                @click="saveTags"
              >
                <span v-if="tagState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="tagState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Save</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteModal" class="modal-backdrop" @mousedown.self="closeDeleteModal">
          <div class="delete-modal">
            <div class="delete-modal__head">
              <h2 class="delete-modal__title">Delete Log</h2>
              <button type="button" class="delete-modal__close" aria-label="Close" @click="closeDeleteModal">
                <IconX :size="22" />
              </button>
            </div>

            <p class="delete-modal__note">
              This log will be permanently deleted from the system. Once removed, its data cannot be recovered,
              viewed, or restored under any circumstances. Please make sure you no longer need this log, or have
              exported a copy if necessary, before proceeding with this action.
            </p>

            <label class="delete-ack">
              <input v-model="deleteAcknowledged" type="checkbox" class="delete-ack__box" />
              <span>This action is permanent and cannot be undone.</span>
            </label>

            <div class="delete-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeDeleteModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="deleteAcknowledged
                  ? { 'modal-btn--save': true, 'modal-btn--saved': deleteState === 'saved' }
                  : 'modal-btn--create'"
                :disabled="!deleteAcknowledged"
                @click="confirmDelete"
              >
                <span v-if="deleteState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="deleteState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.cicd {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: var(--glacia-radius-pill);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: var(--glacia-radius-sm);
  background: none;
  border: none;
  color: var(--glacia-ink-dim);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.13s, color 0.13s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--glacia-ink);
  }
}

// Teleported to <body>, so this is positioned via fixed top/left (see
// menuPos in script) rather than relative to its DOM parent.
.action-menu {
  position: fixed;
  width: 176px;
  background: var(--surface);
  border-radius: 12px;
  box-shadow: 0 12px 28px -6px rgba(16, 24, 32, 0.2);
  overflow: hidden;
  padding: 6px;
  z-index: 200;
  transform-origin: top right;
  animation: action-menu-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 10px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--glacia-ink);
    font-size: 13px;
    font-weight: 500;
    font-family: 'Manrope', 'Inter', sans-serif;
    cursor: pointer;
    text-align: left;
    transition: background 0.13s, color 0.13s;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    &--danger {
      color: var(--glacia-sev-critical);

      &:hover {
        background: rgba(220, 38, 38, 0.08);
      }
    }
  }
}

@keyframes action-menu-bounce {
  0%   { opacity: 0; transform: scale(0.85) translateY(-8px); }
  60%  { opacity: 1; transform: scale(1.03) translateY(0); }
  100% { transform: scale(1); }
}

// ── Manage Tags modal ──────────────────────────────────────────────────────

.tag-modal {
  width: 100%;
  max-width: 460px;
  background: var(--surface);
  border-radius: 24px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  padding: 28px;
  animation: delete-modal-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__close {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: none;
    color: var(--glacia-ink-dim);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--glacia-ink);
    }
  }

  &__sub {
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  &__current {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
    min-height: 30px;
  }

  &__empty {
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  &__create {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 12px;
  }

  &__input {
    flex: 1;
    min-width: 0;
  }

  &__add {
    height: 48px;
    margin-top: 22px;
    padding: 0 18px;
    border-radius: 12px;
    border: none;
    background: var(--glacia-red);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    font-family: 'Manrope', 'Inter', sans-serif;
    cursor: pointer;
    flex-shrink: 0;

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }

  &__actions {
    display: flex;
    gap: 14px;
    margin-top: 20px;
  }
}

.dv-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Manrope', 'Inter', sans-serif;
  white-space: nowrap;
}

.dv-tag__x {
  border: none;
  background: none;
  cursor: pointer;
  color: inherit;
  font-size: 13px;
  line-height: 1;
  padding: 0 0 0 2px;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
}

// ── Delete Log modal ─────────────────────────────────────────────────────────

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.delete-modal {
  width: 100%;
  max-width: 520px;
  background: var(--surface);
  border-radius: 24px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  padding: 32px;
  animation: delete-modal-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__close {
    width: 34px;
    height: 34px;
    border-radius: var(--glacia-radius-sm);
    border: none;
    background: none;
    color: var(--glacia-ink);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.13s;

    &:hover {
      background: rgba(0, 0, 0, 0.06);
    }
  }

  &__note {
    margin: 18px 0 0;
    font-size: 15px;
    line-height: 1.7;
    color: var(--glacia-ink-dim);
  }

  &__actions {
    display: flex;
    gap: 14px;
    margin-top: 20px;
  }
}

@keyframes delete-modal-bounce {
  0%   { opacity: 0; transform: scale(0.92) translateY(10px); }
  60%  { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
}

.delete-ack {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 0;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1.5px solid var(--glacia-red);
  background: var(--surface);
  cursor: pointer;
  user-select: none;

  span {
    font-size: 14px;
    line-height: 1.5;
    color: var(--glacia-ink);
  }
}

.delete-ack__box {
  appearance: none;
  width: 20px;
  height: 20px;
  margin: 0;
  border-radius: 6px;
  border: 2px solid var(--glacia-red);
  background: var(--surface);
  flex-shrink: 0;
  cursor: pointer;
  position: relative;

  &:checked::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 3px;
    background: var(--glacia-red);
  }
}

.modal-btn {
  flex: 1;
  height: 52px;
  border-radius: 14px;
  border: none;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Manrope', 'Inter', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.13s, opacity 0.13s;

  &--cancel {
    background: rgba(220, 38, 38, 0.06);
    color: var(--glacia-sev-critical);

    &:hover {
      background: rgba(220, 38, 38, 0.12);
    }
  }

  &--save {
    background: linear-gradient(135deg, #b91c1c, #ff2e3a);
    color: #fff;
    box-shadow: 0 8px 20px -6px rgba(255, 46, 58, 0.4);

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }

    // Excludes --saved so a lingering :hover (the mouse doesn't move after
    // a click) can't out-specificity the green "saved" background below.
    &:not(:disabled):not(.modal-btn--saved):hover {
      filter: brightness(1.06);
    }
  }

  &--saved {
    background: #16a34a;
    box-shadow: 0 8px 20px -6px rgba(22, 163, 74, 0.4);
  }

  &--create {
    background: var(--glacia-glass-fill-strong);
    color: var(--glacia-ink);
    border: 1px solid var(--glacia-glass-border);

    &:disabled {
      color: var(--glacia-ink-dim);
      cursor: default;
    }
  }

  &__spinner {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 2px solid rgba(var(--glass-rgb), 0.4);
    border-top-color: #fff;
    animation: modal-btn-spin 0.7s linear infinite;
  }

  &__check {
    animation: modal-btn-pop 0.4s ease;
  }
}

@keyframes modal-btn-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes modal-btn-pop {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}
</style>
