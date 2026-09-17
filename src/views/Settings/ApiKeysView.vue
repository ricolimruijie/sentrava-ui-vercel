<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { get } from '@/utils/request'
import { useFetch } from '@/composables/useFetch'
import { usePagination } from '@/composables/usePagination'
import {
  IconCirclePlus, IconDotsVertical, IconPencil, IconKeyOff, IconX, IconCopy, IconCheck, IconAlertTriangle,
} from '@tabler/icons-vue'

const { data, loading } = useFetch(() => get('/settings/api-keys'))

const MAX_KEYS = 100

// ── Create new API key modal ─────────────────────────────────────────────────
// Two steps: 'form' (name the key) -> 'reveal' (show the full key exactly
// once, matching the page's own warning that it can't be viewed again).
const showCreateModal = ref(false)
const modalStep = ref('form')
const newKeyName = ref('')
const revealedKey = ref('')
const createState = ref('idle') // 'idle' | 'loading' — spinner before the reveal step
const copyState = ref('idle') // 'idle' | 'loading' | 'copied'
const canCreate = computed(() => newKeyName.value.trim().length > 0)

function openCreateModal() {
  newKeyName.value = ''
  modalStep.value = 'form'
  createState.value = 'idle'
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  modalStep.value = 'form'
  revealedKey.value = ''
  createState.value = 'idle'
  copyState.value = 'idle'
}

function randomHex(len) {
  let out = ''
  for (let i = 0; i < len; i++) out += Math.floor(Math.random() * 16).toString(16)
  return out
}

function createApiKey() {
  if (!canCreate.value || createState.value !== 'idle') return
  createState.value = 'loading'
  setTimeout(() => {
    const fullKey = `sk-${randomHex(32)}`
    const masked = `sk-${fullKey.slice(3, 9)}*****${fullKey.slice(-12)}`
    const today = new Date().toISOString().slice(0, 10)
    const entry = {
      id: `key-${Date.now()}`,
      name: newKeyName.value.trim(),
      trackingId: `${randomHex(8)}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}-${randomHex(12)}`,
      key: masked,
      created: today,
      lastUsed: today,
      requests: 0,
    }
    data.value = [entry, ...(data.value ?? [])]
    pagination.goTo(1)
    revealedKey.value = fullKey
    createState.value = 'idle'
    modalStep.value = 'reveal'
  }, 600)
}

function triggerCopy() {
  if (copyState.value !== 'idle') return
  copyState.value = 'loading'
  navigator.clipboard.writeText(revealedKey.value).catch(() => {
    // clipboard permission denied / unavailable — the state sequence still
    // plays out below so the button doesn't get stuck
  })
  setTimeout(() => {
    copyState.value = 'copied'
    setTimeout(() => { copyState.value = 'idle' }, 1600)
  }, 600)
}

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

// ── Edit API key modal ───────────────────────────────────────────────────────
const showEditModal = ref(false)
const editingId = ref(null)
const editName = ref('')
const saveState = ref('idle') // 'idle' | 'loading' | 'saved'
const canSave = computed(() => editName.value.trim().length > 0)

function editKey(item) {
  closeMenu()
  editingId.value = item.id
  editName.value = item.name
  saveState.value = 'idle'
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingId.value = null
  editName.value = ''
  saveState.value = 'idle'
}

function saveEdit() {
  if (!canSave.value || saveState.value !== 'idle') return
  saveState.value = 'loading'
  setTimeout(() => {
    const name = editName.value.trim()
    data.value = (data.value ?? []).map((k) => (k.id === editingId.value ? { ...k, name } : k))
    saveState.value = 'saved'
    setTimeout(closeEditModal, 700)
  }, 500)
}

// ── Revoke API key modal ─────────────────────────────────────────────────────
const showRevokeModal = ref(false)
const revokingItem = ref(null)
const revokeState = ref('idle') // 'idle' | 'loading' | 'saved'
const revokeAcknowledged = ref(false)

function revokeKey(item) {
  closeMenu()
  revokingItem.value = item
  revokeState.value = 'idle'
  revokeAcknowledged.value = false
  showRevokeModal.value = true
}

