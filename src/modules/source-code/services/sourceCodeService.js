import { get } from '@/services/api/client'

// Data for the Source Code pages: preload once from the view, then read with the
// getters (which return copies).
const cache = { repos: [], vulns: [], scans: {} }
const copy = (v) => structuredClone(v)

export async function fetchSourceCodeRepos() {
  cache.repos = (await get('/assets/source-code')) ?? []
  return copy(cache.repos)
}

export const preloadSourceCodeList = fetchSourceCodeRepos

export async function preloadSourceCodeDetail() {
  const [, vulns] = await Promise.all([fetchSourceCodeRepos(), get('/assets/source-code/vulns')])
  cache.vulns = vulns ?? []
  await Promise.all(cache.repos.map(async ({ id }) => {
    cache.scans[id] = await get(`/assets/source-code/${id}/scans`)
  }))
}

export const getSourceCodeRepos = () => copy(cache.repos)
export const getSourceCodeVulns = () => copy(cache.vulns)
export const getSourceCodeScans = (id) => copy(cache.scans[id] ?? [])
