import { fxState } from '../state/store.js'

// A low ambient synth loop, generated entirely in WebAudio — no assets.
// Two detuned saws through a slow-breathing lowpass, a sub sine, and a
// filtered noise "air" layer. An analyser feeds fxState.audioLevel so the
// bloom pass can pulse with the drone.

let ctx = null
let master = null
let analyser = null
let nodes = []
let rafId = 0
const freqData = new Uint8Array(64)

function buildGraph() {
  master = ctx.createGain()
  master.gain.value = 0

  analyser = ctx.createAnalyser()
  analyser.fftSize = 128
  analyser.smoothingTimeConstant = 0.85

  master.connect(analyser)
  analyser.connect(ctx.destination)

  // breathing lowpass
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 300
  filter.Q.value = 4

  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.07
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 220
  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)
  lfo.start()

  const sawGain = ctx.createGain()
  sawGain.gain.value = 0.12
  for (const detune of [-6, 5]) {
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = 55
    osc.detune.value = detune
    osc.connect(sawGain)
    osc.start()
    nodes.push(osc)
  }
  sawGain.connect(filter)
  filter.connect(master)

  // sub
  const sub = ctx.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = 27.5
  const subGain = ctx.createGain()
  subGain.gain.value = 0.22
  const subTrem = ctx.createOscillator()
  subTrem.frequency.value = 0.11
  const subTremGain = ctx.createGain()
  subTremGain.gain.value = 0.08
  subTrem.connect(subTremGain)
  subTremGain.connect(subGain.gain)
  sub.connect(subGain)
  subGain.connect(master)
  sub.start()
  subTrem.start()
  nodes.push(sub, subTrem, lfo)

  // air: looping filtered noise
  const len = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = buf
  noise.loop = true
  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.value = 900
  noiseFilter.Q.value = 0.6
  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.015
  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(master)
  noise.start()
  nodes.push(noise)
}

function meter() {
  if (!analyser) return
  analyser.getByteFrequencyData(freqData)
  let sum = 0
  for (let i = 0; i < 24; i++) sum += freqData[i]
  const level = sum / (24 * 255)
  fxState.audioLevel += (level - fxState.audioLevel) * 0.12
  rafId = requestAnimationFrame(meter)
}

export function startAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    buildGraph()
  }
  ctx.resume()
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.setTargetAtTime(0.5, ctx.currentTime, 0.8)
  cancelAnimationFrame(rafId)
  meter()
}

export function stopAudio() {
  if (!ctx) return
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.3)
  cancelAnimationFrame(rafId)
  const fade = setInterval(() => {
    fxState.audioLevel *= 0.9
    if (fxState.audioLevel < 0.01) {
      fxState.audioLevel = 0
      clearInterval(fade)
    }
  }, 60)
}
