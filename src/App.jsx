import { Canvas } from '@react-three/fiber'
import World from './three/World.jsx'
import Preloader from './components/Preloader.jsx'
import Cursor from './components/Cursor.jsx'
import Header from './components/Header.jsx'
import HeroOverlay from './components/overlays/HeroOverlay.jsx'
import PourOverlay from './components/overlays/PourOverlay.jsx'
import TunnelOverlay from './components/overlays/TunnelOverlay.jsx'
import SaleOverlay from './components/overlays/SaleOverlay.jsx'
import ShakerOverlay from './components/overlays/ShakerOverlay.jsx'
import FooterOverlay from './components/overlays/FooterOverlay.jsx'
import { useScrollSetup } from './hooks/useScrollSetup.js'
import { useMouseAndIdle, useKonami } from './hooks/useInput.js'
import { useStore } from './state/store.js'
import { SECTIONS } from './config/sections.js'

const OVERLAYS = {
  hero: HeroOverlay,
  pour: PourOverlay,
  tunnel: TunnelOverlay,
  sale: SaleOverlay,
  shaker: ShakerOverlay,
  footer: FooterOverlay,
}

export default function App() {
  useScrollSetup()
  useMouseAndIdle()
  useKonami()
  const setReady = useStore((s) => s.setReady)

  return (
    <>
      <Preloader />
      <Cursor />
      <Header />

      <div className="canvas-root">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ fov: 55, near: 0.1, far: 240, position: [0, 0.4, 7.2] }}
          gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
          onCreated={({ gl }) => {
            gl.localClippingEnabled = true
            setReady()
          }}
        >
          <World />
        </Canvas>
      </div>

      <main className="content">
        {SECTIONS.map((s) => {
          const Overlay = OVERLAYS[s.id]
          return (
            <section key={s.id} id={`section-${s.id}`} style={{ height: `${s.vh}vh` }}>
              <div className="sticky-frame">
                <Overlay />
              </div>
            </section>
          )
        })}
      </main>
    </>
  )
}
