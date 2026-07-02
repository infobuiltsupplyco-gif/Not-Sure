// NOVA procedural generation engine.
// Renders deterministic, seeded cinematic scenes to a canvas — the free demo
// backend. Swapping in a hosted model provider only requires replacing the
// functions in this file with API calls; everything upstream (prompt, engine
// profile, motion preset, aspect, duration) already flows through Scene.

export type CameraState = {
  scale: number
  dx: number
  dy: number
  rot: number
  shake: number
}

export type MotionFn = (p: number) => CameraState // p in [0,1]

export type Palette = {
  name: string
  bg: [string, string]
  blobs: string[]
  particle: string
}

export type Scene = {
  seed: number
  palette: Palette
  blobs: Blob[]
  particles: Particle[]
  stars: Star[]
  horizon: number
}

type Blob = {
  cx: number
  cy: number
  r: number
  orbitR: number
  speed: number
  phase: number
  color: string
  wobble: number
}

type Particle = {
  x: number
  y: number
  size: number
  vx: number
  vy: number
  twinkle: number
}

type Star = { x: number; y: number; size: number; a: number }

export function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PALETTES: { keys: string[]; p: Palette }[] = [
  {
    keys: ['fire', 'flame', 'lava', 'explosion', 'burn', 'sunset', 'desert', 'mars'],
    p: {
      name: 'Ember',
      bg: ['#1a0603', '#3d0f04'],
      blobs: ['#ff5e1f', '#ffb01f', '#ff2d55', '#ff8c42', '#d94411'],
      particle: '#ffd29d',
    },
  },
  {
    keys: ['ocean', 'sea', 'water', 'underwater', 'wave', 'rain', 'storm', 'ice', 'arctic'],
    p: {
      name: 'Abyss',
      bg: ['#020a14', '#052540'],
      blobs: ['#1fa2ff', '#12d8fa', '#2b6cff', '#7fd4ff', '#0e4d92'],
      particle: '#c9f0ff',
    },
  },
  {
    keys: ['forest', 'jungle', 'nature', 'plant', 'garden', 'moss', 'spring'],
    p: {
      name: 'Verdant',
      bg: ['#03120a', '#0a2e18'],
      blobs: ['#28c76f', '#9dff70', '#0fb59b', '#5ee672', '#1f7a4d'],
      particle: '#e0ffd9',
    },
  },
  {
    keys: ['neon', 'cyberpunk', 'city', 'tokyo', 'synthwave', 'retro', 'arcade', 'club'],
    p: {
      name: 'Neon',
      bg: ['#0b0217', '#1d0538'],
      blobs: ['#ff2ec4', '#8a2eff', '#2ee6ff', '#ff5ea8', '#5b2eff'],
      particle: '#ffd0f4',
    },
  },
  {
    keys: ['space', 'galaxy', 'nebula', 'cosmos', 'star', 'astronaut', 'planet', 'void'],
    p: {
      name: 'Nebula',
      bg: ['#03020e', '#120a2e'],
      blobs: ['#6a4dff', '#b44dff', '#4d7bff', '#ff4dd2', '#2e1f8f'],
      particle: '#e6e0ff',
    },
  },
  {
    keys: ['gold', 'luxury', 'royal', 'honey', 'amber', 'champagne'],
    p: {
      name: 'Gilded',
      bg: ['#140d02', '#2e2004'],
      blobs: ['#ffc93d', '#ff9d1f', '#ffe08a', '#d98f11', '#b06e0a'],
      particle: '#fff1c2',
    },
  },
  {
    keys: ['ghost', 'fog', 'mist', 'winter', 'snow', 'moon', 'silver', 'noir'],
    p: {
      name: 'Phantom',
      bg: ['#07090d', '#161c26'],
      blobs: ['#9fb4cc', '#d7e3f4', '#5c7594', '#b8c8dd', '#3d4f66'],
      particle: '#f0f6ff',
    },
  },
]

const FALLBACKS: Palette[] = PALETTES.map((x) => x.p)

