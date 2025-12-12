import * as THREE from "three";

export function createStarfield(): THREE.Points {
  const starCount = 3000;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const radius = 5000;

    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.cos(phi);
    starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const brightness = Math.random() * 0.5 + 0.5;
    starColors[i * 3] = brightness;
    starColors[i * 3 + 1] = brightness;
    starColors[i * 3 + 2] = brightness;
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

  const starMaterial = new THREE.PointsMaterial({
    size: 10,
    sizeAttenuation: true,
    vertexColors: true,
    fog: false,
    transparent: true,
    opacity: 0.8,
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  stars.renderOrder = 10000;
  return stars;
}

export function createPlanetGlow(): THREE.Group {
  const group = new THREE.Group();

  const earthGeo = new THREE.SphereGeometry(80, 32, 32);
  const earthMat = new THREE.MeshBasicMaterial({
    color: 0x333333,
  });
  const earth = new THREE.Mesh(earthGeo, earthMat);
  earth.position.set(200, -600, 150);

  const glowGeo = new THREE.SphereGeometry(85, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x555555,
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.copy(earth.position);

  group.add(earth);
  group.add(glow);

  return group;
}

export function createNebulaBackground(): THREE.Points {
  const particleCount = 300;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 800;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 800 - 300;

    const brightness = Math.random() * 0.3 + 0.2;
    colors[i * 3] = brightness;
    colors[i * 3 + 1] = brightness;
    colors[i * 3 + 2] = brightness;
  }

  const nebulaGeo = new THREE.BufferGeometry();
  nebulaGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  nebulaGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const nebulaMat = new THREE.PointsMaterial({
    size: 2,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.15,
    fog: false,
  });

  const nebula = new THREE.Points(nebulaGeo, nebulaMat);
  return nebula;
}
