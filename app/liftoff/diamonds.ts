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

export function animateDiamonds(
  diamonds: THREE.Mesh[],
  rocketPos: { x: number; y: number; z: number },
  thrustActive: boolean,
  thrustPower: number
) {
  const rx = rocketPos.x || 0;
  const ry = rocketPos.y || 0;
  const rz = rocketPos.z || 0;
  const thrustFactor = thrustActive ? Math.min(1, (thrustPower / 0.02) * 1.8) : 0;
  const nozzleY = ry - NOZZLE_OFFSET;

  for (let i = 0; i < diamonds.length; i++) {
    const ring = diamonds[i];
    const spacing = 0.9 + i * 0.6;
    const y = nozzleY - spacing * (1 + thrustFactor * 3);
    ring.position.set(rx, y, rz);

    const baseScale = 0.6 + i * 0.25 + thrustFactor * (0.8 + i * 0.2);
    ring.scale.set(baseScale, baseScale, baseScale);

    const phase = (Date.now() * 0.002 + i * 0.5) % Math.PI;
    const glow = Math.max(0, Math.sin(phase) * 0.6 + thrustFactor * 1.2);

    const mat = ring.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.min(1, glow * (1 - i * 0.12));
    mat.color.setHSL(0.07, 1, Math.min(0.9, 0.35 + glow * 0.6));
    ring.visible = thrustFactor > 0.02;
  }
}
