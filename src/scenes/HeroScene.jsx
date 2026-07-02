import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import ProteinTub from '../components/ProteinTub.jsx'
import { galaxyVertex, galaxyFragment } from '../shaders/galaxy.js'
import { scrollState, mouseState, useStore, isMobile } from '../state/store.js'
import { localProgress, RANGES, COLORS } from '../config/sections.js'

// ------------------------------------------------------------ powder galaxy
function Galaxy() {
  const matRef = useRef()
  const count = isMobile() ? 1100 : 2600

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3) // real positions come from the shader
    const seed = new Float32Array(count)
    const radius = new Float32Array(count)
    const speed = new Float32Array(count)
    const phase = new Float32Array(count)
    const y = new Float32Array(count)
    const scale = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      seed[i] = Math.random()
      const r = 1.8 + Math.pow(Math.random(), 0.7) * 6.5
      radius[i] = r
      speed[i] = (0.05 + Math.random() * 0.18) * (Math.random() > 0.5 ? 1 : -1) * (3.5 / r)
      phase[i] = Math.random() * Math.PI * 2
      y[i] = (Math.random() - 0.5) * (0.4 + (r - 1.8) * 0.55)
      scale[i] = 0.4 + Math.random() * 1.1
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    geo.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1))
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    geo.setAttribute('aY', new THREE.BufferAttribute(y, 1))
    geo.setAttribute('aScale', new THREE.BufferAttribute(scale, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30)
    return geo
  }, [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 0.48 },
      uSpread: { value: 1 },
      uColorA: { value: new THREE.Color(COLORS.acid) },
      uColorB: { value: new THREE.Color('#e8e8ec') },
      uOpacity: { value: 0.7 },
    }),
    []
  )

  useFrame((state) => {
    // NOTE: R3F clones the uniforms prop at construction — always mutate
    // the live material's uniforms via ref, not the memoized object.
    const u = matRef.current?.uniforms
    if (!u) return
    const local = localProgress(scrollState.p, 'hero')
    u.uTime.value = state.clock.elapsedTime
    u.uSpread.value = 1 + local * 1.8
    u.uOpacity.value = 0.7 * (1 - Math.max(0, local - 0.6) * 2.2)
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={galaxyVertex}
        fragmentShader={galaxyFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// -------------------------------------------------------- assembling headline
const LINES = [
  { text: 'FUEL THE', y: 2.35, size: 1.35, color: '#f2f2f4' },
  { text: 'MACHINE', y: -2.15, size: 1.85, color: COLORS.acid },
]

function useLetterLayout(fontsReady) {
  return useMemo(() => {
    if (!fontsReady) return []
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.font = '100px Anton'
    const letters = []
    for (const line of LINES) {
      const widths = [...line.text].map((ch) => ctx.measureText(ch).width)
      const spacing = 6 // px of tracking at 100px em
      const totalPx = widths.reduce((a, b) => a + b + spacing, -spacing)
      let x = -((totalPx / 100) * line.size) / 2
      ;[...line.text].forEach((ch, i) => {
        const w = (widths[i] / 100) * line.size
        if (ch !== ' ') {
          letters.push({ ch, x: x + w / 2, y: line.y, size: line.size, color: line.color })
        }
        x += w + (spacing / 100) * line.size
      })
    }
    return letters
  }, [fontsReady])
}

function Headline() {
  const loaded = useStore((s) => s.loaded)
  const [fontsReady, setFontsReady] = useState(false)
  const groupRef = useRef()
  const refs = useRef([])

  useEffect(() => {
    let alive = true
    document.fonts.load('100px Anton').then(() => alive && setFontsReady(true))
    return () => { alive = false }
  }, [])

  const letters = useLetterLayout(fontsReady)

  const scatter = useMemo(
    () =>
      letters.map(() => ({
        x: (Math.random() - 0.5) * 16,
        y: (Math.random() - 0.5) * 12,
        z: 4 + Math.random() * 14,
        rx: (Math.random() - 0.5) * 5,
        ry: (Math.random() - 0.5) * 5,
        rz: (Math.random() - 0.5) * 3,
      })),
    [letters]
  )

  // scatter immediately, assemble when the preloader releases
  useEffect(() => {
    if (!letters.length) return
    refs.current.forEach((g, i) => {
      if (!g) return
      const s = scatter[i]
      g.position.set(letters[i].x + s.x, letters[i].y + s.y, s.z)
      g.rotation.set(s.rx, s.ry, s.rz)
    })
    if (!loaded) return
    const tl = gsap.timeline({ delay: 0.15 })
    refs.current.forEach((g, i) => {
      if (!g) return
      const t = i * 0.045
      tl.to(g.position, { x: letters[i].x, y: letters[i].y, z: 0, duration: 1.5, ease: 'expo.out' }, t)
      tl.to(g.rotation, { x: 0, y: 0, z: 0, duration: 1.5, ease: 'expo.out' }, t)
    })
    return () => tl.kill()
  }, [letters, scatter, loaded])

  useFrame(() => {
    if (!groupRef.current) return
    const local = localProgress(scrollState.p, 'hero')
    const fade = THREE.MathUtils.clamp(1 - local * 1.7, 0, 1)
    groupRef.current.visible = fade > 0.01
    groupRef.current.position.x = mouseState.sx * 0.35
    groupRef.current.position.y = -mouseState.sy * 0.2
    refs.current.forEach((g) => {
      if (!g?.children[0]?.material) return
      g.children[0].material.opacity = fade
    })
  })

  return (
    <group ref={groupRef} position={[0, 0, -3.2]}>
      {letters.map((l, i) => (
        <group key={`${l.ch}-${i}`} ref={(el) => (refs.current[i] = el)}>
          <Text
            font={import.meta.env.BASE_URL + 'fonts/Anton.ttf'}
            fontSize={l.size}
            color={l.color}
            anchorX="center"
            anchorY="middle"
            material-transparent
            material-toneMapped={false}
          >
            {l.ch}
          </Text>
        </group>
      ))}
    </group>
  )
}

// ------------------------------------------------------------------- scene
export default function HeroScene() {
  const group = useRef()
  const tubRef = useRef()

  useFrame((state) => {
    const p = scrollState.p
    const visible = p < RANGES.pour.start + 0.1
    group.current.visible = visible
    if (!visible) return
    const t = state.clock.elapsedTime
    if (tubRef.current) {
      tubRef.current.rotation.y = t * 0.18
      tubRef.current.position.y = Math.sin(t * 0.55) * 0.14
    }
  })

  return (
    <group ref={group}>
      <Headline />
      <group ref={tubRef}>
        <ProteinTub open scale={1.55} bodyColor="#101014" bandColor={COLORS.acid} bandEmissive={0.55} />
      </group>
      <Galaxy />
      <pointLight position={[3, 4, 4]} intensity={40} color="#ffffff" />
      <pointLight position={[-4, -2, 3]} intensity={26} color={COLORS.acid} />
      <pointLight position={[0, -3.2, 0]} intensity={12} color={COLORS.acid} />
    </group>
  )
}
