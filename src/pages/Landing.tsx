import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import CinePlayer from '../components/CinePlayer'
import { ENGINES, PRESETS } from '../data/models'

const SHOWCASE = [
  { prompt: 'neon tokyo street in the rain, cinematic', preset: 'dolly-in' },
  { prompt: 'nebula collapsing into a newborn star', preset: 'orbit' },
  { prompt: 'golden hour desert dunes, fire in the wind', preset: 'crane-up' },
  { prompt: 'deep ocean bioluminescence, silent abyss', preset: 'bullet-time' },
  { prompt: 'ghost fog rolling over a silver moonlit lake', preset: 'dolly-out' },
  { prompt: 'jungle canopy after spring rain', preset: 'handheld' },
]

export default function Landing() {
  return (
    <div className="page">
      <Nav />

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <CinePlayer
            prompt="nebula aurora cinematic hero"
            presetId="orbit"
            aspect="21:9"
            duration={12}
            ambient
          />
        </div>
        <div className="hero-content">
          <p className="eyebrow">AI motion studio · $0 forever</p>
          <h1>
            Direct impossible shots.
            <br />
            <span className="grad-text">Pay absolutely nothing.</span>
          </h1>
          <p className="hero-sub">
            NOVA turns a line of text into cinematic motion — crash zooms, orbits, bullet time —
            rendered instantly in your browser. No credits. No watermarks. No card.
          </p>
          <div className="hero-cta">
            <Link to="/create" className="btn btn-primary btn-lg">Generate your first shot</Link>
            <a href="#presets" className="btn btn-ghost btn-lg">Explore motion presets</a>
          </div>
          <div className="hero-stats">
            <div><strong>11</strong><span>camera moves</span></div>
            <div><strong>6</strong><span>engine profiles</span></div>
            <div><strong>4</strong><span>aspect ratios</span></div>
            <div><strong>$0</strong><span>per generation</span></div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {[...Array(2)].map((_, i) => (
            <span key={i}>
              CRASH ZOOM · 360 ORBIT · BULLET TIME · FPV DIVE · WHIP PAN · CRANE UP · DOLLY IN ·
              HANDHELD · ZOOM PUNCH · LOCKED OFF ·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* SHOWCASE */}
      <section className="section">
        <h2>Live from the engine</h2>
        <p className="section-sub">
          Every tile below is rendering in real time on your device — the same engine you get in the studio.
        </p>
        <div className="showcase-grid">
          {SHOWCASE.map((s) => (
            <Link to={`/create?prompt=${encodeURIComponent(s.prompt)}&preset=${s.preset}`} key={s.prompt} className="showcase-card">
              <CinePlayer prompt={s.prompt} presetId={s.preset} aspect="16:9" duration={8} ambient />
              <div className="showcase-meta">
                <span className="chip">{PRESETS.find((p) => p.id === s.preset)?.name}</span>
                <p>{s.prompt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ENGINES */}
      <section className="section" id="engines">
        <h2>Six engines. One prompt box.</h2>
        <p className="section-sub">
          Pick the profile that matches the shot — flagship cinema, fast social, surreal VFX, photoreal, stills.
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
              <ul>
                {e.strengths.map((s) => <li key={s}>{s}</li>)}
              </ul>
              <p className="engine-spec">
                {e.kind === 'video' ? `Up to ${e.maxDuration}s · ` : ''}{e.resolution}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PRESETS */}
      <section className="section" id="presets">
        <h2>Camera language, one click</h2>
        <p className="section-sub">
          Motion presets encode real cinematography — apply a move to any prompt and the camera obeys.
        </p>
        <div className="preset-grid">
          {PRESETS.map((p) => (
            <Link to={`/create?preset=${p.id}`} key={p.id} className="preset-card">
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section className="section">
        <h2>Three steps to a finished shot</h2>
        <div className="steps">
          <div className="step"><span>1</span><h3>Describe it</h3><p>Type the scene. Palettes, atmosphere and mood are inferred from your words.</p></div>
          <div className="step"><span>2</span><h3>Direct it</h3><p>Choose an engine, a camera move, aspect ratio and duration.</p></div>
          <div className="step"><span>3</span><h3>Export it</h3><p>Download the clip as WebM or the still as PNG. It's yours — no watermark.</p></div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing">
        <h2>Pricing that ends the pricing page</h2>
        <div className="pricing">
          <div className="price-card price-hero">
            <h3>Everything</h3>
            <div className="price"><span>$0</span>/forever</div>
            <ul>
              <li>Unlimited video generations</li>
              <li>Unlimited image generations</li>
              <li>All 11 motion presets</li>
              <li>All 6 engine profiles</li>
              <li>WebM &amp; PNG export, no watermark</li>
              <li>100% private — renders on your device</li>
            </ul>
            <Link to="/create" className="btn btn-primary">Start now</Link>
            <p className="price-note">
              No account. No credits. The free engine runs entirely in your browser; hosted
              frontier models can be plugged in later with your own API keys.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <h2>FAQ</h2>
        <div className="faq">
          <details>
            <summary>How is this actually free?</summary>
            <p>
              Free mode uses NOVA's procedural engine, which renders deterministic cinematic scenes
              locally on your GPU via the browser canvas. There are no servers to pay for, so there is
              nothing to charge you for.
            </p>
          </details>
          <details>
            <summary>Can it use hosted frontier video models?</summary>
            <p>
              The studio is built provider-agnostic: engine profiles, prompts, camera presets and
              aspect settings all flow through one interface. Connecting a hosted model is a matter of
              mapping an engine profile to that provider's API with your own key — those providers bill
              per generation, which is why they aren't part of the free tier.
            </p>
          </details>
          <details>
            <summary>Who owns what I make?</summary>
            <p>You do. Everything is generated on your device and never leaves it unless you export and share it.</p>
          </details>
          <details>
            <summary>Why do the same prompts give the same shot?</summary>
            <p>
              Generation is seeded from your prompt, so results are reproducible. Hit "Reroll" in the
              studio to explore variations of the same prompt.
            </p>
          </details>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-final">
        <h2>The director's chair is empty.</h2>
        <Link to="/create" className="btn btn-primary btn-lg">Take it — free</Link>
      </section>

      <Footer />
    </div>
  )
}
