<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import Button    from 'primevue/button'
import { IconShieldSearch } from '@tabler/icons-vue'
import GlassField from '@/components/reusable/GlassField.vue'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const form  = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

// Demo role shortcuts (static mode only)
const IS_STATIC = import.meta.env.VITE_IS_STATIC === 'true'
const demoAccounts = [
  { label: 'Super Admin', email: 'superadmin@sentra.io', password: 'demo' },
  { label: 'Admin',       email: 'admin@acme.com',       password: 'demo' },
  { label: 'Analyst',     email: 'analyst@acme.com',     password: 'demo' },
  { label: 'Member',      email: 'member@acme.com',      password: 'demo' },
]

async function submit() {
  error.value   = ''
  loading.value = true
  try {
    await auth.login(form.email, form.password)
    const redirect = route.query.redirect ?? '/dashboard'
    router.push(redirect)
  } catch (e) {
    error.value = e?.message ?? 'Invalid credentials. Please try again.'
  } finally {
    loading.value = false
  }
}

function useDemo(account) {
  form.email    = account.email
  form.password = account.password
  submit()
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Brand -->
      <div class="login-card__brand">
        <div class="brand-mark">S</div>
        <span class="brand-name">SentraVA</span>
      </div>

      <h1 class="login-card__title">Sign in to your account</h1>
      <p class="login-card__sub">Centralized Vulnerability Assessment</p>

      <!-- Error -->
      <div v-if="error" class="login-card__error">{{ error }}</div>

      <!-- Form -->
      <form @submit.prevent="submit" class="login-card__form">
        <GlassField
          v-model="form.email"
          label="Email address"
          placeholder="you@company.com"
          input-type="email"
          required
          error-text="Email address is required"
        />

        <GlassField
          v-model="form.password"
          label="Password"
          placeholder="••••••••"
          input-type="password"
          required
          error-text="Password is required"
        />

        <Button
          type="submit"
          label="Sign in"
          :loading="loading"
          class="w-full login-btn"
        />
      </form>

      <!-- Demo shortcuts -->
      <template v-if="IS_STATIC">
        <div class="login-card__divider"><span>Quick demo</span></div>
        <div class="demo-accounts">
          <button
            v-for="acc in demoAccounts"
            :key="acc.email"
            class="demo-btn"
            @click="useDemo(acc)"
          >
            {{ acc.label }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 36px 32px;
  box-shadow: var(--shadow-lg);

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 24px;
  }

  &__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 4px;
  }

  &__sub {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin-bottom: 24px;
  }

  &__error {
    background: #fef2f2;
    color: #DC2626;
    border: 1px solid #fecaca;
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    font-size: var(--text-sm);
    margin-bottom: 16px;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 24px 0 12px;
    color: var(--color-text-muted);
    font-size: var(--text-xs);

    &::before, &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--color-border);
    }
  }
}

.brand-mark {
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 800;
  font-size: 20px;
}

.brand-name {
  font-size: var(--text-xl);
  font-weight: 800;
  color: var(--color-text);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text);
  }
}

.w-full { width: 100%; }

.login-btn {
  width: 100%;
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  font-weight: 600 !important;

  &:hover {
    background: var(--color-primary-dark) !important;
    border-color: var(--color-primary-dark) !important;
  }
}

.demo-accounts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.demo-btn {
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.13s;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-50);
  }
}
</style>
