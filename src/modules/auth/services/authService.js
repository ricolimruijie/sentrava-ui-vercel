import { post } from '@/services/api/client'

// `login` resolves with a session, or — when the account has two-factor authentication on — with
// { twoFactorRequired: true, challengeId, email } and no session until `verifyTwoFactor` succeeds.
export const login = (email, password, dataMode) => post('/auth/login', { email, password, dataMode })
export const verifyTwoFactor = (challengeId, code) => post('/auth/2fa/verify', { challengeId, code })
export const sendTwoFactorEmail = (challengeId) => post('/auth/2fa/email-code', { challengeId })
export const setTwoFactorEnabled = (email, enabled) => post('/auth/2fa', { email, enabled })
export const forgotPassword = (email) => post('/auth/forgot-password', { email })
