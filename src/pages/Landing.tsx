import { Link } from 'react-router-dom'
import {
  AlertIcon,
  BoltIcon,
  BuildingIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  FileIcon,
  Logo,
  MapPinIcon,
  RadarIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '../components/Icons'

const FEATURES = [
  {
    icon: <MapPinIcon />,
    title: 'GPS-verified patrols',
    body: 'Guards scan NFC checkpoints on their phone. Every scan is timestamped and geo-verified, so you can prove coverage to any client, any night.',
  },
  {
    icon: <AlertIcon />,
    title: 'Incident reporting in 60 seconds',
    body: 'Photos, severity, and voice-to-text notes from the field. Reports land in the client portal before the guard finishes their round.',
  },
  {
    icon: <UsersIcon />,
    title: 'Rostering that fills itself',
    body: 'Licence-aware scheduling matches certified guards to sites, flags expiring CoAs, and broadcasts open shifts to available staff.',
  },
  {
    icon: <RadarIcon />,
    title: 'Live operations board',
    body: 'One screen shows every guard, site, and open incident in real time. Missed welfare checks escalate automatically.',
  },
  {
    icon: <FileIcon />,
    title: 'Client portal & auto-reports',
    body: 'Clients log in to see their own sites — patrol proof, incident history, and a branded PDF summary every Monday morning.',
  },
  {
    icon: <ChartIcon />,
    title: 'Margin analytics',
    body: 'See profitability per contract, not just per company. Know which sites make money before the quarter ends.',
  },
]

const PLANS = [
  {
    name: 'Patrol',
    price: '$12',
    per: '/guard/mo',
    desc: 'For crews getting off paper and WhatsApp.',
    features: ['GPS checkpoint scanning', 'Incident reports with photos', 'Shift start/end logging', 'Email support'],
    cta: 'Start free trial',
    featured: false,
  },
  {
    name: 'Operations',
    price: '$29',
    per: '/guard/mo',
    desc: 'For companies running multiple sites and clients.',
    features: [
      'Everything in Patrol',
      'Live operations board',
      'Licence-aware rostering',
      'Client portal & weekly PDF reports',
      'Welfare check escalations',
      'Priority support',
    ],
    cta: 'Start free trial',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    per: '',
    desc: 'For national operators and multi-branch groups.',
    features: [
      'Everything in Operations',
      'Multi-branch management',
      'Margin & contract analytics',
      'API access & integrations',
      'SLA + dedicated onboarding',
    ],
    cta: 'Talk to sales',
    featured: false,
  },
]

const QUOTES = [
  {
    quote:
      'We replaced paper run sheets, a whiteboard roster, and three group chats with Vigil. Our clients noticed within a week — the Monday report alone has won us two contract renewals.',
    name: 'Karen T.',
    role: 'Director, guarding company — Auckland',
    initials: 'KT',
  },
  {
    quote:
      'The first time a client disputed whether a patrol happened, I sent them the GPS-stamped scan log. That conversation used to take a week of he-said-she-said. Now it takes one screenshot.',
    name: 'Mike R.',
    role: 'Operations Manager — Christchurch',
    initials: 'MR',
  },
  {
    quote:
      'Rostering used to eat my Sunday. Vigil flags who is licensed, who is available, and who is about to hit overtime. It builds the week in minutes.',
    name: 'Losa F.',
    role: 'Rostering Lead — Wellington',
    initials: 'LF',
  },
]

export default function Landing() {
  return (
    <div>
      <header className="mk-nav">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="mk-nav-links">
          <a href="#product">Product</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#customers">Customers</a>
        </nav>
        <div className="mk-nav-cta">
          <Link to="/login" className="btn btn-ghost btn-sm">
            Sign in
          </Link>
          <Link to="/login" className="btn btn-primary btn-sm">
            Start free trial
          </Link>
        </div>
      </header>

      <section className="mk-hero">
        <span className="badge badge-accent">
          <span className="dot" />
          Built for security operations companies
        </span>
        <h1>
          Run your entire security company <span className="gradient-text">from one screen</span>
        </h1>
        <p className="sub">
          Vigil is the operating system for guarding and patrol companies — live patrol verification, incident
          reporting, licence-aware rostering, and client portals that win contract renewals.
        </p>
        <div className="mk-hero-cta">
          <Link to="/login" className="btn btn-primary btn-lg">
            Try the live demo
          </Link>
          <a href="#product" className="btn btn-ghost btn-lg">
            See the product
          </a>
        </div>
        <p className="mk-hero-note">14-day free trial · No credit card · Set up in an afternoon</p>
      </section>

      <section className="mk-section" style={{ paddingTop: 0 }}>
        <div className="mk-stats">
          <div className="mk-stat card">
            <div className="num">97.4%</div>
            <div className="lbl">avg. checkpoint compliance on Vigil</div>
          </div>
          <div className="mk-stat card">
            <div className="num">60s</div>
            <div className="lbl">median time to file an incident</div>
          </div>
          <div className="mk-stat card">
            <div className="num">6 hrs</div>
            <div className="lbl">admin saved per manager, per week</div>
          </div>
          <div className="mk-stat card">
            <div className="num">2×</div>
            <div className="lbl">contract renewal rate vs. paper reporting</div>
          </div>
        </div>
      </section>

      <section id="product" className="mk-section">
        <p className="mk-kicker">Product</p>
        <h2 className="mk-h2">Everything between the guard and the invoice</h2>
        <p className="mk-lede">
          Most security companies run on paper run sheets, spreadsheets, and group chats. Vigil replaces all of it with
          one system your guards, dispatchers, and clients share.
        </p>
        <div className="mk-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="mk-feature card">
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mk-section">
        <p className="mk-kicker">How it works</p>
        <h2 className="mk-h2">From street to spreadsheet-free in three steps</h2>
        <div className="mk-grid" style={{ marginTop: 36 }}>
          <div className="mk-feature card">
            <div className="icon">
              <BuildingIcon />
            </div>
            <h3>1 — Map your sites</h3>
            <p>
              Add sites and stick NFC checkpoint tags where patrols matter — doors, docks, plant rooms. Import your
              guard list with licence numbers and expiry dates.
            </p>
          </div>
          <div className="mk-feature card">
            <div className="icon">
              <BoltIcon />
            </div>
            <h3>2 — Guards use their phones</h3>
            <p>
              No hardware to buy. Guards scan checkpoints, log incidents with photos, and confirm welfare checks from
              the Vigil app on any smartphone.
            </p>
          </div>
          <div className="mk-feature card">
            <div className="icon">
              <ShieldCheckIcon />
            </div>
            <h3>3 — Clients see the proof</h3>
            <p>
              Your clients get a portal with live patrol proof and a branded weekly report. Renewals stop being
              arguments and start being formalities.
            </p>
          </div>
        </div>
      </section>

      <section id="customers" className="mk-section">
        <p className="mk-kicker">Customers</p>
        <h2 className="mk-h2">Operators switch, then never look back</h2>
        <div className="mk-grid" style={{ marginTop: 36 }}>
          {QUOTES.map((q) => (
            <figure key={q.name} className="mk-quote card" style={{ margin: 0 }}>
              <p>“{q.quote}”</p>
              <figcaption className="who">
                <span className="avatar">{q.initials}</span>
                <span>
                  <span className="name">{q.name}</span>
                  <br />
                  <span className="role">{q.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="pricing" className="mk-section">
        <p className="mk-kicker">Pricing</p>
        <h2 className="mk-h2">Priced per guard, so it scales with you</h2>
        <p className="mk-lede">Win one mid-size contract and Vigil pays for itself for the year.</p>
        <div className="mk-pricing">
          {PLANS.map((p) => (
            <div key={p.name} className={`mk-plan card${p.featured ? ' featured' : ''}`}>
              {p.featured && <span className="plan-tag">Most popular</span>}
              <div className="plan-name">{p.name}</div>
              <div className="plan-price">
                {p.price}
                <span>{p.per}</span>
              </div>
              <p className="plan-desc">{p.desc}</p>
              <ul>
                {p.features.map((f) => (
                  <li key={f}>
                    <CheckIcon size={15} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/login" className={`btn ${p.featured ? 'btn-primary' : 'btn-ghost'}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-cta-panel card">
          <h2 className="mk-h2" style={{ marginBottom: 10 }}>
            Your guards are already out there. See them.
          </h2>
          <p className="mk-lede" style={{ margin: '0 auto 28px' }}>
            Explore the live demo with a fully-loaded operations dashboard — no signup required.
          </p>
          <Link to="/login" className="btn btn-primary btn-lg" style={{ display: 'inline-flex' }}>
            <ClockIcon size={18} /> Open the live demo
          </Link>
        </div>
      </section>

      <footer className="mk-footer">
        <span>© {new Date().getFullYear()} Vigil Technologies Ltd · Aotearoa New Zealand</span>
        <div className="cols">
          <a href="#product">Product</a>
          <a href="#pricing">Pricing</a>
          <Link to="/login">Sign in</Link>
        </div>
      </footer>
    </div>
  )
}
