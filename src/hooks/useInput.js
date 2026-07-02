import { useEffect } from 'react'
import { mouseState, fxState, useStore } from '../state/store.js'

// Mouse tracking (normalized -1..1) + idle detection (8s -> cinematic orbit)
export function useMouseAndIdle() {
  useEffect(() => {
    let idleTimer

    const arm = () => {
      fxState.idle = false
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        fxState.idle = true
      }, 8000)
    }

    const onMove = (e) => {
      mouseState.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseState.y = (e.clientY / window.innerHeight) * 2 - 1
      arm()
    }
    const onAny = () => arm()

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('wheel', onAny, { passive: true })
    window.addEventListener('touchstart', onAny, { passive: true })
    window.addEventListener('keydown', onAny)
    arm()

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('wheel', onAny)
      window.removeEventListener('touchstart', onAny)
      window.removeEventListener('keydown', onAny)
      clearTimeout(idleTimer)
    }
  }, [])
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

// ↑↑↓↓←→←→BA — it rains tubs
export function useKonami() {
  const fire = useStore((s) => s.fireKonami)
  useEffect(() => {
    let i = 0
    const onKey = (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (key === KONAMI[i]) {
        i++
        if (i === KONAMI.length) {
          i = 0
          fire()
        }
      } else {
        i = key === KONAMI[0] ? 1 : 0
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fire])
}
