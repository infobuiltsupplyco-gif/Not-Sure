import { useEffect, useRef } from 'react'

// Magnetic ring cursor. Lerps after the pointer, swells over interactive
// elements, magnetizes [data-magnetic] targets, and morphs into a scoop
// icon over products (DOM [data-cursor="scoop"] or the 3D tunnel tubs via
// the 'apex:cursor' window event).
export default function Cursor() {
  const ringRef = useRef()
  const dotRef = useRef()

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const ring = ringRef.current
    const dot = dotRef.current
    document.documentElement.classList.add('has-custom-cursor')

    let mx = innerWidth / 2
    let my = innerHeight / 2
    let rx = mx
    let ry = my
    let scoop3d = false
    let magnetEl = null
    let raf

    const onMove = (e) => {
      mx = e.clientX
      my = e.clientY

      const t = e.target
      const interactive = t.closest?.('a, button, input, [data-magnetic], [data-cursor]')
      const scoopEl = t.closest?.('[data-cursor="scoop"]')

      ring.classList.toggle('cur-hover', !!interactive)
      ring.classList.toggle('cur-scoop', !!scoopEl || scoop3d)

      const m = t.closest?.('[data-magnetic]')
      if (m !== magnetEl) {
        if (magnetEl) magnetEl.style.transform = ''
        magnetEl = m
      }
      if (magnetEl) {
        const r = magnetEl.getBoundingClientRect()
        const dx = mx - (r.left + r.width / 2)
        const dy = my - (r.top + r.height / 2)
        magnetEl.style.transform = `translate(${dx * 0.22}px, ${dy * 0.22}px)`
        // pull the cursor toward the element center too
        mx -= dx * 0.28
        my -= dy * 0.28
      }
    }

    const onCursorMode = (e) => {
      scoop3d = e.detail === 'scoop'
      ring.classList.toggle('cur-scoop', scoop3d)
    }

    const onDown = () => ring.classList.add('cur-down')
    const onUp = () => ring.classList.remove('cur-down')

    const loop = () => {
      rx += (mx - rx) * 0.16
      ry += (my - ry) * 0.16
      ring.style.transform = `translate(${rx}px, ${ry}px)`
      dot.style.transform = `translate(${mx}px, ${my}px)`
      raf = requestAnimationFrame(loop)
    }
    loop()

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('apex:cursor', onCursorMode)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('apex:cursor', onCursorMode)
      document.documentElement.classList.remove('has-custom-cursor')
      if (magnetEl) magnetEl.style.transform = ''
    }
  }, [])

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true">
        <svg className="cursor-scoop-icon" viewBox="0 0 24 24" width="18" height="18">
          <path
            d="M4 11 a8 8 0 0 0 16 0 Z M12 11 L17 3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M4.5 11 a7.5 7.5 0 0 0 15 0 Z" fill="currentColor" opacity="0.35" />
        </svg>
      </div>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  )
}
