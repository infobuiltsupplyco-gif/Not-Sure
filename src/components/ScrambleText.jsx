import { useEffect, useRef } from 'react'

const CHARS = '!<>-_\\/[]{}—=+*^?#01XZ'

// Splits text into chars and scrambles them into place whenever the
// element scrolls into view.
export default function ScrambleText({ text, as: Tag = 'span', className = '', delay = 0 }) {
  const rootRef = useRef()

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const spans = [...el.querySelectorAll('[data-ch]')]
    let interval

    const scramble = () => {
      clearInterval(interval)
      let frame = 0
      interval = setInterval(() => {
        frame++
        spans.forEach((span, i) => {
          const settle = delay * 60 + i * 2.2 + 6
          if (frame >= settle) {
            span.textContent = span.dataset.ch
            span.classList.add('scr-done')
          } else if (frame > delay * 60) {
            span.textContent = CHARS[(Math.random() * CHARS.length) | 0]
            span.classList.remove('scr-done')
          }
        })
        if (frame > delay * 60 + spans.length * 2.2 + 8) clearInterval(interval)
      }, 1000 / 30)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) scramble()
        }
      },
      { threshold: 0.35 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      clearInterval(interval)
    }
  }, [text, delay])

  return (
    <Tag ref={rootRef} className={`scramble ${className}`} aria-label={text}>
      {[...text].map((ch, i) =>
        ch === ' ' ? (
          <span key={i} className="scr-space">&nbsp;</span>
        ) : (
          <span key={i} data-ch={ch} aria-hidden="true">{ch}</span>
        )
      )}
    </Tag>
  )
}
