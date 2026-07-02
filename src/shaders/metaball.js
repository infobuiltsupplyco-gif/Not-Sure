// SHAKER — raymarched metaball liquid, marched in the mesh's local space.
// A wavy fill plane union'd with 6 slosh blobs, intersected with the
// bottle's capsule volume. uSlosh (scroll velocity) drives amplitude:
// scroll fast and the liquid churns violently.

export const metaballVertex = /* glsl */ `
varying vec3 vLocal;
void main() {
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const metaballFragment = /* glsl */ `
precision highp float;

uniform vec3 uCamLocal;  // camera position in this mesh's local space
uniform float uTime;
uniform float uSlosh;    // 0..1 smoothed scroll velocity
uniform vec3 uColorDeep;
uniform vec3 uColorRim;

varying vec3 vLocal;

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdSphere(vec3 p, vec3 c, float r) { return length(p - c) - r; }

// bottle interior: vertical capsule-ish cylinder
float sdContainer(vec3 p) {
  float d = length(p.xz) - 0.52;
  d = max(d, abs(p.y) - 0.72);
  return d;
}

float blobPos(float i, float comp, float t, float amp) {
  return sin(t * (1.1 + i * 0.37) + i * 2.3 + comp * 4.1) * amp;
}

float map(vec3 p) {
  float amp = 0.06 + uSlosh * 0.42;
  float t = uTime * (1.2 + uSlosh * 6.0);

  // sloshing fill surface
  float level = -0.12 + sin(t * 0.8) * 0.03;
  float wave = sin(p.x * 7.0 + t * 2.0) * cos(p.z * 6.0 + t * 1.7) * (0.02 + uSlosh * 0.16);
  float fill = p.y - (level + wave);

  // churn blobs
  float d = fill;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec3 c = vec3(
      blobPos(fi, 0.0, t, 0.30 + amp),
      -0.15 + blobPos(fi, 1.0, t, amp * 2.2),
      blobPos(fi, 2.0, t, 0.26 + amp)
    );
    d = smin(d, sdSphere(p, c, 0.13 + 0.05 * sin(fi * 3.7)), 0.16);
  }

  return max(d, sdContainer(p));
}

vec3 calcNormal(vec3 p) {
  const vec2 e = vec2(0.004, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

void main() {
  vec3 ro = uCamLocal;
  vec3 rd = normalize(vLocal - uCamLocal);

  // start at the surface of the bounding mesh we're drawn on
  float tDist = length(vLocal - uCamLocal);
  vec3 p = vLocal;

  bool hit = false;
  for (int i = 0; i < 48; i++) {
    float d = map(p);
    if (d < 0.004) { hit = true; break; }
    tDist += d * 0.85;
    p = ro + rd * tDist;
    if (length(p) > 2.2) break; // left the volume
  }

  if (!hit) discard;

  vec3 n = calcNormal(p);
  vec3 viewDir = normalize(uCamLocal - p);
  float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 2.2);

  vec3 lightDir = normalize(vec3(0.6, 1.0, 0.4));
  float diff = max(dot(n, lightDir), 0.0);
  float spec = pow(max(dot(reflect(-lightDir, n), viewDir), 0.0), 48.0);

  vec3 col = uColorDeep * (0.35 + diff * 0.65);
  col += uColorRim * fresnel * 1.4;
  col += vec3(1.0) * spec * (0.8 + uSlosh);

  gl_FragColor = vec4(col, 0.92);
}
`
