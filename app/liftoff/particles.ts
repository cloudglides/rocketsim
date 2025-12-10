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
    fPos[i * 3] = (Math.random() - 0.5) * 0.2;
    fPos[i * 3 + 1] = -10;
    fPos[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    fVel[i * 3] = (Math.random() - 0.5) * 0.15;
    fVel[i * 3 + 1] = -Math.random() * 1.2 - 0.6;
    fVel[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    fLife[i] = Math.random();
  }

  const flameGeo = new THREE.BufferGeometry();
  flameGeo.setAttribute("position", new THREE.BufferAttribute(fPos, 3));
  flameGeo.setAttribute("velocity", new THREE.BufferAttribute(fVel, 3));
  flameGeo.setAttribute("lifetime", new THREE.BufferAttribute(fLife, 1));

  const flameMat = new THREE.PointsMaterial({
    size: PARTICLES.PARTICLE_SCALE * 1.5,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const flames = new THREE.Points(flameGeo, flameMat);
  flames.visible = false;
  return flames;
}

export function createSmokes(): THREE.Points {
  const smokeCount = PARTICLES.SMOKE_COUNT;
  const sPos = new Float32Array(smokeCount * 3);
  const sVel = new Float32Array(smokeCount * 3);
  const sLife = new Float32Array(smokeCount);

  for (let i = 0; i < smokeCount; i++) {
    sPos[i * 3] = (Math.random() - 0.5) * 0.6;
    sPos[i * 3 + 1] = -10;
    sPos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    sVel[i * 3] = (Math.random() - 0.5) * 0.05;
    sVel[i * 3 + 1] = Math.random() * 0.02 + 0.02;
    sVel[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    sLife[i] = Math.random();
  }

  const smokeGeo = new THREE.BufferGeometry();
  smokeGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
  smokeGeo.setAttribute("velocity", new THREE.BufferAttribute(sVel, 3));
  smokeGeo.setAttribute("lifetime", new THREE.BufferAttribute(sLife, 1));

  const smokeMat = new THREE.PointsMaterial({
    color: 0x666666,
    size: PARTICLES.PARTICLE_SCALE * 1.5,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });

  const smokes = new THREE.Points(smokeGeo, smokeMat);
  smokes.visible = false;
  return smokes;
}

export function animateParticles(
  delta: number,
  flameRef: THREE.Points,
  smokeRef: THREE.Points,
  rocketPos: { x: number; y: number; z: number },
  velocity: number,
  particleScale: number,
  thrustActive: boolean
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

  // Update flames
  for (let i = 0; i < flamePos.length / 3; i++) {
    flameLife[i] += delta * (1.5 + Math.random() * 0.5);
    flamePos[i * 3] += (flameVel[i * 3] + (Math.random() - 0.5) * 0.01 + WIND.X) * delta * 60;
    flamePos[i * 3 + 1] += (flameVel[i * 3 + 1] + velocity * 0.3 + WIND.Y) * delta * 60;
    flamePos[i * 3 + 2] += (flameVel[i * 3 + 2] + (Math.random() - 0.5) * 0.01 + WIND.Z) * delta * 60;
    flameVel[i * 3] *= 0.98;
    flameVel[i * 3 + 2] *= 0.98;
    flameVel[i * 3 + 1] *= 0.95;

    if (flamePos[i * 3 + 1] < nozzleY - 12 || flameLife[i] > 0.8) {
      flamePos[i * 3] = rx + (Math.random() - 0.5) * 0.35;
      flamePos[i * 3 + 1] = nozzleY + (Math.random() - 0.5) * 0.4;
      flamePos[i * 3 + 2] = rz + (Math.random() - 0.5) * 0.35;
      flameVel[i * 3] = (Math.random() - 0.5) * 0.2;
      flameVel[i * 3 + 1] = -Math.random() * 1.3 - 0.8;
      flameVel[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      flameLife[i] = 0;
    }
  }

  // Update smokes
  for (let i = 0; i < smokePos.length / 3; i++) {
    smokeLife[i] += delta * (0.15 + Math.random() * 0.2);
    smokePos[i * 3] += (smokeVel[i * 3] + WIND.X * 0.6) * delta * 60;
    smokePos[i * 3 + 1] += (smokeVel[i * 3 + 1] + Math.abs(velocity) * 0.01 + WIND.Y * 0.3) * delta * 60;
    smokePos[i * 3 + 2] += (smokeVel[i * 3 + 2] + WIND.Z * 0.6) * delta * 60;
    smokeVel[i * 3] *= 0.998;
    smokeVel[i * 3 + 2] *= 0.998;

    if (smokeLife[i] > 4) {
      smokePos[i * 3] = rx + (Math.random() - 0.5) * 0.5;
      smokePos[i * 3 + 1] = nozzleY + (Math.random() - 0.5) * 0.5;
      smokePos[i * 3 + 2] = rz + (Math.random() - 0.5) * 0.5;
      smokeVel[i * 3] = (Math.random() - 0.5) * 0.04;
      smokeVel[i * 3 + 1] = Math.random() * 0.02 + 0.01;
      smokeVel[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
      smokeLife[i] = 0;
    }
  }

  flameRef.geometry.attributes.position.needsUpdate = true;
  flameRef.geometry.attributes.lifetime.needsUpdate = true;
  smokeRef.geometry.attributes.position.needsUpdate = true;
  smokeRef.geometry.attributes.lifetime.needsUpdate = true;

  // Realistic flame coloring
  const flameMat = flameRef.material as THREE.PointsMaterial;
  const smokeMat = smokeRef.material as THREE.PointsMaterial;

  if (thrustActive) {
    flameMat.size = particleScale * 2 * (1 + Math.min(Math.abs(velocity) * 0.3, 1.5));
    smokeMat.size = particleScale * 1.8;
    // Orange/yellow flame color
    flameMat.color.setHSL(0.08, 0.95, 0.55 + Math.abs(velocity) * 0.03);
    smokeMat.opacity = Math.max(0.15, Math.min(0.5, 0.3 + Math.abs(velocity) * 0.005));
  } else {
    flameMat.size = particleScale * 0.5;
    smokeMat.size = particleScale;
    smokeMat.opacity = 0;
  }
}
