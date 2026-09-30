export default [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/Dashboard/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'Dashboard', crumbs: [{ label: 'Menu' }] },
  },
]
