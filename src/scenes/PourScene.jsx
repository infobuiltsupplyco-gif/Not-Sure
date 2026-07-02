import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { pourVertex, pourFragment, coneVertex, coneFragment } from '../shaders/pour.js'
import { scrollState, isMobile } from '../state/store.js'
import { localProgress, RANGES, WORLD, COLORS } from '../config/sections.js'

// THE POUR — the camera free-falls down the tub's throat through a powder
// waterfall. The fall is driven by scroll progress, so reversing scroll
// freezes and rewinds the pour.

function Waterfall() {
  const matRef = useRef()
  const count = isMobile() ? 2200 : 5200

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    const radius = new Float32Array(count)
    const phase = new Float32Array(count)
    const speed = new Float32Array(count)
    const scale = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      seed[i] = Math.random()
      // a dense core column + wide ambient dust
      radius[i] = Math.random() > 0.35 ? 0.3 + Math.random() * 1.8 : 2.5 + Math.random() * 3.5
      phase[i] = Math.random() * Math.PI * 2
      speed[i] = 0.6 + Math.random() * 1.4
      scale[i] = 0.35 + Math.random() * 1.2
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    geo.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
    geo.setAttribute('aScale', new THREE.BufferAttribute(scale, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -20, 0), 45)
    return geo
  }, [count])

  const uniforms = useMemo(
    () => ({
      uFall: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 0.42 },
      uTop: { value: WORLD.pourTop + 3 },
      uHeight: { value: Math.abs(WORLD.pourBottom - WORLD.pourTop) + 8 },
      uColorA: { value: new THREE.Color(COLORS.acid) },
      uColorB: { value: new THREE.Color('#cfc9b4') },
      uOpacity: { value: 0.5 },
    }),
    []
  )

  useFrame((state) => {
    const u = matRef.current?.uniforms
    if (!u) return
    const local = localProgress(scrollState.p, 'pour')
    u.uFall.value = local * 60 // scroll IS time here
    u.uTime.value = state.clock.elapsedTime
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={pourVertex}
        fragmentShader={pourFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function LightShafts() {
  const matRefs = useRef([])
  const uniforms = useMemo(
    () => [
      { uColor: { value: new THREE.Color(COLORS.acid) }, uIntensity: { value: 0.16 }, uTime: { value: 0 } },
      { uColor: { value: new THREE.Color('#ffffff') }, uIntensity: { value: 0.08 }, uTime: { value: 0 } },
      { uColor: { value: new THREE.Color(COLORS.acid) }, uIntensity: { value: 0.1 }, uTime: { value: 0 } },
    ],
    []
  )

  useFrame((state) => {
    for (const m of matRefs.current) {
      if (m) m.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  const cone = useMemo(() => new THREE.CylinderGeometry(1.4, 5.2, 34, 24, 1, true), [])

  return (
    <group position={[0, (WORLD.pourTop + WORLD.pourBottom) / 2, 0]}>
      {uniforms.map((u, i) => (
        <mesh key={i} geometry={cone} rotation={[0, (i * Math.PI * 2) / 3, 0]} position={[Math.sin(i * 2.1) * 1.2, 0, Math.cos(i * 2.1) * 1.2]}>
          <shaderMaterial
            ref={(el) => (matRefs.current[i] = el)}
            vertexShader={coneVertex}
            fragmentShader={coneFragment}
            uniforms={u}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function PourScene() {
  const group = useRef()
  const lightRef = useRef()

  useFrame(({ camera }) => {
    const p = scrollState.p
    const visible = p > RANGES.hero.start + 0.02 && p < RANGES.tunnel.start + 0.05
    group.current.visible = visible
    if (!visible) return
    // acid glow rides with the camera down the shaft
    if (lightRef.current) lightRef.current.position.y = camera.position.y - 2
  })

  return (
    <group ref={group}>
      <Waterfall />
      <LightShafts />
      <pointLight ref={lightRef} intensity={30} distance={18} color={COLORS.acid} />
      {/* the shaft wall — keeps the dive claustrophobic */}
      <mesh position={[0, (WORLD.pourTop + WORLD.pourBottom) / 2, 0]}>
        <cylinderGeometry args={[9, 9, 44, 32, 1, true]} />
        <meshStandardMaterial color="#070709" roughness={0.95} metalness={0.1} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}
