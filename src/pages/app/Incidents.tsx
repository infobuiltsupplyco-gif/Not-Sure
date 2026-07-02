import { useMemo, useState, type FormEvent } from 'react'
import { timeAgo, useStore } from '../../data/store'
import { seedSites, seedGuards } from '../../data/seed'
import type { Incident, IncidentStatus, Severity } from '../../data/types'
import { SeverityBadge, StatusBadge } from './Dashboard'

const STATUS_FILTERS: Array<{ key: IncidentStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'investigating', label: 'Investigating' },
  { key: 'resolved', label: 'Resolved' },
]

export default function Incidents() {
  const { incidents, addIncident, setIncidentStatus } = useStore()
  const [filter, setFilter] = useState<IncidentStatus | 'all'>('all')
  const [query, setQuery] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return incidents.filter(
      (i) =>
        (filter === 'all' || i.status === filter) &&
        (!q || `${i.id} ${i.title} ${i.site} ${i.reportedBy}`.toLowerCase().includes(q)),
    )
  }, [incidents, filter, query])

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Incidents</h1>
          <p className="sub">
            {incidents.filter((i) => i.status !== 'resolved').length} open ·{' '}
            {incidents.length} total this week
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          + Log incident
        </button>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search incidents…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="seg">
          {STATUS_FILTERS.map((f) => (
            <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {visible.length === 0 ? (
          <div className="empty">No incidents match — that’s a good night.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Incident</th>
                <th>Site</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Logged</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((i) => (
                <IncidentRow
                  key={i.id}
                  incident={i}
                  expanded={expanded === i.id}
                  onToggle={() => setExpanded(expanded === i.id ? null : i.id)}
                  onStatus={(s) => setIncidentStatus(i.id, s)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showNew && (
        <NewIncidentModal
          onClose={() => setShowNew(false)}
          onCreate={(inc) => {
            addIncident(inc)
            setShowNew(false)
            setFilter('all')
          }}
        />
      )}
    </>
  )
}

function IncidentRow({
  incident: i,
  expanded,
  onToggle,
  onStatus,
}: {
  incident: Incident
  expanded: boolean
  onToggle: () => void
  onStatus: (s: IncidentStatus) => void
}) {
  return (
    <>
      <tr onClick={onToggle} style={{ cursor: 'pointer' }}>
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
        <td style={{ color: 'var(--ink-3)' }}>{expanded ? '▾' : '▸'}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} style={{ background: 'var(--surface-2)' }}>
            <div style={{ padding: '6px 2px', display: 'grid', gap: 10 }}>
              <div>
                <strong style={{ color: 'var(--ink)' }}>Notes — </strong>
                {i.notes}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                Reported by {i.reportedBy} · {new Date(i.createdAt).toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {i.status !== 'investigating' && i.status !== 'resolved' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => onStatus('investigating')}>
                    Start investigating
                  </button>
                )}
                {i.status !== 'resolved' && (
                  <button className="btn btn-primary btn-sm" onClick={() => onStatus('resolved')}>
                    Mark resolved
                  </button>
                )}
                {i.status === 'resolved' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => onStatus('open')}>
                    Reopen
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function NewIncidentModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (inc: Omit<Incident, 'id' | 'createdAt'>) => void
}) {
  const [title, setTitle] = useState('')
  const [site, setSite] = useState(seedSites[0].name)
  const [severity, setSeverity] = useState<Severity>('medium')
  const [reportedBy, setReportedBy] = useState(seedGuards[0].name)
  const [notes, setNotes] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onCreate({ title: title.trim(), site, severity, status: 'open', reportedBy, notes: notes.trim() })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Log an incident</h2>
        <form className="form-grid" onSubmit={submit}>
          <div className="field">
            <label htmlFor="inc-title">What happened?</label>
            <input
              id="inc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Broken window — level 2 fire escape"
              autoFocus
              required
            />
          </div>
          <div className="row-2">
            <div className="field">
              <label htmlFor="inc-site">Site</label>
              <select id="inc-site" value={site} onChange={(e) => setSite(e.target.value)}>
                {seedSites.map((s) => (
                  <option key={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="inc-sev">Severity</label>
              <select id="inc-sev" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="inc-by">Reported by</label>
            <select id="inc-by" value={reportedBy} onChange={(e) => setReportedBy(e.target.value)}>
              {seedGuards.map((g) => (
                <option key={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="inc-notes">Notes</label>
            <textarea
              id="inc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Actions taken, people involved, follow-up required…"
            />
          </div>
          <div className="actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Log incident
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
