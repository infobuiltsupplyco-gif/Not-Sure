import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { metaballVertex, metaballFragment } from '../shaders/metaball.js'
import { textLiquidVertex, textLiquidFragment } from '../shaders/textLiquid.js'
import { scrollState, fxState } from '../state/store.js'
import { localProgress, RANGES, WORLD, COLORS } from '../config/sections.js'

// SHAKER — raymarched metaball liquid sloshing inside a glass bottle.
// Scroll velocity is the churn input: scroll hard and it goes violent.

const _camLocal = new THREE.Vector3()

function Liquid({ slosh }) {
  const meshRef = useRef()
  const matRef = useRef()
  const uniforms = useMemo(
    () => ({
      uCamLocal: { value: new THREE.Vector3() },
      uTime: { value: 0 },
      uSlosh: { value: 0 },
      uColorDeep: { value: new THREE.Color('#1a5c00') },
      uColorRim: { value: new THREE.Color(COLORS.acid) },
    }),
    []
  )

  useFrame((st) => {
    const mesh = meshRef.current
    const u = matRef.current?.uniforms
    if (!mesh || !u) return
    u.uTime.value = st.clock.elapsedTime
    u.uSlosh.value = slosh.current
    mesh.updateWorldMatrix(true, false)
    _camLocal.copy(st.camera.position)
    mesh.worldToLocal(_camLocal)
    u.uCamLocal.value.copy(_camLocal)
  })

  return (
    <mesh ref={meshRef} position={[0, 0.05, 0]}>
      <boxGeometry args={[1.15, 1.55, 1.15]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={metaballVertex}
        fragmentShader={metaballFragment}
        uniforms={uniforms}
        transparent
        side={THREE.FrontSide}
      />
    </mesh>
  )
}

function LiquidText({ slosh }) {
  const matRef = useRef()
  const [texture, setTexture] = useState(null)
  const uniforms = useMemo(
    () => ({
      uMap: { value: null },
      uTime: { value: 0 },
      uSlosh: { value: 0 },
      uOpacity: { value: 0 },
    }),
    []
  )

  useEffect(() => {
    let alive = true
    document.fonts.load('100px Anton').then(() => {
      if (!alive) return
      const canvas = document.createElement('canvas')
      canvas.width = 2048
      canvas.height = 512
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, 2048, 512)
      ctx.font = '300px Anton'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.fillText('SHAKE THE SYSTEM', 1024, 270)
      const tex = new THREE.CanvasTexture(canvas)
      tex.anisotropy = 4
      setTexture(tex)
    })
    return () => { alive = false }
  }, [])

  useFrame((st) => {
    const u = matRef.current?.uniforms
    if (!u) return
    u.uTime.value = st.clock.elapsedTime
    u.uSlosh.value = slosh.current
    u.uMap.value = texture
    const local = localProgress(scrollState.p, 'shaker')
    // fade in mid-section, out at the edges
    u.uOpacity.value = THREE.MathUtils.smoothstep(local, 0.05, 0.3) * (1 - THREE.MathUtils.smoothstep(local, 0.85, 1))
  })

  if (!texture) return null
  return (
    <mesh position={[0, 0.4, -4.5]}>
      <planeGeometry args={[13, 3.25]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={textLiquidVertex}
        fragmentShader={textLiquidFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

export default function ShakerScene() {
  const group = useRef()
  const bottleRef = useRef()
  const ballRef = useRef()
  const slosh = useRef(0)

  useFrame((st, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    const p = scrollState.p
    const visible = p > RANGES.sale.end - 0.05 && p < RANGES.footer.start + 0.04
    group.current.visible = visible
    if (!visible) return

    // churn follows scroll velocity, with slow settle
    const target = Math.min(1, scrollState.sv * 1.4)
    slosh.current += (target - slosh.current) * (target > slosh.current ? 0.2 : 0.015)

    const t = st.clock.elapsedTime
    if (bottleRef.current) {
      // the bottle itself rocks with the churn
      bottleRef.current.rotation.z = Math.sin(t * (2 + slosh.current * 8)) * 0.04 * (0.3 + slosh.current)
      bottleRef.current.rotation.x = Math.cos(t * (1.7 + slosh.current * 7)) * 0.03 * (0.3 + slosh.current)
      bottleRef.current.position.y = Math.sin(t * 0.7) * 0.08
    }
    if (ballRef.current) {
      ballRef.current.position.y = -0.25 + Math.abs(Math.sin(t * (1.5 + slosh.current * 10))) * (0.1 + slosh.current * 0.5)
      ballRef.current.position.x = Math.sin(t * (1.2 + slosh.current * 6)) * 0.18
    }
  })

  return (
    <group ref={group} position={[0, WORLD.tunnelY - 0.4, WORLD.shakerZ]}>
      <LiquidText slosh={slosh} />

      <group ref={bottleRef} scale={1.5}>
        <Liquid slosh={slosh} />
        {/* whisk ball */}
        <mesh ref={ballRef} position={[0, -0.25, 0]}>
          <sphereGeometry args={[0.16, 20, 16]} />
          <meshStandardMaterial color="#d8d8de" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* glass body */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.66, 0.55, 1.72, 36, 1, true]} />
          <meshPhysicalMaterial
            color="#9fb0b8"
            metalness={0}
            roughness={0.06}
            clearcoat={1}
            transparent
            opacity={0.16}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {/* base + cap */}
        <mesh position={[0, -0.85, 0]}>
          <cylinderGeometry args={[0.57, 0.6, 0.14, 36]} />
          <meshStandardMaterial color="#101013" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.68, 0.68, 0.24, 36]} />
          <meshStandardMaterial color={COLORS.acid} emissive={COLORS.acid} emissiveIntensity={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.2, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#101013" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* platform ring */}
      <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.62, 48]} />
        <meshBasicMaterial color={COLORS.acid} toneMapped={false} transparent opacity={0.85} />
      </mesh>

      <pointLight position={[2.5, 2, 3]} intensity={40} color="#ffffff" />
      <pointLight position={[-2.5, -1, 2]} intensity={26} color={COLORS.acid} />
    </group>
  )
}