function closeRevokeModal() {
  showRevokeModal.value = false
  revokingItem.value = null
  revokeState.value = 'idle'
  revokeAcknowledged.value = false
}

function confirmRevoke() {
  if (!revokingItem.value || !revokeAcknowledged.value || revokeState.value !== 'idle') return
  revokeState.value = 'loading'
  setTimeout(() => {
    data.value = (data.value ?? []).filter((k) => k.id !== revokingItem.value.id)
    pagination.goTo(pagination.page.value) // re-clamp in case the last page just emptied out
    revokeState.value = 'saved'
    setTimeout(closeRevokeModal, 700)
  }, 500)
}

function handleClickOutside(e) {
  if (!e.target.closest('.action-menu, .action-btn')) closeMenu()
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

const pagination = usePagination({ pageSize: 10 })

const items = computed(() => {
  pagination.setTotal(data.value?.length ?? 0)
  const start = pagination.offset.value
  return (data.value ?? []).slice(start, start + pagination.pageSize.value)
})

function fmt(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
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
</script>

<template>
  <div class="apikeys">
    <div class="apikeys__head">
      <h1 class="apikeys__title">API Keys</h1>
      <button type="button" class="btn-create" @click="openCreateModal">
        <IconCirclePlus :size="16" />
        Create New API Key
      </button>
    </div>

    <p class="apikeys__desc">
      Your API keys are shown below. Each key is displayed in full only once when it is created, so copy and
      store it somewhere safe right away. Keep it private. Never share it with anyone, and avoid putting it in
      browser side or other client facing code where it could be exposed. As a security precaution, SentraVA may
      automatically deactivate any key it detects has been exposed publicly. Accounts can hold up to 100 API keys
      at a time.
    </p>

    <div class="apikeys__wrap">
      <table class="vtable">
        <thead>
          <tr>
            <th class="vtable__num">#</th>
            <th class="vtable__name">Name</th>
            <th class="vtable__tracking">Tracking ID</th>
            <th class="vtable__key">Key</th>
            <th class="vtable__date">Created</th>
            <th class="vtable__date">Last used</th>
            <th class="vtable__requests">API Request</th>
            <th class="vtable__action">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="8" class="vtable__empty">Loading…</td></tr>
          <tr v-else-if="!items.length"><td colspan="8" class="vtable__empty">No API keys yet.</td></tr>
          <tr v-for="(item, i) in items" :key="item.id" class="vtable__row">
            <td class="vtable__num">{{ pagination.offset.value + i + 1 }}.</td>
            <td class="vtable__name">{{ item.name }}</td>
            <td class="vtable__tracking">{{ item.trackingId }}</td>
            <td class="vtable__key">{{ item.key }}</td>
            <td class="vtable__date">{{ fmt(item.created) }}</td>
            <td class="vtable__date">{{ fmt(item.lastUsed) }}</td>
            <td class="vtable__requests">{{ item.requests }}</td>
            <td class="vtable__action">
              <button
                type="button"
                class="action-btn"
                aria-label="Actions"
                @click.stop="toggleMenu(item, $event)"
              >
                <IconDotsVertical :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="pagination.totalPages.value > 1" class="apikeys__pagination">
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

    <Teleport to="body">
      <div v-if="openMenuId" class="action-menu" :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }">
        <button type="button" class="action-menu__item" @click="editKey(items.find((i) => i.id === openMenuId))">
          <IconPencil :size="15" />
          Edit
        </button>
        <button
          type="button"
          class="action-menu__item action-menu__item--danger"
          @click="revokeKey(items.find((i) => i.id === openMenuId))"
        >
          <IconKeyOff :size="15" />
          Revoke API Key
        </button>
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showCreateModal" class="modal-backdrop" @mousedown.self="closeCreateModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Create new API key</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeCreateModal">
                <IconX :size="20" />
              </button>
            </div>

            <template v-if="modalStep === 'form'">
              <p class="create-modal__note">Each account can retain up to {{ MAX_KEYS }} API Keys.</p>

              <input
                v-model="newKeyName"
                type="text"
                class="create-modal__input"
                placeholder="Name of the API key"
                @keyup.enter="createApiKey"
              />

              <div class="create-modal__actions">
                <button type="button" class="modal-btn modal-btn--cancel" @click="closeCreateModal">Cancel</button>
                <button
                  type="button"
                  class="modal-btn"
                  :class="canCreate ? 'modal-btn--save' : 'modal-btn--create'"
                  :disabled="!canCreate"
                  @click="createApiKey"
                >
                  <span v-if="createState === 'loading'" class="copy-btn__spinner" />
                  <span v-else>Create API key</span>
                </button>
              </div>
            </template>

            <template v-else>
              <p class="create-modal__note">
                Save this key somewhere safe and accessible. For security reasons, you won't be able to view it
                again through your account. If you lose it, you'll need to generate a new one.
              </p>

              <div class="create-modal__reveal">
                <input type="text" class="create-modal__input" :value="revealedKey" readonly @click="$event.target.select()" />

                <button
                  type="button"
                  class="copy-btn"
                  :class="{ 'copy-btn--copied': copyState === 'copied' }"
                  @click="triggerCopy"
                >
                  <span v-if="copyState === 'loading'" class="copy-btn__spinner" />
                  <IconCheck v-else-if="copyState === 'copied'" :size="18" class="copy-btn__check" />
                  <template v-else>
                    <IconCopy :size="18" />
                    <span>Copy</span>
                  </template>
                </button>
              </div>

              <div class="create-modal__divider" />

              <div class="create-modal__warning">
                <IconAlertTriangle :size="18" class="create-modal__warning-icon" />
                <span>Do not share this key with others, or expose it in the browser or other client-side code.</span>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showEditModal" class="modal-backdrop" @mousedown.self="closeEditModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Edit API Key</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeEditModal">
                <IconX :size="20" />
              </button>
            </div>

            <label class="edit-modal__label" for="edit-api-key-name">Name</label>
            <input
              id="edit-api-key-name"
              v-model="editName"
              type="text"
              class="create-modal__input"
              placeholder="API Name"
              @keyup.enter="saveEdit"
            />

            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeEditModal">Cancel</button>
              <button
                type="button"
                class="modal-btn modal-btn--save"
                :class="{ 'modal-btn--saved': saveState === 'saved' }"
                :disabled="!canSave"
                @click="saveEdit"
              >
                <span v-if="saveState === 'loading'" class="copy-btn__spinner" />
                <IconCheck v-else-if="saveState === 'saved'" :size="18" class="copy-btn__check" />
                <span v-else>Save</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showRevokeModal" class="modal-backdrop" @mousedown.self="closeRevokeModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Revoke API Key</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeRevokeModal">
                <IconX :size="20" />
              </button>
            </div>

            <p class="create-modal__note">
              This API key will immediately be disabled. API requests made using this key will be rejected,
              which could cause any systems still depending on it to break. Once revoked, you'll no longer be
              able to view or modify this API key.
            </p>

            <label class="revoke-ack">
              <input v-model="revokeAcknowledged" type="checkbox" class="revoke-ack__box" />
              <span>I understand this action is permanent and cannot be undone.</span>
            </label>

            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeRevokeModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="revokeAcknowledged
                  ? { 'modal-btn--save': true, 'modal-btn--saved': revokeState === 'saved' }
                  : 'modal-btn--create'"
                :disabled="!revokeAcknowledged"
                @click="confirmRevoke"
              >
                <span v-if="revokeState === 'loading'" class="copy-btn__spinner" />
                <IconCheck v-else-if="revokeState === 'saved'" :size="18" class="copy-btn__check" />
                <span v-else>Revoke</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.apikeys {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__desc {
    margin: 6px 0 16px;
    max-width: 900px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--glacia-ink-dim);
  }

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

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 18px;
  background: var(--glacia-red);
  color: #fff;
  border: none;
  border-radius: var(--glacia-radius-pill);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 6px 20px rgba(255, 37, 41, 0.4);
  transition: background 0.15s, box-shadow 0.15s;

  &:hover {
    background: #e01e22;
    box-shadow: 0 8px 24px rgba(255, 37, 41, 0.5);
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

  &__num {
    width: 60px;
    color: var(--glacia-ink-dim);
    font-weight: 500;
  }

  &__name {
    width: 190px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__tracking {
    width: 250px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 12px;
    color: var(--glacia-ink-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__key {
    width: 230px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 12px;
    color: var(--glacia-ink-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__date {
    width: 140px;
    color: var(--glacia-ink-dim);
    white-space: nowrap;
  }

  &__requests {
    width: 110px;
    font-weight: 600;
  }

  // th/td specificity beats the plain class above for text-align, so pin it
  // here explicitly.
  th.vtable__requests,
  td.vtable__requests {
    text-align: center;
  }

  &__action {
    width: 70px;
    text-align: center;
  }
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
  background: #fff;
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

// ── Create API key modal ─────────────────────────────────────────────────────

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

.create-modal {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  padding: 28px;
  animation: create-modal-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 26px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__close {
    width: 32px;
    height: 32px;
    border-radius: var(--glacia-radius-sm);
    border: none;
    background: none;
    color: var(--glacia-ink-dim);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.13s, color 0.13s;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--glacia-ink);
    }
  }

  &__note {
    margin: 14px 0 12px;
    font-size: 14px;
    color: var(--glacia-ink-dim);
  }

  &__input {
    width: 100%;
    height: 54px;
    padding: 0 18px;
    border-radius: 14px;
    border: 1px solid var(--glacia-glass-border);
    background: #fff;
    color: var(--glacia-ink);
    font-size: 15px;
    font-family: 'Manrope', 'Inter', sans-serif;
    outline: none;
    box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);
    transition: border-color 0.13s, box-shadow 0.13s;

    &::placeholder {
      color: var(--glacia-ink-dim);
    }

    &:focus {
      border-color: var(--glacia-red);
      box-shadow: 0 2px 6px rgba(16, 24, 32, 0.12);
    }
  }

  &__actions {
    display: flex;
    gap: 14px;
    margin-top: 20px;
  }

  &__reveal {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .create-modal__input {
      color: var(--glacia-ink);
      font-weight: 600;
      cursor: text;
    }
  }

  &__divider {
    height: 1px;
    background: var(--glacia-glass-border);
    margin: 20px 0 16px;
  }

  &__warning {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--glacia-ink-dim);
  }

  &__warning-icon {
    flex-shrink: 0;
    margin-top: 1px;
    color: #f5a623;
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
    background: #ff2e3a;
    color: #fff;
    box-shadow: 0 8px 20px -6px rgba(255, 46, 58, 0.4);

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }

    // Excludes --saved so a lingering :hover (the mouse doesn't move after
    // a click) can't out-specificity the green "saved" background below.
    &:not(:disabled):not(.modal-btn--saved):hover {
      background: #e6212c;
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

    &:not(:disabled):hover {
      background: rgba(255, 37, 41, 0.08);
      border-color: rgba(255, 37, 41, 0.3);
      color: var(--glacia-red);
    }
  }

}

.copy-btn {
  width: 100%;
  box-sizing: border-box;
  height: 56px;
  padding: 12px;
  border: none;
  border-radius: 16px;
  background: var(--glacia-red);
  color: #fff;
  font-family: 'Manrope', 'Inter', sans-serif;
  font-weight: 700;
  font-size: 17px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 8px 20px -6px rgba(255, 37, 41, 0.45);
  white-space: nowrap;
  transition: background 0.2s ease;

  &--copied {
    background: #16a34a;
  }
}

.copy-btn__spinner {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  animation: copy-btn-spin 0.7s linear infinite;
}

.copy-btn__check {
  animation: btn-pop 0.4s ease;
}

@keyframes copy-btn-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes btn-pop {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}

@keyframes create-modal-bounce {
  0%   { opacity: 0; transform: scale(0.92) translateY(10px); }
  60%  { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
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

.edit-modal__label {
  display: block;
  margin: 16px 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--glacia-ink);
}

.revoke-ack {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 14px 0 12px;
  padding: 18px 18px;
  border-radius: 14px;
  background: rgba(220, 38, 38, 0.06);
  cursor: pointer;
  user-select: none;
}

.revoke-ack__box {
  width: 18px;
  height: 18px;
  margin-top: 1px;
  flex-shrink: 0;
  accent-color: var(--glacia-sev-critical);
  cursor: pointer;
}

.revoke-ack span {
  font-size: 13px;
  line-height: 1.5;
  color: var(--glacia-ink);
}
</style>
