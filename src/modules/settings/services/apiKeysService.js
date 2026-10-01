import { get } from '@/services/api/client'

export const getApiKeys = () => get('/settings/api-keys')
