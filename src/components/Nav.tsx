import { Link, NavLink } from 'react-router-dom'

export default function Nav() {
  return (
    <header className="nav">
      <Link to="/" className="nav-logo">
        <span className="logo-mark" aria-hidden>◈</span>
        NOVA
      </Link>
      <nav className="nav-links">
        <NavLink to="/models">Engines</NavLink>
        <NavLink to="/library">Library</NavLink>
        <a href="#pricing" className="nav-plain">Pricing</a>
      </nav>
      <Link to="/create" className="btn btn-primary btn-sm">
        Start creating — free
      </Link>
    </header>
  )
}
