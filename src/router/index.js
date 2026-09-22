import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import AppLayout    from '@/components/layout/AppLayout.vue'
import authRoutes   from './auth'
import dashboardRoutes from './dashboard'

// Stub placeholder for future pages
const Placeholder = {
  template: `
    <div style="display:flex;align-items:center;justify-content:center;height:60vh;color:var(--glacia-ink-dim);font-size:14px;">
      work in progress
    </div>
  `
}

const appRoutes = [
  ...dashboardRoutes,
  {
    path: '/assets',
    component: () => import('@/views/Assets/AssetInventoryView.vue'),
    meta: { requiresAuth: true, title: 'Asset Inventory', crumbs: [{ label: 'Manage' }] },
  },
  // Services — each shows a blank Work in Progress page
  { path: '/assets/domains',     component: Placeholder, meta: { requiresAuth: true, title: 'Domain Inspection' } },
  { path: '/assets/networks',    component: Placeholder, meta: { requiresAuth: true, title: 'Network' } },
  { path: '/assets/webapps',     component: Placeholder, meta: { requiresAuth: true, title: 'Web Application' } },
  { path: '/assets/source-code', component: Placeholder, meta: { requiresAuth: true, title: 'Source Code' } },
  {
    path: '/scans/history',
    component: () => import('@/views/Scans/CiCdView.vue'),
    meta: { requiresAuth: true, title: 'Report Log', crumbs: [{ label: 'CI/CD' }] },
  },
  {
    path: '/scans/history/:runId/vulnerabilities',
    component: () => import('@/views/Scans/VulnerabilityOverviewView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Vulnerability Overview',
      crumbs: [{ label: 'CI/CD' }, { label: 'Report Log', to: '/scans/history' }],
    },
  },
  { path: '/scans/:section?',     component: Placeholder, meta: { requiresAuth: true } },
  { path: '/vulnerabilities',     component: Placeholder, meta: { requiresAuth: true } },
  { path: '/reports',             component: Placeholder, meta: { requiresAuth: true } },
  { path: '/settings',            component: Placeholder, meta: { requiresAuth: true } },
  {
    path: '/settings/api-keys',
    component: () => import('@/views/Settings/ApiKeysView.vue'),
    meta: { requiresAuth: true, title: 'API Keys', crumbs: [{ label: 'CI/CD' }] },
  },
  {
    path: '/companies',
    component: () => import('@/views/Company/CompanyView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Company',
      crumbs: [{ label: 'Manage' }],
      // The Company page's tabs live client-side as a `tab` query param —
      // this lets the breadcrumb reflect the active tab as a trailing
      // crumb instead of always showing the static page title.
      tabQuery: 'tab',
      tabLabels: { overview: 'Overview', list: 'Company list', audit: 'Audit log', probe: 'Probe box' },
    },
  },
  { path: '/credits',             component: Placeholder, meta: { requiresAuth: true } },
  {
    path: '/tickets',
    component: () => import('@/views/Tickets/TicketListView.vue'),
    meta: { requiresAuth: true, title: 'Ticket', crumbs: [{ label: 'Manage' }] },
  },
  {
    path: '/tickets/:id',
    component: () => import('@/views/Tickets/TicketDetailView.vue'),
    meta: { requiresAuth: true, title: 'Ticket Detail', crumbs: [{ label: 'Manage' }, { label: 'Ticket', to: '/tickets' }] },
  },
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
