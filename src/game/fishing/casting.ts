import { CAST } from './fishingConfig';
import { clamp } from '../world/math';

export interface Vec3Like { x: number; y: number; z: number }

export function launchVelocity(
  yaw: number,
  pitch: number,
  power: number,
  rodCastPower: number,
  out: Vec3Like,
): Vec3Like {
  const elevation = clamp(
    CAST.baseElevation + pitch * CAST.pitchInfluence,
    CAST.minElevation,
    CAST.maxElevation,
  );
  const speed = (CAST.minSpeed + (CAST.maxSpeed - CAST.minSpeed) * clamp(power, 0, 1)) * rodCastPower;
  const horizontal = Math.cos(elevation) * speed;
  out.x = -Math.sin(yaw) * horizontal;
  out.z = -Math.cos(yaw) * horizontal;
  out.y = Math.sin(elevation) * speed;
  return out;
}

export function stepProjectile(pos: Vec3Like, vel: Vec3Like, dt: number): void {
  vel.y -= CAST.gravity * dt;
  const d = Math.max(0, 1 - CAST.drag * dt);
  vel.x *= d;
  vel.z *= d;
  pos.x += vel.x * dt;
  pos.y += vel.y * dt;
  pos.z += vel.z * dt;
}
