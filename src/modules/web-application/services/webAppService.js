import { get } from '@/services/api/client'

// Data for the Web Application pages: preload once from the view, then read with
// the getters (which return copies).
const cache = { apps: [], vulns: [], scans: {} }
const copy = (v) => structuredClone(v)

export async function fetchWebApps() {
  cache.apps = (await get('/assets/webapps')) ?? []
  return copy(cache.apps)
}

export const preloadWebAppList = fetchWebApps

export async function preloadWebAppDetail() {
  const [, vulns] = await Promise.all([fetchWebApps(), get('/assets/webapps/vulns')])
  cache.vulns = vulns ?? []
  await Promise.all(cache.apps.map(async ({ id }) => {
    cache.scans[id] = await get(`/assets/webapps/${id}/scans`)
  }))
}

export const getWebApps = () => copy(cache.apps)
export const getWebAppVulns = () => copy(cache.vulns)
export const getWebAppScans = (id) => copy(cache.scans[id] ?? [])
