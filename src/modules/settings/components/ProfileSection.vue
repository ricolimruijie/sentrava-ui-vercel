<script setup>
import { ref, computed } from 'vue'
import { IconCheck } from '@tabler/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useRole } from '@/composables/useRole'
import GlassField from '@/components/common/GlassField.vue'

const auth = useAuthStore()
const { isSuperAdmin, isAdmin } = useRole()

const roleLabel = computed(() => (isSuperAdmin.value ? 'Super Admin' : isAdmin.value ? 'Admin' : 'Member'))
const username = computed(() => auth.user?.username ?? (auth.user?.email ?? '').split('@')[0])
const company = computed(() => auth.user?.companies?.[0]?.name ?? 'All companies')

function initials(name) {
  const parts = (name ?? '').trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

// Only the display name is editable; the rest is managed by your company admin.
const name = ref(auth.user?.name ?? '')
const state = ref('idle') // 'idle' | 'loading' | 'saved'
const dirty = computed(() => name.value.trim() !== (auth.user?.name ?? ''))
const canSave = computed(() => dirty.value && !!name.value.trim() && state.value === 'idle')

function save() {
  if (!canSave.value) return
  state.value = 'loading'
  setTimeout(() => {
    auth.updateProfile({ name: name.value.trim() })
    state.value = 'saved'
    setTimeout(() => { state.value = 'idle' }, 1400)
  }, 500)
}
</script>

<template>
  <div class="profile">
    <header class="sec-head">
      <h2 class="sec-head__title">Profile</h2>
      <p class="sec-head__desc">Your personal details as they appear across SentraVA.</p>
    </header>

    <div class="profile__who">
      <span class="profile__avatar">{{ initials(auth.user?.name) }}</span>
      <div class="profile__who-text">
        <div class="profile__name">{{ auth.user?.name ?? '—' }}</div>
        <div class="profile__email">{{ auth.user?.email ?? '—' }}</div>
      </div>
      <span class="profile__role">{{ roleLabel }}</span>
    </div>

    <div class="profile__grid">
      <GlassField
        v-model="name"
        label="Full name"
        placeholder="Your full name"
        required
        error-text="Full name is required"
        @enter="save"
      />

      <div class="ro">
        <span class="ro__label">Username</span>
        <div class="ro__box">{{ username }}</div>
      </div>

      <div class="ro">
        <span class="ro__label">Email address</span>
        <div class="ro__box">{{ auth.user?.email ?? '—' }}</div>
      </div>

      <div class="ro">
        <span class="ro__label">Company</span>
        <div class="ro__box">{{ company }}</div>
      </div>

      <div class="ro">
        <span class="ro__label">Role</span>
        <div class="ro__box">{{ roleLabel }}</div>
      </div>
    </div>

    <p class="profile__note">Username, email, company and role are managed by your company administrator.</p>

    <div class="profile__actions">
      <button type="button" class="btn-save" :class="{ 'btn-save--saved': state === 'saved' }" :disabled="!canSave && state === 'idle'" @click="save">
        <span v-if="state === 'loading'" class="btn-save__spinner" />
        <template v-else-if="state === 'saved'"><IconCheck :size="16" /> Saved</template>
        <template v-else>Save changes</template>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sec-head {
  margin-bottom: 22px;

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__desc {
    margin: 4px 0 0;
    font-size: 13.5px;
    color: var(--glacia-ink-dim);
  }
}

.profile {
  &__who {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    margin-bottom: 24px;
    border-radius: 16px;
    background: rgba(var(--glass-rgb), 0.55);
    border: 1px solid var(--glacia-glass-border);
  }

  &__avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 37, 41, 0.12);
    color: var(--glacia-red);
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 800;
  }

  &__who-text { flex: 1; min-width: 0; }

  &__name {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 800;
    color: var(--glacia-ink);
  }

  &__email {
    margin-top: 2px;
    font-size: 13px;
    color: var(--glacia-ink-dim);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__role {
    padding: 5px 14px;
    border-radius: var(--glacia-radius-pill);
    background: rgba(255, 37, 41, 0.1);
    color: var(--glacia-red);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 20px;
  }

  &__note {
    margin: 18px 0 0;
    font-size: 12.5px;
    color: var(--glacia-ink-dim);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 22px;
  }
}

// Read-only fields: same label + box proportions as GlassField, muted.
.ro {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__label {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: var(--glacia-ink);
  }

  &__box {
    display: flex;
    align-items: center;
    height: 44px;
    padding: 0 16px;
    border-radius: var(--glacia-radius-sm, 12px);
    border: 1px solid rgba(var(--tint), 0.1);
    background: rgba(var(--tint), 0.04);
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 14px;
    color: var(--glacia-ink-dim);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.btn-save {
  min-width: 140px;
  height: 40px;
  padding: 0 22px;
  border: 0;
  border-radius: var(--glacia-radius-pill);
  background: var(--glacia-red);
  color: #fff;
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 6px 20px rgba(255, 37, 41, 0.35);
  transition: background 0.15s, opacity 0.15s;

  &:hover:not(:disabled) { background: #e01e22; }
  &:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
  &--saved { background: #16a34a !important; box-shadow: none; opacity: 1 !important; }

  &__spinner {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid rgba(var(--glass-rgb), 0.45);
    border-top-color: #fff;
    animation: save-spin 0.7s linear infinite;
  }
}

@keyframes save-spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .profile__grid { grid-template-columns: 1fr; }
}
</style>
