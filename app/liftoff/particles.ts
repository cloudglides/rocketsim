import * as THREE from "three";
import { PARTICLES, WIND, NOZZLE_OFFSET } from "./constants";

export interface ParticleRefs {
  flameRef: THREE.Points | null;
  smokeRef: THREE.Points | null;
}

export function createFlames(): THREE.Points {
  const flameCount = PARTICLES.FLAME_COUNT;
  const fPos = new Float32Array(flameCount * 3);
  const fVel = new Float32Array(flameCount * 3);
  const fLife = new Float32Array(flameCount);

  for (let i = 0; i < flameCount; i++) {
    fPos[i * 3] = 0;
    fPos[i * 3 + 1] = -500;
    fPos[i * 3 + 2] = 0;
    fVel[i * 3] = 0;
    fVel[i * 3 + 1] = 0;
    fVel[i * 3 + 2] = 0;
    fLife[i] = 1.0;
  }

  const flameGeo = new THREE.BufferGeometry();
  flameGeo.setAttribute("position", new THREE.BufferAttribute(fPos, 3));
  flameGeo.setAttribute("velocity", new THREE.BufferAttribute(fVel, 3));
  flameGeo.setAttribute("lifetime", new THREE.BufferAttribute(fLife, 1));

  const flameMat = new THREE.PointsMaterial({
    size: PARTICLES.PARTICLE_SCALE * 3.5,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    color: 0xff6600,
    fog: false,
  });

  const flames = new THREE.Points(flameGeo, flameMat);
  flames.visible = true;
  flames.frustumCulled = false;
  flameGeo.computeBoundingSphere();
  return flames;
}

export function createSmokes(): THREE.Points {
  const smokeCount = PARTICLES.SMOKE_COUNT;
  const sPos = new Float32Array(smokeCount * 3);
  const sVel = new Float32Array(smokeCount * 3);
  const sLife = new Float32Array(smokeCount);

  for (let i = 0; i < smokeCount; i++) {
    sPos[i * 3] = 0;
    sPos[i * 3 + 1] = -500;
    sPos[i * 3 + 2] = 0;
    sVel[i * 3] = 0;
    sVel[i * 3 + 1] = 0;
    sVel[i * 3 + 2] = 0;
    sLife[i] = 1.0;
  }

  const smokeGeo = new THREE.BufferGeometry();
  smokeGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
  smokeGeo.setAttribute("velocity", new THREE.BufferAttribute(sVel, 3));
  smokeGeo.setAttribute("lifetime", new THREE.BufferAttribute(sLife, 1));

  const smokeMat = new THREE.PointsMaterial({
    color: 0x999999,
    size: PARTICLES.PARTICLE_SCALE * 2.2,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    fog: false,
  });

  const smokes = new THREE.Points(smokeGeo, smokeMat);
  smokes.visible = true;
  smokes.frustumCulled = false;
  smokeGeo.computeBoundingSphere();
  return smokes;
}

