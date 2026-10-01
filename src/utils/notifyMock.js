// In static (mock) mode the backend does not exist, so pages that would trigger a
// notification call this to add one to the mock list. In live mode it does nothing: the
// real backend creates notifications itself. See modules/notifications/utils/catalogue.js.
const IS_STATIC = import.meta.env.VITE_IS_STATIC === 'true'

export async function notifyMock(code, options) {
  if (!IS_STATIC) return
  try {
    const mock = await import('@/mocks/notifications/notifications')
    mock.emitNotification(code, options)
  } catch { /* a missing demo notification must never break the page */ }
}

export const demoUserId = async (name) => (IS_STATIC ? (await import('@/mocks/notifications/notifications')).demoUserIdByName[name] : undefined)
