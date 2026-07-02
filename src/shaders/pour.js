import { SIMPLEX_3D, CURL_3D } from './noise.glsl.js'

// THE POUR — a slow-motion powder waterfall around the camera.
// uFall is driven by *scroll progress*, not the clock, so reversing the
// scroll literally reverses time for the fall.

export const pourVertex = /* glsl */ `
uniform float uFall;   // scroll-driven "time"
uniform float uTime;   // real clock, for micro turbulence only
uniform float uSize;
uniform float uTop;
uniform float uHeight;

attribute float aSeed;
attribute float aRadius;
attribute float aPhase;
attribute float aSpeed;
attribute float aScale;

varying float vSeed;
varying float vLife;
varying float vDepth;

${SIMPLEX_3D}
${CURL_3D}

void main() {
  // each particle loops down the shaft, offset by its seed
  float cycle = fract(aSeed + uFall * aSpeed * 0.08);
  float y = uTop - cycle * uHeight;

  float ang = aPhase + cycle * 2.2 + uFall * 0.05;
  float r = aRadius * (0.75 + cycle * 0.5);
  vec3 p = vec3(cos(ang) * r, y, sin(ang) * r);

  // slow-mo turbulence
  p += curlNoise(vec3(p.x * 0.4, p.y * 0.18, p.z * 0.4) + uTime * 0.03) * (0.35 + aSeed * 0.4);

  vSeed = aSeed;
  vLife = cycle;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_PointSize = uSize * aScale * (170.0 / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`

export const pourFragment = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;

varying float vSeed;
varying float vLife;
varying float vDepth;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float alpha = smoothstep(0.5, 0.04, d);

  // fade in at top, out at bottom of the shaft
  alpha *= smoothstep(0.0, 0.08, vLife) * smoothstep(1.0, 0.85, vLife);
  alpha *= smoothstep(26.0, 5.0, vDepth);

  vec3 col = mix(uColorB, uColorA, smoothstep(0.3, 0.9, vSeed));
  gl_FragColor = vec4(col, alpha * uOpacity);
  if (gl_FragColor.a < 0.003) discard;
}
`

// Fake volumetric light shafts: additive cones with radial + length falloff
export const coneVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const coneFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
varying vec2 vUv;

void main() {
  float radial = sin(vUv.x * 3.14159);
  radial = pow(radial, 2.2);
  float len = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
  float flicker = 0.9 + 0.1 * sin(uTime * 1.7 + vUv.y * 9.0);
  gl_FragColor = vec4(uColor, radial * len * uIntensity * flicker);
}
`
