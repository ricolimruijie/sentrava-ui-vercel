// Dummy per-endpoint findings breakdown shared by the Domain and Network
// detail mocks: [critical, high, medium, low, info] for each of the 10 rows.
const ROWS = [
  [2, 9, 21, 14, 6],
  [0, 5, 12, 20, 9],
  [1, 7, 18, 11, 4],
  [3, 12, 24, 16, 8],
  [0, 3, 9, 15, 7],
  [1, 6, 14, 10, 5],
  [0, 4, 11, 17, 10],
  [2, 8, 19, 13, 3],
  [0, 2, 8, 12, 6],
  [1, 10, 22, 15, 9],
]

// { severityCounts: { critical, high, medium, low, info }, total }
export function endpointSeverity(i) {
  const [critical, high, medium, low, info] = ROWS[i % ROWS.length]
  return { severityCounts: { critical, high, medium, low, info }, total: critical + high + medium + low + info }
}
