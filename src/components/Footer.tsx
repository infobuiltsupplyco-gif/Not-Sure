import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="nav-logo">
            <span className="logo-mark" aria-hidden>◈</span>
            NOVA
          </div>
          <p className="footer-tag">Cinematic AI video &amp; image generation. Free forever.</p>
        </div>
        <div className="footer-cols">
          <div>
            <h4>Studio</h4>
            <Link to="/create">Create</Link>
            <Link to="/library">Library</Link>
            <Link to="/models">Engines</Link>
          </div>
          <div>
            <h4>Product</h4>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="#presets">Motion presets</a>
          </div>
        </div>
      </div>
      <p className="footer-fine">
        NOVA runs a fully client-side procedural engine in free mode — nothing is uploaded, nothing is billed.
      </p>
    </footer>
  )
}
