import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text3D, Center } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import gsap from 'gsap'
import ProteinTub from '../components/ProteinTub.jsx'
import { makeClothMaterial } from '../shaders/cloth.js'
import { burstVertex, burstFragment } from '../shaders/burst.js'
import { scrollState, fxState, useStore, isMobile } from '../state/store.js'
import { localProgress, RANGES, WORLD, SALE_PRODUCTS, COLORS, FLAVORS } from '../config/sections.js'

const FONT = import.meta.env.BASE_URL + 'fonts/helvetiker_bold.typeface.json'
const STAGE_Y = -42.4 // floor top

// ---------------------------------------------------------------- burst FX
function Burst({ trigger, color = COLORS.acid, size = 1 }) {
  const matRef = useRef()
  const count = 130
  const uniforms = useMemo(
    () => ({
      uT: { value: 1 },
      uSize: { value: 0.7 * size },
      uColorA: { value: new THREE.Color(color) },
      uColorB: { value: new THREE.Color('#ffffff') },
    }),
    [color, size]
  )
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const dir = new Float32Array(count * 3)
    const speed = new Float32Array(count)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 1.2, (Math.random() - 0.5) * 2).normalize()
      dir.set([v.x, v.y, v.z], i * 3)
      speed[i] = 0.4 + Math.random() * 1.1
      seed[i] = Math.random()
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3))
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12)
    return geo
  }, [])

  useEffect(() => {
    if (!trigger) return
    const u = matRef.current?.uniforms
    if (!u) return
    u.uT.value = 0
    const tw = gsap.to(u.uT, { value: 1, duration: 0.9, ease: 'power2.out' })
    return () => tw.kill()
  }, [trigger])

  return (
    <points geometry={geometry} frustumCulled={false} visible={!!trigger}>
      <shaderMaterial
        ref={matRef}
        vertexShader={burstVertex}
        fragmentShader={burstFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// --------------------------------------------------------------- price cut
// Original price gets sliced by a chrome blade: the mesh is swapped for two
// clones clipped by opposing planes (kept glued to each falling half by
// re-projecting the local plane through each mesh's matrixWorld every frame).
const CUT_NORMAL = new THREE.Vector3(0.07, 1, 0).normalize()

function SlicedHalf({ text, top, onRef }) {
  const meshRef = useRef()
  const bodyRef = useRef()

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: '#e9e9ee',
      metalness: 1,
      roughness: 0.16,
      side: THREE.DoubleSide,
      transparent: true,
    })
    const n = CUT_NORMAL.clone().multiplyScalar(top ? 1 : -1)
    m.clippingPlanes = [new THREE.Plane(n, 0)]
    return m
  }, [top])

  const localPlane = useMemo(() => new THREE.Plane(CUT_NORMAL.clone().multiplyScalar(top ? 1 : -1), 0), [top])

  useEffect(() => {
    onRef({ meshRef, material, localPlane, bodyRef })
    const body = bodyRef.current
    if (!body) return
    const s = top ? 1 : -1
    body.setLinvel({ x: (Math.random() - 0.5) * 1.2, y: top ? 2.8 : 0.7, z: top ? 1.6 : 0.9 }, true)
    body.setAngvel({ x: Math.random() * 1.5 * s, y: (Math.random() - 0.5) * 2, z: (2.5 + Math.random()) * s }, true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <RigidBody ref={bodyRef} colliders={false} density={2}>
      <CuboidCollider args={[1.0, 0.24, 0.15]} position={[0, top ? 0.26 : -0.26, 0]} />
      <group ref={meshRef}>
        <Center>
          <Text3D font={FONT} size={0.82} height={0.26} bevelEnabled bevelSize={0.018} bevelThickness={0.015} curveSegments={5} material={material}>
            {text}
          </Text3D>
        </Center>
      </group>
    </RigidBody>
  )
}

function PriceCut({ product, threshold }) {
  const [cut, setCut] = useState(false)
  const [sparks, setSparks] = useState(0)
  const [slam, setSlam] = useState(0)
  const started = useRef(false)
  const bladeRef = useRef()
  const saleRef = useRef()
  const halves = useRef([])
  const tlRef = useRef()
  const _plane = useMemo(() => new THREE.Plane(), [])

  const chromeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#e9e9ee', metalness: 1, roughness: 0.16 }),
    []
  )
  const acidMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLORS.acid,
        emissive: COLORS.acid,
        emissiveIntensity: 1.5,
        metalness: 0.3,
        roughness: 0.3,
        toneMapped: false,
      }),
    []
  )

  const reset = () => {
    started.current = false
    tlRef.current?.kill()
    setCut(false)
    setSparks(0)
    setSlam(0)
    halves.current = []
    if (bladeRef.current) {
      bladeRef.current.position.x = 4.2
      bladeRef.current.visible = false
    }
    if (saleRef.current) {
      saleRef.current.position.y = 6.5
      saleRef.current.visible = false
    }
  }

  const fire = () => {
    started.current = true
    const tl = gsap.timeline()
    tlRef.current = tl
    if (bladeRef.current) {
      bladeRef.current.visible = true
      tl.fromTo(bladeRef.current.position, { x: 4.2 }, { x: -4.6, duration: 0.34, ease: 'power3.in' }, 0)
      tl.add(() => {
        setCut(true)
        setSparks((s) => s + 1)
        fxState.shake = Math.max(fxState.shake, 0.35)
      }, 0.17)
      tl.set(bladeRef.current, { visible: false }, 0.45)
    }
    if (saleRef.current) {
      tl.add(() => {
        saleRef.current.visible = true
      }, 0.55)
      tl.fromTo(saleRef.current.position, { y: 6.5 }, { y: 0, duration: 0.4, ease: 'power4.in' }, 0.55)
      tl.fromTo(saleRef.current.scale, { x: 1.4, y: 1.6, z: 1.4 }, { x: 1, y: 1, z: 1, duration: 0.25, ease: 'power2.out' }, 0.9)
      tl.add(() => {
        fxState.shake = 1
        setSlam((s) => s + 1)
      }, 0.96)
    }
  }

  useFrame(() => {
    const local = localProgress(scrollState.p, 'sale')
    if (!started.current && local >= threshold && local < 0.98) fire()
    else if (started.current && local < threshold - 0.08) reset()

    // keep the cut planes glued to the tumbling halves
    for (const h of halves.current) {
      const mesh = h.meshRef.current
      if (!mesh) continue
      mesh.updateWorldMatrix(true, false)
      _plane.copy(h.localPlane).applyMatrix4(mesh.matrixWorld)
      h.material.clippingPlanes[0].copy(_plane)
    }
  })

  return (
    <group position={[0, 2.7, 0]}>
      {!cut && (
        <Center>
          <Text3D font={FONT} size={0.82} height={0.26} bevelEnabled bevelSize={0.018} bevelThickness={0.015} curveSegments={5} material={chromeMat}>
            {`$${product.was}`}
          </Text3D>
        </Center>
      )}
      {cut && (
        <>
          <SlicedHalf text={`$${product.was}`} top onRef={(h) => halves.current.push(h)} />
          <SlicedHalf text={`$${product.was}`} onRef={(h) => halves.current.push(h)} />
        </>
      )}

      {/* chrome blade */}
      <group ref={bladeRef} visible={false} position={[4.2, 0.05, 0]} rotation={[0, 0, -0.07]}>
        <mesh material={chromeMat}>
          <boxGeometry args={[2.4, 0.05, 0.9]} />
        </mesh>
        <mesh position={[-1.2, 0, 0]}>
          <boxGeometry args={[0.06, 0.02, 0.9]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      </group>

      {/* sale price slams in */}
      <group ref={saleRef} visible={false} position={[0, 6.5, 0]}>
        <Center>
          <Text3D font={FONT} size={1.0} height={0.32} bevelEnabled bevelSize={0.02} bevelThickness={0.018} curveSegments={5} material={acidMat}>
            {`$${product.now}`}
          </Text3D>
        </Center>
      </group>

      <Burst trigger={sparks} color="#ffffff" size={0.7} />
      <Burst trigger={slam} color={COLORS.acid} size={1.2} />
    </group>
  )
}