export function animateParticles(
  delta: number,
  flameRef: THREE.Points,
  smokeRef: THREE.Points,
  rocketPos: { x: number; y: number; z: number },
  velocity: number,
  particleScale: number,
  thrustActive: boolean,
  altitude: number = 0,
  thrustPower: number = 0.008,
  particleSpawnYOffset: number = 0,
  rocketRotation: { x: number; z: number } = { x: 0, z: 0 }
) {
  const flamePos = flameRef.geometry.attributes.position.array as Float32Array;
  const flameVel = flameRef.geometry.attributes.velocity.array as Float32Array;
  const flameLife = flameRef.geometry.attributes.lifetime.array as Float32Array;

  const smokePos = smokeRef.geometry.attributes.position.array as Float32Array;
  const smokeVel = smokeRef.geometry.attributes.velocity.array as Float32Array;
  const smokeLife = smokeRef.geometry.attributes.lifetime.array as Float32Array;

  const rx = rocketPos.x || 0;
  const ry = rocketPos.y || 0;
  const rz = rocketPos.z || 0;
  const nozzleY = ry - NOZZLE_OFFSET;

  const thrustFactor = thrustActive ? Math.min(1, (thrustPower / 0.02) * 1.8) : 0;

  const speedChaos = Math.min(Math.abs(velocity) * 0.25, 2.5);
  const altitudeChaos = Math.pow(Math.max(0, Math.min(altitude / 400, 1)), 1.4);
  const totalChaos = (speedChaos + altitudeChaos) * (0.8 + thrustFactor * 0.4);
  const altitudeFactor = Math.max(0.5, 1 - ry / 1000);

  const thrustDirX = Math.sin(rocketRotation.z);
  const thrustDirY = -Math.cos(rocketRotation.z) * Math.cos(rocketRotation.x);
  const thrustDirZ = Math.sin(rocketRotation.x);

  for (let i = 0; i < flamePos.length / 3; i++) {
    if (thrustActive) {
      flameLife[i] += delta * (2.0 + speedChaos * 0.6);
    } else {
      flameLife[i] += delta * 3.0;
    }

    const chaos = (Math.random() - 0.5) * totalChaos * 0.4;
    flamePos[i * 3] += (flameVel[i * 3] + chaos + WIND.X) * delta * 60;
    flamePos[i * 3 + 1] += (flameVel[i * 3 + 1] + velocity * 0.4 + WIND.Y) * delta * 60;
    flamePos[i * 3 + 2] += (flameVel[i * 3 + 2] + chaos + WIND.Z) * delta * 60;

    flameVel[i * 3] *= 0.97;
    flameVel[i * 3 + 2] *= 0.97;
    flameVel[i * 3 + 1] *= 0.94;

    if (flamePos[i * 3 + 1] < nozzleY - 20 || flameLife[i] > 0.8) {
      const spreadRadius = 0.5 + totalChaos * 0.4;
      const thrustOffset = 2 + thrustFactor * 3;
      
      flamePos[i * 3] = rx + thrustDirX * thrustOffset + (Math.random() - 0.5) * spreadRadius;
      flamePos[i * 3 + 1] = ry + thrustDirY * thrustOffset + particleSpawnYOffset + (Math.random() - 0.5) * 0.3;
      flamePos[i * 3 + 2] = rz + thrustDirZ * thrustOffset + (Math.random() - 0.5) * spreadRadius;

      const thrustVelocity = 1.5 + thrustFactor * 1.5;
      flameVel[i * 3] = thrustDirX * (thrustVelocity + totalChaos * 0.5) + (Math.random() - 0.5) * (0.3 + totalChaos * 0.2);
      flameVel[i * 3 + 1] = thrustDirY * (thrustVelocity + totalChaos * 0.5) - Math.random() * 0.8;
      flameVel[i * 3 + 2] = thrustDirZ * (thrustVelocity + totalChaos * 0.5) + (Math.random() - 0.5) * (0.3 + totalChaos * 0.2);
      flameLife[i] = 0;
    }
  }

  for (let i = 0; i < smokePos.length / 3; i++) {
    if (thrustActive) {
      smokeLife[i] += delta * (0.15 + speedChaos * 0.1);
    } else {
      smokeLife[i] += delta * 0.5;
    }

    const dispersion = (Math.random() - 0.5) * totalChaos * 0.25;
    smokePos[i * 3] += (smokeVel[i * 3] + dispersion + WIND.X * 0.7) * delta * 60;
    smokePos[i * 3 + 1] += (smokeVel[i * 3 + 1] + Math.abs(velocity) * 0.02 + WIND.Y * 0.4) * delta * 60;
    smokePos[i * 3 + 2] += (smokeVel[i * 3 + 2] + dispersion + WIND.Z * 0.7) * delta * 60;

    smokeVel[i * 3] *= 0.997;
    smokeVel[i * 3 + 2] *= 0.997;

    const maxLife = thrustActive ? 2.5 + altitudeFactor : 1.5;
    if (smokeLife[i] > maxLife) {
      const dispersionRadius = 0.5 + totalChaos * 0.3;
      const thrustOffset = 1.5 + thrustFactor * 2.5;
      
      smokePos[i * 3] = rx + thrustDirX * thrustOffset + (Math.random() - 0.5) * dispersionRadius;
      smokePos[i * 3 + 1] = ry + thrustDirY * thrustOffset + particleSpawnYOffset + (Math.random() - 0.5) * 0.2;
      smokePos[i * 3 + 2] = rz + thrustDirZ * thrustOffset + (Math.random() - 0.5) * dispersionRadius;

      const smokeVelMult = 0.8 + thrustFactor * 0.4;
      smokeVel[i * 3] = thrustDirX * (0.08 + totalChaos * 0.04) * smokeVelMult + (Math.random() - 0.5) * (0.08 + totalChaos * 0.04) * smokeVelMult;
      smokeVel[i * 3 + 1] = thrustDirY * (0.08 + totalChaos * 0.04) * smokeVelMult + Math.random() * (0.08 + totalChaos * 0.04) * smokeVelMult;
      smokeVel[i * 3 + 2] = thrustDirZ * (0.08 + totalChaos * 0.04) * smokeVelMult + (Math.random() - 0.5) * (0.08 + totalChaos * 0.04) * smokeVelMult;
      smokeLife[i] = 0;
    }
  }

  flameRef.geometry.attributes.position.needsUpdate = true;
  flameRef.geometry.attributes.lifetime.needsUpdate = true;
  flameRef.geometry.computeBoundingSphere();

  smokeRef.geometry.attributes.position.needsUpdate = true;
  smokeRef.geometry.attributes.lifetime.needsUpdate = true;
  smokeRef.geometry.computeBoundingSphere();

  const flameMat = flameRef.material as THREE.PointsMaterial;
  const smokeMat = smokeRef.material as THREE.PointsMaterial;

  if (thrustActive) {
    flameMat.size = particleScale * (2.0 + thrustFactor * 2.5 + totalChaos * 1.0);
    smokeMat.size = particleScale * (1.5 + thrustFactor * 2.0 + totalChaos * 0.6);

    const saturation = Math.min(1, 0.85 + thrustFactor * 0.15 + totalChaos * 0.1);
    const lightness = Math.max(0.45, Math.min(0.7, 0.5 + thrustFactor * 0.15 + speedChaos * 0.08));
    flameMat.color.setHSL(0.04, saturation, lightness);

    const smokeOpacity = Math.max(0.25, Math.min(0.8, 0.3 + thrustFactor * 0.3 + totalChaos * 0.15)) * altitudeFactor;
    smokeMat.opacity = smokeOpacity;
  } else {
    flameMat.size = particleScale * 0.5;
    smokeMat.size = particleScale * 0.8;
    smokeMat.opacity = 0;
  }
}
