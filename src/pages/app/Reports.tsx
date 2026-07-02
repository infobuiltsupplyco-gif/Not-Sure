import { useState } from 'react'
import { seedSites } from '../../data/seed'
import { useStore } from '../../data/store'
import { FileIcon } from '../../components/Icons'

export default function Reports() {
  const { incidents } = useStore()
  const [generated, setGenerated] = useState<string | null>(null)

  function generate(siteName: string) {
    const siteIncidents = incidents.filter((i) => i.site === siteName)
    const site = seedSites.find((s) => s.name === siteName)
    const lines = [
      `VIGIL — WEEKLY OPERATIONS REPORT`,
      `Site: ${siteName}`,
      `Client: ${site?.client ?? '—'}`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `CHECKPOINT COMPLIANCE`,
      site && site.checkpoints
        ? `${site.checkpointsScanned}/${site.checkpoints} scanned tonight (${Math.round((site.checkpointsScanned / site.checkpoints) * 100)}%)`
        : `Site onboarding — no patrol data yet`,
      ``,
      `INCIDENTS THIS WEEK (${siteIncidents.length})`,
      ...(siteIncidents.length
        ? siteIncidents.map(
            (i) =>
              `- [${i.severity.toUpperCase()}] ${i.id} ${i.title} — ${i.status} (reported by ${i.reportedBy})`,
          )
        : ['- No incidents recorded. All patrols completed without event.']),
      ``,
      `Report prepared automatically by Vigil.`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vigil-report-${siteName.toLowerCase().replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setGenerated(siteName)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p className="sub">Client-ready summaries, generated from live patrol and incident data</p>
        </div>
      </div>

      <div className="cards-3">
        {seedSites.map((s) => {
          const count = incidents.filter((i) => i.site === s.name).length
          return (
            <div key={s.id} className="site-card card">
              <div className="s-head">
                <h3>{s.name}</h3>
                <span className="badge badge-neutral">
                  <span className="dot" />
                  {count} incident{count === 1 ? '' : 's'}
                </span>
              </div>
              <div className="s-client">{s.client}</div>
              <p style={{ fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 18 }}>
                Weekly summary covering patrol compliance, incident log, and guard attendance for this site.
              </p>
              <button className="btn btn-ghost btn-sm" onClick={() => generate(s.name)}>
                <FileIcon size={15} />
                {generated === s.name ? 'Downloaded ✓ — generate again' : 'Generate weekly report'}
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}
