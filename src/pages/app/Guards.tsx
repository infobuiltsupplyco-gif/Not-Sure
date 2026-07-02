import { useMemo, useState } from 'react'
import { seedGuards } from '../../data/seed'
import type { GuardStatus } from '../../data/types'
import { StatusBadge } from './Dashboard'

const FILTERS: Array<{ key: GuardStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'on-duty', label: 'On duty' },
  { key: 'on-break', label: 'On break' },
  { key: 'off-duty', label: 'Off duty' },
]

export default function Guards() {
  const [filter, setFilter] = useState<GuardStatus | 'all'>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return seedGuards.filter(
      (g) =>
        (filter === 'all' || g.status === filter) &&
        (!q || `${g.name} ${g.role} ${g.site ?? ''} ${g.licence}`.toLowerCase().includes(q)),
    )
  }, [filter, query])

  const onDuty = seedGuards.filter((g) => g.status === 'on-duty').length

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Guards</h1>
          <p className="sub">
            {onDuty} of {seedGuards.length} on duty · all licences current
          </p>
        </div>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search guards…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="seg">
          {FILTERS.map((f) => (
            <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cards-2">
        {visible.map((g) => (
          <div key={g.id} className="guard-card card">
            <span className="avatar">
              {g.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)}
            </span>
            <span>
              <div className="g-name">{g.name}</div>
              <div className="g-sub">
                {g.role} · {g.licence} · {g.phone}
              </div>
              <div className="g-sub">
                {g.site ? `${g.site}${g.shiftEnds ? ` · shift ends ${g.shiftEnds}` : ''}` : 'Not rostered tonight'}
              </div>
            </span>
            <StatusBadge status={g.status} />
          </div>
        ))}
        {visible.length === 0 && <div className="empty card">No guards match that filter.</div>}
      </div>
    </>
  )
}
