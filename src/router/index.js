import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import AppLayout    from '@/components/layout/AppLayout.vue'
import authRoutes   from './auth'
import dashboardRoutes from './dashboard'

// Stub placeholder for future pages
const Placeholder = {
  template: `
    <div style="padding:40px;text-align:center;color:var(--color-text-secondary)">
      <h2 style="font-size:1.5rem;font-weight:600;margin-bottom:8px">Coming Soon</h2>
      <p style="font-size:var(--text-sm)">This module is under active development.</p>
    </div>
  `
}

const appRoutes = [
  ...dashboardRoutes,
  { path: '/assets/:type?',       component: Placeholder, meta: { requiresAuth: true } },
  { path: '/scans/:section?',     component: Placeholder, meta: { requiresAuth: true } },
  { path: '/vulnerabilities',     component: Placeholder, meta: { requiresAuth: true } },
  { path: '/reports',             component: Placeholder, meta: { requiresAuth: true } },
  { path: '/settings',            component: Placeholder, meta: { requiresAuth: true } },
  { path: '/companies',           component: Placeholder, meta: { requiresAuth: true } },
  { path: '/credits',             component: Placeholder, meta: { requiresAuth: true } },
  { path: '/tickets',             component: Placeholder, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    {
      path: '/',
      component: AppLayout,
      children: appRoutes,
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/' || to.path === '') {
    return { path: '/dashboard' }
  }
})

export default router
