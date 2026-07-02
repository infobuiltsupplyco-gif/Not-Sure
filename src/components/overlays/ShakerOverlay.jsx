import { useCallback, useRef } from 'react'
import { useSectionTicker } from '../../hooks/useSectionTicker.js'

export default function ShakerOverlay() {
  const ref = useRef()

  useSectionTicker(
    'shaker',
    useCallback((local) => {
      if (!ref.current) return
      const inA = Math.min(1, Math.max(0, (local - 0.12) / 0.15))
      const out = Math.min(1, Math.max(0, (local - 0.85) / 0.15))
      ref.current.style.opacity = inA * (1 - out)
    }, [])
  )

  return (
    <div ref={ref} className="overlay shaker-overlay" style={{ opacity: 0 }}>
      <p className="shaker-caption">
        LIVE FLUID SIM // SCROLL VELOCITY = CHURN RATE
        <br />
        <span>GO ON. RIP THE WHEEL.</span>
      </p>
    </div>
  )
}