export function pickPalette(prompt: string, rand: () => number): Palette {
  const lower = prompt.toLowerCase()
  let best: Palette | null = null
  let bestIdx = Infinity
  for (const { keys, p } of PALETTES) {
    for (const k of keys) {
      const idx = lower.indexOf(k)
      if (idx !== -1 && idx < bestIdx) {
        bestIdx = idx
        best = p
      }
    }
  }
  return best ?? FALLBACKS[Math.floor(rand() * FALLBACKS.length)]
}

export function buildScene(prompt: string, seedExtra = 0): Scene {
  const seed = (hashSeed(prompt || 'nova') + seedExtra) >>> 0
  const rand = mulberry32(seed)
  const palette = pickPalette(prompt, rand)

  const blobs: Blob[] = []
  const blobCount = 6 + Math.floor(rand() * 4)
  for (let i = 0; i < blobCount; i++) {
    blobs.push({
      cx: 0.15 + rand() * 0.7,
      cy: 0.15 + rand() * 0.7,
      r: 0.14 + rand() * 0.24,
      orbitR: 0.04 + rand() * 0.12,
      speed: (rand() > 0.5 ? 1 : -1) * (0.4 + rand() * 0.9),
      phase: rand() * Math.PI * 2,
      color: palette.blobs[i % palette.blobs.length],
      wobble: 0.5 + rand() * 1.5,
    })
  }

  const particles: Particle[] = []
  const pCount = 70 + Math.floor(rand() * 50)
  for (let i = 0; i < pCount; i++) {
    particles.push({
      x: rand(),
      y: rand(),
      size: 0.6 + rand() * 2.2,
      vx: (rand() - 0.5) * 0.02,
      vy: -0.008 - rand() * 0.03,
      twinkle: rand() * Math.PI * 2,
    })
  }

  const stars: Star[] = []
  for (let i = 0; i < 60; i++) {
    stars.push({ x: rand(), y: rand() * 0.7, size: 0.4 + rand() * 1.2, a: 0.2 + rand() * 0.6 })
  }

  return { seed, palette, blobs, particles, stars, horizon: 0.62 + rand() * 0.2 }
}

// --- Motion presets (camera curves) ---

const ease = (t: number) => t * t * (3 - 2 * t)

export const MOTIONS: Record<string, MotionFn> = {
  static: () => ({ scale: 1, dx: 0, dy: 0, rot: 0, shake: 0 }),
  'dolly-in': (p) => ({ scale: 1 + ease(p) * 0.35, dx: 0, dy: 0, rot: 0, shake: 0 }),
  'dolly-out': (p) => ({ scale: 1.35 - ease(p) * 0.35, dx: 0, dy: 0, rot: 0, shake: 0 }),
  'crash-zoom': (p) => ({
    scale: 1 + Math.pow(p, 3.2) * 1.6,
    dx: 0,
    dy: 0,
    rot: 0,
    shake: p > 0.75 ? (p - 0.75) * 0.05 : 0,
  }),
  orbit: (p) => ({
    scale: 1.18,
    dx: Math.sin(p * Math.PI * 2) * 0.1,
    dy: Math.cos(p * Math.PI * 2) * 0.04,
    rot: Math.sin(p * Math.PI * 2) * 0.06,
    shake: 0,
  }),
  'crane-up': (p) => ({ scale: 1.12, dx: 0, dy: ease(p) * 0.22, rot: 0, shake: 0 }),
  handheld: (p) => ({
    scale: 1.08,
    dx: Math.sin(p * 23) * 0.008 + Math.sin(p * 7) * 0.012,
    dy: Math.cos(p * 19) * 0.008 + Math.cos(p * 5) * 0.01,
    rot: Math.sin(p * 11) * 0.008,
    shake: 0.004,
  }),
  'whip-pan': (p) => {
    const w = p < 0.45 ? 0 : p > 0.55 ? 1 : ease((p - 0.45) / 0.1)
    return { scale: 1.1, dx: -0.5 + w * 1.0, dy: 0, rot: 0, shake: p > 0.42 && p < 0.58 ? 0.02 : 0 }
  },
  'bullet-time': (p) => ({
    scale: 1.15 + Math.sin(p * Math.PI) * 0.08,
    dx: Math.sin(p * Math.PI * 2) * 0.16,
    dy: 0,
    rot: Math.sin(p * Math.PI * 2) * 0.12,
    shake: 0,
  }),
  'fpv-dive': (p) => ({
    scale: 1 + ease(p) * 0.9,
    dx: Math.sin(p * 9) * 0.02,
    dy: -ease(p) * 0.3,
    rot: Math.sin(p * 6) * 0.05,
    shake: 0.006,
  }),
  'zoom-punch': (p) => {
    const k = Math.sin(Math.min(p * 4, 1) * Math.PI * 0.5)
    return { scale: 1 + k * 0.5 - ease(p) * 0.15, dx: 0, dy: 0, rot: 0, shake: p < 0.3 ? 0.015 : 0 }
  },
}

