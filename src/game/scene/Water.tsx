import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WAVE_GLSL } from '../world/waves';
import { DEPTH_RANGE, TERRAIN_SIZE } from '../world/terrain';
import { createDepthTexture } from '../world/depthTexture';
import { SUN_DIR } from '../world/constants';
import { env } from '../world/environment';

const vertexShader = /* glsl */ `
#include <fog_pars_vertex>
uniform float uTime;
varying vec3 vWorld;
${WAVE_GLSL}
void main() {
  vec3 pos = position;
  pos.y += waveH(pos.xz, uTime);
  vWorld = pos;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform vec3 uSunDir;
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform vec3 uSky;
uniform vec3 uHorizon;
uniform sampler2D uDepth;
varying vec3 vWorld;
${WAVE_GLSL}
#include <fog_pars_fragment>
void main() {
  vec2 p = vWorld.xz;
  float dist = length(cameraPosition - vWorld);

  float e = 0.15;
  float h0 = waveH(p, uTime);
  float hx = waveH(p + vec2(e, 0.0), uTime);
  float hz = waveH(p + vec2(0.0, e), uTime);
  vec2 slope = vec2(-(hx - h0) / e, -(hz - h0) / e);
  float fine = 1.0 - smoothstep(18.0, 70.0, dist);
  vec2 rp = p * vec2(7.0, 6.0) + vec2(uTime * 2.0, -uTime * 1.7);
  slope += vec2(cos(rp.x) * sin(rp.y) * 7.0, sin(rp.x) * cos(rp.y) * 6.0) * 0.010 * fine;
  vec2 rp2 = p * vec2(2.7, 3.3) + vec2(-uTime * 1.1, uTime * 0.85);
  slope += vec2(sin(rp2.x * 1.3 + rp2.y), cos(rp2.y * 1.1 - rp2.x)) * 0.022 * fine;
  vec3 n = normalize(vec3(slope.x, 1.0, slope.y));

  vec3 V = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);
  vec3 R = reflect(-V, n);

  float dep = texture2D(uDepth, p / uSize + 0.5).r * ${DEPTH_RANGE.toFixed(2)} - 0.5;
  vec3 body = mix(uShallow, uDeep, smoothstep(0.1, 3.2, dep));

  vec3 skyCol = mix(uHorizon, uSky, clamp(R.y * 1.6, 0.0, 1.0));
  vec2 cuv = R.xz / (R.y + 0.25) * 0.9 + vec2(uTime * 0.01, 0.0);
  float cl = smoothstep(0.55, 1.0, 0.5 + 0.25 * sin(cuv.x * 3.1 + sin(cuv.y * 2.3) * 1.7) + 0.25 * sin(cuv.y * 4.3 - cuv.x * 1.9));
  skyCol = mix(skyCol, vec3(1.0), cl * 0.32 * clamp(R.y * 3.0, 0.0, 1.0));
  vec3 col = mix(body, skyCol, clamp(fres * 0.85 + 0.07, 0.0, 1.0));

  float glint = pow(max(dot(R, uSunDir), 0.0), 380.0) * 2.6;
  float glow = pow(max(dot(R, uSunDir), 0.0), 9.0) * 0.18;
  float scatter = pow(max(dot(-V, uSunDir), 0.0), 3.0) * smoothstep(0.2, 2.0, dep) * 0.08;
  col += uShallow * scatter;
  col += vec3(1.0, 0.88, 0.68) * (glint + glow);

  float edge = 1.0 - smoothstep(0.02, 0.3, dep);
  float foam = edge * (0.5 + 0.5 * sin(p.x * 3.1 + uTime) * sin(p.y * 2.7 - uTime * 0.8));
  col = mix(col, vec3(0.93, 0.95, 0.92), foam * 0.55);

  float alpha = mix(0.32, 0.97, smoothstep(0.0, 1.7, dep));
  alpha = max(alpha, max(fres, foam * 0.8));

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

const SHALLOW = new THREE.Color('#5aa79b');
const DEEP = new THREE.Color('#123f58');

export function Water() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 180, 180);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const depth = useMemo(() => createDepthTexture(384), []);
  const uniforms = useMemo(
    () =>
      THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uTime: { value: 0 },
          uSize: { value: TERRAIN_SIZE },
          uSunDir: { value: SUN_DIR.clone() },
          uShallow: { value: new THREE.Color('#5aa79b') },
          uDeep: { value: new THREE.Color('#123f58') },
          uSky: { value: new THREE.Color('#4a86c7') },
          uHorizon: { value: new THREE.Color('#cde0eb') },
          uDepth: { value: depth },
        },
      ]),
    [depth],
  );

  useEffect(() => () => { geometry.dispose(); depth.dispose(); }, [geometry, depth]);

  useFrame((state) => {
    const m = mat.current;
    if (!m) return;
    const u = m.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uSunDir.value.copy(env.sunDir);
    u.uSky.value.copy(env.skyColor);
    u.uHorizon.value.copy(env.horizonColor);
    const k = 0.5 + 0.5 * env.daylight;
    u.uShallow.value.copy(SHALLOW).multiplyScalar(k);
    u.uDeep.value.copy(DEEP).multiplyScalar(k);
  });

  return (
    <mesh geometry={geometry} renderOrder={1}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        fog
      />
    </mesh>
  );
}
