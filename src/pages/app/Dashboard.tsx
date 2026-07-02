import { Link } from 'react-router-dom'
import IncidentChart from '../../components/IncidentChart'
import { incidentTrend, seedEvents, seedGuards, seedSites, trendLabels } from '../../data/seed'
import { timeAgo, useStore } from '../../data/store'
import type { PatrolEvent } from '../../data/types'
import { AlertIcon, ClockIcon, MapPinIcon, ShieldCheckIcon } from '../../components/Icons'

const EVENT_STYLE: Record<PatrolEvent['kind'], { bg: string; color: string; icon: JSX.Element }> = {
  checkpoint: { bg: 'var(--accent-soft)', color: 'var(--accent-strong)', icon: <MapPinIcon size={16} /> },
  incident: { bg: 'var(--critical-soft)', color: '#e66767', icon: <AlertIcon size={16} /> },
  welfare: { bg: 'var(--good-soft)', color: '#4ade4a', icon: <ShieldCheckIcon size={16} /> },
  'shift-start': { bg: 'var(--surface-3)', color: 'var(--ink-2)', icon: <ClockIcon size={16} /> },
  'shift-end': { bg: 'var(--surface-3)', color: 'var(--ink-2)', icon: <ClockIcon size={16} /> },
}

export default function Dashboard() {
  const { incidents } = useStore()
  const onDuty = seedGuards.filter((g) => g.status === 'on-duty').length
  const openIncidents = incidents.filter((i) => i.status !== 'resolved').length
  const activeSites = seedSites.filter((s) => s.status === 'active')
  const totalCp = activeSites.reduce((s, x) => s + x.checkpoints, 0)
  const scannedCp = activeSites.reduce((s, x) => s + x.checkpointsScanned, 0)
  const compliance = Math.round((scannedCp / totalCp) * 1000) / 10
  const mrr = seedSites.reduce((s, x) => s + x.contractValue, 0)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Operations</h1>
          <p className="sub">Live view across all sites · updated moments ago</p>
        </div>
        <span className="badge badge-good">
          <span className="dot" />
          All systems normal
        </span>
      </div>

      <div className="tiles">
        <div className="tile card">
          <div className="lbl">Guards on duty</div>
          <div className="val">{onDuty}</div>
          <div className="delta">
            <span className="up">▲ 2</span> vs. this time last week
          </div>
        </div>
        <div className="tile card">
          <div className="lbl">Open incidents</div>
          <div className="val">{openIncidents}</div>
          <div className="delta">
            1 critical — <Link to="/app/incidents" style={{ color: 'var(--accent-strong)' }}>triage now</Link>
          </div>
        </div>
        <div className="tile card">
          <div className="lbl">Checkpoint compliance (tonight)</div>
          <div className="val">{compliance}%</div>
          <div className="delta">
            {scannedCp} of {totalCp} checkpoints scanned
          </div>
        </div>
        <div className="tile card">
          <div className="lbl">Contracted revenue</div>
          <div className="val">${(mrr / 1000).toFixed(1)}k</div>
          <div className="delta">
            <span className="up">▲ $27.5k</span> Wynyard Quarter onboarding
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel card">
          <div className="panel-head">
            <h3>Incidents logged per day</h3>
            <span className="hint">Last 14 days</span>
          </div>
          <IncidentChart values={incidentTrend} labels={trendLabels()} />
        </div>

        <div className="panel card">
          <div className="panel-head">
            <h3>Live patrol activity</h3>
            <span className="hint">All sites</span>
          </div>
          <div className="feed">
            {seedEvents.map((e) => {
              const s = EVENT_STYLE[e.kind]
              return (
                <div key={e.id} className="feed-item">
                  <span className="f-icon" style={{ background: s.bg, color: s.color }}>
                    {s.icon}
                  </span>
                  <span className="f-body">
                    <div className="f-title">{e.detail}</div>
                    <div className="f-sub">
                      {e.guard} · {e.site}
                    </div>
                  </span>
                  <span className="f-time">{e.minutesAgo}m</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="panel card" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <h3>Latest incidents</h3>
          <Link to="/app/incidents" className="hint" style={{ color: 'var(--accent-strong)' }}>
            View all →
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Incident</th>
              <th>Site</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Logged</th>
            </tr>
          </thead>
          <tbody>
            {incidents.slice(0, 4).map((i) => (
              <tr key={i.id}>
                <td className="num">{i.id}</td>
                <td className="strong">{i.title}</td>
                <td>{i.site}</td>
                <td>
                  <SeverityBadge severity={i.severity} />
                </td>
                <td>
                  <StatusBadge status={i.status} />
                </td>
                <td>{timeAgo(i.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    low: 'badge-neutral',
    medium: 'badge-warning',
    high: 'badge-serious',
    critical: 'badge-critical',
  }
  return (
    <span className={`badge ${map[severity] ?? 'badge-neutral'}`}>
      <span className="dot" />
      {severity}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'badge-critical',
    investigating: 'badge-warning',
    resolved: 'badge-good',
    'on-duty': 'badge-good',
    'on-break': 'badge-warning',
    'off-duty': 'badge-neutral',
    active: 'badge-good',
    onboarding: 'badge-accent',
  }
  return (
    <span className={`badge ${map[status] ?? 'badge-neutral'}`}>
      <span className="dot" />
      {status.replace('-', ' ')}
    </span>
  )
}
