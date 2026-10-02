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
const columns = files.flatMap((f) => readFileSync(f, 'utf8').split('\n').map((l, i) => ({ f, line: i + 1, m: COLUMN.exec(l), text: l })).filter((x) => x.m)
  .map((x) => ({ file: f, line: x.line, key: x.m[1], label: x.m[2], rest: x.m[3] })))

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
  it('uses the shared DataTable for every table except the two dashboard cards', () => {
    const raw = files.length
    const handBuilt = vueFiles('src').filter((f) => /<table\b/.test(readFileSync(f, 'utf8')) && !f.endsWith('DataTable.vue'))
    expect(handBuilt.map((f) => f.split('/').pop()).sort()).toEqual(['TicketFeed.vue', 'TopVulnerabilities.vue'])
    expect(raw).toBeGreaterThan(0)
  })
})
