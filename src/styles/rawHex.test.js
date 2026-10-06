// Ratchet: raw hex colors must come from the design tokens (src/styles/design-tokens.css), not be typed into
// components. Files may keep the hex they had when this test was added (rawHex.baseline.json), but no file may
// gain more, and a file that drops below its baseline must lower it (run `npm run hex:baseline`).
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import baseline from './rawHex.baseline.json'

const SRC = join(__dirname, '..')
// Theme definitions, the tag palette (stored with each tag) and fake data are allowed to hold hex.
const ALLOWED = [/^styles\//, /^mocks\//, /\.test\.js$/, /^main\.js$/, /^config\/tagPalette\.js$/]
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g
const NEUTRAL = new Set(['#fff', '#ffffff', '#000', '#000000'])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(vue|scss|css|js)$/.test(name)) out.push(p)
  }
  return out
}

export function countRawHex() {
  const counts = {}
  for (const file of walk(SRC)) {
    const rel = relative(SRC, file)
    if (ALLOWED.some((re) => re.test(rel))) continue
    const n = (readFileSync(file, 'utf8').match(HEX) ?? []).filter((h) => !NEUTRAL.has(h.toLowerCase())).length
    if (n) counts[rel] = n
  }
  return counts
}

describe('raw hex colors', () => {
  const counts = countRawHex()

  it('no file has more raw hex than its baseline', () => {
    const over = Object.entries(counts).filter(([f, n]) => n > (baseline[f] ?? 0)).map(([f, n]) => `${f}: ${n} > ${baseline[f] ?? 0}`)
    expect(over, 'Use a token from design-tokens.css instead of a raw hex').toEqual([])
  })

  it('baseline is not stale (lower it when you remove hex)', () => {
    const stale = Object.entries(baseline).filter(([f, n]) => (counts[f] ?? 0) < n).map(([f, n]) => `${f}: ${counts[f] ?? 0} < ${n}`)
    expect(stale, 'Run: npm run hex:baseline').toEqual([])
  })
})

if (process.env.WRITE_HEX_BASELINE) {
  writeFileSync(join(__dirname, 'rawHex.baseline.json'), JSON.stringify(countRawHex(), null, 2) + '\n')
}
