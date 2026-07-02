# NOVA — Cinematic AI Motion Studio

Free-forever AI video & image generation studio. Type a prompt, pick an
engine profile and a camera move, and NOVA renders a cinematic shot —
entirely in your browser, at zero cost, with no account and no watermark.

## Features

- **Create studio** — prompt box, video/image modes, 6 engine profiles,
  11 motion presets (crash zoom, 360 orbit, bullet time, FPV dive, …),
  4 aspect ratios, 3–10s durations, seeded rerolls.
- **Real exports** — download clips as WebM and stills as PNG.
- **Library** — every generation is saved locally (localStorage) and
  replays deterministically from its seed.
- **$0 architecture** — the free engine is a procedural renderer
  (`src/engine/engine.ts`) that draws seeded cinematic scenes on a canvas.
  Nothing is uploaded and there are no server costs.

## Plugging in hosted models

The studio is provider-agnostic: prompt, engine profile, motion preset,
aspect and duration flow through one interface. To route a profile to a
hosted video/image model, replace the render path in
`src/engine/engine.ts` with the provider API call and supply your own key.
(Hosted providers bill per generation — that part is never free.)

## Development

```bash
npm install
npm run dev     # local dev server
npm run build   # type-check + production build to dist/
```

Deploys to GitHub Pages automatically on push to `main`
(`.github/workflows/deploy.yml`); the app uses a hash router so it works
under the `/Not-Sure/` base path.

## Stack

Vite · React 18 · TypeScript · react-router (hash) · zero runtime dependencies beyond React
