"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function LiftoffPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rocketRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const [thrustActive, setThrustActive] = useState(false);
  const [particleScale, setParticleScale] = useState(0.5);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current?.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(5, 10, 5);
    scene.add(light);

    const loader = new GLTFLoader();
    loader.load("/model/rocket.glb", (gltf: any) => {
      const rocket = gltf.scene;
      rocketRef.current = rocket;

      rocket.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((mat) => {
            const material = mat as THREE.MeshStandardMaterial;
            if (material.map) material.map.needsUpdate = true;
            if (material.normalMap) material.normalMap.needsUpdate = true;
            if (material.roughnessMap) material.roughnessMap.needsUpdate = true;
            if (material.metalnessMap) material.metalnessMap.needsUpdate = true;
          });
        }
      });

      rocket.scale.set(1, 1, 1);
      scene.add(rocket);

      const particleCount = 500;
      const positions = new Float32Array(particleCount * 3);
      const velocities = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = rocket.position.x + (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 1] = rocket.position.y - 10;
        positions[i * 3 + 2] = rocket.position.z + (Math.random() - 0.5) * 0.2;

        velocities[i * 3] = (Math.random() - 0.5) * 0.3;
        velocities[i * 3 + 1] = -Math.random() * 0.7 - 0.3;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

      const material = new THREE.PointsMaterial({ color: 0xffaa33, size: particleScale });
      const particles = new THREE.Points(geometry, material);
      particles.visible = thrustActive;
      particlesRef.current = particles;
      scene.add(particles);
    });

    function animateParticles() {
      const particles = particlesRef.current;
      const rocket = rocketRef.current;
      if (!particles || !rocket || !thrustActive) return;

      const positions = particles.geometry.attributes.position.array as Float32Array;
      const velocities = particles.geometry.attributes.velocity.array as Float32Array;

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];

        if (positions[i * 3 + 1] < rocket.position.y - 10 - 3) {
          positions[i * 3] = rocket.position.x + (Math.random() - 0.5) * 0.2;
          positions[i * 3 + 1] = rocket.position.y - 10;
          positions[i * 3 + 2] = rocket.position.z + (Math.random() - 0.5) * 0.2;

          velocities[i * 3] = (Math.random() - 0.5) * 0.3;
          velocities[i * 3 + 1] = -Math.random() * 0.7 - 0.3;
          velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;
      (particles.material as THREE.PointsMaterial).size = particleScale;
    }

    function animate() {
      requestAnimationFrame(animate);
      animateParticles();
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setThrustActive(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setThrustActive(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement))
        mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (particlesRef.current) particlesRef.current.visible = thrustActive;
  }, [thrustActive]);

  useEffect(() => {
    if (particlesRef.current) (particlesRef.current.material as THREE.PointsMaterial).size = particleScale;
  }, [particleScale]);

  return (
    <div className="w-full h-screen relative">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 p-2 bg-white/80 rounded">
        <label>
          Particle Scale:{" "}
          <input
            type="range"
            min="0.1"
            max="1.5"
            step="0.05"
            value={particleScale}
            onChange={(e) => setParticleScale(parseFloat(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}

