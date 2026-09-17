<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import {
  IconBell,
  IconChevronDown,
  IconChevronRight,
  IconSettings,
  IconUserCircle,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-vue'
import Avatar from 'primevue/avatar'

defineProps({
  collapsed: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle-sidebar'])

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

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
      <button
        class="navbar__icon-btn"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="emit('toggle-sidebar')"
      >
        <component :is="collapsed ? IconChevronsRight : IconChevronsLeft" :size="18" />
      </button>
      <nav v-if="route.meta.title" class="breadcrumb" aria-label="Breadcrumb">
        <template v-if="route.meta.section">
          <span class="breadcrumb__crumb">{{ route.meta.section }}</span>
          <IconChevronRight :size="14" class="breadcrumb__sep" />
        </template>
        <h1 class="breadcrumb__current">{{ route.meta.title }}</h1>
      </nav>
      <slot />
    </div>

    <div class="navbar__right">
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
                class="user-menu__avatar user-menu__avatar--bounce"
                size="large"
                shape="circle"
              />
              <div class="user-menu__name">{{ auth.user?.name ?? '—' }}</div>
              <div class="user-menu__email">{{ auth.user?.email ?? '—' }}</div>
            </div>

            <!-- Actions -->
            <div class="user-menu__grid">
              <button class="user-menu__card" @click="showMenu = false">
                <IconUserCircle :size="20" />
                <span>Profile</span>
              </button>

              <button class="user-menu__card" @click="showMenu = false">
                <IconSettings :size="20" />
                <span>Settings</span>
              </button>
            </div>

            <button class="user-menu__logout" @click="logout">Log out</button>
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

  &__left  {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

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

// ── Breadcrumb ───────────────────────────────────────────────────────────────

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;

  &__crumb {
    font-size: 14px;
    font-weight: 500;
    color: var(--glacia-ink-dim);
    white-space: nowrap;
  }

  &__sep {
    color: var(--glacia-ink-dim);
    opacity: 0.6;
    flex-shrink: 0;
  }

  &__current {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--glacia-ink);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// ── Dropdown ─────────────────────────────────────────────────────────────────

.user-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 28px -6px rgba(16, 24, 32, 0.2);
  overflow: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 100;

  &__profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
  }

  &__avatar {
    background: var(--glacia-red) !important;
    color: #fff !important;
    font-weight: 700 !important;

    &--bounce {
      animation: menu-avatar-bounce 0.4s ease;
    }
  }

  &__name {
    margin-top: 6px;
    font-size: 14px;
    font-weight: 700;
    color: var(--glacia-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    animation: menu-body-fade 0.3s ease 0.15s both;
  }

  &__email {
    font-size: 12px;
    color: var(--glacia-ink-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    animation: menu-body-fade 0.3s ease 0.2s both;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    animation: menu-body-fade 0.3s ease 0.26s both;
  }

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 8px;
    border: 1px solid var(--glacia-glass-border);
    border-radius: 12px;
    background: none;
    color: var(--glacia-ink-dim);
    font-size: 12px;
    font-family: 'Manrope', 'Inter', sans-serif;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);
    transition: background 0.13s, border-color 0.13s, box-shadow 0.13s;

    &:hover {
      background: rgba(0, 0, 0, 0.03);
      border-color: var(--glacia-ink-dim);
      box-shadow: 0 2px 6px rgba(16, 24, 32, 0.12);
    }
  }

  &__logout {
    border: none;
    border-radius: 12px;
    padding: 10px;
    background: rgba(220, 38, 38, 0.08);
    color: var(--glacia-sev-critical);
    font-weight: 600;
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 13.5px;
    cursor: pointer;
    transition: background 0.13s;
    animation: menu-body-fade 0.3s ease 0.32s both;

    &:hover {
      background: rgba(220, 38, 38, 0.14);
    }
  }
}

@keyframes menu-avatar-bounce {
  0%   { opacity: 0; transform: scale(0.4); }
  60%  { opacity: 1; transform: scale(1.12); }
  100% { transform: scale(1); }
}

@keyframes menu-body-fade {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
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
