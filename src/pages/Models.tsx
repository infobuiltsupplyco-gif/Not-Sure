import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { ENGINES } from '../data/models'

export default function Models() {
  return (
    <div className="page">
      <Nav />
      <section className="section">
        <h2>Engine profiles</h2>
        <p className="section-sub">
          Every profile shares one prompt interface. In free mode all profiles route to the on-device
          NOVA renderer; each can be remapped to a hosted provider with your own API key.
        </p>
        <div className="engine-grid">
          {ENGINES.map((e) => (
            <div className="engine-card" key={e.id}>
              <div className="engine-head">
                <h3>{e.name}</h3>
                {e.badge && <span className="badge">{e.badge}</span>}
              </div>
              <p className="engine-class">{e.vendorClass}</p>
              <p>{e.tagline}</p>
              <ul>{e.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
              <p className="engine-spec">
                {e.kind === 'video' ? `Up to ${e.maxDuration}s · ` : ''}{e.resolution}
              </p>
              <Link to={`/create`} className="btn btn-ghost btn-sm">Use this engine</Link>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  )
}
