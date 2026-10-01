import { get } from '@/services/api/client'

// Data for the Network pages: preload once from the view, then read with the getters
// (which return copies).
const cache = { networks: [], endpoints: [], vulns: [], scans: {} }
const copy = (v) => structuredClone(v)

export async function fetchNetworks() {
  cache.networks = (await get('/assets/networks')) ?? []
  return copy(cache.networks)
}

export async function preloadNetworkList() {
  const [, endpoints] = await Promise.all([fetchNetworks(), get('/assets/networks/endpoints')])
  cache.endpoints = endpoints ?? []
}

export async function preloadNetworkDetail() {
  const [, endpoints, vulns] = await Promise.all([
    fetchNetworks(), get('/assets/networks/endpoints'), get('/assets/networks/vulns'),
  ])
  cache.endpoints = endpoints ?? []
  cache.vulns = vulns ?? []
  await Promise.all(cache.networks.map(async ({ id }) => {
    cache.scans[id] = await get(`/assets/networks/${id}/scans`)
  }))
}

export const getNetworks = () => copy(cache.networks)
export const getNetworkEndpoints = () => copy(cache.endpoints)
export const getNetworkVulns = () => copy(cache.vulns)
export const getNetworkScans = (id) => copy(cache.scans[id] ?? cache.scans[1] ?? [])
