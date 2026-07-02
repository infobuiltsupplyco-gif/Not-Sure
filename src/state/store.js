import { create } from 'zustand'

// React state — things that change rarely and should re-render UI
export const useStore = create((set) => ({
  ready: false, // WebGL context created — preloader may complete
  setReady: () => set({ ready: true }),

  loaded: false, // preloader finished, hero assembly may start
  setLoaded: () => set({ loaded: true }),

  selectedFlavor: null, // { ring, tub } | null
  selectFlavor: (v) => set({ selectedFlavor: v }),

  muted: true,
  setMuted: (muted) => set({ muted }),

  konamiAt: 0, // timestamp of last konami trigger
  fireKonami: () => set({ konamiAt: performance.now() }),
}))

// Mutable per-frame state — read inside useFrame / rAF, never re-renders React
export const scrollState = {
  p: 0, // global scroll progress 0..1
  v: 0, // raw scroll velocity (px/ms-ish, from ScrollTrigger)
  sv: 0, // smoothed |velocity| 0..~1
}

export const mouseState = {
  x: 0, // target, normalized -1..1
  y: 0,
  sx: 0, // smoothed
  sy: 0,
}

export const fxState = {
  shake: 0, // camera shake impulse, decays in CameraRig
  audioLevel: 0, // 0..1 from analyser
  idle: false,
  reduced: false, // low-power / mobile flag
}

export const isMobile = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(max-width: 768px)').matches || navigator.maxTouchPoints > 1)
