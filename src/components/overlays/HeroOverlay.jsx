import { useCallback, useRef } from 'react'
import { useSectionTicker } from '../../hooks/useSectionTicker.js'

export default function HeroOverlay() {
  const ref = useRef()

  useSectionTicker(
    'hero',
    useCallback((local) => {
      if (ref.current) ref.current.style.opacity = Math.max(0, 1 - local * 2.4)
    }, [])
  )

  return (
    <div ref={ref} className="overlay hero-overlay">
      <p className="hero-tagline">
        PRECISION-ENGINEERED PROTEIN<br />
        FOR BODIES THAT REFUSE TO IDLE
      </p>
      <div className="hero-meta">
        <span>EST. 2026</span>
        <span>AOTEAROA NZ</span>
        <span>BATCH №004</span>
      </div>
      <div className="scroll-hint">
        <span className="scroll-hint-label">SCROLL TO DIVE IN</span>
        <span className="scroll-hint-line" />
      </div>
    </div>
  )
}
