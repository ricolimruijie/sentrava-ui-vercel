<script setup>
import { useRole } from '@/composables/useRole'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getScanHistory } from '@/modules/scans/services/scansService'
import { formatShortDateTime } from '@/utils/helpers'
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
  { key: '__index', label: 'No', width: '52px', dim: true },
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

<style scoped lang="scss" src="./CiCdView.scss"></style>
