import { get } from '@/services/api/client'

export const getCompanyInfo  = () => get('/company/info')
export const getCompanyList  = () => get('/company/list')
export const getMembers      = () => get('/company/members')
export const getAuditLog     = () => get('/company/audit-log')
export const getProbes       = () => get('/company/probes')
