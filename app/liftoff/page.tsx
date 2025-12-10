"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function LiftoffPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rocketRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const sceneInitialized = useRef(false);

  const velocityRef = useRef(0);
  const fuelRef = useRef(100);
  const thrustActiveRef = useRef(false);
  const thrustPowerRef = useRef(0.008);
  const gravityRef = useRef(0.0025);
  const massRef = useRef(1000);
  const dragCoefficientRef = useRef(0.0001);
  const particleScaleRef = useRef(0.5);
  const fuelConsumptionRef = useRef(0.5);

  const [thrustActive, setThrustActive] = useState(false);
  const [followRocket, setFollowRocket] = useState(true);
  const [altitude, setAltitude] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [fuelPercent, setFuelPercent] = useState(100);

  const [thrustPower, setThrustPower] = useState(0.008);
  const [gravity, setGravity] = useState(0.0025);
  const [mass, setMass] = useState(1000);
  const [dragCoefficient, setDragCoefficient] = useState(0.0001);
  const [particleScale, setParticleScale] = useState(0.5);
  const [fuelConsumption, setFuelConsumption] = useState(0.5);
  const [povOffsetY, setPovOffsetY] = useState(4);

  const GROUND_LEVEL = -5.5;
  const CAMERA_OFFSET_X = 0;
  const CAMERA_OFFSET_Z = 12;

  useEffect(() => { thrustActiveRef.current = thrustActive; }, [thrustActive]);
  useEffect(() => { thrustPowerRef.current = thrustPower; }, [thrustPower]);
  useEffect(() => { gravityRef.current = gravity; }, [gravity]);
  useEffect(() => { massRef.current = mass; }, [mass]);
  useEffect(() => { dragCoefficientRef.current = dragCoefficient; }, [dragCoefficient]);
  useEffect(() => { particleScaleRef.current = particleScale; }, [particleScale]);
  useEffect(() => { fuelConsumptionRef.current = fuelConsumption; }, [fuelConsumption]);

  useEffect(() => {
    if (particlesRef.current) {
      particlesRef.current.visible = thrustActive && fuelPercent > 0;
    }
  }, [thrustActive, fuelPercent]);

  useEffect(() => {
    if (!mountRef.current || sceneInitialized.current) return;
    sceneInitialized.current = true;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(CAMERA_OFFSET_X, GROUND_LEVEL + povOffsetY, CAMERA_OFFSET_Z);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    scene.add(ground);

    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 1] = -10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      velocities[i * 3] = (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 1] = -Math.random() * 0.3 - 0.15;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      lifetimes[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));
    geo.setAttribute("lifetime", new THREE.BufferAttribute(lifetimes, 1));

    const mat = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.5,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geo, mat);
    particles.visible = false;
    particlesRef.current = particles;
    scene.add(particles);

    const loader = new GLTFLoader();
    loader.load("/model/rocket.glb", (gltf) => {
      const rocket = gltf.scene;
      rocketRef.current = rocket;
      rocket.scale.set(1, 1, 1);
      rocket.position.y = GROUND_LEVEL;
      rocket.position.x = 0;
      rocket.position.z = 0;
      scene.add(rocket);
    });

    const clock = new THREE.Clock();
    let animId: number;

    const animateParticles = (delta: number) => {
      if (!particlesRef.current || !thrustActiveRef.current || fuelRef.current <= 0) return;
      const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const vel = particlesRef.current.geometry.attributes.velocity.array as Float32Array;
      const life = particlesRef.current.geometry.attributes.lifetime.array as Float32Array;
      const intensity = Math.min(Math.abs(velocityRef.current) * 2 + 0.5, 2.5);
      const ry = rocketRef.current?.position.y || 0;
      const rx = rocketRef.current?.position.x || 0;
      const rz = rocketRef.current?.position.z || 0;
      for (let i = 0; i < particleCount; i++) {
        life[i] += delta;
        pos[i * 3] += vel[i * 3] * intensity;
        pos[i * 3 + 1] += vel[i * 3 + 1] * intensity;
        pos[i * 3 + 2] += vel[i * 3 + 2] * intensity;
        vel[i * 3] *= 0.98;
        vel[i * 3 + 2] *= 0.98;
        if (pos[i * 3 + 1] < ry - 12 || life[i] > 1) {
          pos[i * 3] = rx + (Math.random() - 0.5) * 0.6;
          pos[i * 3 + 1] = ry - 9;
          pos[i * 3 + 2] = rz + (Math.random() - 0.5) * 0.6;
          vel[i * 3] = (Math.random() - 0.5) * 0.25;
          vel[i * 3 + 1] = -Math.random() * 0.45 - 0.15;
          vel[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
          life[i] = 0;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.geometry.attributes.lifetime.needsUpdate = true;
      (particlesRef.current.material as THREE.PointsMaterial).size = particleScaleRef.current;
    };

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (rocketRef.current) {
        const rocket = rocketRef.current;
        let thrust = 0;
        if (thrustActiveRef.current && fuelRef.current > 0) {
          thrust = thrustPowerRef.current;
          fuelRef.current = Math.max(0, fuelRef.current - fuelConsumptionRef.current * delta * 2);
          setFuelPercent(Math.round(fuelRef.current * 10) / 10);
        }

        const curMass = massRef.current + fuelRef.current * 5;
        const accel = (thrust - gravityRef.current - dragCoefficientRef.current * velocityRef.current * Math.abs(velocityRef.current)) / (curMass / 1000);
        velocityRef.current += accel * delta * 60;
        rocket.position.y += velocityRef.current * delta * 60;

        if (rocket.position.y <= GROUND_LEVEL && velocityRef.current < 0) {
          rocket.position.y = GROUND_LEVEL;
          velocityRef.current = 0;
        }

        setAltitude(Math.round(Math.max(0, rocket.position.y - GROUND_LEVEL) * 10) / 10);
        setSpeed(Math.round(Math.abs(velocityRef.current) * 1000) / 10);
        rocket.rotation.z = Math.sin(Date.now() * 0.001) * velocityRef.current * 0.005;
      }

      if (followRocket && rocketRef.current) {
        const ry = rocketRef.current.position.y;
        camera.position.y = ry + povOffsetY;
        camera.position.x = CAMERA_OFFSET_X;
        camera.position.z = CAMERA_OFFSET_Z;
        camera.lookAt(rocketRef.current.position.x, rocketRef.current.position.y + 2, rocketRef.current.position.z);
        controls.enabled = false;
      } else {
        controls.enabled = true;
      }

      animateParticles(delta);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const cam = camera;
      cam.aspect = window.innerWidth / window.innerHeight;
      cam.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleReset = () => {
    if (rocketRef.current) rocketRef.current.position.set(0, GROUND_LEVEL, 0);
    velocityRef.current = 0;
    fuelRef.current = 100;
    setAltitude(0);
    setSpeed(0);
    setFuelPercent(100);
    setThrustActive(false);
    setPovOffsetY(4);
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="absolute top-4 left-4 p-4 bg-black/80 rounded-lg text-white max-w-xs">
        <h2 className="text-lg font-bold text-center border-b border-white/30 pb-2 mb-3">Rocket Flight Computer</h2>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="bg-green-900/50 p-2 rounded"><p className="text-green-300 text-xs">Altitude</p><p className="text-xl font-mono">{altitude.toFixed(1)}m</p></div>
          <div className="bg-blue-900/50 p-2 rounded"><p className="text-blue-300 text-xs">Speed</p><p className="text-xl font-mono">{speed.toFixed(1)}m/s</p></div>
          <div className="bg-orange-900/50 p-2 rounded"><p className="text-orange-300 text-xs">Fuel</p><p className="text-xl font-mono">{fuelPercent.toFixed(0)}%</p></div>
          <div className="bg-purple-900/50 p-2 rounded"><p className="text-purple-300 text-xs">Mass</p><p className="text-xl font-mono">{(mass + fuelPercent * 5).toFixed(0)}kg</p></div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer bg-cyan-600 p-3 rounded mb-4">
          <input type="checkbox" checked={followRocket} onChange={e => setFollowRocket(e.target.checked)} className="w-5 h-5" />
          <span className="text-sm font-bold">{followRocket ? "Camera: LOCKED Y (adjustable)" : "Camera: FREE ORBIT"}</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer bg-red-600 p-3 rounded mb-3">
          <input type="checkbox" checked={thrustActive} onChange={e => { setThrustActive(e.target.checked); thrustActiveRef.current = e.target.checked; }} disabled={fuelPercent <= 0} className="w-5 h-5" />
          <span className="text-sm font-bold">{fuelPercent <= 0 ? "OUT OF FUEL" : thrustActive ? "ENGINE ON" : "START ENGINE"}</span>
        </label>

        <button onClick={handleReset} className="w-full bg-yellow-600 hover:bg-yellow-700 py-2 rounded font-bold">RESET LAUNCH</button>

        <div className="mt-4 space-y-3 text-xs">
          <div><label className="flex justify-between"><span>POV Y Offset</span><span>{povOffsetY.toFixed(1)}</span></label><input type="range" min="-8" max="30" step="0.5" value={povOffsetY} onChange={e => setPovOffsetY(+e.target.value)} className="w-full" /></div>
          <div><label className="flex justify-between"><span>Thrust</span><span>{(thrustPower * 1000).toFixed(1)}</span></label><input type="range" min="0.001" max="0.02" step="0.001" value={thrustPower} onChange={e => { setThrustPower(+e.target.value); thrustPowerRef.current = +e.target.value; }} className="w-full" /></div>
          <div><label className="flex justify-between"><span>Gravity</span><span>{(gravity * 1000).toFixed(2)}</span></label><input type="range" min="0" max="0.01" step="0.0001" value={gravity} onChange={e => { setGravity(+e.target.value); gravityRef.current = +e.target.value; }} className="w-full" /></div>
          <div><label className="flex justify-between"><span>Mass</span><span>{mass}</span></label><input type="range" min="100" max="5000" step="100" value={mass} onChange={e => { setMass(+e.target.value); massRef.current = +e.target.value; }} className="w-full" /></div>
          <div><label className="flex justify-between"><span>Drag</span><span>{(dragCoefficient * 10000).toFixed(1)}</span></label><input type="range" min="0" max="0.001" step="0.00001" value={dragCoefficient} onChange={e => { setDragCoefficient(+e.target.value); dragCoefficientRef.current = +e.target.value; }} className="w-full" /></div>
          <div><label className="flex justify-between"><span>Fuel Use</span><span>{fuelConsumption.toFixed(1)}</span></label><input type="range" min="0.1" max="5" step="0.1" value={fuelConsumption} onChange={e => { setFuelConsumption(+e.target.value); fuelConsumptionRef.current = +e.target.value; }} className="w-full" /></div>
          <div><label className="flex justify-between"><span>Flame</span><span>{particleScale.toFixed(1)}</span></label><input type="range" min="0.1" max="2" step="0.1" value={particleScale} onChange={e => { setParticleScale(+e.target.value); particleScaleRef.current = +e.target.value; }} className="w-full" /></div>
        </div>
      </div>
    </div>
  );
}

