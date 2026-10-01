import { get } from '@/services/api/client'

export const getScanHistory = () => get('/scans/history')
export const getRunVulnerabilities = (runId) => get(`/scans/history/${runId}/vulnerabilities`)
