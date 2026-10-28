import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { mulberry32 } from '../world/rng';
import { env } from '../world/environment';
import { lerp } from '../world/math';

function makeCloudTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const rng = mulberry32(77);
  for (let i = 0; i < 26; i++) {
    const x = 40 + rng() * 176;
    const y = 70 + (rng() - 0.5) * 26 - Math.sin((x / 256) * Math.PI) * 14;
    const r = 18 + rng() * 26;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.42)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // flat, slightly shaded underside
  const shade = ctx.createLinearGradient(0, 40, 0, 110);
  shade.addColorStop(0, 'rgba(255,255,255,0)');
  shade.addColorStop(1, 'rgba(120,130,150,0.32)');
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 256, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const COUNT = 28;
const tmp = new THREE.Color();
const WHITE = new THREE.Color('#ffffff');
const GREY = new THREE.Color('#8f99a6');
const greyLit = new THREE.Color();

export function Clouds() {
  const data = useMemo(() => {
    const rng = mulberry32(2024);
    const tex = makeCloudTexture();
    const group = new THREE.Group();
    const sprites: { s: THREE.Sprite; speed: number; base: number }[] = [];
    for (let i = 0; i < COUNT; i++) {
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, opacity: 0.8 });
      const s = new THREE.Sprite(mat);
      const ang = rng() * Math.PI * 2;
      const dist = 380 + rng() * 280;
      const w = 220 + rng() * 300;
      s.position.set(Math.cos(ang) * dist, 120 + rng() * 110, Math.sin(ang) * dist);
      s.scale.set(w, w * 0.42, 1);
      s.renderOrder = -1;
      group.add(s);
      sprites.push({ s, speed: 1.2 + rng() * 2.2, base: 0.55 + rng() * 0.45 });
    }
    return { tex, group, sprites };
  }, []);

  useEffect(
    () => () => {
      data.sprites.forEach((c) => (c.s.material as THREE.SpriteMaterial).dispose());
      data.tex.dispose();
    },
    [data],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const light = lerp(0.3, 1, env.daylight);
    greyLit.copy(GREY).multiplyScalar(light);
    tmp.copy(WHITE).lerp(env.sunColor, 0.45).multiplyScalar(light).lerp(greyLit, env.cloud * 0.8);
    const cover = 0.5 + 0.5 * env.cloud;
    for (const c of data.sprites) {
      const p = c.s.position;
      p.x += c.speed * dt;
      if (p.x > 700) p.x = -700;
      const m = c.s.material as THREE.SpriteMaterial;
      m.color.copy(tmp);
      m.opacity = c.base * cover;
    }
  });

  return <primitive object={data.group} />;
}
