import { SIMPLEX_3D, CURL_3D } from './noise.glsl.js'

// Hero "protein powder galaxy" — GPU particles orbiting the tub,
// displaced by curl noise for that dust-cloud drift.

export const galaxyVertex = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uSpread; // 1 = normal, >1 blows the galaxy apart (scroll out)

attribute float aSeed;
attribute float aRadius;
attribute float aSpeed;
attribute float aPhase;
attribute float aY;
attribute float aScale;

varying float vSeed;
varying float vDepth;

${SIMPLEX_3D}
${CURL_3D}

void main() {
  float ang = aPhase + uTime * aSpeed;
  float r = aRadius * uSpread;
  vec3 p = vec3(cos(ang) * r, aY * uSpread, sin(ang) * r);

  // curl drift — the powder breathes
  p += curlNoise(p * 0.32 + uTime * 0.05) * (0.38 + aSeed * 0.25);

  vSeed = aSeed;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_PointSize = uSize * aScale * (160.0 / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`

export const galaxyFragment = /* glsl */ `
uniform vec3 uColorA; // acid green
uniform vec3 uColorB; // chrome white
uniform float uOpacity;

varying float vSeed;
varying float vDepth;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float alpha = smoothstep(0.5, 0.05, d);
  alpha *= smoothstep(30.0, 8.0, vDepth); // fade far dust

  vec3 col = mix(uColorA, uColorB, step(0.72, vSeed));
  col *= 0.7 + vSeed * 0.9;

  gl_FragColor = vec4(col, alpha * uOpacity);
  if (gl_FragColor.a < 0.003) discard;
}
`
