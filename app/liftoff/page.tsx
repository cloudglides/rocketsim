"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { setupScene, setupCamera, setupRenderer, setupControls, setupLighting, setupGround, loadRocket } from "./sceneSetup";
import { createFlames, createSmokes, animateParticles } from "./particles";
import { createDiamonds, animateDiamonds } from "./diamonds";
import { calculateAcceleration, updatePhysics, calculateThrust } from "./physics";
import { setupPointerControls, setupResizeListener, handlePOVDrag, type POVControlState } from "./controls";
import { GROUND_LEVEL, PHYSICS, CAMERA, PARTICLES } from "./constants";

export default function LiftoffPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rocketRef = useRef<THREE.Group | null>(null);
  const flameRef = useRef<THREE.Points | null>(null);
  const smokeRef = useRef<THREE.Points | null>(null);
  const diamondsRef = useRef<THREE.Mesh[]>([]);
  const sceneInitialized = useRef(false);

  // Physics refs
  const velocityRef = useRef(0);
  const fuelRef = useRef(PHYSICS.INITIAL_FUEL);
  const thrustActiveRef = useRef(false);
  const thrustPowerRef = useRef(PHYSICS.THRUST_POWER);
  const gravityRef = useRef(PHYSICS.GRAVITY);
  const massRef = useRef(PHYSICS.MASS);
  const dragCoefficientRef = useRef(PHYSICS.DRAG_COEFFICIENT);
  const particleScaleRef = useRef(PARTICLES.PARTICLE_SCALE);
  const fuelConsumptionRef = useRef(PHYSICS.FUEL_CONSUMPTION);
  const povOffsetRef = useRef(CAMERA.DEFAULT_POV_OFFSET);

  // UI State
  const [thrustActive, setThrustActive] = useState(false);
  const [followRocket, setFollowRocket] = useState(true);
  const [altitude, setAltitude] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [fuelPercent, setFuelPercent] = useState(PHYSICS.INITIAL_FUEL);

  // Physics params
  const [thrustPower, setThrustPower] = useState(PHYSICS.THRUST_POWER);
  const [gravity, setGravity] = useState(PHYSICS.GRAVITY);
  const [mass, setMass] = useState(PHYSICS.MASS);
  const [dragCoefficient, setDragCoefficient] = useState(PHYSICS.DRAG_COEFFICIENT);
  const [particleScale, setParticleScale] = useState(PARTICLES.PARTICLE_SCALE);
  const [fuelConsumption, setFuelConsumption] = useState(PHYSICS.FUEL_CONSUMPTION);
  const [povOffsetY, setPovOffsetY] = useState(CAMERA.DEFAULT_POV_OFFSET);
  const [showControls, setShowControls] = useState(false);

  // Pointer control state
  const povControlStateRef = useRef<POVControlState>({ isDragging: false, lastPointerY: 0 });

  // Sync refs with state
  useEffect(() => { thrustActiveRef.current = thrustActive; }, [thrustActive]);
  useEffect(() => { thrustPowerRef.current = thrustPower; }, [thrustPower]);
  useEffect(() => { gravityRef.current = gravity; }, [gravity]);
  useEffect(() => { massRef.current = mass; }, [mass]);
  useEffect(() => { dragCoefficientRef.current = dragCoefficient; }, [dragCoefficient]);
  useEffect(() => { particleScaleRef.current = particleScale; }, [particleScale]);
  useEffect(() => { fuelConsumptionRef.current = fuelConsumption; }, [fuelConsumption]);
  useEffect(() => { povOffsetRef.current = povOffsetY; }, [povOffsetY]);

  useEffect(() => {
    if (!mountRef.current || sceneInitialized.current) return;
    sceneInitialized.current = true;

    // Scene setup
    const scene = setupScene();
    const camera = setupCamera(window.innerWidth, window.innerHeight, povOffsetRef.current);
    const renderer = setupRenderer(mountRef.current);
    const controls = setupControls(camera, renderer);
    const baseLight = setupLighting(scene);
    setupGround(scene);

    // Particles
    const flames = createFlames();
    const smokes = createSmokes();
    flameRef.current = flames;
    smokeRef.current = smokes;
    scene.add(flames);
    scene.add(smokes);

    // Diamonds
    const diamonds = createDiamonds(scene);
    diamondsRef.current = diamonds;

    // Load rocket model
    loadRocket(scene, GROUND_LEVEL).then((rocket) => {
      rocketRef.current = rocket;
    });

    // Animation loop
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (rocketRef.current) {
        const rocket = rocketRef.current;

        // Calculate physics
        const thrust = calculateThrust(thrustActiveRef.current, thrustPowerRef.current, fuelRef.current);
        const acceleration = calculateAcceleration({
          thrust,
          gravity: gravityRef.current,
          dragCoefficient: dragCoefficientRef.current,
          mass: massRef.current,
          fuel: fuelRef.current,
          velocity: velocityRef.current,
        });

        const physicsUpdate = updatePhysics(
          velocityRef.current,
          acceleration,
          rocket.position.y,
          delta,
          fuelConsumptionRef.current,
          thrustActiveRef.current,
          fuelRef.current
        );

        velocityRef.current = physicsUpdate.newVelocity;
        rocket.position.y = physicsUpdate.newYPosition;
        fuelRef.current = physicsUpdate.newFuel;

        // Update UI
        setAltitude(Math.round(Math.max(0, rocket.position.y - GROUND_LEVEL) * 10) / 10);
        setSpeed(Math.round(Math.abs(velocityRef.current) * 1000) / 10);
        setFuelPercent(Math.round(fuelRef.current * 10) / 10);
        rocket.rotation.z = Math.sin(Date.now() * 0.001) * velocityRef.current * 0.005;
      }

      // Camera control - apply smooth POV following without jerking
      controls.update();
      
      if (followRocket && rocketRef.current) {
        const ry = rocketRef.current.position.y;
        const targetY = ry + povOffsetRef.current;
        
        // Smoothly interpolate camera position to avoid glitching
        camera.position.y += (targetY - camera.position.y) * 0.15;
        controls.target.set(rocketRef.current.position.x, rocketRef.current.position.y, rocketRef.current.position.z);
      }

      // Lighting
      if (rocketRef.current) {
        baseLight.position.set(rocketRef.current.position.x, rocketRef.current.position.y - 6, rocketRef.current.position.z);
        baseLight.intensity = thrustActiveRef.current ? 1.5 + Math.random() * 1.2 : 0.03;
      }

      // Particle animation
      if (flameRef.current && smokeRef.current && rocketRef.current) {
        animateParticles(delta, flameRef.current, smokeRef.current, rocketRef.current.position, velocityRef.current, particleScaleRef.current, thrustActiveRef.current);
        animateDiamonds(diamondsRef.current, rocketRef.current.position, thrustActiveRef.current, thrustPowerRef.current);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Event handlers
    const onPointerDown = (e: PointerEvent) => {
      povControlStateRef.current.isDragging = true;
      povControlStateRef.current.lastPointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!povControlStateRef.current.isDragging) return;
      if (followRocket) {
        const dy = e.clientY - povControlStateRef.current.lastPointerY;
        povOffsetRef.current = povOffsetRef.current - dy * 0.05;
        setPovOffsetY(Math.round(povOffsetRef.current * 10) / 10);
        povControlStateRef.current.lastPointerY = e.clientY;
      }
    };

    const onPointerUp = () => {
      povControlStateRef.current.isDragging = false;
    };

    const onDoubleClick = () => {
      povOffsetRef.current = CAMERA.DEFAULT_POV_OFFSET;
      setPovOffsetY(CAMERA.DEFAULT_POV_OFFSET);
      setFollowRocket(true);
    };

    const cleanupPointer = setupPointerControls(onPointerDown, onPointerMove, onPointerUp, onDoubleClick, renderer);
    const cleanupResize = setupResizeListener(camera, renderer);

    return () => {
      cancelAnimationFrame(animId);
      cleanupPointer();
      cleanupResize();
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleReset = () => {
    if (rocketRef.current) rocketRef.current.position.set(0, GROUND_LEVEL, 0);
    velocityRef.current = 0;
    fuelRef.current = PHYSICS.INITIAL_FUEL;
    setAltitude(0);
    setSpeed(0);
    setFuelPercent(PHYSICS.INITIAL_FUEL);
    setThrustActive(false);
    setPovOffsetY(CAMERA.DEFAULT_POV_OFFSET);
    povOffsetRef.current = CAMERA.DEFAULT_POV_OFFSET;
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Top Bar - Telemetry */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-cyan-950/40 to-transparent backdrop-blur-md border-b border-cyan-500/20 flex items-center px-8 gap-12 z-40">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-300 font-mono">{altitude.toFixed(1)}</div>
            <div className="text-[10px] uppercase text-cyan-600 tracking-widest">Alt (m)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-300 font-mono">{speed.toFixed(1)}</div>
            <div className="text-[10px] uppercase text-blue-600 tracking-widest">Speed (m/s)</div>
          </div>
          <div className="text-center">
            <div className="relative inline-block">
              <div className="text-2xl font-bold text-orange-300 font-mono">{fuelPercent.toFixed(0)}</div>
              <div className="absolute -right-2 top-0 text-sm text-orange-300">%</div>
            </div>
            <div className="text-[10px] uppercase text-orange-600 tracking-widest">Fuel</div>
            {/* Fuel bar */}
            <div className="w-32 h-1 bg-orange-900/50 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-orange-300 rounded-full" style={{ width: `${fuelPercent}%` }} />
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-300 font-mono">{(mass + fuelPercent * 5).toFixed(0)}</div>
            <div className="text-[10px] uppercase text-purple-600 tracking-widest">Mass (kg)</div>
          </div>

          <div className="ml-auto flex gap-3 items-center">
            <button
              onClick={() => setShowControls(!showControls)}
              onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
              className={`px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all duration-200 select-none ${
                showControls
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/50 border border-cyan-500"
                  : "bg-slate-700/50 text-slate-300 hover:bg-cyan-600/30 border border-cyan-600/30"
              }`}
            >
              {showControls ? "◀ Close" : "▶ Tuning"}
            </button>

            <button
              onClick={handleReset}
              onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
              className="px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider bg-yellow-600/20 text-yellow-300 border border-yellow-600/50 hover:bg-yellow-600/40 transition-all duration-200 select-none"
            >
              Reset
            </button>

            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider cursor-pointer transition-all duration-200 select-none ${
              thrustActive
                ? "bg-red-600/30 text-red-300 border border-red-600/50"
                : "bg-red-900/20 text-red-400 border border-red-900/50"
            }`}>
              <input 
                type="checkbox" 
                checked={thrustActive} 
                onChange={e => { setThrustActive(e.target.checked); thrustActiveRef.current = e.target.checked; }} 
                disabled={fuelPercent <= 0} 
                className="w-4 h-4 cursor-pointer" 
              />
              <span>{fuelPercent <= 0 ? "No Fuel" : thrustActive ? "🔥 Firing" : "Off"}</span>
            </label>

            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider cursor-pointer transition-all duration-200 select-none ${
              followRocket
                ? "bg-blue-600/30 text-blue-300 border border-blue-600/50"
                : "bg-blue-900/20 text-blue-400 border border-blue-900/50"
            }`}>
              <input 
                type="checkbox" 
                checked={followRocket} 
                onChange={e => setFollowRocket(e.target.checked)} 
                className="w-4 h-4 cursor-pointer" 
              />
              <span>{followRocket ? "📷 Follow" : "Free"}</span>
            </label>
          </div>
        </div>

      {/* Right Sidebar - Controls */}
      {showControls && (
        <div className="absolute top-20 right-0 bottom-0 w-80 bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl border-l border-cyan-500/20 overflow-y-auto p-6 space-y-6 shadow-2xl z-30">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase tracking-widest">Engine Tuning</h3>

          {/* Thrust */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-slate-300">Thrust Power</label>
              <span className="text-xs font-mono text-cyan-300">{(thrustPower * 1000).toFixed(1)}</span>
            </div>
            <input type="range" min="0.001" max="0.02" step="0.001" value={thrustPower} onChange={e => { setThrustPower(+e.target.value); thrustPowerRef.current = +e.target.value; }} className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500" />
          </div>

          {/* Gravity */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-slate-300">Gravity</label>
              <span className="text-xs font-mono text-cyan-300">{(gravity * 1000).toFixed(2)}</span>
            </div>
            <input type="range" min="0" max="0.01" step="0.0001" value={gravity} onChange={e => { setGravity(+e.target.value); gravityRef.current = +e.target.value; }} className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500" />
          </div>

          {/* Mass */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-slate-300">Dry Mass</label>
              <span className="text-xs font-mono text-cyan-300">{mass} kg</span>
            </div>
            <input type="range" min="100" max="5000" step="100" value={mass} onChange={e => { setMass(+e.target.value); massRef.current = +e.target.value; }} className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500" />
          </div>

          {/* Drag Coefficient */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-slate-300">Drag Coefficient</label>
              <span className="text-xs font-mono text-cyan-300">{(dragCoefficient * 10000).toFixed(2)}</span>
            </div>
            <input type="range" min="0" max="0.001" step="0.00001" value={dragCoefficient} onChange={e => { setDragCoefficient(+e.target.value); dragCoefficientRef.current = +e.target.value; }} className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500" />
          </div>

          {/* Fuel Consumption */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-slate-300">Fuel Consumption Rate</label>
              <span className="text-xs font-mono text-cyan-300">{fuelConsumption.toFixed(2)}</span>
            </div>
            <input type="range" min="0.1" max="5" step="0.1" value={fuelConsumption} onChange={e => { setFuelConsumption(+e.target.value); fuelConsumptionRef.current = +e.target.value; }} className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500" />
          </div>

          {/* Particle Scale */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-slate-300">Flame Intensity</label>
              <span className="text-xs font-mono text-cyan-300">{particleScale.toFixed(2)}</span>
            </div>
            <input type="range" min="0.1" max="2" step="0.1" value={particleScale} onChange={e => { setParticleScale(+e.target.value); particleScaleRef.current = +e.target.value; }} className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500" />
          </div>

          {/* POV Offset */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-slate-300">Camera Height</label>
              <span className="text-xs font-mono text-cyan-300">{povOffsetY.toFixed(1)}</span>
            </div>
            <input type="range" min="-8" max="30" step="0.5" value={povOffsetY} onChange={e => { const v = +e.target.value; setPovOffsetY(v); povOffsetRef.current = v; }} className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500" />
          </div>
        </div>
      )}
    </div>
  );
}
