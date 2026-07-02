export type EngineProfile = {
  id: string
  name: string
  vendorClass: string
  kind: 'video' | 'image'
  tagline: string
  strengths: string[]
  maxDuration: number
  resolution: string
  badge?: string
}

// Engine profiles. In free demo mode every profile routes to the built-in
// NOVA procedural renderer with parameters tuned per profile. To go live,
// map each profile id to a provider API call in src/engine/engine.ts.
export const ENGINES: EngineProfile[] = [
  {
    id: 'nova-cine-1',
    name: 'NOVA Cine 1',
    vendorClass: 'Flagship cinematic',
    kind: 'video',
    tagline: 'Film-grade motion with physical camera language.',
    strengths: ['Cinematic lighting', 'Camera control', 'Long takes'],
    maxDuration: 10,
    resolution: '720p–4K',
    badge: 'Flagship',
  },
  {
    id: 'nova-pulse',
    name: 'NOVA Pulse',
    vendorClass: 'Fast social video',
    kind: 'video',
    tagline: 'Snappy vertical clips built for feeds and ads.',
    strengths: ['Vertical-first', 'High energy', 'Sub-minute renders'],
    maxDuration: 8,
    resolution: '720p–1080p',
    badge: 'Fastest',
  },
  {
    id: 'nova-dream',
    name: 'NOVA Dream',
    vendorClass: 'Surreal / VFX',
    kind: 'video',
    tagline: 'Impossible physics, particle worlds, dream logic.',
    strengths: ['Abstract worlds', 'VFX transitions', 'Music-video looks'],
    maxDuration: 10,
    resolution: '720p–1080p',
  },
  {
    id: 'nova-real',
    name: 'NOVA Real',
    vendorClass: 'Photoreal video',
    kind: 'video',
    tagline: 'Documentary realism with natural light and texture.',
    strengths: ['Photorealism', 'Natural motion', 'Skin & fabric detail'],
    maxDuration: 10,
    resolution: '1080p–4K',
  },
  {
    id: 'nova-still-pro',
    name: 'NOVA Still Pro',
    vendorClass: 'Flagship image',
    kind: 'image',
    tagline: 'Editorial-grade stills with typography-safe layouts.',
    strengths: ['Poster & key art', 'Product shots', 'Color fidelity'],
    maxDuration: 0,
    resolution: 'Up to 4K',
    badge: 'Flagship',
  },
  {
    id: 'nova-sketch',
    name: 'NOVA Sketch',
    vendorClass: 'Concept image',
    kind: 'image',
    tagline: 'Rapid concept frames for boards and pitches.',
    strengths: ['Instant drafts', 'Style range', 'Batch variations'],
    maxDuration: 0,
    resolution: 'Up to 2K',
    badge: 'Fastest',
  },
]

export type MotionPreset = {
  id: string
  name: string
  desc: string
}

export const PRESETS: MotionPreset[] = [
  { id: 'crash-zoom', name: 'Crash Zoom', desc: 'Aggressive accelerating push straight into the subject.' },
  { id: 'dolly-in', name: 'Dolly In', desc: 'Smooth forward glide that builds intimacy.' },
  { id: 'dolly-out', name: 'Dolly Out', desc: 'Slow reveal pulling back from the subject.' },
  { id: 'orbit', name: '360 Orbit', desc: 'Camera circles the scene in a full sweep.' },
  { id: 'bullet-time', name: 'Bullet Time', desc: 'Frozen-moment arc with time dilation.' },
  { id: 'crane-up', name: 'Crane Up', desc: 'Rising crane move that opens up the world.' },
  { id: 'handheld', name: 'Handheld', desc: 'Organic documentary shake and drift.' },
  { id: 'whip-pan', name: 'Whip Pan', desc: 'Violent lateral snap between beats.' },
  { id: 'fpv-dive', name: 'FPV Dive', desc: 'Drone-style plunge with banked turns.' },
  { id: 'zoom-punch', name: 'Zoom Punch', desc: 'Impact zoom with recoil settle.' },
  { id: 'static', name: 'Locked Off', desc: 'Tripod-still frame; the scene does the moving.' },
]
