<script setup>
import { ref, computed } from 'vue'
import GlassField from '@/components/reusable/GlassField.vue'
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

<style scoped lang="scss">
.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: var(--glacia-radius-pill);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

// ── Edit Company Name modal ──────────────────────────────────────────────────
// Same structure/behaviour as ApiKeysView.vue's Edit API Key modal.

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
  background: var(--surface);
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  padding: 28px;
  animation: create-modal-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition: height 0.38s cubic-bezier(0.4, 0, 0.2, 1);

  &--wide {
    max-width: 720px;
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
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

  &__input {
    width: 100%;
    height: 54px;
    padding: 0 18px;
    border-radius: 14px;
    border: 1px solid var(--glacia-glass-border);
    background: var(--surface);
    color: var(--glacia-ink);
    font-size: 15px;
    font-family: 'Manrope', 'Inter', sans-serif;
    outline: none;
    box-sizing: border-box;
    box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);
    transition: border-color 0.13s, box-shadow 0.13s;

    &::placeholder {
      color: var(--glacia-ink-dim);
    }

    &:focus {
      border-color: #2563EB;
      box-shadow: 0 2px 6px rgba(16, 24, 32, 0.12);
    }

    &--readonly {
      background: var(--surface-2);
      color: var(--glacia-ink-dim);
      cursor: default;

      &:focus {
        border-color: var(--glacia-glass-border);
        box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);
      }
    }

    &--error {
      border-color: var(--glacia-sev-critical);
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.12);

      &:focus {
        border-color: var(--glacia-sev-critical);
        box-shadow: 0 2px 6px rgba(220, 38, 38, 0.18);
      }
    }
  }

  &__actions {
    display: flex;
    gap: 14px;
    margin-top: 20px;
  }
}

@keyframes create-modal-bounce {
  0%   { opacity: 0; transform: scale(0.92) translateY(10px); }
  60%  { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
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

.modal-btn__spinner--dark {
  border-color: rgba(var(--glass-rgb), 0.4);
  border-top-color: #fff;
}

.revoke-ack {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 8px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1.5px solid var(--glacia-red);
  background: var(--surface);
  cursor: pointer;
  user-select: none;
}

.revoke-ack__box {
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

.revoke-ack span {
  font-size: 14px;
  line-height: 1.5;
  color: var(--glacia-ink);
}

.account-card {
  margin-top: 16px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid var(--glacia-glass-border);
  background: var(--surface);
  box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);

  &__header {
    height: 56px;
    background: linear-gradient(135deg, #e53925, #d63a2e);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 18px;
    color: #fff;
  }

  &__id {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
  }

  &__shield {
    color: #fff;
    opacity: 0.95;
  }

  &__avatar-wrap {
    display: flex;
    justify-content: center;
    margin-top: -28px;
  }

  &__avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--surface-3);
    border: 3px solid #fff;
    box-shadow: 0 4px 12px rgba(16, 24, 32, 0.12);
    color: var(--glacia-ink-dim);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 800;

    &--named {
      background: #ffe9ea;
      color: var(--glacia-red);
    }
  }

  &__body {
    padding: 12px 18px 16px;
    text-align: center;
  }

  &__name {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 18px;
    font-weight: 800;
    color: var(--glacia-ink);
  }

  &__company {
    margin-top: 2px;
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  .role-pill {
    margin-top: 10px;
  }

  &__divider {
    height: 1px;
    background: repeating-linear-gradient(90deg, var(--glacia-glass-border) 0 6px, transparent 6px 10px);
    margin: 14px 0;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    text-align: left;
  }

  &__row-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  &__row-value {
    font-size: 13px;
    font-weight: 700;
    color: var(--glacia-ink);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__2fa {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
    padding: 10px 14px;
    border-radius: 12px;
    background: var(--green-soft);
  }

  &__2fa-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--glacia-ink);
  }

  &__2fa-value {
    font-size: 13px;
    font-weight: 700;
    color: #2e7d32;
  }
}

.create-modal__body {
  overflow-x: hidden;
  // Setting only overflow-x makes the browser auto-compute overflow-y as
  // "auto" (not "visible") per spec — which would clip a GlassField
  // dropdown menu wherever it overflows past this box. Keep it explicit.
  overflow-y: visible;
  padding: 2px 2px 0;
  margin: 0 -2px;
}
</style>
