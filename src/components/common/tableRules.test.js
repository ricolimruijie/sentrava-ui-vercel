import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Guards the table rules (README › Tables): every <DataTable> column definition must follow them, so a
// new table can't quietly reintroduce percentage widths, uneven padding or an uncut-able header.
function vueFiles(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? vueFiles(p) : p.endsWith('.vue') ? [p] : []
  })
}
const files = vueFiles('src').filter((f) => readFileSync(f, 'utf8').includes('<DataTable'))
const COLUMN = /^\s*\{ key: '([^']+)', label: '([^']*)'(.*)\},?\s*$/
const ARRAY_START = /^const \w*[Cc]olumns\w* = \[/
// Only the objects inside `const …Columns = [ … ]` are table columns (other lists have { key, label } too).
const columns = files.flatMap((f) => {
  let inside = false
  const found = []
  readFileSync(f, 'utf8').split('\n').forEach((text, i) => {
    if (ARRAY_START.test(text)) { inside = true; return }
    if (inside && text.startsWith(']')) { inside = false; return }
    const m = inside ? COLUMN.exec(text) : null
    if (m) found.push({ file: f, line: i + 1, key: m[1], label: m[2], rest: m[3] })
  })
  return found
})

describe('table column definitions', () => {
  it('finds the tables', () => {
    expect(files.length).toBeGreaterThanOrEqual(17)
    expect(columns.length).toBeGreaterThan(100)
  })
  it('never use percentage widths (fixed columns are px, text columns have no width)', () => {
    const bad = columns.filter((c) => /width: '[^']*%'/.test(c.rest))
    expect(bad.map((c) => `${c.file}:${c.line} ${c.label}`)).toEqual([])
  })
  it('never override the cell padding', () => {
    const bad = columns.filter((c) => /\b(compact|padLeft|padRight)\b/.test(c.rest))
    expect(bad.map((c) => `${c.file}:${c.line} ${c.label}`)).toEqual([])
  })
  it('the row-number column is titled "No", is kind "index" and is at least 52px', () => {
    const idx = columns.filter((c) => c.key === '__index')
    expect(idx.length).toBeGreaterThanOrEqual(25)
    for (const c of idx) {
      expect(c.label, `${c.file}:${c.line}`).toBe('No')
      expect(c.rest, `${c.file}:${c.line}`).toMatch(/kind: 'index'/)
      expect(Number(/width: '(\d+)px'/.exec(c.rest)?.[1]), `${c.file}:${c.line}`).toBeGreaterThanOrEqual(52)
    }
  })
  it('every "Action" column has kind "action" (so it gets the shared width)', () => {
    const bad = columns.filter((c) => /^Actions?$/.test(c.label) && !/kind: 'action'/.test(c.rest))
    expect(bad.map((c) => `${c.file}:${c.line}`)).toEqual([])
  })
  it('sizes columns only with px widths', () => {
    const bad = columns.filter((c) => /width: '/.test(c.rest) && !/width: '\d+px'/.test(c.rest))
    expect(bad.map((c) => `${c.file}:${c.line} ${c.label}`)).toEqual([])
  })
  // Every real table column is either fixed-format (px width), a special kind (No / checkbox / Action), or a
  // text column that declares its minimum (header + padding) and its maximum (widest realistic value).
  it('every text column declares a min and a max, and fixed columns never do', () => {
    const real = columns
    const bad = []
    for (const c of real) {
      const kind = /kind: '/.test(c.rest), width = /width: '\d+px'/.test(c.rest), min = /min: \d+/.test(c.rest), max = /max: \d+/.test(c.rest)
      if (kind && (min || max)) bad.push(`${c.file}:${c.line} ${c.label}: a special column has min/max`)
      else if (width && !kind && (min || max)) bad.push(`${c.file}:${c.line} ${c.label}: fixed column also has min/max`)
      else if (!kind && !width && !(min && max)) bad.push(`${c.file}:${c.line} ${c.label}: text column needs min and max`)
      else if (min && max) { const a = Number(/min: (\d+)/.exec(c.rest)[1]), b = Number(/max: (\d+)/.exec(c.rest)[1]); if (a < 130 && c.label) bad.push(`${c.file}:${c.line} ${c.label}: min ${a} is below the 130px floor`); if (b < a) bad.push(`${c.file}:${c.line} ${c.label}: max ${b} < min ${a}`) }
    }
    expect(bad).toEqual([])
  })
  it('uses the shared DataTable for every table except the two dashboard cards', () => {
    const raw = files.length
    const handBuilt = vueFiles('src').filter((f) => /<table\b/.test(readFileSync(f, 'utf8')) && !f.endsWith('DataTable.vue'))
    expect(handBuilt.map((f) => f.split('/').pop()).sort()).toEqual(['TicketFeed.vue', 'TopVulnerabilities.vue'])
    expect(raw).toBeGreaterThan(0)
  })
})
