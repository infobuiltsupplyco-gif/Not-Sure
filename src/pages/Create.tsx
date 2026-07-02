import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Nav from '../components/Nav'
import CinePlayer from '../components/CinePlayer'
import { ASPECTS } from '../engine/engine'
import { ENGINES, PRESETS } from '../data/models'
import { useStore, type Creation } from '../data/store'

const STAGES = [
  'Parsing prompt…',
  'Building scene graph…',
  'Seeding palette & atmosphere…',
  'Blocking camera move…',
  'Rendering frames…',
  'Grading & film grain…',
]

type Job = {
  prompt: string
  engineId: string
  presetId: string
  aspect: string
  duration: number
  seedExtra: number
}

export default function Create() {
  const [params] = useSearchParams()
  const { addCreation } = useStore()

  const [mode, setMode] = useState<'video' | 'image'>('video')
  const [prompt, setPrompt] = useState(params.get('prompt') || '')
  const [engineId, setEngineId] = useState('nova-cine-1')
  const [presetId, setPresetId] = useState(params.get('preset') || 'dolly-in')
  const [aspect, setAspect] = useState('16:9')
  const [duration, setDuration] = useState(6)
  const [seedExtra, setSeedExtra] = useState(0)

  const [job, setJob] = useState<Job | null>(null)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')
  const [done, setDone] = useState(false)
  const timerRef = useRef<number[]>([])

  const engines = ENGINES.filter((e) => e.kind === mode)
  useEffect(() => {
    if (!engines.some((e) => e.id === engineId)) setEngineId(engines[0].id)
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => timerRef.current.forEach(clearTimeout), [])

  const generate = (reroll = false) => {
    if (!prompt.trim()) return
    timerRef.current.forEach(clearTimeout)
    timerRef.current = []
    const nextSeed = reroll ? seedExtra + 1 : seedExtra
    if (reroll) setSeedExtra(nextSeed)

    const j: Job = {
      prompt: prompt.trim(),
      engineId,
      presetId,
      aspect,
      duration: mode === 'video' ? duration : 0,
      seedExtra: nextSeed,
    }
    setJob(j)
    setDone(false)
    setProgress(0)

    // Staged progress — the procedural render is instant, but pacing the
    // reveal makes each stage of the pipeline legible.
    const total = 4200 + Math.random() * 1800
    STAGES.forEach((s, i) => {
      timerRef.current.push(
        window.setTimeout(() => {
          setStage(s)
          setProgress(Math.round(((i + 1) / (STAGES.length + 1)) * 100))
        }, (total / (STAGES.length + 1)) * i),
      )
    })
    timerRef.current.push(
      window.setTimeout(() => {
        setProgress(100)
        setStage('Done')
        setDone(true)
        addCreation({
          id: `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
          kind: j.duration > 0 ? 'video' : 'image',
          prompt: j.prompt,
          engineId: j.engineId,
          presetId: j.presetId,
          aspect: j.aspect,
          duration: j.duration,
          seedExtra: j.seedExtra,
          createdAt: Date.now(),
        } satisfies Creation)
      }, total),
    )
  }

  const engine = ENGINES.find((e) => e.id === engineId)

  return (
    <div className="page">
      <Nav />
      <div className="studio">
        {/* CONTROLS */}
        <aside className="panel">
          <div className="mode-toggle">
            <button className={mode === 'video' ? 'on' : ''} onClick={() => setMode('video')}>Video</button>
            <button className={mode === 'image' ? 'on' : ''} onClick={() => setMode('image')}>Image</button>
          </div>

          <label className="field">
            <span>Prompt</span>
            <textarea
              rows={4}
              placeholder="A neon city dissolving into ocean fog at midnight…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Engine</span>
            <select value={engineId} onChange={(e) => setEngineId(e.target.value)}>
              {engines.map((e) => (
                <option key={e.id} value={e.id}>{e.name} — {e.vendorClass}</option>
              ))}
            </select>
            {engine && <small>{engine.tagline}</small>}
          </label>

          {mode === 'video' && (
            <>
              <label className="field">
                <span>Camera move</span>
                <div className="preset-pills">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      className={`pill ${presetId === p.id ? 'on' : ''}`}
                      onClick={() => setPresetId(p.id)}
                      title={p.desc}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </label>
              <label className="field">
                <span>Duration — {duration}s</span>
                <input type="range" min={3} max={10} value={duration} onChange={(e) => setDuration(+e.target.value)} />
              </label>
            </>
          )}

          <label className="field">
            <span>Aspect ratio</span>
            <div className="preset-pills">
              {Object.entries(ASPECTS).map(([k, v]) => (
                <button key={k} className={`pill ${aspect === k ? 'on' : ''}`} onClick={() => setAspect(k)} title={v.label}>
                  {k}
                </button>
              ))}
            </div>
          </label>

          <button className="btn btn-primary btn-lg btn-block" onClick={() => generate(false)} disabled={!prompt.trim()}>
            {job && !done ? 'Generating…' : 'Generate — $0.00'}
          </button>
          {done && (
            <button className="btn btn-ghost btn-block" onClick={() => generate(true)}>
              ↻ Reroll variation
            </button>
          )}
          <p className="panel-note">
            Free demo engine — renders locally, saves to your Library automatically.
          </p>
        </aside>

        {/* PREVIEW */}
        <main className="stage">
          {!job && (
            <div className="stage-empty">
              <span className="logo-mark big" aria-hidden>◈</span>
              <h2>Your shot appears here</h2>
              <p>Describe a scene, pick a camera move, hit Generate.</p>
            </div>
          )}
          {job && !done && (
            <div className="stage-progress">
              <div className="progress-ring" style={{ ['--p' as string]: `${progress}%` }}>
                <span>{progress}%</span>
              </div>
              <p className="stage-label">{stage}</p>
              <p className="stage-detail">{engine?.name} · {job.aspect}{job.duration ? ` · ${job.duration}s` : ''}</p>
            </div>
          )}
          {job && done && (
            <div className="stage-result">
              <CinePlayer
                prompt={job.prompt}
                presetId={job.presetId}
                aspect={job.aspect}
                duration={job.duration}
                seedExtra={job.seedExtra}
              />
              <p className="result-prompt">“{job.prompt}”</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
