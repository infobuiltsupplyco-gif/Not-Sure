import { seedSites } from '../../data/seed'
import { StatusBadge } from './Dashboard'

export default function Sites() {
  const active = seedSites.filter((s) => s.status === 'active').length
  const mrr = seedSites.reduce((s, x) => s + x.contractValue, 0)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Sites</h1>
          <p className="sub">
            {active} active contracts · ${mrr.toLocaleString()} NZD/month contracted
          </p>
        </div>
      </div>

      <div className="cards-3">
        {seedSites.map((s) => {
          const pct = s.checkpoints ? Math.round((s.checkpointsScanned / s.checkpoints) * 100) : 0
          return (
            <div key={s.id} className="site-card card">
              <div className="s-head">
                <h3>{s.name}</h3>
                <StatusBadge status={s.status} />
              </div>
              <div className="s-client">
                {s.client} · {s.address}
              </div>
              {s.status === 'active' ? (
                <>
                  <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Checkpoint compliance for ${s.name}`}>
                    <div style={{ width: `${pct}%`, background: pct >= 90 ? 'var(--good)' : pct >= 75 ? 'var(--accent)' : 'var(--serious)' }} />
                  </div>
                  <div className="meter-row">
                    <span>
                      {s.checkpointsScanned}/{s.checkpoints} checkpoints tonight
                    </span>
                    <span style={{ fontWeight: 650, color: 'var(--ink-2)' }}>{pct}%</span>
                  </div>
                </>
              ) : (
                <div className="meter-row" style={{ marginTop: 0 }}>
                  <span>Go-live scheduled — checkpoint mapping in progress</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: '1px solid var(--hairline)',
                  fontSize: 13,
                  color: 'var(--ink-3)',
                }}
              >
                <span>
                  {s.guardsAssigned} guard{s.guardsAssigned === 1 ? '' : 's'} assigned
                </span>
                <span style={{ color: 'var(--ink-2)', fontWeight: 650 }}>
                  ${s.contractValue.toLocaleString()}/mo
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
