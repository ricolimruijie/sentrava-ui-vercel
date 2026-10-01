<script setup>
import { ref, computed } from 'vue'
import GlassField from '@/components/common/GlassField.vue'
import { IconX, IconCheck, IconShield, IconAt, IconMail } from '@tabler/icons-vue'

// Edit-member and delete-user modals used by the member tables (Company
// overview + a company's members page). The parent opens them through the
// exposed methods and applies the result to its own list via the emits.
const emit = defineEmits(['edited', 'removed'])

const roleMeta = {
  admin:  { label: 'Admin',  color: 'var(--glacia-red)', bg: 'rgba(255, 37, 41, 0.1)' },
  member: { label: 'Member', color: 'var(--glacia-ink-dim)', bg: 'rgba(15, 23, 42, 0.06)' },
}
function roleOf(role) {
  return roleMeta[role] ?? roleMeta.member
}

function initials(row) {
  if (row.name) {
    const parts = row.name.trim().split(/\s+/)
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
  }
  return row.username.slice(0, 2).toUpperCase()
}

// ── Edit member modal — idle/loading/saved, pre-filled, auto-close
const showEditMemberModal = ref(false)
const editingMember = ref(null)
const editMemberName = ref('')
const editMemberState = ref('idle') // 'idle' | 'loading' | 'saved'
const canSaveMember = computed(() => editMemberName.value.trim().length > 0)

function openEdit(item) {
  editingMember.value = item
  editMemberName.value = item.name ?? ''
  editMemberState.value = 'idle'
  showEditMemberModal.value = true
}

function closeEditMemberModal() {
  showEditMemberModal.value = false
  editingMember.value = null
  editMemberName.value = ''
  editMemberState.value = 'idle'
}

function saveEditMember() {
  if (!canSaveMember.value || editMemberState.value !== 'idle' || !editingMember.value) return
  editMemberState.value = 'loading'
  setTimeout(() => {
    emit('edited', { id: editingMember.value.id, name: editMemberName.value.trim() || null })
    editMemberState.value = 'saved'
    setTimeout(closeEditMemberModal, 700)
  }, 500)
}

// ── Delete user modal
const showDeleteUserModal = ref(false)
const deletingMember = ref(null)
const deleteUserConfirmed = ref(false)
const deleteUserState = ref('idle') // 'idle' | 'loading' | 'saved'

function openDelete(item) {
  deletingMember.value = item
  deleteUserConfirmed.value = false
  deleteUserState.value = 'idle'
  showDeleteUserModal.value = true
}
function closeDeleteUserModal() {
  showDeleteUserModal.value = false
  deletingMember.value = null
}
function submitDeleteUser() {
  if (!deleteUserConfirmed.value || deleteUserState.value !== 'idle' || !deletingMember.value) return
  deleteUserState.value = 'loading'
  setTimeout(() => {
    emit('removed', deletingMember.value.id)
    deleteUserState.value = 'saved'
    setTimeout(closeDeleteUserModal, 700)
  }, 500)
}

defineExpose({ openEdit, openDelete })
</script>

<template>
  <div>
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showEditMemberModal" class="modal-backdrop" @mousedown.self="closeEditMemberModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Edit Member</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeEditMemberModal">
                <IconX :size="20" />
              </button>
            </div>

            <GlassField
              v-model="editMemberName"
              label="Name"
              placeholder="Member name"
              required
              error-text="Member name is required"
              @enter="canSaveMember && saveEditMember()"
            />

            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeEditMemberModal">Cancel</button>
              <button
                type="button"
                class="modal-btn modal-btn--save"
                :class="{ 'modal-btn--saved': editMemberState === 'saved' }"
                :disabled="!canSaveMember"
                @click="saveEditMember"
              >
                <span v-if="editMemberState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="editMemberState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Save</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteUserModal" class="modal-backdrop" @mousedown.self="closeDeleteUserModal">
          <div class="create-modal create-modal--wide">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Delete User</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeDeleteUserModal">
                <IconX :size="20" />
              </button>
            </div>
            <div class="account-card">
              <div class="account-card__header">
                <span class="account-card__id">ACCOUNT ID</span>
                <IconShield :size="18" class="account-card__shield" />
              </div>
              <div class="account-card__avatar-wrap">
                <span class="account-card__avatar" :class="{ 'account-card__avatar--named': !!deletingMember?.name }">{{ deletingMember ? initials(deletingMember) : '—' }}</span>
              </div>
              <div class="account-card__body">
                <div class="account-card__name">{{ deletingMember?.name ?? deletingMember?.username ?? '—' }}</div>
                <div class="account-card__company">{{ deletingMember?.company ?? '—' }}</div>
                <span class="role-pill" :style="{ background: roleOf(deletingMember?.role ?? 'member').bg, color: roleOf(deletingMember?.role ?? 'member').color }">
                  {{ roleOf(deletingMember?.role ?? 'member').label }}
                </span>

                <div class="account-card__divider" />

                <div class="account-card__row">
                  <span class="account-card__row-label"><IconAt :size="14" /> Username</span>
                  <span class="account-card__row-value">{{ deletingMember?.username ?? '—' }}</span>
                </div>
                <div class="account-card__row">
                  <span class="account-card__row-label"><IconMail :size="14" /> Email</span>
                  <span class="account-card__row-value">{{ deletingMember?.email ?? '—' }}</span>
                </div>

                <div class="account-card__2fa">
                  <span class="account-card__2fa-label"><IconShield :size="14" /> Two-factor authentication</span>
                  <span class="account-card__2fa-value">Active</span>
                </div>
              </div>
            </div>

            <label class="revoke-ack" style="margin-top: 18px;">
              <input v-model="deleteUserConfirmed" type="checkbox" class="revoke-ack__box" />
              <span>I understand that this action will permanently remove the user and cannot be undone.</span>
            </label>

            <div class="create-modal__actions">
              <button
                type="button"
                class="modal-btn"
                :class="deleteUserConfirmed
                  ? { 'modal-btn--save': true, 'modal-btn--saved': deleteUserState === 'saved' }
                  : 'modal-btn--create'"
                :disabled="!deleteUserConfirmed"
                @click="submitDeleteUser"
              >
                <span v-if="deleteUserState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="deleteUserState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Delete</span>
              </button>
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeDeleteUserModal">Cancel</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss" src="./MemberActionModals.scss"></style>
