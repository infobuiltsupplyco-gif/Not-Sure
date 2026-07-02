import { useCallback, useRef, useState } from 'react'
import { useSectionTicker } from '../../hooks/useSectionTicker.js'

export default function FooterOverlay() {
  const ref = useRef()
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  useSectionTicker(
    'footer',
    useCallback((local) => {
      if (!ref.current) return
      ref.current.style.opacity = Math.min(1, Math.max(0, (local - 0.45) / 0.25))
    }, [])
  )

  const submit = (e) => {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
  }

  return (
    <div ref={ref} className="overlay footer-overlay" style={{ opacity: 0 }}>
      <div className="footer-cta">
        <p className="footer-kicker">TRANSMISSIONS FROM THE VOID</p>
        {sent ? (
          <p className="footer-sent">
            LOCKED IN. <span>THE MACHINE KNOWS YOUR NAME NOW.</span>
          </p>
        ) : (
          <form className="email-form" onSubmit={submit}>
            <div className="email-border">
              <input
                type="email"
                required
                placeholder="YOUR@EMAIL.SYSTEM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
              />
              <button type="submit" className="btn-acid" data-magnetic>
                JACK IN
              </button>
            </div>
          </form>
        )}
        <p className="footer-hint">PSST — ↑↑↓↓←→←→BA</p>
      </div>

      <div className="footer-base">
        <span>© 2026 APEX FUEL LTD</span>
        <span className="footer-links">
          <a href="#section-hero">INSTAGRAM</a>
          <a href="#section-hero">TIKTOK</a>
          <a href="#section-hero">LAB REPORTS</a>
        </span>
        <span>FUEL THE MACHINE</span>
      </div>
    </div>
  )
}
