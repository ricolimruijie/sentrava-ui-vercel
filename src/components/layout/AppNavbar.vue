<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import {
  IconBell,
  IconSearch,
  IconChevronDown,
  IconSettings,
  IconLogout,
  IconUserCircle,
} from '@tabler/icons-vue'
import Avatar from 'primevue/avatar'

const auth   = useAuthStore()
const router = useRouter()

const showMenu = ref(false)
const menuRef  = ref(null)

const initials = (name) =>
  name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '??'

function handleClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    showMenu.value = false
  }
}

onMounted(()  => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

function logout() {
  showMenu.value = false
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="navbar">
    <div class="navbar__left">
      <slot />
    </div>

    <div class="navbar__right">
      <button class="navbar__icon-btn" aria-label="Search">
        <IconSearch :size="18" />
      </button>

      <button class="navbar__icon-btn navbar__icon-btn--notif" aria-label="Notifications">
        <IconBell :size="18" />
        <span class="notif-dot" />
      </button>

      <div class="navbar__divider" />

      <!-- User button + dropdown -->
      <div ref="menuRef" class="navbar__user-wrap">
        <button
          class="navbar__user"
          :class="{ 'navbar__user--open': showMenu }"
          @click="showMenu = !showMenu"
        >
          <Avatar
            :label="initials(auth.user?.name)"
            class="navbar__avatar"
            size="small"
            shape="circle"
          />
          <span class="navbar__username">{{ auth.user?.name }}</span>
          <IconChevronDown
            :size="14"
            class="navbar__chevron"
            :class="{ 'navbar__chevron--up': showMenu }"
          />
        </button>

        <!-- Dropdown -->
        <transition name="dropdown">
          <div v-if="showMenu" class="user-menu">
            <!-- User info -->
            <div class="user-menu__profile">
              <Avatar
                :label="initials(auth.user?.name)"
                class="user-menu__avatar"
                size="large"
                shape="circle"
              />
              <div class="user-menu__info">
                <span class="user-menu__name">{{ auth.user?.name ?? '—' }}</span>
                <span class="user-menu__email">{{ auth.user?.email ?? '—' }}</span>
                <span class="user-menu__role">{{ auth.user?.role ?? '—' }}</span>
              </div>
            </div>

            <div class="user-menu__divider" />

            <!-- Actions -->
            <button class="user-menu__item" @click="showMenu = false">
              <IconUserCircle :size="16" />
              Profile
            </button>

            <button class="user-menu__item" @click="showMenu = false">
              <IconSettings :size="16" />
              Settings
            </button>

            <div class="user-menu__divider" />

            <button class="user-menu__item user-menu__item--danger" @click="logout">
              <IconLogout :size="16" />
              Log out
            </button>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.navbar {
  height: 60px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: var(--glacia-glass-fill);
  border-bottom: 1px solid var(--glacia-glass-border);
  backdrop-filter: blur(var(--glacia-blur-md)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--glacia-blur-md)) saturate(140%);
  box-shadow: inset 0 -1px 0 var(--glacia-glass-border);
  position: sticky;
  top: 0;
  z-index: 20;

  &__left  { flex: 1; min-width: 0; }
  &__right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  &__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--glacia-radius-sm);
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--glacia-ink-dim);
    position: relative;
    transition: background 0.13s, color 0.13s;

    &:hover { background: var(--glacia-glass-fill-strong); color: var(--glacia-ink); }

    &--notif .notif-dot {
      position: absolute;
      top: 7px; right: 7px;
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--glacia-red);
      border: 2px solid transparent;
    }
  }

  &__divider {
    width: 1px;
    height: 24px;
    background: var(--glacia-glass-border);
    margin: 0 6px;
  }

  &__user-wrap {
    position: relative;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 10px 5px 6px;
    border-radius: var(--glacia-radius-sm);
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--glacia-ink);
    transition: background 0.13s;

    &:hover, &--open { background: var(--glacia-glass-fill-strong); }
  }

  &__avatar {
    background: var(--glacia-red) !important;
    color: #fff !important;
    font-size: var(--text-xs) !important;
    font-weight: 700 !important;
  }

  &__username {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--glacia-ink);
    max-width: 120px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__chevron {
    transition: transform 0.18s ease;
    color: var(--glacia-ink-dim);

    &--up { transform: rotate(180deg); }
  }
}

// ── Dropdown ─────────────────────────────────────────────────────────────────

.user-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  background: rgba(255,255,255,0.90);
  border: 1px solid rgba(255,255,255,0.80);
  border-radius: var(--glacia-radius-md);
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  backdrop-filter: blur(var(--glacia-blur-md));
  -webkit-backdrop-filter: blur(var(--glacia-blur-md));
  padding: 6px;
  z-index: 100;

  &__profile {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 10px 12px;
  }

  &__avatar {
    background: var(--glacia-red) !important;
    color: #fff !important;
    font-weight: 700 !important;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--glacia-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__email {
    font-size: 11px;
    color: var(--glacia-ink-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__role {
    display: inline-block;
    margin-top: 3px;
    padding: 1px 8px;
    background: rgba(255,37,41,0.18);
    color: var(--glacia-red);
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
    text-transform: capitalize;
    width: fit-content;
  }

  &__divider {
    height: 1px;
    background: rgba(0,0,0,0.08);
    margin: 4px 0;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 10px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--glacia-ink-dim);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: background 0.13s, color 0.13s;
    text-align: left;

    &:hover {
      background: rgba(0,0,0,0.05);
      color: var(--glacia-ink);
    }

    &--danger {
      color: var(--glacia-sev-critical);

      &:hover {
        background: rgba(220,38,38,0.08);
        color: var(--glacia-sev-critical);
      }
    }
  }
}

// ── Dropdown animation ────────────────────────────────────────────────────────

.dropdown-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
