# APEX FUEL — FUEL THE MACHINE

A single-page 3D e-commerce demo for a fictional protein supplement brand.
One continuous WebGL canvas; the camera flies through six scenes as you scroll.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in /dist
npm run preview  # serve the production build
```

## Stack

- **Vite + React 19**
- **React Three Fiber + drei + @react-three/postprocessing** — one continuous canvas, film grain / chromatic aberration / bloom on everything
- **@react-three/rapier** — physics for the sliced price halves and the Konami tub rain
- **GSAP + ScrollTrigger** — scroll choreography, camera keyframes derived from section ranges
- **Lenis** — smooth scrolling (native scroll preserved, `position: sticky` overlays)
- **Custom GLSL** in `src/shaders/` — no faked textures

## The ride

1. **HERO** — procedural protein tub in a void, 2,600 GPU powder particles orbiting with curl-noise drift, headline assembles letter-by-letter from scattered 3D fragments.
2. **THE POUR** — the camera dives down the tub's throat through a particle waterfall. The fall is driven by scroll progress, so reversing scroll rewinds time. Macro stats roll odometer-style.
3. **FLAVOR TUNNEL** — six rings of instanced tubs (4 draw calls for 60 tubs), one flavor colorway per ring. Hover to inspect, click to lock the camera on and open a glass spec card.
4. **THE CUT** — 3D extruded prices sliced in half by a chrome blade (clipping planes re-projected onto each tumbling half every frame), halves fall with Rapier physics, sale price slams down with camera shake + particle burst. Flip-clock countdown.
5. **SHAKER** — raymarched metaball liquid sloshing inside a bottle. Scroll velocity = churn rate. "SHAKE THE SYSTEM" warps through a liquid displacement shader.
6. **FOOTER** — everything spirals into a black hole, then the wordmark condenses out of the debris. Email input with an animated gradient border.

## Extras

- **Konami code** (`↑↑↓↓←→←→BA`) — tubs rain from the sky with physics
- **Sound toggle** — a WebAudio ambient synth loop (no assets); bloom pulses with the drone
- **Idle detection** — 8s without input and the camera starts a slow cinematic orbit
- **Custom cursor** — magnetic ring that morphs into a scoop over products
- Mouse parallax on every scene

## Performance

- DPR capped at 1.5, instancing for repeated tubs, particle counts halved on mobile
- Fonts self-hosted (`public/fonts`), zero runtime network dependencies
- Preloader: a 3D scoop fills with particles as the progress bar

## Structure

```
src/
  config/sections.js   scroll layout — single source of truth for scenes, camera & DOM
  three/               Canvas world: CameraRig (keyframed flight path), Effects (post)
  scenes/              one component per scene
  shaders/             all GLSL (curl noise, pour, metaballs, black hole, cloth, bursts)
  components/          preloader, cursor, overlays, odometer, flip clock, scramble text
  hooks/               Lenis+ScrollTrigger setup, input/idle/konami
  audio/               generated ambient synth
```
