// One-shot particle burst for the sale-price slam.
// uT runs 0..1 once; particles fly out ballistically and fade.

export const burstVertex = /* glsl */ `
uniform float uT;
uniform float uSize;

attribute vec3 aDir;
attribute float aSpeed;
attribute float aSeed;

varying float vSeed;
varying float vT;

void main() {
  float t = uT;
  vec3 p = aDir * aSpeed * t * 3.2;
  p.y -= 4.5 * t * t; // gravity

  vSeed = aSeed;
  vT = t;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * (1.0 - t * 0.6) * (140.0 / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`

export const burstFragment = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;

varying float vSeed;
varying float vT;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float alpha = smoothstep(0.5, 0.08, d) * (1.0 - vT) * (1.0 - vT);
  vec3 col = mix(uColorA, uColorB, step(0.65, vSeed));
  gl_FragColor = vec4(col, alpha);
  if (gl_FragColor.a < 0.004) discard;
}
`
