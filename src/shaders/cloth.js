// Cloth-like wobble for the creatine pouch — injected into
// MeshStandardMaterial via onBeforeCompile so the pouch keeps full PBR
// lighting while its vertices breathe.

export const clothVertexChunk = /* glsl */ `
  float clothW = sin(position.y * 6.5 + uClothTime * 2.1)
               * cos(position.x * 5.0 + uClothTime * 1.5)
               + 0.5 * sin(position.x * 11.0 - uClothTime * 2.7);
  // pin the sealed top/bottom seams, let the belly billow
  float clothPin = smoothstep(0.5, 0.12, abs(uv.y - 0.5));
  transformed += normal * clothW * 0.045 * clothPin;
`

export function makeClothMaterial(material) {
  const uniforms = { uClothTime: { value: 0 } }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uClothTime = uniforms.uClothTime
    shader.vertexShader = 'uniform float uClothTime;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n' + clothVertexChunk
    )
  }
  material.customProgramCacheKey = () => 'cloth-wobble'
  return uniforms
}
