import { SIMPLEX_3D, CURL_3D } from './noise.glsl.js'

// FOOTER — every particle spirals into the singularity (uCollapse),
// then re-forms into the APEX FUEL wordmark (uReform), whose glyph
// positions are baked into the aText attribute from a canvas sample.

export const holeVertex = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uCollapse; // 0..1 spiral inward
uniform float uReform;   // 0..1 snap to text

attribute float aSeed;
attribute float aRadius;
attribute float aPhase;
attribute float aY;
attribute vec3 aText;

varying float vSeed;
varying float vHeat;
varying float vStag;

${SIMPLEX_3D}
${CURL_3D}

void main() {
  // radius shrinks as the hole feeds; angular velocity blows up near center
  float r = aRadius * (1.0 - uCollapse * 0.94) + 0.15;
  float speed = (0.25 + aSeed * 0.35) + uCollapse * 4.0 / (r + 0.4);
  float ang = aPhase + uTime * speed;

  vec3 spiral = vec3(
    cos(ang) * r,
    aY * (1.0 - uCollapse * 0.85) + sin(ang * 2.0 + aSeed * 9.0) * 0.12 * r,
    sin(ang) * r * 0.55
  );
  spiral += curlNoise(spiral * 0.5 + uTime * 0.04) * 0.12 * (1.0 - uCollapse);

  // staggered reform — letters condense particle by particle
  float stagger = smoothstep(aSeed * 0.6, aSeed * 0.6 + 0.4, uReform);
  vec3 target = aText + curlNoise(aText * 2.0 + uTime * 0.15) * 0.03;
  vec3 p = mix(spiral, target, stagger);

  vSeed = aSeed;
  vHeat = uCollapse * (1.0 - smoothstep(0.2, 3.5, r)) * (1.0 - stagger);
  vStag = stagger;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  // shrink to glyph-grain size once a particle locks into the wordmark
  gl_PointSize = uSize * (0.6 + aSeed) * mix(1.0, 0.5, stagger) * (150.0 / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`

export const holeFragment = /* glsl */ `
uniform vec3 uColorA; // acid
uniform vec3 uColorB; // chrome
uniform float uOpacity;

varying float vSeed;
varying float vHeat;
varying float vStag;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float alpha = smoothstep(0.5, 0.05, d);

  vec3 col = mix(uColorA, uColorB, step(0.8, vSeed));
  col = mix(col, vec3(1.0, 1.0, 0.9), vHeat); // white-hot near the horizon

  // settled wordmark grains render at steady, lower energy
  gl_FragColor = vec4(col, alpha * uOpacity * mix(1.0, 0.85, vStag));
  if (gl_FragColor.a < 0.003) discard;
}
`

// Accretion disk — a flat ring with swirling angular bands
export const diskVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const diskFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uIntensity;
varying vec2 vUv;

${SIMPLEX_3D}

void main() {
  vec2 c = vUv - 0.5;
  float r = length(c) * 2.0;
  float ang = atan(c.y, c.x);

  float band = smoothstep(0.32, 0.45, r) * smoothstep(1.0, 0.62, r);
  float swirl = snoise(vec3(cos(ang + uTime * 0.6 - r * 5.0), sin(ang + uTime * 0.6), r * 4.0));
  band *= 0.55 + 0.45 * swirl;

  vec3 col = mix(uColorB, uColorA, smoothstep(0.4, 0.9, r));
  gl_FragColor = vec4(col * uIntensity, band);
}
`
