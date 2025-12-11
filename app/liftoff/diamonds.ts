import * as THREE from "three";
import { DIAMONDS, NOZZLE_OFFSET } from "./constants";

export function createDiamonds(scene: THREE.Scene): THREE.Mesh[] {
  const diamonds: THREE.Mesh[] = [];

  for (let i = 0; i < DIAMONDS.COUNT; i++) {
    const ringGeo = new THREE.RingGeometry(DIAMONDS.BASE_RADIUS, DIAMONDS.OUTER_RADIUS, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.0, 0.6 - i * 0.06, 0.2),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.rotation.x = Math.PI / 2;
    diamonds.push(ring);
    scene.add(ring);
  }

  return diamonds;
}

let diamondTimeAccumulator = 0;

export function animateDiamonds(
  diamonds: THREE.Mesh[],
  rocketPos: { x: number; y: number; z: number },
  thrustActive: boolean,
  thrustPower: number,
  velocity: number = 0,
  altitude: number = 0,
  delta: number = 0
) {
  const rx = rocketPos.x || 0;
  const ry = rocketPos.y || 0;
  const rz = rocketPos.z || 0;
  const thrustFactor = thrustActive ? Math.min(1, (thrustPower / 0.02) * 1.8) : 0;
  const nozzleY = ry - NOZZLE_OFFSET;

  // Use delta-based timing instead of Date.now()
  diamondTimeAccumulator += delta;
  const time = diamondTimeAccumulator;

  const altitudeChaos = Math.pow(Math.max(0, Math.min(altitude / 300, 1)), 1.5);
  const speedChaos = Math.min(Math.abs(velocity) * 0.3, 2.5);
  const totalChaos = altitudeChaos + speedChaos;

  for (let i = 0; i < diamonds.length; i++) {
    const ring = diamonds[i];
    const spacing = 0.9 + i * 0.6;

    const chaosSpacing = spacing * (1 + thrustFactor * 3.5 + totalChaos * 4);
    const y = nozzleY - chaosSpacing;

    // Reduce perturbation variance calculation
    const perturbX = Math.sin(time * 2 + i) * totalChaos * 0.8;
    const perturbZ = Math.cos(time * 2 + i) * totalChaos * 0.8;
    ring.position.set(rx + perturbX, y, rz + perturbZ);

    const baseScale = 0.6 + i * 0.25 + thrustFactor * (0.8 + i * 0.2);
    const chaosScale = baseScale * (1 + totalChaos * 0.6);
    ring.scale.set(chaosScale, chaosScale, chaosScale);

    const chaosRotation = totalChaos * 0.05;
    ring.rotation.x = Math.PI / 2 + Math.sin(time + i) * chaosRotation;
    ring.rotation.z = Math.cos(time * 0.7 + i) * chaosRotation;

    const phase = time + i * 0.5;
    const glow = Math.max(0, Math.sin(phase) * 0.8 + thrustFactor * 1.5);

    const chaosGlow = glow * (1 + totalChaos * 0.8);

    const mat = ring.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.min(1, chaosGlow * (1 - i * 0.1));

    const chaosHue = 0.07 - Math.min(totalChaos * 0.02, 0.05);
    const chaosSat = Math.max(0.6, 1 - totalChaos * 0.1);
    mat.color.setHSL(chaosHue, chaosSat, Math.min(0.9, 0.35 + chaosGlow * 0.8));

    ring.visible = thrustFactor > 0.02;
  }
}
