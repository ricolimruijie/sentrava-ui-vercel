import axios from 'axios'
import { sleep } from '@/utils/helpers'

const IS_STATIC = import.meta.env.VITE_IS_STATIC === 'true'
const BASE_URL  = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

// ── Real HTTP client ─────────────────────────────────────────────────────────

const client = axios.create({ baseURL: BASE_URL, timeout: 15_000 })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentra_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sentra_token')
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data ?? err)
  }
)

// ── Mock registry ────────────────────────────────────────────────────────────
// Each entry: { pattern: RegExp, handler: (url, cfg) => Promise<any> }
const mockHandlers = []

export function registerMock(pattern, handler) {
  mockHandlers.push({ pattern, handler })
}

async function mockRequest(url, config) {
  const entry = mockHandlers.find(e => e.pattern.test(url))
  if (!entry) {
    console.warn(`[Mock] No handler registered for: ${url}`)
    return null
  }
  await sleep(80 + Math.random() * 180)   // realistic latency
  return entry.handler(url, config)
}

// ── Public API ───────────────────────────────────────────────────────────────

export function request(url, config = {}) {
  if (IS_STATIC) return mockRequest(url, config)
  const { method = 'GET', data, params, ...rest } = config
  return client.request({ url, method, data, params, ...rest })
}

export const get   = (url, params,  cfg = {}) => request(url, { method: 'GET',    params, ...cfg })
export const post  = (url, data,    cfg = {}) => request(url, { method: 'POST',   data,   ...cfg })
export const put   = (url, data,    cfg = {}) => request(url, { method: 'PUT',    data,   ...cfg })
export const patch = (url, data,    cfg = {}) => request(url, { method: 'PATCH',  data,   ...cfg })
export const del   = (url,          cfg = {}) => request(url, { method: 'DELETE',         ...cfg })
