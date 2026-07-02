import { useCallback, useRef } from 'react'
import ScrambleText from '../ScrambleText.jsx'
import { useSectionTicker } from '../../hooks/useSectionTicker.js'
import { useStore } from '../../state/store.js'
import { FLAVORS } from '../../config/sections.js'

export default function TunnelOverlay() {
  const ref = useRef()
  const selected = useStore((s) => s.selectedFlavor)
  const selectFlavor = useStore((s) => s.selectFlavor)
  const flavor = selected ? FLAVORS[selected.ring] : null

  useSectionTicker(
    'tunnel',
    useCallback((local) => {
      if (!ref.current) return
      const inA = Math.min(1, Math.max(0, (local - 0.02) / 0.1))
      const out = Math.min(1, Math.max(0, (local - 0.88) / 0.12))
      ref.current.style.opacity = inA * (1 - out)
    }, [])
  )

  return (
    <div ref={ref} className="overlay tunnel-overlay" style={{ opacity: 0 }}>
      <div className="tunnel-titles">
        <ScrambleText as="h2" className="section-title" text="FLAVOR TUNNEL" />
        <p className="section-sub">SIX COLORWAYS. HOVER TO INSPECT. CLICK TO LOCK ON.</p>
      </div>

      {flavor && (
        <div className="spec-card" style={{ '--accent': flavor.accent, '--band': flavor.band }}>
          <button className="spec-close" onClick={() => selectFlavor(null)} aria-label="Close">
            ✕
          </button>
          <span className="spec-eyebrow">RING 0{selected.ring + 1} / SPEC SHEET</span>
          <h3 className="spec-name">{flavor.name}</h3>
          <p className="spec-desc">{flavor.desc}</p>
          <div className="spec-grid">
            <div>
              <b>{flavor.protein}g</b>
              <i>PROTEIN</i>
            </div>
            <div>
              <b>{flavor.kcal}</b>
              <i>KCAL</i>
            </div>
            <div>
              <b>{flavor.sweetener}</b>
              <i>SWEETENER</i>
            </div>
          </div>
          <div className="spec-actions">
            <span className="spec-price">$74.00</span>
            <button className="btn-acid" data-magnetic data-cursor="scoop">
              ADD TO STACK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
