import { useState } from 'react'

interface Props {
  values: number[]
  labels: string[]
}

/**
 * Single-series bar chart (incidents per day). Follows the dataviz spec:
 * thin bars with 4px rounded top data-ends anchored to a square baseline,
 * 2px surface gap between bars, recessive gridlines/axis ink, per-mark
 * hover tooltip with a hit target wider than the mark, and no legend
 * (single series — the panel title names it).
 */
export default function IncidentChart({ values, labels }: Props) {
  const [hover, setHover] = useState<number | null>(null)

  const W = 640
  const H = 220
  const PAD_L = 30
  const PAD_B = 24
  const PAD_T = 12
  const plotW = W - PAD_L - 8
  const plotH = H - PAD_T - PAD_B
  const max = Math.max(4, ...values)
  const step = plotW / values.length
  const barW = Math.min(26, step - 8)
  const r = Math.min(4, barW / 2)

  const y = (v: number) => PAD_T + plotH - (v / max) * plotH
  const ticks = [0, Math.round(max / 2), max]

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Incidents logged per day, last 14 days">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - 8} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth="1" />
            <text
              x={PAD_L - 8}
              y={y(t) + 4}
              textAnchor="end"
              fontSize="11"
              fill="var(--ink-3)"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {t}
            </text>
          </g>
        ))}
        {values.map((v, i) => {
          const cx = PAD_L + i * step + step / 2
          const barH = Math.max(2, (v / max) * plotH)
          const top = PAD_T + plotH - barH
          const active = hover === i
          return (
            <g key={i}>
              {/* rounded top corners only: rounded rect clipped at the baseline */}
              <path
                d={`M ${cx - barW / 2} ${top + r}
                    Q ${cx - barW / 2} ${top} ${cx - barW / 2 + r} ${top}
                    L ${cx + barW / 2 - r} ${top}
                    Q ${cx + barW / 2} ${top} ${cx + barW / 2} ${top + r}
                    L ${cx + barW / 2} ${PAD_T + plotH}
                    L ${cx - barW / 2} ${PAD_T + plotH} Z`}
                fill={active ? 'var(--accent-strong)' : 'var(--accent)'}
              />
              {i % 2 === 0 && (
                <text x={cx} y={H - 6} textAnchor="middle" fontSize="10.5" fill="var(--ink-3)">
                  {labels[i]}
                </text>
              )}
              {/* hover hit target wider than the mark */}
              <rect
                x={PAD_L + i * step}
                y={PAD_T}
                width={step}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          )
        })}
        <line
          x1={PAD_L}
          x2={W - 8}
          y1={PAD_T + plotH}
          y2={PAD_T + plotH}
          stroke="var(--baseline)"
          strokeWidth="1"
        />
      </svg>
      {hover !== null && (
        <div
          className="chart-tip"
          style={{
            left: `${((PAD_L + hover * step + step / 2) / W) * 100}%`,
            top: `${(y(values[hover]) / H) * 100}%`,
          }}
        >
          <div className="t-val">{values[hover]} incidents</div>
          <div className="t-lbl">{labels[hover]}</div>
        </div>
      )}
    </div>
  )
}
