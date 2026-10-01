import { useAuthStore } from '@/stores/auth'
import { buildNotification, isVisibleTo, byNewest, NOTIFICATIONS_EVENT } from '@/modules/notifications/utils/catalogue'

// Mock notification backend (static mode). The real backend creates notifications when
// events happen; here a seeded list lives in localStorage so the panel has data across
// reloads, and read/unread is kept per user.
const LIST_KEY = 'sentra_mock_notifications'
const READ_KEY = 'sentra_mock_notifications_read'
const SEED_VERSION_KEY = 'sentra_mock_notifications_seed'
const SEED_VERSION = '1'

const MIN = 60_000, HOUR = 3_600_000, DAY = 86_400_000
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback } }
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable */ } }

// Demo accounts (see mocks/index.js): u0 Super Admin, u1 Alex Johnson (Admin, Acme),
// u3 James Park (Member, Acme). Acme = c1, Globex = c2.
export const demoUserIdByName = { 'Alex Johnson': 'u1', 'James Park': 'u3', 'Root Admin': 'u0' }

function seed() {
  const now = Date.now()
  const at = (ms) => new Date(now - ms).toISOString()
  let i = 0
  const make = (code, vars, ago, extra) => ({ id: `n-seed-${++i}`, ...buildNotification(code, vars), createdAt: at(ago), ...extra })
  const acme = { companyId: 'c1' }, globex = { companyId: 'c2' }
  const list = [
    make('N-SC-01', { asset: 'protergo.id' }, 2 * MIN, { ...acme, link: '/assets/domains/1' }),
    make('N-SC-02', { asset: 'Customer Portal' }, 25 * MIN, { ...acme, link: '/assets/webapps/2' }),
    make('N-SC-03', { triggerType: 'Continuous', asset: 'beta-ventures.io' }, 1 * HOUR, { ...acme, link: '/assets/domains/3' }),
    make('N-AI-01', { asset: 'api.protergo.id' }, 3 * HOUR, { ...acme, link: '/assets' }),
    make('N-AI-02', { asset: '10.10.19.2/24' }, 5 * HOUR, { ...acme, link: '/assets/networks/1' }),
    make('N-RV-01', { asset: 'Website Protergo Cyber Security' }, 6 * HOUR, { ...acme, link: '/assets/webapps/1' }),
    make('N-RV-02', {}, 7 * HOUR, { ...acme, link: '/assets/webapps/1' }),
    make('N-IN-01', { company: 'Acme Corporation' }, 9 * HOUR, { ...acme, link: '/companies?tab=probe' }),
    make('N-IN-02', { company: 'Acme Corporation' }, 8 * HOUR, { ...acme, link: '/companies?tab=probe' }),
    make('N-IN-03', { company: 'Acme Corporation' }, 7.5 * HOUR, { ...acme, link: '/companies?tab=probe' }),
    make('N-CD-01', { key: 'github-actions-prod' }, 1 * DAY, { ...acme, link: '/settings/api-keys' }),
    make('N-CD-02', { key: 'legacy-deploy' }, 2 * DAY, { ...acme, link: '/settings/api-keys' }),
    make('N-CD-03', { key: 'old-ci-key' }, 3 * DAY, { ...acme, link: '/settings/api-keys' }),
    make('N-TK-01', { ticket: 'ANO31456123458766', company: 'Acme Corporation', category: 'Application & System Failures' }, 4 * HOUR, { ...acme, link: '/tickets/ANO31456123458766' }),
    make('N-TK-02', { ticket: 'ANO31456123458766', status: 'Processing' }, 3 * HOUR, { ...acme, userIds: ['u3'], link: '/tickets/ANO31456123458766' }),
    make('N-TK-03', { ticket: 'ANO31456123458766' }, 2 * HOUR, { ...acme, userIds: ['u3', 'u0'], link: '/tickets/ANO31456123458766' }),
    make('N-TK-04', { ticket: 'ANO31456123458769' }, 1 * DAY, { ...acme, userIds: ['u3'], link: '/tickets/ANO31456123458769' }),
    make('N-UM-01', { user: 'new.hire@acme.com', company: 'Acme Corporation', role: 'Member' }, 2 * DAY, { ...acme, link: '/companies' }),
    make('N-UM-02', { company: 'Acme Corporation', role: 'Member' }, 4 * DAY, { ...acme, userIds: ['u3'], link: '/companies' }),
    // Another company: only Super Admin is assigned to it.
    make('N-SC-01', { asset: 'globex.io' }, 10 * MIN, { ...globex, link: '/assets/domains/2' }),
    make('N-IN-01', { company: 'Globex Industries' }, 3 * HOUR, { ...globex, link: '/companies?tab=probe' }),
    make('N-TK-01', { ticket: 'ANO31456123458768', company: 'Globex Industries', category: 'General Enquiries' }, 5 * HOUR, { ...globex, link: '/tickets/ANO31456123458768' }),
  ]
  // A long history so the panel has more than its 50 most recent and "View all" has something to show.
  const assets = ['protergo.id', 'acme-corp.com', 'beta-ventures.io', 'Customer Portal', 'Billing Dashboard', 'protergo-backend', '10.10.20.0/24']
  for (let d = 3; d <= 80; d += 2) list.push(make('N-SC-01', { asset: assets[d % assets.length] }, d * DAY + (d % 7) * HOUR, { ...acme, link: '/assets' }))
  // Older than the 90 day retention window: must never be shown.
  list.push(make('N-SC-01', { asset: 'purged-example.com' }, 100 * DAY, { ...acme, link: '/assets' }))
  return list
}

function ensureSeeded() {
  if (read(SEED_VERSION_KEY, null) === SEED_VERSION && read(LIST_KEY, null)) return
  write(LIST_KEY, seed()); write(SEED_VERSION_KEY, SEED_VERSION); localStorage.removeItem(READ_KEY)
}

const currentUser = () => useAuthStore().user

// What the signed-in user's panel gets: their visible notifications, newest first, each with a read flag.
export function listForCurrentUser() {
  ensureSeeded()
  const user = currentUser()
  const readIds = new Set(read(READ_KEY, {})[user?.id] ?? [])
  return read(LIST_KEY, []).filter((n) => isVisibleTo(n, user)).sort(byNewest)
    .map(({ id, code, title, message, createdAt, link }) => ({ id, code, title, message, createdAt, link: link ?? null, read: readIds.has(id) }))
}

function saveRead(mutate) {
  const user = currentUser(); if (!user) return
  const all = read(READ_KEY, {}); const set = new Set(all[user.id] ?? [])
  mutate(set); all[user.id] = [...set]; write(READ_KEY, all)
}
export function markRead(id) { saveRead((set) => set.add(id)) }
export function markAllRead() {
  const ids = listForCurrentUser().map((n) => n.id)
  saveRead((set) => ids.forEach((id) => set.add(id)))
}

// Used by other pages in static mode to mimic the backend creating a notification (see utils/notifyMock.js).
export function emitNotification(code, { vars = {}, companyId, userIds, link } = {}) {
  ensureSeeded()
  const base = buildNotification(code, vars)
  const n = { id: `n-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, ...base, createdAt: new Date().toISOString(), companyId, link: link ?? null, ...(userIds ? { userIds } : {}) }
  write(LIST_KEY, [n, ...read(LIST_KEY, [])])
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT))
}
