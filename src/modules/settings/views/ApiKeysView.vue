<script setup>
import { useRole } from '@/composables/useRole'
import { formatDateLong } from '@/utils/helpers'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getApiKeys } from '@/modules/settings/services/apiKeysService'
import { useFetch } from '@/composables/useFetch'
import DataTable from '@/components/common/DataTable.vue'
import GlassField from '@/components/common/GlassField.vue'
import {
  IconCirclePlus, IconDotsVertical, IconPencil, IconKeyOff, IconX, IconCopy, IconCheck, IconAlertTriangle, IconKey,
} from '@tabler/icons-vue'

const { can } = useRole()

const { data, loading } = useFetch(() => getApiKeys())

const MAX_KEYS = 100

const tableRef = ref(null)

const allColumns = [
  { key: '__index', label: '#', width: '24px', dim: true },
  { key: 'name', label: 'Name', width: '14%', dim: true, truncate: true },
  { key: 'trackingId', label: 'Tracking ID', width: '18%', dim: true, truncate: true },
  { key: 'key', label: 'Key', width: '16%', dim: true, truncate: true },
  { key: 'created', label: 'Created', width: '12%', dim: true, truncate: true},
  { key: 'lastUsed', label: 'Last used', width: '12%', dim: true, truncate: true},
  { key: 'requests', label: 'API Request', width: '10%', align: 'center', dim: true },
  { key: 'action', label: 'Action', width: '90px', align: 'center' },
]
// The action column only holds actions this role may not use.
const columns = computed(() => allColumns.filter((c) => c.key !== 'action' || can('manage_api_keys')))

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
  // Safety: if something stalls, don't leave the button spinning forever
  const safety = setTimeout(() => { if (createState.value === 'loading') createState.value = 'idle' }, 3000)
  setTimeout(() => {
    clearTimeout(safety)
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
    tableRef.value?.pagination.goTo(1)
    revealedKey.value = fullKey
    createState.value = 'idle'
    modalStep.value = 'reveal'
  }, 600)
}

function triggerCopy() {
  if (copyState.value !== 'idle') return
  copyState.value = 'loading'
  const safety = setTimeout(() => { if (copyState.value === 'loading') copyState.value = 'idle' }, 3000)
  const doCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(revealedKey.value)
      } else {
        const ta = document.createElement('textarea')
        ta.value = revealedKey.value
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        ta.remove()
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 600))
    clearTimeout(safety)
    copyState.value = 'copied'
    setTimeout(() => { copyState.value = 'idle' }, 1600)
  }
  doCopy()
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
    tableRef.value?.pagination.goTo(tableRef.value.pagination.page.value) // re-clamp in case the last page just emptied out
    revokeState.value = 'saved'
    setTimeout(closeRevokeModal, 700)
  }, 500)
}

function handleClickOutside(e) {
  if (!e.target.closest('.action-menu, .action-btn')) closeMenu()
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div class="apikeys">
    <div class="apikeys__head">
      <h1 class="apikeys__title">API Keys</h1>
      <button v-if="can('manage_api_keys')" type="button" class="btn-create" @click="openCreateModal">
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

    <DataTable
      ref="tableRef"
      :columns="columns"
      :items="data ?? []"
      :loading="loading"
      empty-text="No API keys yet." :empty-icon="IconKey"
    >
      <template #cell-created="{ row }">{{ formatDateLong(row.created) }}</template>
      <template #cell-lastUsed="{ row }">{{ formatDateLong(row.lastUsed) }}</template>
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
        <button v-if="can('manage_api_keys')" type="button" class="action-menu__item" @click="editKey((data ?? []).find((i) => i.id === openMenuId))">
          <IconPencil :size="15" />
          Edit
        </button>
        <button
          v-if="can('manage_api_keys')"
          type="button"
          class="action-menu__item action-menu__item--danger"
          @click="revokeKey((data ?? []).find((i) => i.id === openMenuId))"
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

              <GlassField
                v-model="newKeyName"
                label="API key name"
                placeholder="Name of the API key"
                required
                error-text="A name is required"
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

            <GlassField
              v-model="editName"
              label="Name"
              placeholder="API Name"
              required
              error-text="A name is required"
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
              <div class="revoke-modal__head-left">
                <div class="revoke-modal__icon">
                  <IconKeyOff :size="22" />
                </div>
                <h2 class="create-modal__title">Revoke API key</h2>
              </div>
              <button type="button" class="create-modal__close create-modal__close--circle" aria-label="Close" @click="closeRevokeModal">
                <IconX :size="20" />
              </button>
            </div>

            <p class="create-modal__note">
              This key will be disabled immediately. Requests using it will be rejected, which could break
              systems still depending on it. Once revoked, you won't be able to view or restore it.
            </p>

            <label class="revoke-ack">
              <input v-model="revokeAcknowledged" type="checkbox" class="revoke-ack__box" />
              <span>This action is permanent and cannot be undone.</span>
            </label>

            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--neutral" @click="closeRevokeModal">Cancel</button>
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

<style scoped lang="scss" src="./ApiKeysView.scss"></style>
