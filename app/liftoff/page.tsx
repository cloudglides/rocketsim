"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { setupScene, setupCamera, setupRenderer, setupControls, setupLighting, setupGround, loadRocket } from "./sceneSetup";
import { createFlames, createSmokes, animateParticles } from "./particles";
import { createDiamonds, animateDiamonds } from "./diamonds";
import { calculateAcceleration, updatePhysics, calculateThrust, calculateGravityWithAltitude } from "./physics";
import { setupPointerControls, setupResizeListener, handlePOVDrag, type POVControlState } from "./controls";
import { GROUND_LEVEL, PHYSICS, CAMERA, PARTICLES, ROCKET_SPAWN_Y, PARTICLE_SPAWN_Y_OFFSET, ORBITAL_ALTITUDE, ORBITAL_VELOCITY, SCALE_FACTOR } from "./constants";
import { createStarfield, createPlanetGlow, createNebulaBackground } from "./space";

export default function LiftoffPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rocketRef = useRef<THREE.Group | null>(null);
  const flameRef = useRef<THREE.Points | null>(null);
  const smokeRef = useRef<THREE.Points | null>(null);
  const diamondsRef = useRef<THREE.Mesh[]>([]);
  const sceneInitialized = useRef(false);
  const starsRef = useRef<{ stars: THREE.Points; nebula: THREE.Points } | null>(null);
  const spaceContainerRef = useRef<THREE.Group | null>(null);
  const cameraShakeRef = useRef({ intensity: 0, targetIntensity: 0 });
  const trailRef = useRef<THREE.Points | null>(null);
  const trailPositionsRef = useRef<number[]>([]);
  const trailOpacitiesRef = useRef<number[]>([]);

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
  const lateralVelocityXRef = useRef(0);
  const lateralVelocityZRef = useRef(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const [thrustActive, setThrustActive] = useState(false);
  const [followRocket, setFollowRocket] = useState(true);
  const [altitude, setAltitude] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [fuelPercent, setFuelPercent] = useState(PHYSICS.INITIAL_FUEL);
  const [unlimitedFuel, setUnlimitedFuel] = useState(false);
  const [inOrbit, setInOrbit] = useState(false);
  const [gameState, setGameState] = useState<'ready' | 'flying' | 'orbit' | 'crashed'>('ready');
  const [orbitCelebrationTime, setOrbitCelebrationTime] = useState(0);
  const [milestone, setMilestone] = useState<{ text: string; time: number } | null>(null);
  const milestonesReachedRef = useRef(new Set<number>());
  const hasLaunchedRef = useRef(false);

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
    sceneRef.current = scene;
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

    // Create rocket trail
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(3000 * 3);
    const trailColors = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      trailPositions[i * 3] = 0;
      trailPositions[i * 3 + 1] = -1000;
      trailPositions[i * 3 + 2] = 0;
      trailColors[i * 3] = 0.8;
      trailColors[i * 3 + 1] = 0.6;
      trailColors[i * 3 + 2] = 0.3;
    }
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
    const trailMat = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      sizeAttenuation: true,
      fog: false,
    });
    const trail = new THREE.Points(trailGeo, trailMat);
    scene.add(trail);
    trailRef.current = trail;

    const stars = createStarfield();
    const nebula = createNebulaBackground();
    const planetGlow = createPlanetGlow();

    const spaceContainer = new THREE.Group();
    spaceContainer.add(stars);
    spaceContainer.add(nebula);
    spaceContainer.add(planetGlow);
    scene.add(spaceContainer);
    spaceContainerRef.current = spaceContainer;

    // Store references for altitude-based visibility
    starsRef.current = { stars, nebula };

    loadRocket(scene, GROUND_LEVEL + ROCKET_SPAWN_Y).then((rocket) => {
      rocketRef.current = rocket;
    });

    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);

      // Update celebration timer
      if (orbitCelebrationTime > 0) {
        setOrbitCelebrationTime(prev => Math.max(0, prev - delta));
      }

      // Update milestone timer
      if (milestone && milestone.time > 0) {
        setMilestone(prev => prev ? { ...prev, time: Math.max(0, prev.time - delta) } : null);
      } else if (milestone && milestone.time <= 0) {
        setMilestone(null);
      }

      if (sceneRef.current && starsRef.current && rocketRef.current) {
        const currentAltitude = Math.max(0, rocketRef.current.position.y - GROUND_LEVEL);
        const altitudeKm = currentAltitude * SCALE_FACTOR;

        if (altitudeKm < 50) {
          sceneRef.current.background = new THREE.Color(0x87ceeb);
          sceneRef.current.fog = new THREE.Fog(0x87ceeb, 50, 200);
          starsRef.current.stars.visible = false;
          starsRef.current.nebula.visible = false;
        } else if (altitudeKm < 100) {
          const ratio = (altitudeKm - 50) / 50;
          const r = Math.round(0x87 * (1 - ratio) + 0x0a * ratio);
          const g = Math.round(0xce * (1 - ratio) + 0x0a * ratio);
          const b = Math.round(0xeb * (1 - ratio) + 0x1a * ratio);
          const color = (r << 16) | (g << 8) | b;
          sceneRef.current.background = new THREE.Color(color);
          sceneRef.current.fog = new THREE.Fog(color, 50, 200);
          starsRef.current.stars.visible = false;
          starsRef.current.nebula.visible = false;
        } else if (altitudeKm < 500) {
          const ratio = (altitudeKm - 100) / 400;
          const r = Math.round(0x0a * (1 - ratio) + 0x00 * ratio);
          const g = Math.round(0x0a * (1 - ratio) + 0x00 * ratio);
          const b = Math.round(0x1a * (1 - ratio) + 0x05 * ratio);
          const color = (r << 16) | (g << 8) | b;
          sceneRef.current.background = new THREE.Color(color);
          sceneRef.current.fog = null;
          // Fade in stars as we approach 500km
          starsRef.current.stars.visible = true;
          starsRef.current.nebula.visible = true;
          const starFadeRatio = ratio;
          (starsRef.current.stars.material as THREE.PointsMaterial).opacity = starFadeRatio * 0.3;
          (starsRef.current.nebula.material as THREE.PointsMaterial).opacity = starFadeRatio * 0.15;
        } else {
          // At 500km+ show space with stars at full brightness
          sceneRef.current.background = new THREE.Color(0x000000);
          sceneRef.current.fog = null;
          starsRef.current.stars.visible = true;
          starsRef.current.stars.renderOrder = 100;
          (starsRef.current.stars.material as THREE.PointsMaterial).opacity = 1.0;
          starsRef.current.nebula.visible = true;
          starsRef.current.nebula.renderOrder = 50;
          (starsRef.current.nebula.material as THREE.PointsMaterial).opacity = 0.5;
        }
      }

      if (rocketRef.current) {
        const rocket = rocketRef.current;
        const currentAltitude = Math.max(0, rocket.position.y - GROUND_LEVEL);

        const thrust = calculateThrust(thrustActiveRef.current, thrustPowerRef.current, fuelRef.current);
        const altitudeGravity = calculateGravityWithAltitude(gravityRef.current, currentAltitude);
        const acceleration = calculateAcceleration({
          thrust,
          gravity: altitudeGravity,
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
        fuelRef.current = unlimitedFuel ? PHYSICS.INITIAL_FUEL : physicsUpdate.newFuel;

        const rotationSpeed = 0.45;
        const rotationDamping = 0.68;
        const maxRotation = Math.PI / 1.8;

        // Left/Right moves left/right
        if (keysPressed.current['ArrowLeft']) {
          rocket.rotation.x += rotationSpeed;
        }
        if (keysPressed.current['ArrowRight']) {
          rocket.rotation.x -= rotationSpeed;
        }
        // Up/Down moves forward/back
        if (keysPressed.current['ArrowUp']) {
          rocket.rotation.z -= rotationSpeed;
        }
        if (keysPressed.current['ArrowDown']) {
          rocket.rotation.z += rotationSpeed;
        }

        if (!keysPressed.current['ArrowLeft'] && !keysPressed.current['ArrowRight']) {
          rocket.rotation.x *= rotationDamping;
        }
        if (!keysPressed.current['ArrowUp'] && !keysPressed.current['ArrowDown']) {
          rocket.rotation.z *= rotationDamping;
        }

        // Aggressive rotation limits
        rocket.rotation.x = Math.max(-maxRotation, Math.min(maxRotation, rocket.rotation.x));
        rocket.rotation.z = Math.max(-maxRotation, Math.min(maxRotation, rocket.rotation.z));
        rocket.rotation.y = 0;

        const thrustDirectionX = Math.sin(rocket.rotation.z);
        const thrustDirectionY = -Math.cos(rocket.rotation.z) * Math.cos(rocket.rotation.x);
        const thrustDirectionZ = Math.sin(rocket.rotation.x);

        const currentMass = massRef.current + fuelRef.current * 5;
        const thrustMagnitude = thrust / (currentMass / 1000);

        const altitudeKm = currentAltitude * SCALE_FACTOR;
        const heavyDrag = 0.75;
        const spaceDrag = 0.95;
        const atmosphericDrag = altitudeKm < 100 ? heavyDrag : spaceDrag;

        lateralVelocityXRef.current *= atmosphericDrag;
        lateralVelocityZRef.current *= atmosphericDrag;
        
        // Clamp lateral velocity to prevent overshoot
        const maxLateralVel = 15;
        lateralVelocityXRef.current = Math.max(-maxLateralVel, Math.min(maxLateralVel, lateralVelocityXRef.current));
        lateralVelocityZRef.current = Math.max(-maxLateralVel, Math.min(maxLateralVel, lateralVelocityZRef.current));

        // Ultra-responsive arcade controls
        lateralVelocityXRef.current += thrustDirectionX * thrustMagnitude * delta * 200;
        lateralVelocityZRef.current += thrustDirectionZ * thrustMagnitude * delta * 200;
        velocityRef.current += (-thrustDirectionY * thrustMagnitude - altitudeGravity * 1.2) * delta * 85;

        rocket.position.x += lateralVelocityXRef.current * delta * 60;
        rocket.position.z += lateralVelocityZRef.current * delta * 60;
        rocket.position.y += velocityRef.current * delta * 60;

        const newAltitude = Math.round(Math.max(0, rocket.position.y - GROUND_LEVEL) * 10) / 10;
        const newSpeed = Math.round(Math.abs(velocityRef.current) * 1000) / 10;
        const newFuelPercent = Math.round(fuelRef.current * 10) / 10;

        setAltitude(newAltitude);
        setSpeed(newSpeed);
        setFuelPercent(newFuelPercent);

        const newAltitudeKm = newAltitude * SCALE_FACTOR;
        const speedKmS = newSpeed / 1000;
        const inOrbitNow = newAltitudeKm >= ORBITAL_ALTITUDE && speedKmS >= ORBITAL_VELOCITY * 0.9;

        // Track launch
        if (thrustActiveRef.current && !hasLaunchedRef.current) {
          hasLaunchedRef.current = true;
        }

        const milestones = [100, 250, 500];
        for (const ms of milestones) {
          if (newAltitudeKm >= ms && !milestonesReachedRef.current.has(ms)) {
            milestonesReachedRef.current.add(ms);
            setMilestone({ text: `🚀 ${ms}km REACHED`, time: 2 });
          }
        }

        if (inOrbitNow && !inOrbit) {
          setInOrbit(true);
          setGameState('orbit');
          setOrbitCelebrationTime(3); // 3 seconds of celebration
          setMilestone({ text: '🌌 ORBIT ACHIEVED!', time: 3 });
        }
      }

      let celebrationShake = 0;
      if (orbitCelebrationTime > 0) {
        const progress = orbitCelebrationTime / 3;
        celebrationShake = Math.sin(orbitCelebrationTime * 8) * (progress > 0.5 ? (1 - progress) * 0.3 : progress * 0.3);
      }

      // Camera shake from thrust or after launch
      const thrustShake = (thrustActiveRef.current && fuelRef.current > 0 ? 0.15 : 0);
      const launchShake = hasLaunchedRef.current && fuelRef.current > 0 ? 0.08 : 0;
      const shakeIntensity = thrustShake + launchShake + celebrationShake;
      cameraShakeRef.current.targetIntensity = shakeIntensity;
      cameraShakeRef.current.intensity += (cameraShakeRef.current.targetIntensity - cameraShakeRef.current.intensity) * 0.15;

      const shakeX = (Math.random() - 0.5) * cameraShakeRef.current.intensity;
      const shakeY = (Math.random() - 0.5) * cameraShakeRef.current.intensity;
      const shakeZ = (Math.random() - 0.5) * cameraShakeRef.current.intensity;

      if (followRocket && rocketRef.current) {
        const ry = rocketRef.current.position.y;
        const targetY = ry + povOffsetRef.current;

        camera.position.y = targetY + shakeY;
        camera.position.z = shakeZ;
        controls.target.y = ry;
      } else {
        camera.position.y += shakeY;
        camera.position.z += shakeZ;
      }

      camera.position.x += shakeX;

      controls.update();

      if (spaceContainerRef.current) {
        spaceContainerRef.current.position.copy(camera.position);
      }

      if (rocketRef.current) {
        baseLight.position.set(rocketRef.current.position.x, rocketRef.current.position.y - 6, rocketRef.current.position.z);
        baseLight.intensity = thrustActiveRef.current ? 1.5 + Math.random() * 1.2 : 0.03;
      }

      if (flameRef.current && smokeRef.current && rocketRef.current) {
        const currentAltitude = Math.max(0, rocketRef.current.position.y - GROUND_LEVEL - ROCKET_SPAWN_Y);
        animateParticles(delta, flameRef.current, smokeRef.current, rocketRef.current.position, velocityRef.current, particleScaleRef.current, thrustActiveRef.current, currentAltitude, thrustPowerRef.current, PARTICLE_SPAWN_Y_OFFSET, { x: rocketRef.current.rotation.x, z: rocketRef.current.rotation.z });
      }

      // Update rocket trail
      if (trailRef.current && rocketRef.current) {
        const trailGeo = trailRef.current.geometry;
        const positions = trailGeo.attributes.position.array as Float32Array;
        const colors = trailGeo.attributes.color.array as Float32Array;

        // Shift positions back and add new position
        for (let i = 2997; i >= 3; i--) {
          positions[i * 3] = positions[(i - 3) * 3];
          positions[i * 3 + 1] = positions[(i - 3) * 3 + 1];
          positions[i * 3 + 2] = positions[(i - 3) * 3 + 2];
          colors[i * 3] = colors[(i - 3) * 3] * 0.98;
          colors[i * 3 + 1] = colors[(i - 3) * 3 + 1] * 0.98;
          colors[i * 3 + 2] = colors[(i - 3) * 3 + 2] * 0.98;
        }

        // Add new rocket position
        positions[0] = rocketRef.current.position.x;
        positions[1] = rocketRef.current.position.y;
        positions[2] = rocketRef.current.position.z;
        colors[0] = 0.9;
        colors[1] = 0.7;
        colors[2] = 0.3;

        trailGeo.attributes.position.needsUpdate = true;
        trailGeo.attributes.color.needsUpdate = true;
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

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keysPressed.current[e.key] = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keysPressed.current[e.key] = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const cleanupPointer = setupPointerControls(onPointerDown, onPointerMove, onPointerUp, onDoubleClick, renderer);
    const cleanupResize = setupResizeListener(camera, renderer);

    return () => {
      cancelAnimationFrame(animId);
      cleanupPointer();
      cleanupResize();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
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
    setInOrbit(false);
    setGameState('ready');
    setPovOffsetY(CAMERA.DEFAULT_POV_OFFSET);
    povOffsetRef.current = CAMERA.DEFAULT_POV_OFFSET;
    milestonesReachedRef.current.clear();
    setMilestone(null);
    hasLaunchedRef.current = false;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />

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



        </div>
      </div>

      <div className="hud-minimal">
        <div className="hud-corner-top-left">
          {(speed / 1000).toFixed(2)} km/s
        </div>
        <div className={`hud-corner-top-right ${fuelPercent > 30 ? 'fuel-good' : 'fuel-low'}`}>
          {fuelPercent.toFixed(0)}%
        </div>
        <div className="hud-corner-bottom-left">
          {(altitude * SCALE_FACTOR).toFixed(0)} km
        </div>
      </div>

    </div>
  );
}