// ------------------------------------------------------------ product models
function ShakerModel() {
  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.52, 0.42, 1.3, 28]} />
        <meshPhysicalMaterial color="#16181a" metalness={0.1} roughness={0.15} clearcoat={1} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 0.86, 0]}>
        <cylinderGeometry args={[0.54, 0.54, 0.22, 28]} />
        <meshStandardMaterial color={COLORS.acid} emissive={COLORS.acid} emissiveIntensity={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.04, 0]}>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshStandardMaterial color="#d8d8de" metalness={0.95} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.48, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 0.1, 28]} />
        <meshStandardMaterial color="#d8d8de" metalness={0.95} roughness={0.25} />
      </mesh>
    </group>
  )
}

function PouchModel() {
  const uniformsRef = useRef()
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#101013', metalness: 0.75, roughness: 0.3 })
    uniformsRef.current = makeClothMaterial(m)
    return m
  }, [])

  useFrame((st) => {
    if (uniformsRef.current) uniformsRef.current.uClothTime.value = st.clock.elapsedTime
  })

  return (
    <group>
      <mesh material={material}>
        <boxGeometry args={[1.25, 1.65, 0.42, 20, 26, 4]} />
      </mesh>
      <mesh position={[0, 0.86, 0]}>
        <boxGeometry args={[1.3, 0.14, 0.1]} />
        <meshStandardMaterial color="#d8d8de" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.05, 0.2]}>
        <planeGeometry args={[1.05, 0.44]} />
        <meshBasicMaterial color={COLORS.acid} toneMapped={false} />
      </mesh>
    </group>
  )
}

