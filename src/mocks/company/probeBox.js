const probeNames = [
  'probe-jakarta-01', 'probe-jakarta-02', 'probe-surabaya-01', 'probe-bandung-01',
  'probe-dc-primary', 'probe-dc-backup', 'probe-remote-vpn',
]
const statuses = ['online', 'online', 'online', 'offline', 'online', 'offline', 'online']

const locations = [
  'Protergo Cyber Security Ampera', 'Protergo Cyber Security Rempoa', 'Protergo Cyber Security Surabaya',
  'Protergo Cyber Security Bandung', 'Protergo Cyber Security Ampera', 'Protergo Cyber Security Rempoa', 'Protergo Cyber Security Surabaya',
]

const credentials = [
  { integrationUrl: 'https://a4c1-163-223-160-20.ngrok-free.app', clientKey: '0IgxLd6GncfBAepfJBd0Kh8oOOL8dKLzdocJ2isAjIhKtJ0RlgLKOmxgJTeK', secretKey: 'dNnFRIBXuDL7DxtpYlSXpfKtHF4vUCsM' },
  { integrationUrl: 'https://23d5-103-145-22-195.ngrok-free.app', clientKey: 'vj7FAc9QeWJKY40uvSwMFLZDe1f8rESQedUStPKR0CsTy4Qwb8DwkNhFdnXs', secretKey: 'iVpzz63FfkCzJr4i0B3JrTAwR4y9ojfl' },
  { integrationUrl: 'https://4770-36-88-14-126.ngrok-free.app', clientKey: '1LlqsajAIxNKu8iS2G8NPRVdD53X83RZJzzzzgEOzdmenCkhvMdgaKjIg8xN', secretKey: 'be3nNyjOq9wMxEhh2FDEEtfjgVvVqE1S' },
  { integrationUrl: 'https://506b-182-253-41-39.ngrok-free.app', clientKey: 'SI6bWHtP3fS2qHx6kwXoIIXGvOoNZYW2mZp0zVZomHFwUbbYrEqmSM9wCZ7U', secretKey: 'w9xfogoEmvnEN5N1aE6PwZPf1Qh6yYTW' },
  { integrationUrl: 'https://6f5d-114-4-70-204.ngrok-free.app', clientKey: 'OvfZ8UzDzV8fUkkibjL5DZPjN0MEQ7wjJJibaZUPgHV7iB3m03nbqnsGpWLu', secretKey: 'qIA1id6Vw5DQL05HA064GiIjHGb3CXlM' },
  { integrationUrl: 'https://0454-202-158-9-123.ngrok-free.app', clientKey: 'NUhJduRHHJEYXg4JdpmrcXgGCJbW56eCuNGMGmSrCGIZEG8pSH4487q7J58m', secretKey: '1CiAhzCueQpBenQtYh5Xj8TPQxjq4i9D' },
  { integrationUrl: 'https://73cf-139-255-33-43.ngrok-free.app', clientKey: 'Q1okTBGzvAmwufUxbvJDCTbyvHNsG9eh6Yo4gfqrc5XlrWi0B26R08qzjI6G', secretKey: 'KFSufrdZSlB5er8bOfZqfM2oeq3hDavJ' },
]

export const probeBoxMock = probeNames.map((name, i) => ({
  id: `probe-${i + 1}`,
  name,
  location: locations[i % locations.length],
  ...credentials[i % credentials.length],
  ip: `10.20.${i + 1}.${10 + i}`,
  status: statuses[i % statuses.length],
  lastSeen: `2026-0${(i % 9) + 1}-${String((i * 3) % 27 + 1).padStart(2, '0')}T${String((i % 12) + 1).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00Z`,
}))
