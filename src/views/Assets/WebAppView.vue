<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/table/DataTable.vue'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import SearchInput from '@/components/reusable/SearchInput.vue'
import { getWebApps } from '@/mocks/assets/webApp.js'
import { IconDotsVertical, IconCirclePlus, IconChevronDown, IconCheck, IconX, IconTag, IconArrowUpRight, IconTrash } from '@tabler/icons-vue'

const router = useRouter()

const apps = ref(getWebApps())

const columns = [
  { key: '__index', label: '#', width: '32px', dim: true },
  { key: 'name', label: 'Application name', width: '15%', truncate: true },
  { key: 'target', label: 'Target', width: '17%', mono: true, dim: true, truncate: true },
  { key: 'owner', label: 'Asset owner', width: '14%', truncate: true },
  { key: 'scanType', label: 'Scan type', width: '11%', truncate: true },
  { key: 'tags', label: 'Multi-Tags', width: '15%' },
  { key: 'status', label: 'Scanning status', width: '10%', align: 'center' },
  { key: 'actions', label: 'Action', width: '32px', align: 'center' },
]

// Same palette as SourceCodeView so tags render identically.
const tagColors = [
  { swatch: '#F26D6D', bg: '#FDE8E8', fg: '#E03131' }, { swatch: '#F2994A', bg: '#FDEEE0', fg: '#E8590C' },
  { swatch: '#F2C94C', bg: '#FCF3D6', fg: '#A67C00' }, { swatch: '#A8BD3A', bg: '#F1F5D6', fg: '#6B8E00' },
  { swatch: '#4CAF6D', bg: '#E3F5E8', fg: '#2F9E52' }, { swatch: '#3DBFA8', bg: '#DEF7F0', fg: '#12967D' },
  { swatch: '#3DC6F2', bg: '#DFF3FC', fg: '#1197C2' }, { swatch: '#7C93F0', bg: '#E6E9FC', fg: '#5C6BC0' },
  { swatch: '#E896BB', bg: '#FBE6F0', fg: '#C2255C' }, { swatch: '#B69AE8', bg: '#F0E6FB', fg: '#7C3FC4' },
  { swatch: '#9AA5B1', bg: '#ECEEF0', fg: '#5C6470' },
]

const statusMeta = {
  NotStarted: { label: 'Not yet started', pill: 'status-pill--notstarted' },
  Queue:      { label: 'Queue',      pill: 'status-pill--queue' },
  Scanning:   { label: 'Scanning',   pill: 'status-pill--scanning' },
  Completed:  { label: 'Completed',  pill: 'status-pill--completed' },
  Failed:     { label: 'Failed',     pill: 'status-pill--failed' },
  Waiting:    { label: 'Waiting',    pill: 'status-pill--waiting' },
}

const scanTypeOptions = [
  { value: 'manual', label: 'Manual Triggered' },
  { value: 'scheduled', label: 'Scheduled Scanning' },
  { value: 'continuous', label: 'Continuous Scanning' },
]

// ── Filters ────────────────────────────────────────────────────────────────
const multiTagFilter = ref(null)
const scanTypeFilter = ref(null)
const statusFilter = ref(null)
const search = ref('')

const multiTagOptions = computed(() => {
  const vocab = new Map()
  apps.value.forEach((a) => (a.tags || []).forEach((t) => vocab.set(t.label, t.colorId)))
  return [...vocab.keys()].sort().map((label) => ({ value: label, label }))
})
const scanTypeFilterOptions = computed(() => scanTypeOptions.map((o) => ({ value: o.value, label: o.label })))
const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))

const filtered = computed(() => {
  let list = apps.value
  if (multiTagFilter.value) list = list.filter((a) => (a.tags || []).some((t) => t.label === multiTagFilter.value))
  if (scanTypeFilter.value) list = list.filter((a) => a.scanType === scanTypeFilter.value)
  if (statusFilter.value) list = list.filter((a) => a.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((a) => a.name.toLowerCase().includes(q) || a.target.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q))
  return list
})

