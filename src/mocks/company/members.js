export const companyInfoMock = {
  name: 'Protergo Cyber Security Ampera',
  type: 'Head company',
  quota: 100,
  contractType: 'Contract based',
}

const templates = [
  { name: 'Rico Lim Rui Jie',   username: 'ricolimruijie',  role: 'admin' },
  { name: null,                 username: 'alexclaire',     role: 'member' },
  { name: null,                 username: 'budimansuharjo', role: 'member' },
  { name: null,                 username: 'sitikhodijah',   role: 'member' },
  { name: null,                 username: 'budiartotarno',  role: 'member' },
  { name: null,                 username: 'dwiastuti',      role: 'member' },
  { name: null,                 username: 'taufikrahman',   role: 'member' },
  { name: 'Nurasiah Ayuni',     username: 'nurasiah',       role: 'member' },
  { name: 'Wiranata Abioka',    username: 'wiranata',       role: 'member' },
  { name: 'Eldiana Elden Ring', username: 'eldiana',        role: 'member' },
]

// 100 members, cycling through the template set above.
export const companyMembersMock = Array.from({ length: 100 }, (_, i) => {
  const t = templates[i % templates.length]
  return {
    id: `member-${i + 1}`,
    name: t.name,
    username: t.username,
    email: `${t.username}@protergo.id`,
    company: companyInfoMock.name,
    role: t.role,
  }
})
