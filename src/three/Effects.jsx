import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { scrollState, fxState } from '../state/store.js'

// Full-canvas grade: bloom (audio-reactive), chromatic aberration that
// stretches with scroll velocity, film grain, vignette.
export default function Effects() {
  const bloomRef = useRef()
  const caOffset = useMemo(() => new THREE.Vector2(0.0012, 0.0008), [])

  useFrame(() => {
    if (bloomRef.current) {
      bloomRef.current.intensity =
        0.62 + fxState.audioLevel * 1.8 + Math.min(1, scrollState.sv) * 0.3 + fxState.shake * 1.2
    }
    const k = 0.0012 + Math.min(1, scrollState.sv) * 0.004 + fxState.shake * 0.01
    caOffset.set(k, k * 0.6)
  })

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        ref={bloomRef}
        mipmapBlur
        intensity={0.62}
        luminanceThreshold={0.48}
        luminanceSmoothing={0.35}
        radius={0.62}
      />
      <ChromaticAberration offset={caOffset} radialModulation modulationOffset={0.25} />
      <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.5} />
      <Vignette eskil={false} offset={0.18} darkness={0.92} />
    </EffectComposer>
  )
}