// ── Row action menu (teleported, same as SourceCodeView) ───────────────────
const openMenuId = ref(null)
const menuPos = ref({ top: 0, left: 0 })

function toggleMenu(row, event) {
  if (openMenuId.value === row.id) {
    openMenuId.value = null
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  menuPos.value = { top: rect.bottom + 6, left: rect.right - 176 }
  openMenuId.value = row.id
}

function closeMenu() {
  openMenuId.value = null
}

function deleteApp(id) {
  closeMenu()
  apps.value = apps.value.filter((a) => a.id !== id)
}

// ── Detail: dedicated page ─────────────────────────────────────────────────
function seeDetail(id) {
  closeMenu()
  router.push(`/assets/webapps/${id}`)
}

// ── Multi-Tags picker popover (same pattern as SourceCodeView) ─────────────
const tagPopoverFor = ref(null) // app id
const tagPopoverPos = ref({ top: 0, left: 0 })
const tagQuery = ref('')
const tagNewColor = ref(4)
const createdTags = ref([])
const tagVocab = computed(() => {
  const m = new Map()
  apps.value.forEach((a) => (a.tags || []).forEach((t) => m.set(t.label, t.colorId)))
  createdTags.value.forEach((t) => m.set(t.label, t.colorId))
  return [...m.entries()].map(([label, colorId]) => ({ label, colorId, bg: tagColors[colorId].bg, fg: tagColors[colorId].fg }))
})
const filteredTagVocab = computed(() => {
  const q = tagQuery.value.trim().toLowerCase()
  if (!q) return tagVocab.value
  return tagVocab.value.filter((t) => t.label.toLowerCase().includes(q))
})
const tagPopoverRow = computed(() => apps.value.find((a) => a.id === tagPopoverFor.value) || null)

function openTagPopover(row, e) {
  tagPopoverFor.value = row.id
  tagQuery.value = ''
  const rect = e.currentTarget.getBoundingClientRect()
  tagPopoverPos.value = { top: rect.bottom + 6, left: Math.max(8, Math.min(rect.left, window.innerWidth - 288)) }
}

function manageTags(id) {
  const row = apps.value.find((a) => a.id === id)
  const pos = { ...menuPos.value }
  closeMenu()
  if (!row) return
  tagPopoverFor.value = row.id
  tagQuery.value = ''
  tagPopoverPos.value = { top: pos.top, left: Math.max(8, Math.min(pos.left, window.innerWidth - 288)) }
}

function closeTagPopover() { tagPopoverFor.value = null }

function pickExistingTag(row, tag) {
  if (!row.tags.some((t) => t.label === tag.label)) row.tags.push({ label: tag.label, colorId: tag.colorId })
}

function createRowTag(row) {
  const label = tagQuery.value.trim()
  if (!label || row.tags.some((t) => t.label === label)) return
  const entry = { label, colorId: tagNewColor.value }
  createdTags.value.push(entry)
  row.tags.push(entry)
  tagQuery.value = ''
}

function removeRowTag(row, label) {
  row.tags = row.tags.filter((t) => t.label !== label)
}

function handleClickOutside(e) {
  if (!e.target.closest('.action-menu, .action-btn')) closeMenu()
  if (!e.target.closest('.tag-popover, .tag-add')) closeTagPopover()
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

// ── Register URL modal ─────────────────────────────────────────────────────
const showUrlModal = ref(false)
const regUrl = ref('')
const regUrlOwner = ref('')
const regUrlAttempted = ref(false)
const regUrlState = ref('idle') // 'idle' | 'loading' | 'saved'

function openUrlModal() {
  regUrl.value = ''
  regUrlOwner.value = ''
  regUrlAttempted.value = false
  regUrlState.value = 'idle'
  showUrlModal.value = true
}

function closeUrlModal() {
  showUrlModal.value = false
  regUrlAttempted.value = false
  regUrlState.value = 'idle'
}

function submitUrl() {
  regUrlAttempted.value = true
  if (!regUrl.value.trim() || !regUrlOwner.value.trim() || regUrlState.value !== 'idle') return
  regUrlState.value = 'loading'
  setTimeout(() => {
    let name = regUrl.value.trim().replace(/^https?:\/\//, '').split('/')[0]
    apps.value.unshift({
      id: Math.max(...apps.value.map((a) => a.id)) + 1,
      name,
      target: regUrl.value.trim(),
      owner: regUrlOwner.value.trim(),
      scanType: 'manual',
      tags: [],
      status: 'NotStarted',
    })
    regUrlState.value = 'saved'
    setTimeout(closeUrlModal, 700)
  }, 500)
}

// ── Input Application modal ────────────────────────────────────────────────
const showAppModal = ref(false)
const appName = ref('')
const appTarget = ref('')
const appOwner = ref('')
const appScanType = ref(null)
const appField = ref(null)
const appAttempted = ref(false)
const appState = ref('idle') // 'idle' | 'loading' | 'saved'

function openAppModal() {
  appName.value = ''
  appTarget.value = ''
  appOwner.value = ''
  appScanType.value = null
  appField.value = null
  appAttempted.value = false
  appState.value = 'idle'
  showAppModal.value = true
}

function closeAppModal() {
  showAppModal.value = false
  appField.value = null
  appAttempted.value = false
  appState.value = 'idle'
}

function submitApp() {
  appAttempted.value = true
  if (!appName.value.trim() || !appTarget.value.trim() || !appOwner.value.trim() || !appScanType.value || appState.value !== 'idle') return
  appState.value = 'loading'
  setTimeout(() => {
    apps.value.unshift({
      id: Math.max(...apps.value.map((a) => a.id)) + 1,
      name: appName.value.trim(),
      target: appTarget.value.trim(),
      owner: appOwner.value.trim(),
      scanType: appScanType.value,
      tags: [],
      status: 'NotStarted',
    })
    appState.value = 'saved'
    setTimeout(closeAppModal, 700)
  }, 500)
}
</script>

<template>
  <div class="web-app">
    <div class="web-app__head">
      <h1 class="web-app__title">Web Application Assessment</h1>
      <div class="web-app__actions">
        <button type="button" class="btn-register" @click="openUrlModal"><IconCirclePlus :size="15" /> Register URL</button>
        <button type="button" class="btn-register" @click="openAppModal"><IconCirclePlus :size="15" /> Input Application</button>
      </div>
    </div>

    <div class="web-app__controls">
      <div class="web-app__filters">
        <FilterDropdown v-model="multiTagFilter" :options="multiTagOptions" placeholder="Multi-Tags" />
        <FilterDropdown v-model="scanTypeFilter" :options="scanTypeFilterOptions" placeholder="Scan Type" />
        <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scanner Status" />
      </div>
      <SearchInput v-model="search" placeholder="Search" />
    </div>

    <DataTable
      :columns="columns"
      :items="filtered"
      :loading="false"
      empty-text="No applications found."
    >
      <template #cell-tags="{ row }">
        <div class="cell-tags">
          <span
            v-for="t in row.tags.slice(0, 2)"
            :key="t.label"
            class="dv-tag"
            :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }"
          >{{ t.label }}</span>
          <span v-if="row.tags.length > 2" class="tag-more">+{{ row.tags.length - 2 }}</span>
          <button v-if="!row.tags.length" type="button" class="tag-add" @click.stop="openTagPopover(row, $event)">Add tag</button>
        </div>
      </template>
      <template #cell-status="{ row }">
        <span class="status-pill" :class="statusMeta[row.status]?.pill ?? 'status-pill--notstarted'">
          {{ statusMeta[row.status]?.label ?? row.status }}
        </span>
      </template>
      <template #cell-scanType="{ row }">
        <span :class="{ dim: !row.scanType }">
          {{ scanTypeOptions.find((o) => o.value === row.scanType)?.label ?? '—' }}
        </span>
      </template>
      <template #cell-actions="{ row }">
        <button type="button" class="action-btn" aria-label="Actions" @click.stop="toggleMenu(row, $event)">
          <IconDotsVertical :size="16" />
        </button>
      </template>
    </DataTable>

    <Teleport to="body">
      <div v-if="openMenuId" class="action-menu" :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }">
        <button type="button" class="action-menu__item" @click="seeDetail(openMenuId)">
          <IconArrowUpRight :size="15" />
          See Detail
        </button>
        <button type="button" class="action-menu__item" @click="manageTags(openMenuId)">
          <IconTag :size="15" />
          Manage tag
        </button>
        <button type="button" class="action-menu__item action-menu__item--danger" @click="deleteApp(openMenuId)">
          <IconTrash :size="15" />
          Delete
        </button>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="tagPopoverFor && tagPopoverRow" class="tag-popover" :style="{ top: `${tagPopoverPos.top}px`, left: `${tagPopoverPos.left}px` }">
        <div class="tag-popover__title">Manage Multi Tags</div>
        <div class="tag-popover__current">
          <span v-for="t in tagPopoverRow.tags" :key="t.label" class="dv-tag" :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }">
            {{ t.label }}
            <button type="button" class="dv-tag__x" @click="removeRowTag(tagPopoverRow, t.label)">×</button>
          </span>
          <span v-if="!tagPopoverRow.tags.length" class="tag-popover__empty">No tags yet.</span>
        </div>
        <input v-model="tagQuery" type="text" class="tag-popover__search" placeholder="Find or create tag..." />
        <div class="tag-popover__list">
          <button
            v-for="t in filteredTagVocab"
            :key="t.label"
            type="button"
            class="tag-popover__item"
            :class="{ 'tag-popover__item--added': tagPopoverRow.tags.some((x) => x.label === t.label) }"
            @click="pickExistingTag(tagPopoverRow, t)"
          >
            <span class="dv-dot" :style="{ background: t.fg }"></span>{{ t.label }}
            <span v-if="tagPopoverRow.tags.some((x) => x.label === t.label)" class="tag-popover__check">✓</span>
          </button>
          <div v-if="!filteredTagVocab.length" class="tag-popover__empty">No matches — create it below.</div>
        </div>
        <div class="tag-popover__create">
          <div class="tag-popover__colors">
            <button
              v-for="(c, i) in tagColors"
              :key="c.swatch"
              type="button"
              class="tag-popover__swatch"
              :class="{ 'tag-popover__swatch--active': tagNewColor === i }"
              :style="{ background: c.swatch }"
              @click="tagNewColor = i"
            ></button>
          </div>
          <button type="button" class="tag-popover__add" :disabled="!tagQuery.trim()" @click="createRowTag(tagPopoverRow)">Add</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showUrlModal" class="modal-backdrop" @mousedown.self="closeUrlModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Register URL</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeUrlModal">
                <IconX :size="20" />
              </button>
            </div>
            <div class="create-modal__body">
              <label class="create-modal__label">Target URL<span class="create-modal__required">*</span></label>
              <input
                v-model="regUrl"
                type="text"
                class="create-modal__input"
                :class="{ 'create-modal__input--error': regUrlAttempted && !regUrl.trim() }"
                placeholder="e.g. https://protergo.id"
              />
              <p v-if="regUrlAttempted && !regUrl.trim()" class="field-error">Target URL is required.</p>

              <label class="create-modal__label">Asset owner<span class="create-modal__required">*</span></label>
              <input
                v-model="regUrlOwner"
                type="text"
                class="create-modal__input"
                :class="{ 'create-modal__input--error': regUrlAttempted && !regUrlOwner.trim() }"
                placeholder="e.g. Protergo Cyber Security HQ"
              />
              <p v-if="regUrlAttempted && !regUrlOwner.trim()" class="field-error">Asset owner is required.</p>

              <div class="create-modal__actions">
                <button
                  type="button"
                  class="modal-btn"
                  :class="regUrlState === 'saved' ? 'modal-btn--saved' : 'modal-btn--create'"
                  :disabled="regUrlState !== 'idle'"
                  @click="submitUrl"
                >
                  {{ regUrlState === 'saved' ? 'Registered' : regUrlState === 'loading' ? 'Registering…' : 'Register' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showAppModal" class="modal-backdrop" @mousedown.self="closeAppModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Input Application</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeAppModal">
                <IconX :size="20" />
              </button>
            </div>
            <div class="create-modal__body">
              <label class="create-modal__label">Application name<span class="create-modal__required">*</span></label>
              <input
                v-model="appName"
                type="text"
                class="create-modal__input"
                :class="{ 'create-modal__input--error': appAttempted && !appName.trim() }"
                placeholder="e.g. Customer Portal"
              />
              <p v-if="appAttempted && !appName.trim()" class="field-error">Application name is required.</p>

              <label class="create-modal__label">Target<span class="create-modal__required">*</span></label>
              <input
                v-model="appTarget"
                type="text"
                class="create-modal__input"
                :class="{ 'create-modal__input--error': appAttempted && !appTarget.trim() }"
                placeholder="e.g. https://app.protergo.id"
              />
              <p v-if="appAttempted && !appTarget.trim()" class="field-error">Target is required.</p>

              <label class="create-modal__label">Asset owner<span class="create-modal__required">*</span></label>
              <input
                v-model="appOwner"
                type="text"
                class="create-modal__input"
                :class="{ 'create-modal__input--error': appAttempted && !appOwner.trim() }"
                placeholder="e.g. Protergo Cyber Security HQ"
              />
              <p v-if="appAttempted && !appOwner.trim()" class="field-error">Asset owner is required.</p>

              <label class="create-modal__label">Scan type<span class="create-modal__required">*</span></label>
              <div class="form-select">
                <button type="button" class="form-select__trigger" @click="appField = appField === 'type' ? null : 'type'">
                  <span :class="{ 'form-select__trigger-text--placeholder': !appScanType }">
                    {{ scanTypeOptions.find((o) => o.value === appScanType)?.label ?? 'select scan type...' }}
                  </span>
                  <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': appField === 'type' }" />
                </button>
                <div class="select-panel" :class="{ open: appField === 'type' }">
                  <div class="form-select__inline-menu select-panel__inner">
                    <button
                      v-for="opt in scanTypeOptions"
                      :key="opt.value"
                      type="button"
                      class="form-select__inline-item"
                      :class="{ 'form-select__inline-item--active': opt.value === appScanType }"
                      @click="appScanType = opt.value; appField = null"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="create-modal__actions">
                <button
                  type="button"
                  class="modal-btn"
                  :class="appState === 'saved' ? 'modal-btn--saved' : 'modal-btn--create'"
                  :disabled="appState !== 'idle'"
                  @click="submitApp"
                >
                  {{ appState === 'saved' ? 'Saved' : appState === 'loading' ? 'Saving…' : 'Save' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.web-app {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
    line-height: 1.2;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__filters {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.btn-register {
  display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: var(--glacia-radius-pill); border: none;
  background: var(--glacia-red); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(255, 37, 41, 0.4); transition: background 0.15s, box-shadow 0.15s;
  &:hover { background: #e01e22; box-shadow: 0 8px 24px rgba(255, 37, 41, 0.5); }
}

.status-pill {
  display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; white-space: nowrap;
  &--notstarted { background: #ECEEF0; color: #5C6470; }
  &--completed { background: #dcfce7; color: #16a34a; }
  &--scanning { background: #fef3c7; color: #F79009; }
  &--queue { background: #e0f2fe; color: #0c4a6e; }
  &--failed { background: #fee2e2; color: #dc2626; }
  &--waiting { background: #f3e8ff; color: #6b21a8; }
}

.cell-tags {
  display: flex; align-items: center; gap: 6px; flex-wrap: nowrap; justify-content: flex-start;
  overflow: hidden; min-width: 0;

  &--left {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

.tag-popover {
  position: fixed; width: 280px; background: #fff; border-radius: 16px;
  box-shadow: 0 16px 40px -8px rgba(16,24,32,0.28); border: 1px solid var(--glacia-glass-border);
  padding: 14px; z-index: 400; display: flex; flex-direction: column; gap: 10px;

  &__title {
    font-size: 12px; font-weight: 700; font-family: 'Manrope', 'Inter', sans-serif;
    color: var(--glacia-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  &__current { display: flex; flex-wrap: wrap; gap: 6px; }

  &__search {
    width: 100%; height: 38px; padding: 0 12px; border-radius: 10px; box-sizing: border-box;
    border: 1px solid var(--glacia-glass-border); font-size: 13px; font-family: 'Manrope', 'Inter', sans-serif;
    outline: none; color: var(--glacia-ink);
    &::placeholder { color: var(--glacia-ink-dim); }
    &:focus { border-color: var(--glacia-red); }
  }

  &__list { display: flex; flex-direction: column; gap: 2px; max-height: 180px; overflow-y: auto; }

  &__item {
    display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px;
    border-radius: 8px; border: none; background: transparent; font-size: 13px; font-weight: 500;
    font-family: 'Manrope', 'Inter', sans-serif; color: var(--glacia-ink); cursor: pointer; text-align: left;
    &:hover { background: rgba(255,37,41,0.06); }
    &--added { color: var(--glacia-ink-dim); }
  }

  &__check { margin-left: auto; color: #16a34a; font-weight: 700; }

  &__empty { padding: 8px 10px; font-size: 12px; color: var(--glacia-ink-dim); }

  &__create { display: flex; align-items: center; gap: 8px; }

  &__colors { display: flex; gap: 4px; flex-wrap: wrap; flex: 1; }

  &__swatch {
    width: 18px; height: 18px; border-radius: 50%; border: 2px solid transparent;
    cursor: pointer; padding: 0;
    &--active { border-color: var(--glacia-ink); }
  }

  &__add {
    padding: 8px 14px; border-radius: 9px; border: none; background: var(--glacia-red);
    color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; flex-shrink: 0;
    &:disabled { opacity: 0.4; cursor: default; }
  }
}

.dv-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}

.dv-tag__x {
  border: none; background: none; cursor: pointer; color: inherit;
  font-size: 13px; line-height: 1; padding: 0 0 0 2px; opacity: 0.7;
  &:hover { opacity: 1; }
}

.dv-tag {
  padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700;
  font-family: 'Manrope', 'Inter', sans-serif; white-space: nowrap; flex-shrink: 0;
}

.tag-more {
  display: inline-flex; align-items: center; padding: 5px 9px; border-radius: 999px;
  border: none; background: var(--glacia-glass-fill-strong); color: var(--glacia-ink-dim);
  font-size: 11px; font-weight: 700; font-family: 'Manrope', 'Inter', sans-serif;
  flex-shrink: 0;
}

.tag-add {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px;
  border: 1px dashed var(--glacia-glass-border); background: #fff; font-size: 12px; font-weight: 500;
  font-family: 'Manrope', 'Inter', sans-serif; color: var(--glacia-ink-dim); cursor: pointer; white-space: nowrap;
  &:hover { border-color: var(--glacia-red); color: var(--glacia-red); }
}

.dim {
  color: var(--glacia-ink-dim);
}

.action-btn {
  width: 28px; height: 28px; border-radius: 8px; border: none; background: transparent;
  color: var(--glacia-ink-dim); cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  &:hover { background: rgba(0,0,0,0.05); }
}

.action-menu {
  position: fixed; z-index: 400; min-width: 176px; padding: 6px;
  background: #fff; border: 1px solid var(--glacia-glass-border); border-radius: 12px;
  box-shadow: 0 16px 40px -8px rgba(16,24,32,0.28);

  &__item {
    display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px;
    border: none; border-radius: 8px; background: transparent; cursor: pointer;
    font-size: 13px; font-weight: 500; font-family: 'Manrope', 'Inter', sans-serif; color: var(--glacia-ink);
    &:hover { background: rgba(255,37,41,0.06); }
    &--danger { color: var(--glacia-sev-critical); }
  }
}

.modal-backdrop {
  position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 20px;
}
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.create-modal {
  width: 100%; max-width: 460px; background: #fff; border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(16,24,32,0.35); padding: 28px;
  max-height: calc(100vh - 40px);
  display: flex; flex-direction: column;
  overflow: hidden;
  &__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-shrink: 0; }
  &__title { font-family: 'Manrope', 'Inter', sans-serif; font-size: 22px; font-weight: 800; color: var(--glacia-ink); margin: 0; }
  &__close { width: 32px; height: 32px; border-radius: 8px; border: none; background: none; color: var(--glacia-ink); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; &:hover { background: rgba(0,0,0,0.05); } }
  &__body { margin-top: 8px; overflow-y: auto; min-height: 0; flex: 1 1 auto; overscroll-behavior: contain; }
  &__label { display: block; margin: 16px 0 8px; font-size: 14px; font-weight: 700; color: var(--glacia-ink); }
  &__required { color: var(--glacia-red); margin-left: 2px; }
  &__input {
    width: 100%; height: 48px; padding: 0 16px; border-radius: 14px; border: 1px solid var(--glacia-glass-border);
    background: #fff; color: var(--glacia-ink); font-size: 14px; font-family: 'Manrope', 'Inter', sans-serif;
    outline: none; box-sizing: border-box; box-shadow: 0 1px 3px rgba(16,24,32,0.08);
    &::placeholder { color: var(--glacia-ink-dim); }
    &:focus { border-color: var(--glacia-red); box-shadow: 0 2px 6px rgba(16,24,32,0.12); }
    &--error { border-color: var(--glacia-sev-critical); &:focus { border-color: var(--glacia-sev-critical); } }
  }
  &__actions { display: flex; gap: 14px; margin-top: 20px; flex-shrink: 0; }
}

.field-error { margin: 6px 0 0; font-size: 12px; line-height: 1.4; color: var(--glacia-sev-critical); }

.form-select {
  position: relative;
  &__trigger {
    width: 100%; height: 54px; padding: 0 18px; border-radius: 14px; border: 1px solid var(--glacia-glass-border);
    background: #fff; color: var(--glacia-ink); font-size: 15px; font-family: 'Manrope', 'Inter', sans-serif;
    display: flex; align-items: center; justify-content: space-between; gap: 10px; cursor: pointer;
    box-shadow: 0 1px 3px rgba(16,24,32,0.08); box-sizing: border-box;
    &:hover { border-color: var(--glacia-ink-dim); }
  }
  &__trigger-text--placeholder { color: var(--glacia-ink-dim); }
  &__chevron { flex-shrink: 0; color: var(--glacia-ink-dim); transition: transform 0.2s ease; &--open { transform: rotate(180deg); } }
  &__inline-menu { margin-top: 10px; padding: 8px; border-radius: 16px; border: 1px solid var(--glacia-glass-border); background: #fff; max-height: 260px; overflow-y: auto; }
  &__inline-item {
    display: flex; align-items: center; width: 100%; padding: 14px 16px; border-radius: 10px; border: none;
    background: transparent; color: var(--glacia-ink); font-size: 15px; font-weight: 500; text-align: left; cursor: pointer;
    &--active { background: rgba(255,37,41,0.08); color: var(--glacia-red); font-weight: 700; }
    &:hover:not(&--active) { background: rgba(255,37,41,0.06); }
  }
}

.select-panel {
  overflow: hidden; max-height: 0; opacity: 0;
  transition: max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease, margin-top 0.32s cubic-bezier(0.4,0,0.2,1);
  &.open { max-height: 300px; opacity: 1; margin-top: 10px; }
  &__inner { margin-top: 0; }
}

.modal-btn {
  flex: 1; height: 46px; border-radius: 14px; border: none; font-size: 14px; font-weight: 700;
  font-family: 'Manrope', 'Inter', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  &--create { background: var(--glacia-red); color: #fff; box-shadow: 0 6px 20px rgba(255,37,41,0.35); }
  &--saved { background: #16a34a; color: #fff; }
  &:disabled { cursor: default; }
}
</style>
