"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { setupScene, setupCamera, setupRenderer, setupControls, setupLighting, setupGround, loadRocket } from "./sceneSetup";
import { createFlames, createSmokes, animateParticles } from "./particles";
import { createDiamonds, animateDiamonds } from "./diamonds";
import { calculateAcceleration, updatePhysics, calculateThrust } from "./physics";
import { setupPointerControls, setupResizeListener, handlePOVDrag, type POVControlState } from "./controls";
import { GROUND_LEVEL, PHYSICS, CAMERA, PARTICLES, ROCKET_SPAWN_Y, PARTICLE_SPAWN_Y_OFFSET } from "./constants";

export default function LiftoffPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rocketRef = useRef<THREE.Group | null>(null);
  const flameRef = useRef<THREE.Points | null>(null);
  const smokeRef = useRef<THREE.Points | null>(null);
  const diamondsRef = useRef<THREE.Mesh[]>([]);
  const sceneInitialized = useRef(false);

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

  const [thrustActive, setThrustActive] = useState(false);
  const [followRocket, setFollowRocket] = useState(true);
  const [altitude, setAltitude] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [fuelPercent, setFuelPercent] = useState(PHYSICS.INITIAL_FUEL);
  const [unlimitedFuel, setUnlimitedFuel] = useState(false);

  const [thrustPower, setThrustPower] = useState(PHYSICS.THRUST_POWER);
  const [gravity, setGravity] = useState(PHYSICS.GRAVITY);
  const [mass, setMass] = useState(PHYSICS.MASS);
  const [dragCoefficient, setDragCoefficient] = useState(PHYSICS.DRAG_COEFFICIENT);
  const [particleScale, setParticleScale] = useState(PARTICLES.PARTICLE_SCALE);
  const [fuelConsumption, setFuelConsumption] = useState(PHYSICS.FUEL_CONSUMPTION);
  const [povOffsetY, setPovOffsetY] = useState(CAMERA.DEFAULT_POV_OFFSET);

  const povControlStateRef = useRef<POVControlState>({ isDragging: false, lastPointerY: 0 });

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

    const scene = setupScene();
    const camera = setupCamera(window.innerWidth, window.innerHeight, povOffsetRef.current);
    const renderer = setupRenderer(mountRef.current);
    const controls = setupControls(camera, renderer);
    const baseLight = setupLighting(scene);
    setupGround(scene);

    const flames = createFlames();
    const smokes = createSmokes();
    flameRef.current = flames;
    smokeRef.current = smokes;
    scene.add(flames);
    scene.add(smokes);

    const diamonds = createDiamonds(scene);
    diamondsRef.current = diamonds;

    loadRocket(scene, GROUND_LEVEL + ROCKET_SPAWN_Y).then((rocket) => {
      rocketRef.current = rocket;
    });

    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (rocketRef.current) {
        const rocket = rocketRef.current;

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
        fuelRef.current = unlimitedFuel ? PHYSICS.INITIAL_FUEL : physicsUpdate.newFuel;

        if (Math.random() > 0.8) {
          setAltitude(Math.round(Math.max(0, rocket.position.y - GROUND_LEVEL) * 10) / 10);
          setSpeed(Math.round(Math.abs(velocityRef.current) * 1000) / 10);
          setFuelPercent(Math.round(fuelRef.current * 10) / 10);
        }

        rocket.rotation.z = velocityRef.current * 0.0005;
      }

      if (followRocket && rocketRef.current) {
        const ry = rocketRef.current.position.y;
        const targetY = ry + povOffsetRef.current;

        camera.position.y += (targetY - camera.position.y) * 0.1;
        controls.target.y = ry;
      }

      controls.update();

      if (rocketRef.current) {
        baseLight.position.set(rocketRef.current.position.x, rocketRef.current.position.y - 6, rocketRef.current.position.z);
        baseLight.intensity = thrustActiveRef.current ? 1.5 + Math.random() * 1.2 : 0.03;
      }

      if (flameRef.current && smokeRef.current && rocketRef.current) {
        const currentAltitude = Math.max(0, rocketRef.current.position.y - GROUND_LEVEL - ROCKET_SPAWN_Y);
        animateParticles(delta, flameRef.current, smokeRef.current, rocketRef.current.position, velocityRef.current, particleScaleRef.current, thrustActiveRef.current, currentAltitude, thrustPowerRef.current, PARTICLE_SPAWN_Y_OFFSET);
      }

      renderer.render(scene, camera);
    };

    animate();

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
    if (rocketRef.current) rocketRef.current.position.set(0, GROUND_LEVEL + ROCKET_SPAWN_Y, 0);
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
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="telemetry-bar">
        <div className="telemetry-metrics">
          <div className="metric metric-altitude">
            <div className="metric-label">Altitude</div>
            <div className="metric-value">{altitude.toFixed(1)} m</div>
          </div>
          <div className="metric metric-speed">
            <div className="metric-label">Speed</div>
            <div className="metric-value">{speed.toFixed(1)} m/s</div>
          </div>
          <div className="metric metric-fuel">
            <div className="metric-label">Fuel</div>
            <div className="metric-value">{fuelPercent.toFixed(0)}%</div>
          </div>
          <div className="metric metric-mass">
            <div className="metric-label">Mass</div>
            <div className="metric-value">{(mass + fuelPercent * 5).toFixed(0)} kg</div>
          </div>
        </div>
      </div>

      <div className="controls-box">
        <button
          onClick={handleReset}
          onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
          className="control-btn reset-btn"
        >
          Reset
        </button>

        <div className="control-row">
          <label className="engine-label">
            <input
              type="checkbox"
              checked={thrustActive}
              onChange={e => { setThrustActive(e.target.checked); thrustActiveRef.current = e.target.checked; }}
              disabled={fuelPercent <= 0}
            />
            <span>{fuelPercent <= 0 ? "No Fuel" : thrustActive ? "Firing" : "Engine"}</span>
          </label>
        </div>

        <div className="control-row">
          <label className="follow-label">
            <input
              type="checkbox"
              checked={followRocket}
              onChange={e => setFollowRocket(e.target.checked)}
            />
            <span>{followRocket ? "Follow" : "Free"}</span>
          </label>
        </div>
      </div>

      <div className="config-box">
        <div className="config-title">Options</div>

        <div className="config-section">
          <div className="config-item">
            <label htmlFor="unlimited-fuel">Unlimited Fuel</label>
            <input
              id="unlimited-fuel"
              type="checkbox"
              checked={unlimitedFuel}
              onChange={e => setUnlimitedFuel(e.target.checked)}
            />
          </div>
        </div>

        <div className="config-section">
          <div className="config-slider">
            <div className="config-slider-label">
              <span>Thrust Power</span>
              <span>{(thrustPower * 1000).toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.02"
              step="0.001"
              value={thrustPower}
              onChange={e => {
                setThrustPower(+e.target.value);
                thrustPowerRef.current = +e.target.value;
              }}
            />
          </div>

          <div className="config-slider">
            <div className="config-slider-label">
              <span>Gravity</span>
              <span>{(gravity * 1000).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.01"
              step="0.0001"
              value={gravity}
              onChange={e => {
                setGravity(+e.target.value);
                gravityRef.current = +e.target.value;
              }}
            />
          </div>

          <div className="config-slider">
            <div className="config-slider-label">
              <span>Mass (kg)</span>
              <span>{mass}</span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={mass}
              onChange={e => {
                setMass(+e.target.value);
                massRef.current = +e.target.value;
              }}
            />
          </div>

          <div className="config-slider">
            <div className="config-slider-label">
              <span>Drag Coeff</span>
              <span>{(dragCoefficient * 10000).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.001"
              step="0.00001"
              value={dragCoefficient}
              onChange={e => {
                setDragCoefficient(+e.target.value);
                dragCoefficientRef.current = +e.target.value;
              }}
            />
          </div>

          <div className="config-slider">
            <div className="config-slider-label">
              <span>Fuel Rate</span>
              <span>{fuelConsumption.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={fuelConsumption}
              onChange={e => {
                setFuelConsumption(+e.target.value);
                fuelConsumptionRef.current = +e.target.value;
              }}
            />
          </div>

          <div className="config-slider">
            <div className="config-slider-label">
              <span>Particle Scale</span>
              <span>{particleScale.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={particleScale}
              onChange={e => {
                setParticleScale(+e.target.value);
                particleScaleRef.current = +e.target.value;
              }}
            />
          </div>

          <div className="config-slider">
            <div className="config-slider-label">
              <span>Camera Height</span>
              <span>{povOffsetY.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="-8"
              max="30"
              step="0.5"
              value={povOffsetY}
              onChange={e => {
                const v = +e.target.value;
                setPovOffsetY(v);
                povOffsetRef.current = v;
              }}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
