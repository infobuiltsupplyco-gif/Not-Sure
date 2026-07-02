import { useMemo } from 'react'
import * as THREE from 'three'

// Procedural protein tub: cylinder body + torus lid rim + emissive label
// band. Shared geometries, per-tub materials (colors differ).

export const tubGeometries = {
  body: new THREE.CylinderGeometry(1, 0.94, 1.6, 40, 1, false),
  bodyOpen: new THREE.CylinderGeometry(1, 0.94, 1.6, 40, 1, true),
  band: new THREE.CylinderGeometry(1.035, 1.02, 0.62, 40, 1, true),
  rim: new THREE.TorusGeometry(1.0, 0.085, 12, 40),
  cap: new THREE.CylinderGeometry(1.02, 1.02, 0.16, 40),
  knob: new THREE.CylinderGeometry(0.34, 0.4, 0.1, 24),
  foot: new THREE.TorusGeometry(0.94, 0.05, 8, 40),
}

export default function ProteinTub({
  bodyColor = '#141417',
  bandColor = '#c8ff00',
  bandEmissive = 1.1,
  open = false,
  scale = 1,
  ...props
}) {
  const mats = useMemo(() => {
    return {
      body: new THREE.MeshStandardMaterial({
        color: bodyColor,
        metalness: 0.6,
        roughness: 0.38,
        side: THREE.DoubleSide,
      }),
      band: new THREE.MeshStandardMaterial({
        color: bandColor,
        emissive: bandColor,
        emissiveIntensity: bandEmissive,
        metalness: 0.2,
        roughness: 0.5,
        side: THREE.DoubleSide,
      }),
      chrome: new THREE.MeshStandardMaterial({
        color: '#d8d8de',
        metalness: 0.95,
        roughness: 0.22,
      }),
    }
  }, [bodyColor, bandColor, bandEmissive])

  return (
    <group scale={scale} {...props}>
      <mesh geometry={open ? tubGeometries.bodyOpen : tubGeometries.body} material={mats.body} />
      <mesh geometry={tubGeometries.band} material={mats.band} position={[0, 0.06, 0]} />
      <mesh geometry={tubGeometries.rim} material={mats.chrome} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.8, 0]} />
      {!open && (
        <>
          <mesh geometry={tubGeometries.cap} material={mats.chrome} position={[0, 0.87, 0]} />
          <mesh geometry={tubGeometries.knob} material={mats.body} position={[0, 0.99, 0]} />
        </>
      )}
      <mesh geometry={tubGeometries.foot} material={mats.chrome} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.78, 0]} />
    </group>
  )
}
