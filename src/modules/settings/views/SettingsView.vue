<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconUserCircle, IconShieldLock, IconKey } from '@tabler/icons-vue'
import ProfileSection from '@/modules/settings/components/ProfileSection.vue'
import PasswordSection from '@/modules/settings/components/PasswordSection.vue'
import TwoFactorSection from '@/modules/settings/components/TwoFactorSection.vue'

// Settings — open to every role. The active section lives in `?section=` so the
// navbar breadcrumb can show it (see router meta.tabQuery) and links can deep-link.
const route = useRoute()
const router = useRouter()

const sections = [
  { key: 'profile',    label: 'Profile',                      icon: IconUserCircle },
  { key: 'password',   label: 'Change password',              icon: IconKey },
  { key: 'two-factor', label: 'Two-factor authentication',    icon: IconShieldLock },
]

const active = computed(() => (sections.some((s) => s.key === route.query.section) ? route.query.section : 'profile'))

function select(key) {
  if (key !== active.value) router.replace({ query: { ...route.query, section: key } })
}
</script>

<template>
  <div class="settings">
    <div class="settings__head">
      <h1 class="settings__title">Settings</h1>
      <p class="settings__desc">Manage your personal details and how your account is protected.</p>
    </div>

    <div class="settings__body">
      <nav class="settings-nav card" aria-label="Settings sections">
        <button
          v-for="s in sections"
          :key="s.key"
          type="button"
          class="settings-nav__item"
          :class="{ 'settings-nav__item--active': s.key === active }"
          :aria-current="s.key === active ? 'page' : undefined"
          @click="select(s.key)"
        >
          <component :is="s.icon" :size="18" />
          <span>{{ s.label }}</span>
        </button>
      </nav>

      <section class="settings__content card">
        <ProfileSection v-if="active === 'profile'" />
        <PasswordSection v-else-if="active === 'password'" />
        <TwoFactorSection v-else />
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 26px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__desc {
    margin: 6px 0 0;
    font-size: 14px;
    color: var(--glacia-ink-dim);
  }

  &__body {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 18px;
    align-items: start;
  }

  &__content {
    padding: 28px 30px 30px;
  }
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 11px 12px;
    border: 0;
    border-radius: var(--glacia-radius-sm);
    background: transparent;
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--glacia-ink-dim);
    text-align: left;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover { background: rgba(var(--tint), 0.05); color: var(--glacia-ink); }

    &--active {
      background: rgba(255, 37, 41, 0.1);
      color: var(--glacia-red);

      &:hover { background: rgba(255, 37, 41, 0.12); color: var(--glacia-red); }
    }
  }
}

@media (max-width: 860px) {
  .settings__body { grid-template-columns: 1fr; }
  .settings-nav { flex-direction: row; overflow-x: auto; }
  .settings-nav__item { width: auto; white-space: nowrap; }
}
</style>
