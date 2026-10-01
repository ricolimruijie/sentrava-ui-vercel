import { post } from '@/services/api/client'

export const login = (email, password, dataMode) => post('/auth/login', { email, password, dataMode })
export const forgotPassword = (email) => post('/auth/forgot-password', { email })
