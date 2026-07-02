// Single source of truth for scroll layout.
// Every scene, camera keyframe and DOM overlay derives from these ranges.

export const SECTIONS = [
  { id: 'hero', vh: 150 },
  { id: 'pour', vh: 220 },
  { id: 'tunnel', vh: 280 },
  { id: 'sale', vh: 280 },
  { id: 'shaker', vh: 200 },
  { id: 'footer', vh: 250 },
]

const total = SECTIONS.reduce((a, s) => a + s.vh, 0)
// ScrollTrigger progress = scrollY / (docHeight - viewport), hence total - 100
const denom = total - 100

let acc = 0
export const RANGES = {}
for (const s of SECTIONS) {
  RANGES[s.id] = { start: acc / denom, end: Math.min(1, (acc + s.vh) / denom) }
  acc += s.vh
}

export const TOTAL_VH = total

/** Local progress (0..1, clamped) of a section for a global progress p */
export function localProgress(p, id) {
  const r = RANGES[id]
  return Math.min(1, Math.max(0, (p - r.start) / (r.end - r.start)))
}

/** Lerp inside a section's range: f=0 -> start, f=1 -> end */
export function at(id, f) {
  const r = RANGES[id]
  return r.start + (r.end - r.start) * f
}

// ---------------------------------------------------------------- world map
// The camera flies down through the hero tub (y axis), then along -z.
export const WORLD = {
  heroTub: [0, 0, 0],
  pourTop: -6,
  pourBottom: -36,
  tunnelY: -40,
  tunnelZStart: -44,
  tunnelZEnd: -94,
  saleZ: -120,
  saleY: -40,
  shakerZ: -150,
  holeZ: -180,
}

// ---------------------------------------------------------------- flavors
export const FLAVORS = [
  { name: 'DARK CHOCOLATE', body: '#3e2413', band: '#b87333', accent: '#e8955c', desc: 'Dutch cocoa, zero compromise. 72% cacao bitterness engineered into 25g of isolate.', kcal: 118, protein: 25, sweetener: 'MONK FRUIT' },
  { name: 'VANILLA BONE', body: '#f3e9d2', band: '#d4af37', accent: '#ffe9a8', desc: 'Madagascan vanilla, cold-filtered. The quiet one that hits hardest.', kcal: 112, protein: 25, sweetener: 'STEVIA' },
  { name: 'BERSERK BERRY', body: '#c81e78', band: '#7f00ff', accent: '#ff5ad1', desc: 'Blackcurrant + freeze-dried raspberry. Tastes like a warning label.', kcal: 115, protein: 25, sweetener: 'MONK FRUIT' },
  { name: 'MINT EXECUTION', body: '#9fe2bf', band: '#0c0c0e', accent: '#b8ffe3', desc: 'Peppermint oil at surgical dosage. Cold on the way down.', kcal: 110, protein: 25, sweetener: 'STEVIA' },
  { name: 'MOCHA OVERDRIVE', body: '#4a342a', band: '#caa472', accent: '#ffd9a0', desc: '80mg natural caffeine per scoop. Breakfast is a weapon now.', kcal: 121, protein: 24, sweetener: 'MONK FRUIT' },
  { name: 'RAW CHROME', body: '#dcdcdc', band: '#ffffff', accent: '#ffffff', desc: 'Unflavored. Unfiltered. For people who season nothing.', kcal: 104, protein: 26, sweetener: 'NONE' },
]

// ---------------------------------------------------------------- sale
export const SALE_PRODUCTS = [
  { name: 'WHEY ISOLATE 2KG', model: 'tub', was: 89, now: 59, x: -6.6 },
  { name: 'DETONATE PRE-WORKOUT', model: 'shaker', was: 54, now: 34, x: -2.2 },
  { name: 'CREATINE MONO 500G', model: 'pouch', was: 39, now: 24, x: 2.2 },
  { name: 'MASS GAINER 5KG', model: 'jug', was: 109, now: 69, x: 6.6 },
]

export const COLORS = {
  bg: '#0a0a0c',
  acid: '#c8ff00',
  chrome: '#e8e8ec',
}
