import { useCallback, useRef } from 'react'
import ScrambleText from '../ScrambleText.jsx'
import FlipClock from '../FlipClock.jsx'
import { useSectionTicker } from '../../hooks/useSectionTicker.js'
import { SALE_PRODUCTS } from '../../config/sections.js'

export default function SaleOverlay() {
  const ref = useRef()

  useSectionTicker(
    'sale',
    useCallback((local) => {
      if (!ref.current) return
      const inA = Math.min(1, Math.max(0, (local - 0.02) / 0.08))
      const out = Math.min(1, Math.max(0, (local - 0.9) / 0.1))
      ref.current.style.opacity = inA * (1 - out)
    }, [])
  )

  return (
    <div ref={ref} className="overlay sale-overlay" style={{ opacity: 0 }}>
      <div className="sale-head">
        <ScrambleText as="h2" className="section-title sale-title" text="THE CUT" />
        <div className="sale-countdown">
          <span className="sale-ends">PRICES DIE IN</span>
          <FlipClock />
        </div>
      </div>

      <ul className="sale-strip">
        {SALE_PRODUCTS.map((p) => (
          <li key={p.name} className="sale-item" data-cursor="scoop">
            <span className="sale-item-name">{p.name}</span>
            <span className="sale-item-prices">
              <s>${p.was}</s>
              <b>${p.now}</b>
            </span>
            <button className="btn-acid btn-small" data-magnetic>
              ADD
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