function JugModel() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.82, 0.88, 1.55, 28]} />
        <meshStandardMaterial color="#121215" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.86, 0.86, 0.5, 28, 1, true]} />
        <meshStandardMaterial color={COLORS.acid} emissive={COLORS.acid} emissiveIntensity={0.5} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.34, 0.42, 0.35, 20]} />
        <meshStandardMaterial color="#121215" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.16, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.14, 20]} />
        <meshStandardMaterial color="#d8d8de" metalness={0.95} roughness={0.2} />
      </mesh>
      <mesh position={[0.62, 0.75, 0]} rotation={[Math.PI / 2, 0, -0.4]}>
        <torusGeometry args={[0.3, 0.075, 10, 18, Math.PI * 1.2]} />
        <meshStandardMaterial color="#d8d8de" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  )
}

function ProductModel({ type }) {
  if (type === 'tub') return <ProteinTub scale={0.72} bodyColor="#101014" bandColor={COLORS.acid} bandEmissive={1.2} />
  if (type === 'shaker') return <ShakerModel />
  if (type === 'pouch') return <PouchModel />
  return <JugModel />
}

function ProductDisplay({ product, index }) {
  const spinRef = useRef()
  useFrame((st) => {
    if (spinRef.current) {
      const t = st.clock.elapsedTime
      spinRef.current.rotation.y = t * 0.4 + index * 1.3
      spinRef.current.position.y = 1.85 + Math.sin(t * 0.8 + index * 2) * 0.06
    }
  })

  const threshold = 0.14 + index * 0.17

  return (
    <group position={[product.x, STAGE_Y, 0]}>
      {/* pedestal */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[1.05, 1.2, 0.9, 32]} />
        <meshStandardMaterial color="#0d0d10" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.92, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.95, 1.05, 40]} />
        <meshBasicMaterial color={COLORS.acid} toneMapped={false} transparent opacity={0.9} />
      </mesh>

      <group ref={spinRef} position={[0, 1.85, 0]}>
        <ProductModel type={product.model} />
      </group>

      <PriceCut product={product} threshold={threshold} />
    </group>
  )
}

// -------------------------------------------------------------- konami rain
function KonamiRain() {
  const konamiAt = useStore((s) => s.konamiAt)
  const camera = useThree((s) => s.camera)
  const [drop, setDrop] = useState(null)

  useEffect(() => {
    if (!konamiAt) return
    const origin = camera.position.clone()
    const tubs = Array.from({ length: isMobile() ? 8 : 16 }, (_, i) => ({
      id: `${konamiAt}-${i}`,
      pos: [
        origin.x + (Math.random() - 0.5) * 10,
        origin.y + 6 + Math.random() * 8,
        origin.z - 4 - Math.random() * 8,
      ],
      rot: [Math.random() * 3, Math.random() * 3, Math.random() * 3],
      flavor: FLAVORS[i % FLAVORS.length],
    }))
    setDrop({ tubs, floorY: origin.y - 7, x: origin.x, z: origin.z - 8 })
    const t = setTimeout(() => setDrop(null), 10000)
    return () => clearTimeout(t)
  }, [konamiAt, camera])

  if (!drop) return null
  return (
    <group>
      <CuboidCollider args={[25, 0.5, 25]} position={[drop.x, drop.floorY, drop.z]} />
      {drop.tubs.map((t) => (
        <RigidBody key={t.id} colliders="cuboid" position={t.pos} rotation={t.rot} density={1.2}>
          <ProteinTub scale={0.55} bodyColor={t.flavor.body} bandColor={t.flavor.band} bandEmissive={0.9} />
        </RigidBody>
      ))}
    </group>
  )
}

// ------------------------------------------------------------------- scene
export default function SaleScene() {
  const group = useRef()

  useFrame(() => {
    const p = scrollState.p
    group.current.visible = p > RANGES.tunnel.end - 0.05 && p < RANGES.shaker.start + 0.05
  })

  return (
    <>
      <group ref={group} position={[0, 0, WORLD.saleZ]}>
        {/* stage */}
        <mesh position={[0, STAGE_Y - 0.5, 0]}>
          <boxGeometry args={[30, 1, 16]} />
          <meshStandardMaterial color="#0b0b0e" metalness={0.4} roughness={0.62} />
        </mesh>
        <mesh position={[0, STAGE_Y + 0.01, 6.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 0.08]} />
          <meshBasicMaterial color={COLORS.acid} toneMapped={false} />
        </mesh>
        <CuboidCollider args={[15, 0.5, 8]} position={[0, STAGE_Y - 0.5, 0]} />

        {SALE_PRODUCTS.map((prod, i) => (
          <ProductDisplay key={prod.name} product={prod} index={i} />
        ))}

        <pointLight position={[0, -34, 6]} intensity={55} distance={40} color="#ffffff" />
        <pointLight position={[-8, -38, 5]} intensity={28} distance={26} color={COLORS.acid} />
        <pointLight position={[8, -38, 5]} intensity={28} distance={26} color="#8affff" />
      </group>
      <KonamiRain />
    </>
  )
}
