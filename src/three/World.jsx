import { Suspense } from 'react'
import { Environment, Lightformer } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import CameraRig from './CameraRig.jsx'
import Effects from './Effects.jsx'
import HeroScene from '../scenes/HeroScene.jsx'
import PourScene from '../scenes/PourScene.jsx'
import TunnelScene from '../scenes/TunnelScene.jsx'
import SaleScene from '../scenes/SaleScene.jsx'
import ShakerScene from '../scenes/ShakerScene.jsx'
import FooterScene from '../scenes/FooterScene.jsx'

export default function World() {
  return (
    <>
      <CameraRig />
      <color attach="background" args={['#0a0a0c']} />
      <fog attach="fog" args={['#050507', 6, 36]} />

      <ambientLight intensity={0.35} />

      {/* offline studio environment for the chrome */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={4} position={[0, 5, -9]} scale={[10, 6, 1]} color="#ffffff" />
        <Lightformer intensity={2} position={[-6, 0, 2]} scale={[3, 8, 1]} color="#c8ff00" />
        <Lightformer intensity={1.5} position={[7, 2, 1]} scale={[3, 8, 1]} color="#8affff" />
        <Lightformer intensity={1} position={[0, -5, 4]} scale={[8, 2, 1]} color="#ffffff" />
      </Environment>

      <HeroScene />
      <PourScene />
      <TunnelScene />
      <ShakerScene />
      <FooterScene />

      <Suspense fallback={null}>
        <Physics gravity={[0, -12, 0]}>
          <SaleScene />
        </Physics>
      </Suspense>

      <Effects />
    </>
  )
}
