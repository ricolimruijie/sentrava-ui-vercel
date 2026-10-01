import { get } from '@/services/api/client'

// Data for the Domain Inspection pages. A view calls preloadDomainList() or
// preloadDomainDetail() once (top-level await in its setup); the getters below
// then read what was loaded. Getters return copies, so views can edit freely.
const cache = { domains: [], endpoints: [], vulns: [], scans: {}, reputation: {}, engines: {} }
const copy = (v) => structuredClone(v)

export async function fetchDomains() {
  cache.domains = (await get('/assets/domains')) ?? []
  return copy(cache.domains)
}

export async function preloadDomainList() {
  const [, endpoints] = await Promise.all([fetchDomains(), get('/assets/domains/endpoints')])
  cache.endpoints = endpoints ?? []
}

export async function preloadDomainDetail() {
  const [, endpoints, vulns] = await Promise.all([
    fetchDomains(), get('/assets/domains/endpoints'), get('/assets/domains/vulns'),
  ])
  cache.endpoints = endpoints ?? []
  cache.vulns = vulns ?? []
  await Promise.all(cache.domains.map(async ({ id }) => {
    const [scans, reputation, engines] = await Promise.all([
      get(`/assets/domains/${id}/scans`),
      get(`/assets/domains/${id}/reputation`),
      get(`/assets/domains/${id}/reputation-engines`),
    ])
    cache.scans[id] = scans; cache.reputation[id] = reputation; cache.engines[id] = engines
  }))
}

export const getDomains = () => copy(cache.domains)
export const getDomainEndpoints = () => copy(cache.endpoints)
export const getDomainVulns = () => copy(cache.vulns)
export const getDomainScans = (id) => copy(cache.scans[id] ?? cache.scans[1] ?? [])
export const getDomainReputation = (id) => copy(cache.reputation[id] ?? cache.reputation[1])
export const getDomainReputationEngines = (id) => copy(cache.engines[id] ?? cache.engines[1] ?? [])
