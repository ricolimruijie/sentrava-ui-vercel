// Column width allocation shared by every table (README › Tables).
//
// Each column is described by { kind, base, max? }:
//   index / check / action  constant width, never change (No, checkbox, Action)
//   fixed                   short, predictable values: `base` = widest header or data + padding
//   text                    variable-length text: `base` = its minimum (header + padding), `max` = widest
//                           realistic value
//
// Given the width available, the leftover space (what is left after every column has its base width) is
// handed out like this:
//   1. text columns share it equally, but none grows past its `max`;
//   2. whatever is still left is spread evenly over every column except index / check / action, so no single
//      column ends up holding a big empty area;
// and when even the base widths don't fit, the table keeps them and scrolls sideways.
// Widths depend only on the available width and the column definitions, never on the data inside the cells.

const FROZEN = new Set(['index', 'check', 'action'])

export function allocateColumns(available, specs) {
  const w = specs.map((s) => s.base)
  const baseTotal = w.reduce((a, b) => a + b, 0)
  if (!(available > baseTotal)) return { widths: w, total: baseTotal, scrolls: baseTotal > available + 0.5 }

  let left = available - baseTotal

  // 1. text columns share the leftover equally, each up to its maximum
  let active = specs.map((s, i) => (s.kind === 'text' ? i : -1)).filter((i) => i >= 0)
  while (left > 0.01 && active.length) {
    const share = left / active.length
    let used = 0
    const next = []
    for (const i of active) {
      const room = Math.max(specs[i].max ?? Infinity, specs[i].base) - w[i]
      const add = Math.min(share, room)
      w[i] += add
      used += add
      if (room - add > 0.01) next.push(i)
    }
    left -= used
    active = next
    if (used < 0.01) break
  }

  // 2. anything still left goes evenly to every column except No / checkbox / Action
  if (left > 0.01) {
    const flexible = specs.map((s, i) => (FROZEN.has(s.kind) ? -1 : i)).filter((i) => i >= 0)
    if (flexible.length) flexible.forEach((i) => { w[i] += left / flexible.length })
  }
  return { widths: w, total: available, scrolls: false }
}
