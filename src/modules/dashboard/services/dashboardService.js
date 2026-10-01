import { get } from '@/services/api/client'

export const getClientDashboard     = () => get('/dashboard/client')
export const getSuperAdminDashboard = () => get('/dashboard/super-admin')
