import { useEffect, useMemo, useRef } from 'react'

// Countdown with flipping 3D digit cards (CSS perspective flips).
// Target: 26h from first mount — a rolling "sale ends" deadline.
export default function FlipClock() {
  const target = useMemo(() => Date.now() + 26 * 3600 * 1000, [])
  const cellsRef = useRef([])

  useEffect(() => {
    const update = () => {
      const left = Math.max(0, target - Date.now())
      const h = Math.floor(left / 3600000)
      const m = Math.floor((left % 3600000) / 60000)
      const s = Math.floor((left % 60000) / 1000)
      const str = `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}${String(s).padStart(2, '0')}`
      cellsRef.current.forEach((cell, i) => {
        if (!cell) return
        const next = str[i]
        if (cell.dataset.value !== next) {
          cell.dataset.value = next
          const leaf = cell.querySelector('.flip-leaf')
          const face = cell.querySelector('.flip-face')
          leaf.textContent = face.textContent
          face.textContent = next
          cell.classList.remove('flipping')
          void cell.offsetWidth // restart the animation
          cell.classList.add('flipping')
        }
      })
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [target])

  const groups = [
    { label: 'HRS', digits: [0, 1] },
    { label: 'MIN', digits: [2, 3] },
    { label: 'SEC', digits: [4, 5] },
  ]

  return (
    <div className="flip-clock" aria-label="Sale countdown">
      {groups.map((g, gi) => (
        <div key={g.label} className="flip-group">
          <div className="flip-digits">
            {g.digits.map((d) => (
              <div key={d} className="flip-cell" ref={(el) => (cellsRef.current[d] = el)} data-value="">
                <span className="flip-face">0</span>
                <span className="flip-leaf">0</span>
              </div>
            ))}
          </div>
          <span className="flip-label">{g.label}</span>
          {gi < 2 && <span className="flip-colon">:</span>}
        </div>
      ))}
    </div>
  )
}
