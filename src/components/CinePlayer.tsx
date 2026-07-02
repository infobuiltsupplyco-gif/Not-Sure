import { useEffect, useRef, useState } from 'react'
import { ASPECTS, MOTIONS, buildScene, renderFrame, type Scene } from '../engine/engine'

type Props = {
  prompt: string
  presetId: string
  aspect: string
  duration: number // seconds; 0 => still image
  seedExtra?: number
  autoplay?: boolean
  ambient?: boolean // background/hero usage: no chrome, always playing
  className?: string
}

export default function CinePlayer({
  prompt,
  presetId,
  aspect,
  duration,
  seedExtra = 0,
  autoplay = true,
  ambient = false,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<Scene | null>(null)
  const [playing, setPlaying] = useState(autoplay)
  const playingRef = useRef(playing)
  playingRef.current = playing
  const [recording, setRecording] = useState(false)

  const dims = ASPECTS[aspect] || ASPECTS['16:9']
  const isStill = duration <= 0

  useEffect(() => {
    sceneRef.current = buildScene(prompt, seedExtra)
  }, [prompt, seedExtra])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const motion = MOTIONS[presetId] || MOTIONS.static
    let raf = 0
    let start = performance.now()
    let pausedAt = 0

    const draw = (now: number) => {
      const scene = sceneRef.current
      if (!scene) return
      let t: number
      if (isStill) {
        t = 3.7 // frozen moment
      } else if (playingRef.current) {
        t = ((now - start) / 1000) % duration
      } else {
        t = pausedAt
      }
      const p = isStill ? 0.5 : t / duration
      renderFrame(ctx, scene, t + scene.seed % 10, p, canvas.width, canvas.height, motion)
      pausedAt = t
      if (!isStill) raf = requestAnimationFrame(draw)
    }

    start = performance.now()
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [presetId, duration, isStill, prompt, seedExtra])

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.download = 'nova-still.png'
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  const downloadVideo = () => {
    const canvas = canvasRef.current
    if (!canvas || recording) return
    if (typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
      downloadImage()
      return
    }
    const stream = canvas.captureStream(30)
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm' })
    const chunks: BlobPart[] = []
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const a = document.createElement('a')
      a.download = 'nova-clip.webm'
      a.href = URL.createObjectURL(blob)
      a.click()
      URL.revokeObjectURL(a.href)
      setRecording(false)
    }
    setPlaying(true)
    setRecording(true)
    rec.start()
    setTimeout(() => rec.stop(), duration * 1000)
  }

  return (
    <div className={`cine ${ambient ? 'cine-ambient' : ''} ${className || ''}`} data-aspect={aspect}>
      <canvas ref={canvasRef} width={dims.w} height={dims.h} />
      {!ambient && (
        <div className="cine-bar">
          {!isStill && (
            <button className="btn btn-ghost btn-sm" onClick={() => setPlaying((v) => !v)}>
              {playing ? '❚❚ Pause' : '▶ Play'}
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={isStill ? downloadImage : downloadVideo}
            disabled={recording}
          >
            {recording ? 'Recording…' : isStill ? '↓ Download PNG' : '↓ Download WebM'}
          </button>
        </div>
      )}
    </div>
  )
}
