import { useCallback, useRef } from 'react'
import { useSectionTicker } from '../hooks/useSectionTicker.js'

// Odometer-style number roll. Digit columns translate to the current digit;
// value ramps 0 -> target across a window of the section's local progress.
export default function Odometer({ target, decimals = 0, suffix = '', label, section = 'pour', windowStart = 0.12, windowEnd = 0.6 }) {
  const factor = Math.pow(10, decimals)
  const targetInt = Math.round(target * factor)
  const digitCount = String(targetInt).length
  const colRefs = useRef([])
  const lastShown = useRef(-1)

  const tick = useCallback(
    (local) => {
      const k = Math.min(1, Math.max(0, (local - windowStart) / (windowEnd - windowStart)))
      const eased = 1 - Math.pow(1 - k, 3)
      const val = Math.round(targetInt * eased)
      if (val === lastShown.current) return
      lastShown.current = val
      const str = String(val).padStart(digitCount, '0')
      for (let i = 0; i < digitCount; i++) {
        const col = colRefs.current[i]
        if (col) col.style.transform = `translateY(${-Number(str[i])}em)`
      }
    },
    [targetInt, digitCount, windowStart, windowEnd]
  )
  useSectionTicker(section, tick)

  const digits = []
  const str = String(targetInt)
  for (let i = 0; i < digitCount; i++) {
    const isSep = decimals > 0 && i === digitCount - decimals
    if (isSep) digits.push(<span key={`dot`} className="odo-dot">.</span>)
    digits.push(
      <span key={i} className="odo-digit">
        <span className="odo-col" ref={(el) => (colRefs.current[i] = el)}>
          {'0123456789'.split('').map((d) => (
            <span key={d}>{d}</span>
          ))}
        </span>
      </span>
    )
    void str
  }

  return (
    <div className="odometer">
      <div className="odo-value">
        {digits}
        <span className="odo-suffix">{suffix}</span>
      </div>
      <div className="odo-label">{label}</div>
    </div>
  )
}
