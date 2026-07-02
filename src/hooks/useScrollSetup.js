import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { scrollState } from '../state/store.js'

gsap.registerPlugin(ScrollTrigger)

// One Lenis instance drives everything. Native scroll stays intact
// (position: sticky keeps working), GSAP's ticker feeds Lenis' rAF,
// and a single ScrollTrigger mirrors global progress + velocity into
// the mutable scrollState that the R3F world reads every frame.
export function useScrollSetup() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.6,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time) => {
      lenis.raf(time * 1000)
      // smooth the velocity for shader/FX consumers
      const raw = Math.min(1.5, Math.abs(scrollState.v) * 0.55)
      scrollState.sv += (raw - scrollState.sv) * 0.06
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        scrollState.p = self.progress
        scrollState.v = self.getVelocity() / 1000
      },
    })

    // decay raw velocity between scroll events
    const decay = setInterval(() => {
      scrollState.v *= 0.82
    }, 50)

    return () => {
      st.kill()
      gsap.ticker.remove(tick)
      lenis.destroy()
      clearInterval(decay)
    }
  }, [])
}
