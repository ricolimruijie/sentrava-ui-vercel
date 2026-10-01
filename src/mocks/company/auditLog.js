const actors = [
  { name: 'Rico Lim Rui Jie',   username: 'ricolimruijie' },
  { name: 'Nurasiah Ayuni',     username: 'nurasiah' },
  { name: 'Wiranata Abioka',    username: 'wiranata' },
  { name: 'Eldiana Elden Ring', username: 'eldiana' },
  { name: 'System',             username: 'system' },
]

const actionTemplates = [
  { action: 'Added member',          detail: 'Invited budimansuharjo@protergo.id as Member' },
  { action: 'Removed member',        detail: 'Removed taufikrahman@protergo.id from the company' },
  { action: 'Updated role',          detail: 'Changed wiranata@protergo.id role to Admin' },
  { action: 'Changed quota',         detail: 'Increased quota from 80 to 100' },
  { action: 'Enabled 2FA policy',    detail: 'Enforced two-factor authentication for all members' },
  { action: 'Revoked API key',       detail: 'Revoked API key "CI/CD Pipeline"' },
  { action: 'Created API key',       detail: 'Created API key "Reporting Service"' },
  { action: 'Updated company info',  detail: 'Updated contract type to Contract based' },
]

// 60 audit entries, newest first.
export const auditLogMock = Array.from({ length: 60 }, (_, i) => {
  const t = actionTemplates[i % actionTemplates.length]
  const day = (i % 27) + 1
  const month = (Math.floor(i / 27) % 9) + 1
  const hour = (i % 12) + 1
  const minute = (i * 11) % 60
  return {
    id: `audit-${i + 1}`,
    dateTime: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`,
    actor: actors[i % actors.length].name,
    actorUsername: actors[i % actors.length].username,
    action: t.action,
    detail: t.detail,
  }
})