// --- Frame renderer ---

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  t: number, // seconds
  p: number, // progress 0..1
  w: number,
  h: number,
  motion: MotionFn,
) {
  const cam = motion(p)
  const jx = cam.shake ? (Math.random() - 0.5) * cam.shake * w : 0
  const jy = cam.shake ? (Math.random() - 0.5) * cam.shake * h : 0

  ctx.save()
  ctx.clearRect(0, 0, w, h)

  // camera transform
  ctx.translate(w / 2 + cam.dx * w + jx, h / 2 + cam.dy * h + jy)
  ctx.rotate(cam.rot)
  ctx.scale(cam.scale, cam.scale)
  ctx.translate(-w / 2, -h / 2)

  // background — oversized so camera motion never reveals edges
  const pad = Math.max(w, h) * 0.8
  const bg = ctx.createLinearGradient(0, -pad, 0, h + pad)
  bg.addColorStop(0, scene.palette.bg[0])
  bg.addColorStop(1, scene.palette.bg[1])
  ctx.fillStyle = bg
  ctx.fillRect(-pad, -pad, w + pad * 2, h + pad * 2)

  // stars
  ctx.fillStyle = scene.palette.particle
  for (const s of scene.stars) {
    ctx.globalAlpha = s.a * (0.6 + 0.4 * Math.sin(t * 1.5 + s.x * 40))
    ctx.beginPath()
    ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // luminous blobs
  ctx.globalCompositeOperation = 'lighter'
  for (const b of scene.blobs) {
    const ox = Math.cos(t * b.speed + b.phase) * b.orbitR * w
    const oy = Math.sin(t * b.speed * b.wobble + b.phase) * b.orbitR * h
    const x = b.cx * w + ox
    const y = b.cy * h + oy
    const r = b.r * Math.min(w, h) * (1 + 0.08 * Math.sin(t * b.wobble + b.phase))
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, b.color + 'cc')
    g.addColorStop(0.55, b.color + '55')
    g.addColorStop(1, b.color + '00')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // drifting particles
  for (const pt of scene.particles) {
    const x = ((pt.x + pt.vx * t) % 1 + 1) % 1
    const y = ((pt.y + pt.vy * t) % 1 + 1) % 1
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 2 + pt.twinkle)
    ctx.fillStyle = scene.palette.particle
    ctx.beginPath()
    ctx.arc(x * w, y * h, pt.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  // post: vignette
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)

  // post: film grain (cheap — sparse random specks)
  ctx.globalAlpha = 0.05
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 120; i++) {
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
  }
  ctx.globalAlpha = 1

  // post: letterbox
  const bar = h * 0.05
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, bar)
  ctx.fillRect(0, h - bar, w, bar)
}

export const ASPECTS: Record<string, { w: number; h: number; label: string }> = {
  '16:9': { w: 1280, h: 720, label: 'Widescreen 16:9' },
  '9:16': { w: 720, h: 1280, label: 'Vertical 9:16' },
  '1:1': { w: 960, h: 960, label: 'Square 1:1' },
  '21:9': { w: 1440, h: 616, label: 'Cinema 21:9' },
}
