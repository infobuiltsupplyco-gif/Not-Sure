import { SIMPLEX_3D } from './noise.glsl.js'

// "SHAKE THE SYSTEM" — canvas-baked type on a plane, refracted through a
// moving liquid displacement field. RGB channels split apart as slosh rises.

export const textLiquidVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const textLiquidFragment = /* glsl */ `
uniform sampler2D uMap;
uniform float uTime;
uniform float uSlosh;
uniform float uOpacity;
varying vec2 vUv;

${SIMPLEX_3D}

void main() {
  float amp = 0.006 + uSlosh * 0.05;
  vec2 warp = vec2(
    snoise(vec3(vUv * 3.0, uTime * 0.35)),
    snoise(vec3(vUv * 3.0 + 7.31, uTime * 0.35))
  ) * amp;

  vec2 uv = vUv + warp;
  float split = 0.002 + uSlosh * 0.012;

  float r = texture2D(uMap, uv + vec2(split, 0.0)).a;
  float g = texture2D(uMap, uv).a;
  float b = texture2D(uMap, uv - vec2(split, 0.0)).a;

  vec3 col = vec3(r, g, b) * vec3(0.92, 1.0, 0.75) + vec3(0.06, 0.12, 0.0) * g;
  float a = max(max(r, g), b) * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
}
`
