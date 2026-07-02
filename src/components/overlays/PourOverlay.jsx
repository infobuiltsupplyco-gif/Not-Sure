import { useCallback, useRef } from 'react'
import Odometer from '../Odometer.jsx'
import { useSectionTicker } from '../../hooks/useSectionTicker.js'

export default function PourOverlay() {
  const ref = useRef()

  useSectionTicker(
    'pour',
    useCallback((local) => {
      if (!ref.current) return
      const inA = Math.min(1, Math.max(0, (local - 0.08) / 0.12))
      const out = Math.min(1, Math.max(0, (local - 0.85) / 0.15))
      ref.current.style.opacity = inA * (1 - out)
    }, [])
  )

  return (
    <div ref={ref} className="overlay pour-overlay" style={{ opacity: 0 }}>
      <p className="pour-kicker">PER 32G SCOOP</p>
      <div className="pour-stats">
        <Odometer target={25} suffix="g" label="PROTEIN" windowStart={0.12} windowEnd={0.5} />
        <Odometer target={5.5} decimals={1} suffix="g" label="BCAA" windowStart={0.22} windowEnd={0.6} />
        <Odometer target={0} suffix="" label="SUGAR" windowStart={0.3} windowEnd={0.65} />
      </div>
      <p className="pour-footnote">COLD-FILTERED. THIRD-PARTY TESTED. NO FAIRY DUST.</p>
    </div>
  )
}
