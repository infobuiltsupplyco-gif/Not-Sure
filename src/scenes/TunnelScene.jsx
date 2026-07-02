import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, useStore } from '../state/store.js'
import { RANGES, WORLD, FLAVORS, COLORS } from '../config/sections.js'

// FLAVOR TUNNEL — 6 rings of orbiting tubs, one flavor colorway per ring.
// All 60 tubs are 4 instanced draw calls; the four part-meshes share one
// instanceMatrix buffer (part offsets are baked into the geometries).

const RING_COUNT = 6
const TUBS_PER_RING = 10
const COUNT = RING_COUNT * TUBS_PER_RING
const RING_RADIUS = 4.3
const TUB_SCALE = 0.85

function bake(geo, fn) {
  const g = geo.clone()
  fn(g)
  return g
}

export default function TunnelScene() {
  const group = useRef()
  const bodyRef = useRef()
  const bandRef = useRef()
  const rimRef = useRef()
  const capRef = useRef()
  const hovered = useRef(-1)
  const state = useRef({
    ringAngles: new Float32Array(RING_COUNT),
    scales: new Float32Array(COUNT).fill(1),
  }).current

  const geos = useMemo(() => {
    const body = new THREE.CylinderGeometry(1, 0.94, 1.6, 24, 1, false)
    return {
      body,
      band: bake(new THREE.CylinderGeometry(1.035, 1.02, 0.62, 24, 1, true), (g) => g.translate(0, 0.06, 0)),
      rim: bake(new THREE.TorusGeometry(1.0, 0.085, 8, 24), (g) => {
        g.rotateX(Math.PI / 2)
        g.translate(0, 0.8, 0)
      }),
      cap: bake(new THREE.CylinderGeometry(1.02, 1.02, 0.16, 24), (g) => g.translate(0, 0.87, 0)),
    }
  }, [])

  const mats = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.55, roughness: 0.4 }),
      band: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
      chrome: new THREE.MeshStandardMaterial({ color: '#d8d8de', metalness: 0.95, roughness: 0.25 }),
    }),
    []
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colA = useMemo(() => new THREE.Color(), [])
  const colB = useMemo(() => new THREE.Color(), [])

  const selectFlavor = useStore((s) => s.selectFlavor)

  useFrame((st, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    const p = scrollState.p
    const visible = p > RANGES.pour.end - 0.06 && p < RANGES.sale.start + 0.04
    group.current.visible = visible
    if (!visible) return

    const body = bodyRef.current
    if (!body) return
    const t = st.clock.elapsedTime
    const selected = useStore.getState().selectedFlavor
    const hovId = hovered.current
    const hovRing = hovId >= 0 ? Math.floor(hovId / TUBS_PER_RING) : selected ? selected.ring : -1
    const activeId = selected ? selected.ring * TUBS_PER_RING + selected.tub : hovId

    for (let i = 0; i < RING_COUNT; i++) {
      // ring pauses when one of its tubs is engaged
      const speed = hovRing === i ? 0 : (i % 2 ? -1 : 1) * (0.1 + i * 0.015)
      state.ringAngles[i] += speed * delta
    }

    for (let id = 0; id < COUNT; id++) {
      const ring = Math.floor(id / TUBS_PER_RING)
      const j = id % TUBS_PER_RING
      const flavor = FLAVORS[ring]
      const ang = state.ringAngles[ring] + (j * Math.PI * 2) / TUBS_PER_RING

      let targetScale = TUB_SCALE
      if (id === activeId) targetScale = TUB_SCALE * 1.42
      else if (hovRing === ring && hovRing >= 0) targetScale = TUB_SCALE * 0.86
      state.scales[id] += (targetScale - state.scales[id]) * 0.12

      dummy.position.set(
        Math.cos(ang) * RING_RADIUS,
        WORLD.tunnelY + Math.sin(ang) * RING_RADIUS,
        WORLD.tunnelZStart - ring * 10
      )
      dummy.rotation.set(0, t * 0.35 + j * 1.7, 0)
      dummy.scale.setScalar(state.scales[id])
      dummy.updateMatrix()
      body.setMatrixAt(id, dummy.matrix)

      // colors: engaged tub full strength, ring-mates dimmed
      const dim = hovRing === ring && id !== activeId ? 0.32 : 1
      colA.set(flavor.body).multiplyScalar(dim)
      colB.set(flavor.band).multiplyScalar(dim === 1 ? 1 : 0.22)
      body.setColorAt(id, colA)
      bandRef.current.setColorAt(id, colB)
    }

    body.instanceMatrix.needsUpdate = true
    body.instanceColor.needsUpdate = true
    bandRef.current.instanceColor.needsUpdate = true
    // parts share the exact same transforms — copy, don't recompute
    for (const ref of [bandRef, rimRef, capRef]) {
      ref.current.instanceMatrix.array.set(body.instanceMatrix.array)
      ref.current.instanceMatrix.needsUpdate = true
    }
  })

  const setCursor = (mode) => window.dispatchEvent(new CustomEvent('apex:cursor', { detail: mode }))

  const onMove = (e) => {
    e.stopPropagation()
    if (hovered.current !== e.instanceId) {
      hovered.current = e.instanceId
      setCursor('scoop')
    }
  }
  const onOut = () => {
    hovered.current = -1
    setCursor('default')
  }
  const onClick = (e) => {
    e.stopPropagation()
    const id = e.instanceId
    const ring = Math.floor(id / TUBS_PER_RING)
    const j = id % TUBS_PER_RING
    const ang = state.ringAngles[ring] + (j * Math.PI * 2) / TUBS_PER_RING
    const tubPos = [
      Math.cos(ang) * RING_RADIUS,
      WORLD.tunnelY + Math.sin(ang) * RING_RADIUS,
      WORLD.tunnelZStart - ring * 10,
    ]
    // pull in toward the tunnel axis and forward of the tub
    const camPos = [tubPos[0] * 0.45, WORLD.tunnelY + (tubPos[1] - WORLD.tunnelY) * 0.45, tubPos[2] + 3.4]
    selectFlavor({ ring, tub: j, tubPos, camPos })
  }

  return (
    <group ref={group}>
      <instancedMesh
        ref={bodyRef}
        args={[geos.body, mats.body, COUNT]}
        frustumCulled={false}
        onPointerMove={onMove}
        onPointerOut={onOut}
        onClick={onClick}
      />
      <instancedMesh ref={bandRef} args={[geos.band, mats.band, COUNT]} frustumCulled={false} raycast={() => null} />
      <instancedMesh ref={rimRef} args={[geos.rim, mats.chrome, COUNT]} frustumCulled={false} raycast={() => null} />
      <instancedMesh ref={capRef} args={[geos.cap, mats.chrome, COUNT]} frustumCulled={false} raycast={() => null} />

      {/* neon ring guides */}
      {FLAVORS.map((f, i) => (
        <RingGuide key={i} index={i} color={i % 2 ? COLORS.acid : '#8affff'} />
      ))}

      <pointLight position={[0, WORLD.tunnelY + 2, WORLD.tunnelZStart - 15]} intensity={60} distance={30} color="#ffffff" />
      <pointLight position={[0, WORLD.tunnelY - 3, WORLD.tunnelZStart - 40]} intensity={60} distance={30} color={COLORS.acid} />
    </group>
  )
}

function RingGuide({ index, color }) {
  const ref = useRef()
  useFrame((st) => {
    if (ref.current) ref.current.rotation.z = st.clock.elapsedTime * (index % 2 ? 0.2 : -0.15)
  })
  return (
    <mesh ref={ref} position={[0, WORLD.tunnelY, WORLD.tunnelZStart - index * 10]}>
      <torusGeometry args={[6.4, 0.045, 8, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.65} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  )
}
