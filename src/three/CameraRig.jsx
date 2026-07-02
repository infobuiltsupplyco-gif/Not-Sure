import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { at } from '../config/sections.js'
import { scrollState, mouseState, fxState, useStore } from '../state/store.js'

// The one continuous flight path. Keyframes are expressed as fractions of
// section scroll ranges so the camera and the DOM always agree.
function buildKeyframes() {
  const kf = (p, pos, tgt) => ({ p, pos: new THREE.Vector3(...pos), tgt: new THREE.Vector3(...tgt) })
  return [
    kf(0.0, [0, 0.4, 7.2], [0, 0.4, 0]),
    kf(at('hero', 0.5), [0, 1.7, 4.4], [0, 0.7, 0]),
    kf(at('hero', 0.85), [0, 2.7, 1.2], [0, -0.8, 0]),
    // the dive — straight down the tub's throat
    kf(at('pour', 0.06), [0, -2.5, 0], [0, -9, 0]),
    kf(at('pour', 0.4), [0, -14, 0], [0, -21, 0]),
    kf(at('pour', 0.8), [0, -28, 0], [0, -35, 0]),
    kf(at('pour', 1.0), [0, -37, -3], [0, -40, -14]),
    // flavor tunnel
    kf(at('tunnel', 0.12), [0, -40, -36], [0, -40, -46]),
    kf(at('tunnel', 1.0), [0, -40, -97], [0, -40, -107]),
    // THE CUT — hold the stage
    kf(at('sale', 0.15), [0, -40.5, -110], [0, -40.5, -120]),
    kf(at('sale', 0.85), [0, -40.5, -110.4], [0, -40.5, -120]),
    kf(at('sale', 1.0), [0, -40, -114], [0, -40.2, -124]),
    // shaker
    kf(at('shaker', 0.3), [0, -40, -144.9], [0, -40.3, -150]),
    kf(at('shaker', 0.8), [0, -40, -144.5], [0, -40.3, -150]),
    // event horizon
    kf(at('footer', 0.25), [0, -39.6, -158], [0, -40, -180]),
    kf(1.0, [0, -39.6, -163], [0, -40, -180]),
  ]
}

// Non-uniform Catmull-Rom (Hermite with finite-difference tangents)
function hermite(v0, v1, m1, m2, t) {
  const t2 = t * t
  const t3 = t2 * t
  return (2 * t3 - 3 * t2 + 1) * v0 + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * v1 + (t3 - t2) * m2
}

function sampleVec(kfs, key, p, out) {
  let i = 0
  while (i < kfs.length - 2 && p > kfs[i + 1].p) i++
  const k0 = kfs[Math.max(0, i - 1)]
  const k1 = kfs[i]
  const k2 = kfs[i + 1]
  const k3 = kfs[Math.min(kfs.length - 1, i + 2)]
  const dt = k2.p - k1.p || 1e-6
  const t = THREE.MathUtils.clamp((p - k1.p) / dt, 0, 1)

  for (const c of ['x', 'y', 'z']) {
    const m1 = ((k2[key][c] - k0[key][c]) / (k2.p - k0.p || 1e-6)) * dt
    const m2 = ((k3[key][c] - k1[key][c]) / (k3.p - k1.p || 1e-6)) * dt
    out[c] = hermite(k1[key][c], k2[key][c], m1, m2, t)
  }
  return out
}

const _pos = new THREE.Vector3()
const _tgt = new THREE.Vector3()
const _fwd = new THREE.Vector3()
const _right = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _off = new THREE.Vector3()
const _selPos = new THREE.Vector3()
const _selTgt = new THREE.Vector3()

export default function CameraRig() {
  const camera = useThree((s) => s.camera)
  const kfs = useMemo(buildKeyframes, [])
  const state = useRef({ idleBlend: 0, idleAngle: 0, selBlend: 0, fov: 55 }).current

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    const p = scrollState.p

    // smooth the mouse for parallax drift
    mouseState.sx += (mouseState.x - mouseState.sx) * 0.045
    mouseState.sy += (mouseState.y - mouseState.sy) * 0.045

    sampleVec(kfs, 'pos', p, _pos)
    sampleVec(kfs, 'tgt', p, _tgt)

    // flavor spec-card override — glide to the selected tub
    const sel = useStore.getState().selectedFlavor
    const selTargetBlend = sel ? 1 : 0
    state.selBlend += (selTargetBlend - state.selBlend) * (sel ? 0.04 : 0.06)
    if (state.selBlend > 0.001 && sel) {
      _selPos.set(sel.camPos[0], sel.camPos[1], sel.camPos[2])
      _selTgt.set(sel.tubPos[0], sel.tubPos[1], sel.tubPos[2])
      _pos.lerp(_selPos, state.selBlend)
      _tgt.lerp(_selTgt, state.selBlend)
    }

    // idle cinematic orbit
    const idleTarget = fxState.idle && !sel ? 1 : 0
    state.idleBlend += (idleTarget - state.idleBlend) * 0.012
    if (state.idleBlend > 0.001) {
      state.idleAngle += delta * 0.22
      _off.copy(_pos).sub(_tgt)
      const a = state.idleAngle * state.idleBlend
      const cos = Math.cos(a)
      const sin = Math.sin(a)
      const ox = _off.x * cos - _off.z * sin
      const oz = _off.x * sin + _off.z * cos
      _off.x = ox
      _off.z = oz
      _pos.copy(_tgt).add(_off)
    }

    // mouse parallax in camera space
    _fwd.copy(_tgt).sub(_pos).normalize()
    _right.crossVectors(_fwd, _up).normalize()
    if (_right.lengthSq() < 0.01) _right.set(1, 0, 0)
    _pos.addScaledVector(_right, mouseState.sx * 0.45)
    _pos.y += -mouseState.sy * 0.3
    _tgt.addScaledVector(_right, mouseState.sx * 0.9)
    _tgt.y += -mouseState.sy * 0.55

    // camera shake (sale slam)
    if (fxState.shake > 0.001) {
      _pos.x += (Math.random() - 0.5) * fxState.shake * 0.45
      _pos.y += (Math.random() - 0.5) * fxState.shake * 0.45
      _tgt.x += (Math.random() - 0.5) * fxState.shake * 0.3
      fxState.shake *= Math.pow(0.03, delta) // fast exponential decay
      if (fxState.shake < 0.001) fxState.shake = 0
    }

    camera.position.lerp(_pos, 1 - Math.pow(0.0001, delta))
    camera.lookAt(_tgt)

    // speed-lines fov kick
    const targetFov = 55 + Math.min(1, scrollState.sv) * 10
    state.fov += (targetFov - state.fov) * 0.06
    if (Math.abs(camera.fov - state.fov) > 0.01) {
      camera.fov = state.fov
      camera.updateProjectionMatrix()
    }
  })

  return null
}
