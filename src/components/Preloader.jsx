import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { useStore } from '../state/store.js'
import { COLORS } from '../config/sections.js'

// Preloader: a 3D scoop fills with powder particles as the progress bar.

const scoopVertex = /* glsl */ `
uniform float uProgress;
attribute float aIdx;
varying float vShow;
void main() {
  vShow = step(aIdx, uProgress);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 3.2 * (120.0 / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`
const scoopFragment = /* glsl */ `
uniform vec3 uColor;
varying float vShow;
void main() {
  if (vShow < 0.5) discard;
  vec2 c = gl_PointCoord - 0.5;
  if (length(c) > 0.5) discard;
  gl_FragColor = vec4(uColor, 0.95);
}
`

function Scoop({ progressRef }) {
  const groupRef = useRef()
  const matRef = useRef()
  const uniforms = useMemo(
    () => ({ uProgress: { value: 0 }, uColor: { value: new THREE.Color(COLORS.acid) } }),
    []
  )

  const fill = useMemo(() => {
    const N = 550
    const pos = []
    while (pos.length < N * 3) {
      const x = (Math.random() - 0.5) * 1.5
      const y = -Math.random() * 0.72
      const z = (Math.random() - 0.5) * 1.5
      if (x * x + y * y + z * z < 0.72 * 0.72) pos.push(x, y, z)
    }
    const arr = new Float32Array(pos)
    // sort by height so the scoop fills bottom-up
    const idx = Array.from({ length: N }, (_, i) => i).sort((a, b) => arr[a * 3 + 1] - arr[b * 3 + 1])
    const sorted = new Float32Array(N * 3)
    const aIdx = new Float32Array(N)
    idx.forEach((from, to) => {
      sorted.set(arr.subarray(from * 3, from * 3 + 3), to * 3)
      aIdx[to] = to / N
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(sorted, 3))
    geo.setAttribute('aIdx', new THREE.BufferAttribute(aIdx, 1))
    return geo
  }, [])

  useFrame((st) => {
    if (matRef.current) matRef.current.uniforms.uProgress.value = progressRef.current.v / 100
    if (groupRef.current) {
      groupRef.current.rotation.y = st.clock.elapsedTime * 0.6
      groupRef.current.rotation.z = 0.35
    }
  })

  return (
    <group ref={groupRef}>
      {/* bowl shell */}
      <mesh>
        <sphereGeometry args={[0.78, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshBasicMaterial color="#3c3c44" wireframe transparent opacity={0.55} />
      </mesh>
      {/* handle */}
      <mesh position={[0.95, 0.35, 0]} rotation={[0, 0, -1.1]}>
        <cylinderGeometry args={[0.05, 0.05, 1.0, 8]} />
        <meshBasicMaterial color="#8a8a94" />
      </mesh>
      <points geometry={fill}>
        <shaderMaterial ref={matRef} vertexShader={scoopVertex} fragmentShader={scoopFragment} uniforms={uniforms} transparent depthWrite={false} />
      </points>
    </group>
  )
}

export default function Preloader() {
  const ready = useStore((s) => s.ready)
  const setLoaded = useStore((s) => s.setLoaded)
  const [gone, setGone] = useState(false)
  const rootRef = useRef()
  const pctRef = useRef()
  const progressRef = useRef({ v: 0 })
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    let alive = true
    const timeout = setTimeout(() => alive && setFontsReady(true), 3500)
    document.fonts.ready.then(() => alive && setFontsReady(true))
    return () => {
      alive = false
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    const tw = gsap.to(progressRef.current, {
      v: 96,
      duration: 2.4,
      ease: 'power2.out',
      onUpdate: () => {
        if (pctRef.current) pctRef.current.textContent = `${Math.round(progressRef.current.v)}%`
      },
    })
    return () => tw.kill()
  }, [])

  useEffect(() => {
    if (!(ready && fontsReady)) return
    const tw = gsap.to(progressRef.current, {
      v: 100,
      duration: 0.45,
      delay: 0.6, // let the fake ramp breathe
      ease: 'power3.inOut',
      onUpdate: () => {
        if (pctRef.current) pctRef.current.textContent = `${Math.round(progressRef.current.v)}%`
      },
      onComplete: () => {
        rootRef.current?.classList.add('preloader-done')
        setLoaded()
        setTimeout(() => setGone(true), 1000)
      },
    })
    return () => tw.kill()
  }, [ready, fontsReady, setLoaded])

  if (gone) return null

  return (
    <div ref={rootRef} className="preloader">
      <div className="preloader-scoop">
        <Canvas dpr={[1, 1.5]} camera={{ fov: 40, position: [0, 0.4, 3.4] }} gl={{ antialias: false, alpha: true }}>
          <Scoop progressRef={progressRef} />
        </Canvas>
      </div>
      <div className="preloader-meta">
        <span className="preloader-title">APEX FUEL</span>
        <span className="preloader-sub">CALIBRATING THE MACHINE</span>
        <span ref={pctRef} className="preloader-pct">0%</span>
      </div>
    </div>
  )
}
