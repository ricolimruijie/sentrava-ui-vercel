import { describe, it, expect } from 'vitest'
import { allocateColumns } from './tableLayout'

const sum = (a) => a.reduce((x, y) => x + y, 0)
const NO = { kind: 'index', base: 52 }
const ACTION = { kind: 'action', base: 76 }
const fixed = (base) => ({ kind: 'fixed', base })
const text = (base, max) => ({ kind: 'text', base, max })
const near = (a, b, d = 0.05) => Math.abs(a - b) <= d

describe('allocateColumns', () => {
  it('keeps the base widths and scrolls when they do not fit', () => {
    const r = allocateColumns(300, [NO, fixed(150), text(130, 300), ACTION])
    expect(r.widths).toEqual([52, 150, 130, 76])
    expect(r.scrolls).toBe(true)
  })

  it('gives text columns equal shares of the leftover', () => {
    const r = allocateColumns(52 + 150 + 76 + 400, [NO, fixed(150), text(100, 500), text(100, 500), ACTION])
    expect(near(r.widths[2], r.widths[3])).toBe(true)
    expect(near(sum(r.widths), 678)).toBe(true)
    expect(r.widths[1]).toBe(150) // fixed column untouched while text columns can still grow
  })

  it('stops a text column at its maximum and gives the rest to the other text column', () => {
    const r = allocateColumns(52 + 76 + 130 + 130 + 400, [NO, text(130, 200), text(130, 500), ACTION])
    expect(r.widths[1]).toBe(200) // capped
    expect(near(r.widths[2], 130 + 400 - 70)).toBe(true) // took everything the first one could not use
  })

  it('shares the remainder between text columns that have both reached their maximum', () => {
    const r = allocateColumns(52 + 76 + 130 + 130 + 600, [NO, text(130, 200), text(130, 500), ACTION])
    // 200 + 500 reached, 160 left over: spread evenly over both (no fixed columns here)
    expect(near(r.widths[1], 200 + 80)).toBe(true)
    expect(near(r.widths[2], 500 + 80)).toBe(true)
  })

  it('spreads the remainder over every column except No and Action once text columns hit their maximum', () => {
    const specs = [NO, fixed(150), text(100, 300), fixed(100), ACTION]
    const r = allocateColumns(1000, specs)
    const left = 1000 - (52 + 150 + 100 + 100 + 76) - (300 - 100)
    expect(left).toBeGreaterThan(0)
    expect(r.widths[0]).toBe(52)
    expect(r.widths[4]).toBe(76)
    expect(near(r.widths[2] - 300, left / 3)).toBe(true)
    expect(near(r.widths[1] - 150, left / 3)).toBe(true)
    expect(near(r.widths[3] - 100, left / 3)).toBe(true)
    expect(near(sum(r.widths), 1000)).toBe(true)
  })

  it('never changes No, checkbox and Action at any width', () => {
    const specs = [{ kind: 'check', base: 48 }, NO, text(130, 300), fixed(120), ACTION]
    for (const w of [300, 600, 900, 1200, 1600, 2400, 4000]) {
      const r = allocateColumns(w, specs)
      expect([r.widths[0], r.widths[1], r.widths[4]]).toEqual([48, 52, 76])
    }
  })

  it('fills the available width exactly when there is room, with no gap', () => {
    for (const w of [900, 1152, 1440, 1920, 3000]) {
      const r = allocateColumns(w, [NO, fixed(154), text(93, 380), fixed(117), fixed(139), ACTION])
      expect(near(sum(r.widths), w)).toBe(true)
    }
  })

  it('a single text column is capped, so it does not hold the whole leftover', () => {
    // Network list on a 1152px card used to give Endpoint all 439px of leftover; its maximum is 380
    const specs = [NO, fixed(154), text(93, 380), fixed(114), fixed(136), fixed(136), fixed(146), ACTION]
    const left = 1152 - sum(specs.map((s) => s.base))
    const r = allocateColumns(1152, specs)
    expect(r.widths[2]).toBeLessThan(93 + 439 - 100)
    expect(near(r.widths[2], Math.min(380, 93 + left))).toBe(true)
    // on a wider card the capped column stops at 380 and the other columns share the rest evenly
    const wide = allocateColumns(1600, specs)
    expect(near(wide.widths[2] - 380, wide.widths[1] - 154)).toBe(true)
    expect(near(wide.widths[4] - 136, wide.widths[1] - 154)).toBe(true)
  })

  it('does not depend on anything but the width and the column definitions', () => {
    const specs = [NO, fixed(150), text(100, 300), ACTION]
    expect(allocateColumns(900, specs)).toEqual(allocateColumns(900, specs))
  })
})
