import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import ProteinTub from '../components/ProteinTub.jsx'
import { holeVertex, holeFragment, diskVertex, diskFragment } from '../shaders/blackhole.js'
import { scrollState, isMobile } from '../state/store.js'
import { localProgress, RANGES, WORLD, COLORS, FLAVORS } from '../config/sections.js'

// FOOTER — everything falls into a black hole, then the wordmark condenses
// out of the debris. Glyph targets are sampled from a canvas render of
// "APEX FUEL" in Anton.

function sampleLogo() {
  const W = 560
  const H = 128
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.font = '104px Anton'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText('APEX FUEL', W / 2, H / 2 + 6)
  const data = ctx.getImageData(0, 0, W, H).data
  const pts = []
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 128) {
        pts.push([((x / W) - 0.5) * 12.5, (0.5 - y / H) * (12.5 * H / W), 0])
      }
    }
  }
  // shuffle so wrapping (i % pts.length) covers the whole wordmark evenly
  for (let i = pts.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[pts[i], pts[j]] = [pts[j], pts[i]]
  }
  return pts
}

function HoleParticles() {
  const matRef = useRef()
  const count = isMobile() ? 1600 : 3400
  const [logoPts, setLogoPts] = useState(null)

  useEffect(() => {
    let alive = true
    document.fonts.load('100px Anton').then(() => alive && setLogoPts(sampleLogo()))
    return () => { alive = false }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    const radius = new Float32Array(count)
    const phase = new Float32Array(count)
    const y = new Float32Array(count)
    const text = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      seed[i] = Math.random()
      radius[i] = 2 + Math.pow(Math.random(), 0.8) * 8.5
      phase[i] = Math.random() * Math.PI * 2
      y[i] = (Math.random() - 0.5) * 2.4
      if (logoPts && logoPts.length) {
        const pt = logoPts[i % logoPts.length]
        text[i * 3] = pt[0] + (Math.random() - 0.5) * 0.03
        text[i * 3 + 1] = pt[1] + (Math.random() - 0.5) * 0.03 + 2.6 // above the disk
        text[i * 3 + 2] = 8 + (Math.random() - 0.5) * 0.12
      }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    geo.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    geo.setAttribute('aY', new THREE.BufferAttribute(y, 1))
    geo.setAttribute('aText', new THREE.BufferAttribute(text, 3))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30)
    return geo
  }, [count, logoPts])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 0.62 },
      uCollapse: { value: 0 },
      uReform: { value: 0 },
      uColorA: { value: new THREE.Color(COLORS.acid) },
      uColorB: { value: new THREE.Color('#e8e8ec') },
      uOpacity: { value: 0.95 },
    }),
    []
  )

  useFrame((st) => {
    const u = matRef.current?.uniforms
    if (!u) return
    const local = localProgress(scrollState.p, 'footer')
    u.uTime.value = st.clock.elapsedTime
    u.uCollapse.value = THREE.MathUtils.smoothstep(local, 0.04, 0.48)
    u.uReform.value = logoPts ? THREE.MathUtils.smoothstep(local, 0.5, 0.82) : 0
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={holeVertex}
        fragmentShader={holeFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// last products spiraling past the event horizon
function DoomedTubs() {
  const refs = useRef([])
  const seeds = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        r0: 5 + i * 0.9,
        phase: i * 1.9,
        speed: 0.5 + i * 0.12,
        flavor: FLAVORS[i],
      })),
    []
  )

  useFrame((st) => {
    const local = localProgress(scrollState.p, 'footer')
    const collapse = THREE.MathUtils.smoothstep(local, 0.0, 0.55)
    const t = st.clock.elapsedTime
    seeds.forEach((s, i) => {
      const g = refs.current[i]
      if (!g) return
      const r = Math.max(0.01, s.r0 * (1 - collapse) )
      const ang = s.phase + t * (s.speed + collapse * 5 / (r + 0.4))
      g.position.set(Math.cos(ang) * r, Math.sin(ang * 1.7) * 0.6 * (1 - collapse), Math.sin(ang) * r * 0.5)
      g.rotation.set(ang * 0.7, ang, ang * 0.3)
      const sc = 0.42 * Math.min(1, r / 1.2)
      g.scale.setScalar(Math.max(0.0001, sc))
      g.visible = r > 0.35
    })
  })

  return seeds.map((s, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)}>
      <ProteinTub bodyColor={s.flavor.body} bandColor={s.flavor.band} bandEmissive={0.8} />
    </group>
  ))
}

export default function FooterScene() {
  const group = useRef()
  const diskMatRef = useRef()
  const diskUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(COLORS.acid) },
      uColorB: { value: new THREE.Color('#fff6d8') },
      uIntensity: { value: 1.0 },
    }),
    []
  )

  useFrame((st) => {
    const p = scrollState.p
    group.current.visible = p > RANGES.shaker.end - 0.05
    if (!group.current.visible) return
    const u = diskMatRef.current?.uniforms
    if (!u) return
    u.uTime.value = st.clock.elapsedTime
    // the hole quiets down while the wordmark condenses
    const local = localProgress(p, 'footer')
    u.uIntensity.value = 1.0 - THREE.MathUtils.smoothstep(local, 0.5, 0.85) * 0.65
  })

  return (
    <group ref={group} position={[0, WORLD.tunnelY, WORLD.holeZ]}>
      {/* the singularity */}
      <mesh>
        <sphereGeometry args={[1.15, 40, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* photon rim */}
      <mesh>
        <sphereGeometry args={[1.22, 40, 32]} />
        <meshBasicMaterial color={COLORS.acid} transparent opacity={0.16} blending={THREE.AdditiveBlending} side={THREE.BackSide} />
      </mesh>
      {/* accretion disk */}
      <mesh rotation={[-1.25, 0, 0.12]}>
        <planeGeometry args={[11, 11]} />
        <shaderMaterial
          ref={diskMatRef}
          vertexShader={diskVertex}
          fragmentShader={diskFragment}
          uniforms={diskUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <HoleParticles />
      <DoomedTubs />

      <pointLight position={[0, 3, 6]} intensity={30} color="#ffffff" />
    </group>
  )
}
