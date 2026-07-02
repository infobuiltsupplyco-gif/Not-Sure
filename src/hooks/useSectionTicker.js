import { useEffect } from 'react'
import gsap from 'gsap'
import { scrollState } from '../state/store.js'
import { localProgress } from '../config/sections.js'

// Runs cb(localProgress, globalProgress) on gsap's ticker — DOM overlays
// read scroll state imperatively, zero React re-renders.
export function useSectionTicker(id, cb) {
  useEffect(() => {
    const tick = () => cb(localProgress(scrollState.p, id), scrollState.p)
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [id, cb])
}
