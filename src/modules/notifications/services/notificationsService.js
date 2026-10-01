import { get, post } from '@/services/api/client'

export const getNotifications = () => get('/notifications')
export const markNotificationRead = (id) => post(`/notifications/${id}/read`)
export const markAllNotificationsRead = () => post('/notifications/read-all')
