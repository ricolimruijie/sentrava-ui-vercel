import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const service = vi.hoisted(() => ({ getNotifications: vi.fn(), markNotificationRead: vi.fn(), markAllNotificationsRead: vi.fn() }))
vi.mock('@/modules/notifications/services/notificationsService', () => service)

import { useNotificationStore } from './notifications'
import { PANEL_LIMIT, POLL_MS } from '@/modules/notifications/utils/catalogue'

const mk = (i, over = {}) => ({ id: `n${i}`, code: 'N-SC-01', title: 't', message: 'm', createdAt: new Date(Date.now() - i * 60_000).toISOString(), read: false, ...over })

describe('notification store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.values(service).forEach((f) => f.mockReset())
    service.markNotificationRead.mockResolvedValue({ ok: true })
    service.markAllNotificationsRead.mockResolvedValue({ ok: true })
  })

  it('counts unread, overall and per tab', async () => {
    service.getNotifications.mockResolvedValue([mk(1), mk(2, { read: true }), mk(3, { code: 'N-TK-01' }), mk(4, { code: 'N-RV-01' })])
    const s = useNotificationStore(); await s.fetch()
    expect(s.unreadCount).toBe(3)
    expect(s.unreadByTab).toMatchObject({ all: 3, scans: 1, tickets: 1, infrastructure: 0, system: 0 })
  })

  it('the panel shows at most the 50 most recent', async () => {
    service.getNotifications.mockResolvedValue(Array.from({ length: 70 }, (_, i) => mk(i)))
    const s = useNotificationStore(); await s.fetch()
    expect(s.items).toHaveLength(70)
    expect(s.recent).toHaveLength(PANEL_LIMIT)
    expect(s.recent[0].id).toBe('n0')
  })

  it('marking one read lowers the badge and tells the server', async () => {
    service.getNotifications.mockResolvedValue([mk(1), mk(2)])
    const s = useNotificationStore(); await s.fetch()
    await s.markRead('n1')
    expect(s.unreadCount).toBe(1)
    expect(service.markNotificationRead).toHaveBeenCalledWith('n1')
    await s.markRead('n1') // already read: no second request
    expect(service.markNotificationRead).toHaveBeenCalledTimes(1)
  })

  it('mark all as read clears the badge', async () => {
    service.getNotifications.mockResolvedValue([mk(1), mk(2), mk(3)])
    const s = useNotificationStore(); await s.fetch()
    await s.markAllRead()
    expect(s.unreadCount).toBe(0)
    expect(service.markAllNotificationsRead).toHaveBeenCalledTimes(1)
    await s.markAllRead() // nothing unread: no request
    expect(service.markAllNotificationsRead).toHaveBeenCalledTimes(1)
  })

  it('undoes the optimistic read when the server call fails', async () => {
    service.getNotifications.mockResolvedValue([mk(1)])
    service.markNotificationRead.mockRejectedValue(new Error('offline'))
    const s = useNotificationStore(); await s.fetch()
    await s.markRead('n1')
    expect(s.unreadCount).toBe(1)
  })

  it('a poll that started before a read keeps the optimistic read state', async () => {
    let resolveSlow
    service.getNotifications
      .mockResolvedValueOnce([mk(1), mk(2)])
      .mockImplementationOnce(() => new Promise((r) => { resolveSlow = r })) // slow poll, carries stale flags
      .mockResolvedValue([mk(1, { read: true }), mk(2)])
    const s = useNotificationStore(); await s.fetch()
    const slow = s.fetch()
    await s.markRead('n1')
    resolveSlow([mk(1), mk(2)]) // stale: n1 unread
    await slow
    expect(s.unreadCount).toBe(1)
  })

  it('keeps the old list if a poll fails', async () => {
    service.getNotifications.mockResolvedValueOnce([mk(1)]).mockRejectedValueOnce(new Error('offline'))
    const s = useNotificationStore(); await s.fetch(); await s.fetch()
    expect(s.items).toHaveLength(1)
  })

  describe('polling', () => {
    beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() }) })
    afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
    it('refreshes every 30 seconds until stopped', async () => {
      service.getNotifications.mockResolvedValue([])
      const s = useNotificationStore(); s.start()
      expect(service.getNotifications).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(POLL_MS)
      expect(service.getNotifications).toHaveBeenCalledTimes(2)
      s.stop()
      await vi.advanceTimersByTimeAsync(POLL_MS * 2)
      expect(service.getNotifications).toHaveBeenCalledTimes(2)
    })
  })
})
