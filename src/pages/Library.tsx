import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import CinePlayer from '../components/CinePlayer'
import { ENGINES, PRESETS } from '../data/models'
import { useStore } from '../data/store'

export default function Library() {
  const { creations, removeCreation, clearAll } = useStore()

  return (
    <div className="page">
      <Nav />
      <section className="section">
        <div className="lib-head">
          <div>
            <h2>Your library</h2>
            <p className="section-sub">
              Creations are seeded, so they replay identically — stored on this device only.
            </p>
          </div>
          {creations.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearAll}>Clear all</button>
          )}
        </div>

        {creations.length === 0 ? (
          <div className="stage-empty lib-empty">
            <span className="logo-mark big" aria-hidden>◈</span>
            <h2>Nothing here yet</h2>
            <p>Everything you generate lands here automatically.</p>
            <Link to="/create" className="btn btn-primary">Create your first shot</Link>
          </div>
        ) : (
          <div className="showcase-grid">
            {creations.map((c) => (
              <div key={c.id} className="showcase-card">
                <CinePlayer
                  prompt={c.prompt}
                  presetId={c.presetId}
                  aspect={c.aspect}
                  duration={c.duration}
                  seedExtra={c.seedExtra}
                />
                <div className="showcase-meta">
                  <div className="lib-chips">
                    <span className="chip">{ENGINES.find((e) => e.id === c.engineId)?.name || c.engineId}</span>
                    {c.duration > 0 && (
                      <span className="chip">{PRESETS.find((p) => p.id === c.presetId)?.name}</span>
                    )}
                    <span className="chip">{c.aspect}</span>
                  </div>
                  <p>{c.prompt}</p>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeCreation(c.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  )
}
