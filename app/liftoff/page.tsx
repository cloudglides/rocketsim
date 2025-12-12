"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { setupScene, setupCamera, setupRenderer, setupControls, setupLighting, setupGround, loadRocket } from "./sceneSetup";
import { createFlames, createSmokes, animateParticles } from "./particles";
import { createDiamonds, animateDiamonds } from "./diamonds";
import { calculateAcceleration, updatePhysics, calculateThrust, calculateGravityWithAltitude } from "./physics";
import { setupPointerControls, setupResizeListener, handlePOVDrag, type POVControlState } from "./controls";
import { GROUND_LEVEL, PHYSICS, CAMERA, PARTICLES, ROCKET_SPAWN_Y, PARTICLE_SPAWN_Y_OFFSET, ORBITAL_ALTITUDE, ORBITAL_VELOCITY, SCALE_FACTOR, MAX_SPEED_KMS, SPEED_SHAKE_THRESHOLD, MISSIONS, ORBITAL_INSERT_ALTITUDE_MIN, ORBITAL_INSERT_ALTITUDE_MAX, ORBITAL_INSERT_VELOCITY_MIN, ORBITAL_INSERT_VELOCITY_MAX } from "./constants";
import { createStarfield, createPlanetGlow, createNebulaBackground } from "./space";
import { OrbitView } from "./OrbitView";
import { OrbitSuccess } from "./OrbitSuccess";

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
  const groundRef = useRef<THREE.Mesh | null>(null);


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
  const [orbitMode, setOrbitMode] = useState(false);
  const [gameState, setGameState] = useState<'ready' | 'flying' | 'orbit' | 'crashed'>('ready');
  const [orbitCelebrationTime, setOrbitCelebrationTime] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const hasLaunchedRef = useRef(false);
  const orbitAchievementTimeRef = useRef(0);

  const [thrustPower, setThrustPower] = useState(PHYSICS.THRUST_POWER);
  const [gravity, setGravity] = useState(PHYSICS.GRAVITY);
  const [mass, setMass] = useState(PHYSICS.MASS);
  const [dragCoefficient, setDragCoefficient] = useState(PHYSICS.DRAG_COEFFICIENT);
  const [particleScale, setParticleScale] = useState(PARTICLES.PARTICLE_SCALE);
  const [fuelConsumption, setFuelConsumption] = useState(PHYSICS.FUEL_CONSUMPTION);
  const [povOffsetY, setPovOffsetY] = useState(CAMERA.DEFAULT_POV_OFFSET);

  const [rendererBackend, setRendererBackend] = useState<'WebGPU' | 'WebGL'>('WebGL');
  const [showTitle, setShowTitle] = useState(true);
  const [showMissionSelect, setShowMissionSelect] = useState(false);
  const [currentMission, setCurrentMission] = useState<string>('BEGINNER');
  const [maxAltitudeReached, setMaxAltitudeReached] = useState(0);
  const [missionProgress, setMissionProgress] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const windForceRef = useRef(0);

  const povControlStateRef = useRef<POVControlState>({ isDragging: false, lastPointerY: 0 });
  const bgColorsRef = useRef({
    sky: new THREE.Color(0xffffff),
    space: new THREE.Color(0x000000),
    transition: new THREE.Color(),
  });
  const fogRef = useRef<THREE.Fog | null>(null);
  const trailBufferIndexRef = useRef(0);
  const lastHUDUpdateRef = useRef(0);
  const HUD_UPDATE_INTERVAL = 0.05;
  const tiltInputRef = useRef({ x: 0, z: 0 });
  const [tiltDisplay, setTiltDisplay] = useState({ x: 0, z: 0 });
  const [windDisplay, setWindDisplay] = useState({ x: 0, z: 0 });
  
  const engineTempRef = useRef(0);
  const [engineTemp, setEngineTemp] = useState(0);
  const [engineStatus, setEngineStatus] = useState('OK');
  const malfunctionRef = useRef({ active: false, timeLeft: 0 });
  const [malfunctionAlert, setMalfunctionAlert] = useState('');
  const stageSeparatedRef = useRef(false);
  const [stageSeparated, setStageSeparated] = useState(false);
  const windGustRef = useRef(0);
  const gustTimeRef = useRef(0);
  const [currentMissionConfig, setCurrentMissionConfig] = useState(Object.values(MISSIONS)[0]);
  const [orbitalInsertStatus, setOrbitalInsertStatus] = useState('');
  const [fastForwardActive, setFastForwardActive] = useState(false);
  const [boostActive, setBoostActive] = useState(false);
  const [boostFuel, setBoostFuel] = useState(0);
  const boostFuelRef = useRef(0);
  const [warpActive, setWarpActive] = useState(false);
  const [mathQuestion, setMathQuestion] = useState<{ q: string; answers: number[]; correct: number } | null>(null);
   const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
    const questionTimeRef = useRef(0);
    const nextQuestionTimeRef = useRef(1);
    const [blastMessage, setBlastMessage] = useState('');
    const mathQuestionRef = useRef<{ q: string; answers: number[]; correct: number } | null>(null);

  useEffect(() => { thrustActiveRef.current = thrustActive; }, [thrustActive]);
  useEffect(() => { thrustPowerRef.current = thrustPower; }, [thrustPower]);
  useEffect(() => { gravityRef.current = gravity; }, [gravity]);
  useEffect(() => { massRef.current = mass; }, [mass]);
  useEffect(() => { dragCoefficientRef.current = dragCoefficient; }, [dragCoefficient]);
  useEffect(() => { particleScaleRef.current = particleScale; }, [particleScale]);
  useEffect(() => { fuelConsumptionRef.current = fuelConsumption; }, [fuelConsumption]);
  useEffect(() => { povOffsetRef.current = povOffsetY; }, [povOffsetY]);
  useEffect(() => { mathQuestionRef.current = mathQuestion; }, [mathQuestion]);

  useEffect(() => {
    if (showTitle) {
      return;
    }

    if (sceneInitialized.current) {
      return;
    }
    
    if (!mountRef.current) {
      return;
    }
    
    sceneInitialized.current = true;

    const scene = setupScene();
    sceneRef.current = scene;
    const camera = setupCamera(window.innerWidth, window.innerHeight, povOffsetRef.current);
    const renderer = setupRenderer(mountRef.current);

    if ((renderer as any).webgpuDevice) {
      setRendererBackend('WebGPU');
    } else {
      setRendererBackend('WebGL');
    }

    const controls = setupControls(camera, renderer);
    const baseLight = setupLighting(scene);
    const ground = setupGround(scene);
    groundRef.current = ground;

    const flames = createFlames();
    const smokes = createSmokes();
    flameRef.current = flames;
    smokeRef.current = smokes;
    scene.add(flames);
    scene.add(smokes);

    const diamonds = createDiamonds(scene);
    diamondsRef.current = diamonds;

    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(3000 * 3);
    const trailColors = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      trailPositions[i * 3] = 0;
      trailPositions[i * 3 + 1] = -1000;
      trailPositions[i * 3 + 2] = 0;
      trailColors[i * 3] = 0.3;
      trailColors[i * 3 + 1] = 0.3;
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

    starsRef.current = { stars, nebula };

    loadRocket(scene, GROUND_LEVEL + ROCKET_SPAWN_Y).then((rocket) => {
      rocketRef.current = rocket;
      setSceneReady(true);
    });

    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      let delta = Math.min(clock.getDelta(), 0.05);
      
      if (fastForwardActive) {
        delta *= 2.0;
      }

      if (orbitCelebrationTime > 0) {
        setOrbitCelebrationTime(prev => Math.max(0, prev - delta));
      }

      if (sceneRef.current && starsRef.current && rocketRef.current) {
        const currentAltitude = Math.max(0, rocketRef.current.position.y - GROUND_LEVEL);
        const altitudeKm = currentAltitude * SCALE_FACTOR;

        if (groundRef.current) {
          groundRef.current.visible = altitudeKm < 100;
        }

        if (altitudeKm < 50) {
          sceneRef.current.background = bgColorsRef.current.sky;
          if (!fogRef.current || fogRef.current.color.getHex() !== 0xffffff) {
            fogRef.current = new THREE.Fog(0xffffff, 50, 200);
            sceneRef.current.fog = fogRef.current;
          }
          starsRef.current.stars.visible = false;
          starsRef.current.nebula.visible = false;
        } else if (altitudeKm < 100) {
          const ratio = (altitudeKm - 50) / 50;
          const r = Math.round(0xff * (1 - ratio) + 0x0a * ratio);
          const g = Math.round(0xff * (1 - ratio) + 0x0a * ratio);
          const b = Math.round(0xff * (1 - ratio) + 0x1a * ratio);
          const color = (r << 16) | (g << 8) | b;
          bgColorsRef.current.transition.setHex(color);
          sceneRef.current.background = bgColorsRef.current.transition;
          if (!fogRef.current || fogRef.current.color.getHex() !== color) {
            fogRef.current = new THREE.Fog(color, 50, 200);
            sceneRef.current.fog = fogRef.current;
          }
          starsRef.current.stars.visible = false;
          starsRef.current.nebula.visible = false;
        } else if (altitudeKm < 500) {
          const ratio = (altitudeKm - 100) / 400;
          const r = Math.round(0x0a * (1 - ratio) + 0x00 * ratio);
          const g = Math.round(0x0a * (1 - ratio) + 0x00 * ratio);
          const b = Math.round(0x1a * (1 - ratio) + 0x05 * ratio);
          const color = (r << 16) | (g << 8) | b;
          bgColorsRef.current.transition.setHex(color);
          sceneRef.current.background = bgColorsRef.current.transition;
          sceneRef.current.fog = null;
          starsRef.current.stars.visible = true;
          starsRef.current.nebula.visible = true;
          const starFadeRatio = ratio;
          (starsRef.current.stars.material as THREE.PointsMaterial).opacity = starFadeRatio * 0.3;
          (starsRef.current.nebula.material as THREE.PointsMaterial).opacity = starFadeRatio * 0.15;
        } else {
          sceneRef.current.background = bgColorsRef.current.space;
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
        const altitudeKm = currentAltitude * SCALE_FACTOR;

        gustTimeRef.current += delta;
        const gustWave = Math.sin(gustTimeRef.current * 1.2) * Math.cos(gustTimeRef.current * 0.7);
        windGustRef.current = gustWave * currentMissionConfig.wind;



        if (currentMissionConfig.enableMalfunction) {
          if (malfunctionRef.current.active) {
            malfunctionRef.current.timeLeft -= delta;
            if (malfunctionRef.current.timeLeft <= 0) {
              malfunctionRef.current.active = false;
              setMalfunctionAlert('');
            }
          } else if (thrustActiveRef.current && Math.random() < PHYSICS.MALFUNCTION_CHANCE * delta) {
            malfunctionRef.current.active = true;
            malfunctionRef.current.timeLeft = PHYSICS.MALFUNCTION_DURATION;
            setMalfunctionAlert('ENGINE CUT!');
            setTimeout(() => setMalfunctionAlert(''), 500);
          }
        }

        if (currentMissionConfig.enableStaging && !stageSeparatedRef.current && altitudeKm > 100 && thrustActiveRef.current) {
          stageSeparatedRef.current = true;
          setStageSeparated(true);
          massRef.current -= PHYSICS.STAGE1_FUEL;
          fuelRef.current = PHYSICS.STAGE2_FUEL;
        }

        if (boostActive && boostFuelRef.current > 0) {
          boostFuelRef.current -= delta * 10;
          fuelRef.current -= delta * 2;
          if (boostFuelRef.current <= 0) {
            boostFuelRef.current = 0;
            setBoostActive(false);
          }
          setBoostFuel(Math.max(0, boostFuelRef.current));
        }

        let thrustMultiplier = boostActive ? 1.8 : 1.0;

        if (malfunctionRef.current.active) {
          thrustMultiplier *= 0.0;
        }

        const thrust = calculateThrust(thrustActiveRef.current, thrustPowerRef.current * thrustMultiplier, fuelRef.current);
        const altitudeGravity = calculateGravityWithAltitude(gravityRef.current, currentAltitude);
        
        let dragMult = 1.0;
        if (altitudeKm < 50) dragMult = 2.0;
        else if (altitudeKm < 100) dragMult = 1.5;
        else if (altitudeKm < 300) dragMult = 1.2;
        const acceleration = calculateAcceleration({
          thrust,
          gravity: altitudeGravity,
          dragCoefficient: dragCoefficientRef.current * dragMult,
          mass: massRef.current,
          fuel: fuelRef.current,
          velocity: velocityRef.current,
        });

        let fuelConsumption = fuelConsumptionRef.current;
         if (fastForwardActive) fuelConsumption *= 2.0;
         if (boostActive) fuelConsumption *= 1.5;

         const physicsUpdate = updatePhysics(
           velocityRef.current,
           acceleration,
           rocket.position.y,
           delta,
           fuelConsumption,
           thrustActiveRef.current,
           fuelRef.current
         );

         velocityRef.current = physicsUpdate.newVelocity;
         fuelRef.current = unlimitedFuel ? PHYSICS.INITIAL_FUEL : physicsUpdate.newFuel;

        const rotationSpeed = 0.45;
        const rotationDamping = 0.68;
        const maxRotation = Math.PI / 1.8;

        rocket.rotation.x += tiltInputRef.current.x * 0.08;
        rocket.rotation.z += tiltInputRef.current.z * 0.08;
        rocket.rotation.x = Math.max(-maxRotation, Math.min(maxRotation, rocket.rotation.x));
        rocket.rotation.z = Math.max(-maxRotation, Math.min(maxRotation, rocket.rotation.z));
        rocket.rotation.y = 0;

        setTiltDisplay({ x: Math.round(rocket.rotation.x * 100) / 100, z: Math.round(rocket.rotation.z * 100) / 100 });

        let thrustDirectionX = Math.sin(rocket.rotation.x);
        let thrustDirectionY = -Math.cos(rocket.rotation.z);
        let thrustDirectionZ = Math.sin(rocket.rotation.z);

        const thrustLen = Math.sqrt(thrustDirectionX * thrustDirectionX + thrustDirectionY * thrustDirectionY + thrustDirectionZ * thrustDirectionZ);
        if (thrustLen > 0) {
          thrustDirectionX /= thrustLen;
          thrustDirectionY /= thrustLen;
          thrustDirectionZ /= thrustLen;
        }

        const currentMass = massRef.current + fuelRef.current * 5;
        const thrustMagnitude = thrust / (currentMass / 1000);

        const heavyDrag = 0.75;
        const spaceDrag = 0.95;
        const atmosphericDrag = altitudeKm < 100 ? heavyDrag : spaceDrag;

        const dragDamping = Math.max(0.3, 1 - dragCoefficientRef.current * 100);
        lateralVelocityXRef.current *= atmosphericDrag * dragDamping;
        lateralVelocityZRef.current *= atmosphericDrag * dragDamping;

        const maxLateralVel = 15;
        lateralVelocityXRef.current = Math.max(-maxLateralVel, Math.min(maxLateralVel, lateralVelocityXRef.current));
        lateralVelocityZRef.current = Math.max(-maxLateralVel, Math.min(maxLateralVel, lateralVelocityZRef.current));

        const effectiveWindX = windGustRef.current;
        const effectiveWindZ = windGustRef.current * 0.5;
        
        lateralVelocityXRef.current += thrustDirectionX * thrustMagnitude * delta * 200 + effectiveWindX * delta * 30;
        lateralVelocityZRef.current += thrustDirectionZ * thrustMagnitude * delta * 200 + effectiveWindZ * delta * 30;
        velocityRef.current += (-thrustDirectionY * thrustMagnitude - altitudeGravity * 1.2) * delta * 85;
        
        setWindDisplay({ x: Math.round(effectiveWindX * 100) / 100, z: Math.round(effectiveWindZ * 100) / 100 });

        if (!mathQuestionRef.current) {
          rocket.position.x += lateralVelocityXRef.current * delta * 60;
          rocket.position.z += lateralVelocityZRef.current * delta * 60;
          rocket.position.y += velocityRef.current * delta * 60;

          if (rocket.position.y <= GROUND_LEVEL) {
            rocket.position.y = GROUND_LEVEL;
            if (velocityRef.current < 0) {
              velocityRef.current = 0;
            }
          }
        }

        const newAltitude = Math.round(Math.max(0, rocket.position.y - GROUND_LEVEL) * 10) / 10;
        const totalVelocityMagnitude = Math.sqrt(
          velocityRef.current * velocityRef.current +
          lateralVelocityXRef.current * lateralVelocityXRef.current +
          lateralVelocityZRef.current * lateralVelocityZRef.current
        );
        const newSpeed = Math.round(Math.abs(totalVelocityMagnitude) * 1000) / 10;
        const newFuelPercent = Math.round(fuelRef.current * 10) / 10;

        const newAltitudeKm = newAltitude * SCALE_FACTOR;
        
        lastHUDUpdateRef.current += delta;
        if (lastHUDUpdateRef.current >= HUD_UPDATE_INTERVAL) {
          setAltitude(newAltitude);
          setSpeed(newSpeed);
          setFuelPercent(newFuelPercent);
          setMaxAltitudeReached(Math.max(maxAltitudeReached, newAltitude * SCALE_FACTOR));
          const missionDef = Object.values(MISSIONS).find(m => m.name === currentMission);
          if (missionDef) {
            const progress = (newAltitudeKm / missionDef.target) * 100;
            setMissionProgress(progress);
            
            if (progress >= 100 && gameState === 'flying') {
              setInOrbit(true);
              setGameState('orbit');
              setFadeOut(true);
              setTimeout(() => {
                setOrbitMode(true);
              }, 1200);
            }
          }
          lastHUDUpdateRef.current = 0;
        }
        const speedKmS = totalVelocityMagnitude * SCALE_FACTOR;
        
        if (currentMissionConfig.enablePrecisionOrbit) {
          if (newAltitudeKm >= ORBITAL_INSERT_ALTITUDE_MIN && newAltitudeKm <= ORBITAL_INSERT_ALTITUDE_MAX &&
              speedKmS >= ORBITAL_INSERT_VELOCITY_MIN && speedKmS <= ORBITAL_INSERT_VELOCITY_MAX) {
            setOrbitalInsertStatus('PERFECT INSERTION');
          } else if (newAltitudeKm >= 950 && newAltitudeKm <= 1050) {
            setOrbitalInsertStatus(`ALT: ${newAltitudeKm.toFixed(0)}km | VEL: ${speedKmS.toFixed(1)}km/s`);
          } else {
            setOrbitalInsertStatus('');
          }
        }

        const inOrbitNow = currentMissionConfig.enablePrecisionOrbit ? 
          (newAltitudeKm >= ORBITAL_INSERT_ALTITUDE_MIN && newAltitudeKm <= ORBITAL_INSERT_ALTITUDE_MAX &&
           speedKmS >= ORBITAL_INSERT_VELOCITY_MIN && speedKmS <= ORBITAL_INSERT_VELOCITY_MAX) :
          (newAltitudeKm >= 1000);

        const inAtmosphere = newAltitudeKm < 100;
        const dragScaleFactor = Math.max(0.5, 1 - dragCoefficientRef.current * 5000);
        const crashThreshold = MAX_SPEED_KMS * dragScaleFactor;

        if (inAtmosphere && speedKmS > crashThreshold && gameState === 'flying') {
          setGameState('crashed');
          thrustActiveRef.current = false;
        }

        if (thrustActiveRef.current && !hasLaunchedRef.current) {
          hasLaunchedRef.current = true;
          setGameState('flying');
        }
      }

      let celebrationShake = 0;
      if (orbitCelebrationTime > 0) {
        const progress = orbitCelebrationTime / 3;
        celebrationShake = Math.sin(orbitCelebrationTime * 8) * (progress > 0.5 ? (1 - progress) * 0.3 : progress * 0.3);
      }

      if (mathQuestionRef.current) {
         questionTimeRef.current = Math.max(0, questionTimeRef.current - delta);
         setQuestionTimeLeft(questionTimeRef.current);
         
         if (questionTimeRef.current <= 0) {
           questionTimeRef.current = 0;
           setMathQuestion(null);
           setQuestionTimeLeft(0);
           thrustActiveRef.current = false;
           setThrustActive(false);
           velocityRef.current *= 0.3;
           fuelRef.current = Math.max(0, fuelRef.current - 20);
           setFuelPercent(fuelRef.current);
           setBlastMessage('ROCKET BLASTED');
           setTimeout(() => setBlastMessage(''), 1500);
           nextQuestionTimeRef.current = Math.random() * 5 + 5;
         }
       } else if (gameState !== 'orbit' && !orbitMode && hasLaunchedRef.current && nextQuestionTimeRef.current > 0) {
         nextQuestionTimeRef.current -= delta;
         if (nextQuestionTimeRef.current <= 0) {
           nextQuestionTimeRef.current = 0;
           generateMathQuestion();
         }
       }

      if (mathQuestionRef.current) {
         thrustActiveRef.current = false;
         setThrustActive(false);
       }

      let dragShake = 0;

       const thrustShake = (thrustActiveRef.current && fuelRef.current > 0 ? 0.15 : 0);
        const launchShake = hasLaunchedRef.current && fuelRef.current > 0 ? 0.08 : 0;
        const shakeIntensity = thrustShake + launchShake + celebrationShake + Math.abs(dragShake);
      cameraShakeRef.current.targetIntensity = shakeIntensity;
      cameraShakeRef.current.intensity += (cameraShakeRef.current.targetIntensity - cameraShakeRef.current.intensity) * 0.15;

      const shakeTime = performance.now() * 0.003;
      const shakeX = Math.sin(shakeTime) * cameraShakeRef.current.intensity;
      const shakeY = Math.sin(shakeTime + 1.5) * cameraShakeRef.current.intensity;
      const shakeZ = Math.sin(shakeTime + 3.0) * cameraShakeRef.current.intensity;

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
        const flicker = thrustActiveRef.current ? Math.sin(performance.now() * 0.005) * 0.3 + 0.8 : 0.2;
        baseLight.intensity = flicker;
      }

      if (flameRef.current && smokeRef.current && rocketRef.current) {
        const currentAltitude = Math.max(0, rocketRef.current.position.y - GROUND_LEVEL - ROCKET_SPAWN_Y);
        animateParticles(delta, flameRef.current, smokeRef.current, rocketRef.current.position, velocityRef.current, particleScaleRef.current, thrustActiveRef.current, currentAltitude, thrustPowerRef.current, PARTICLE_SPAWN_Y_OFFSET, { x: rocketRef.current.rotation.x, z: rocketRef.current.rotation.z });
      }

      if (trailRef.current && rocketRef.current) {
        const trailGeo = trailRef.current.geometry;
        const positions = trailGeo.attributes.position.array as Float32Array;
        const colors = trailGeo.attributes.color.array as Float32Array;
        const TRAIL_SIZE = 3000;

        const idx = trailBufferIndexRef.current;
        positions[idx * 3] = rocketRef.current.position.x;
        positions[idx * 3 + 1] = rocketRef.current.position.y;
        positions[idx * 3 + 2] = rocketRef.current.position.z;
        colors[idx * 3] = 0.2;
        colors[idx * 3 + 1] = 0.2;
        colors[idx * 3 + 2] = 0.2;

        const fadeIdx = (idx + 1) % TRAIL_SIZE;
        colors[fadeIdx * 3] *= 0.98;
        colors[fadeIdx * 3 + 1] *= 0.98;
        colors[fadeIdx * 3 + 2] *= 0.98;

        trailBufferIndexRef.current = (idx + 1) % TRAIL_SIZE;
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

    const generateMathQuestion = () => {
       let num1, num2, op, correct, wrong1, wrong2;
       
       if (currentMissionConfig.difficulty === 1) {
         num1 = Math.floor(Math.random() * 15) + 1;
         num2 = Math.floor(Math.random() * 15) + 1;
         op = '+';
         correct = num1 + num2;
         wrong1 = correct + Math.floor(Math.random() * 10) + 1;
         wrong2 = Math.max(1, correct - Math.floor(Math.random() * 10) - 1);
       } else if (currentMissionConfig.difficulty === 2) {
         num1 = Math.floor(Math.random() * 12) + 2;
         num2 = Math.floor(Math.random() * 12) + 2;
         op = Math.random() > 0.5 ? '*' : '/';
         if (op === '*') {
           correct = num1 * num2;
           wrong1 = correct + Math.floor(Math.random() * 20) + 2;
           wrong2 = Math.max(1, correct - Math.floor(Math.random() * 20) - 2);
         } else {
           num1 = Math.floor(Math.random() * 100) + 10;
           num2 = Math.floor(Math.random() * 10) + 2;
           correct = Math.floor(num1 / num2);
           wrong1 = correct + Math.floor(Math.random() * 10) + 1;
           wrong2 = Math.max(0, correct - Math.floor(Math.random() * 10) - 1);
         }
       } else {
         const operations = ['+', '-', '*', '/'];
         op = operations[Math.floor(Math.random() * operations.length)];
         num1 = Math.floor(Math.random() * 50) + 10;
         num2 = Math.floor(Math.random() * 20) + 5;
         
         if (op === '+') correct = num1 + num2;
         else if (op === '-') correct = num1 - num2;
         else if (op === '*') correct = num1 * num2;
         else correct = Math.floor(num1 / num2);
         
         wrong1 = correct + Math.floor(Math.random() * 50) + 5;
         wrong2 = Math.max(0, correct - Math.floor(Math.random() * 50) - 5);
       }
       
       const answers = [correct, wrong1, wrong2].sort(() => Math.random() - 0.5);
       setMathQuestion({
         q: `${num1} ${op} ${num2}`,
         answers,
         correct
       });
       questionTimeRef.current = 8;
       setQuestionTimeLeft(8);
     };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!mathQuestion && gameState !== 'orbit' && !orbitMode) {
          generateMathQuestion();
        }
      }
      if ((e.key === 'w' || e.key === 'W') && !gameState.includes('crashed')) {
        if (e.shiftKey) {
          if (rocketRef.current && altitude * SCALE_FACTOR > 400 && fuelRef.current > 25) {
            const currentAlt = altitude * SCALE_FACTOR;
            const targetAlt = Math.min(currentAlt + 250, 1100);
            rocketRef.current.position.y = GROUND_LEVEL + (targetAlt / SCALE_FACTOR);
            velocityRef.current *= 1.3;
            fuelRef.current -= 25;
          }
        } else {
          tiltInputRef.current.x = Math.max(-1, tiltInputRef.current.x - 0.1);
        }
      }
      if (e.key === 's' || e.key === 'S') tiltInputRef.current.x = Math.min(1, tiltInputRef.current.x + 0.1);
      if (e.key === 'a' || e.key === 'A') tiltInputRef.current.z = Math.max(-1, tiltInputRef.current.z - 0.1);
      if (e.key === 'd' || e.key === 'D') tiltInputRef.current.z = Math.min(1, tiltInputRef.current.z + 0.1);
      if (e.key === 'f' || e.key === 'F') setFastForwardActive(!fastForwardActive);
      if (e.key === 'b' || e.key === 'B') {
        if (fuelRef.current > 20) {
          setBoostActive(true);
          boostFuelRef.current = 15;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') tiltInputRef.current.x = 0;
      if (e.key === 's' || e.key === 'S') tiltInputRef.current.x = 0;
      if (e.key === 'a' || e.key === 'A') tiltInputRef.current.z = 0;
      if (e.key === 'd' || e.key === 'D') tiltInputRef.current.z = 0;
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
  }, [showTitle, showMissionSelect]);

  const handleReset = () => {
    if (rocketRef.current) rocketRef.current.position.set(0, GROUND_LEVEL + ROCKET_SPAWN_Y, 0);
    velocityRef.current = 0;
    lateralVelocityXRef.current = 0;
    lateralVelocityZRef.current = 0;
    fuelRef.current = currentMissionConfig.fuel;
    setAltitude(0);
    setSpeed(0);
    setFuelPercent(currentMissionConfig.fuel);
    setThrustActive(false);
    setInOrbit(false);
    setGameState('ready');
    setOrbitMode(false);
    setPovOffsetY(CAMERA.DEFAULT_POV_OFFSET);
    povOffsetRef.current = CAMERA.DEFAULT_POV_OFFSET;
    hasLaunchedRef.current = false;
    setFadeOut(false);
    setMissionProgress(0);
    engineTempRef.current = 0;
    setEngineTemp(0);
    setEngineStatus('OK');
    malfunctionRef.current = { active: false, timeLeft: 0 };
    setMalfunctionAlert('');
    stageSeparatedRef.current = false;
    setStageSeparated(false);
    setOrbitalInsertStatus('');
    tiltInputRef.current = { x: 0, z: 0 };
    setTiltDisplay({ x: 0, z: 0 });
    setFastForwardActive(false);
    setBoostActive(false);
    boostFuelRef.current = 0;
    setBoostFuel(0);
    setWarpActive(false);
    setMathQuestion(null);
    setQuestionTimeLeft(0);
    questionTimeRef.current = 0;
    nextQuestionTimeRef.current = 0;
  };

  if (showTitle && !showMissionSelect) {
    const handleContinueClick = () => {
      setShowMissionSelect(true);
    };

    return (
      <div className="title-screen" style={{ pointerEvents: 'all' }}>
        <div className="title-content">
          <div className="title-text">LIFTOFF</div>
          <div className="title-subtitle">ROCKET SIMULATOR</div>
          <div style={{ fontSize: '11px', lineHeight: '1.8', marginTop: '32px', maxWidth: '400px', letterSpacing: '0.5px', opacity: 0.7 }}>
            REACH ORBITAL ALTITUDE (1000 KM) WITH LIMITED FUEL<br/><br/>
            SPACE = THROTTLE<br/>
            DRAG TO ADJUST POV<br/>
            DOUBLE CLICK TO RESET VIEW<br/><br/>
            MANAGE YOUR ROCKET TO ACHIEVE ORBIT
          </div>
        </div>
        <button 
          type="button"
          onClick={handleContinueClick}
          onMouseDown={handleContinueClick}
          style={{
            padding: '12px 28px',
            border: '1px solid black',
            background: '#ffffff',
            color: '#000000',
            fontSize: '11px',
            fontWeight: 400,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
            marginTop: '16px',
            position: 'relative',
            zIndex: 101,
            pointerEvents: 'auto',
            outline: 'none',
            display: 'block'
          }}
        >
          START
        </button>
      </div>
    );
  }

  if (showTitle && showMissionSelect) {
    const handleMissionSelect = (missionName: string) => {
      const mission = Object.values(MISSIONS).find(m => m.name === missionName);
      if (mission) {
        fuelRef.current = mission.fuel;
        setFuelPercent(mission.fuel);
        gravityRef.current = mission.gravity;
        setGravity(mission.gravity);
        windForceRef.current = mission.wind;
        setCurrentMissionConfig(mission);
        stageSeparatedRef.current = false;
        setStageSeparated(false);
        engineTempRef.current = 0;
        setEngineTemp(0);
        malfunctionRef.current = { active: false, timeLeft: 0 };
      }
      setCurrentMission(missionName);
      setShowTitle(false);
      setShowMissionSelect(false);
    };

    return (
      <div className="title-screen" style={{ pointerEvents: 'all' }}>
        <div className="title-content">
          <div className="title-text">SELECT MISSION</div>
          <div style={{ fontSize: '11px', lineHeight: '2.2', marginTop: '32px', letterSpacing: '1px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.values(MISSIONS).map(mission => (
              <button
                type="button"
                key={mission.name}
                onClick={() => handleMissionSelect(mission.name)}
                style={{
                  padding: '16px 32px',
                  border: '1px solid black',
                  background: currentMission === mission.name ? '#000000' : '#ffffff',
                  color: currentMission === mission.name ? '#ffffff' : '#000000',
                  fontSize: '12px',
                  fontWeight: 400,
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  fontFamily: "'Courier New', monospace",
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  zIndex: 101,
                  pointerEvents: 'auto'
                }}
              >
                <div style={{ marginBottom: '8px' }}>{mission.name}</div>
                <div style={{ fontSize: '10px', opacity: 0.7 }}>{mission.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" style={{ zIndex: 10, display: showTitle ? 'none' : 'block' }} />
      
      {gameState === 'orbit' && orbitMode ? (
        <OrbitSuccess
          altitude={altitude}
          speed={speed}
          onReset={handleReset}
          mission={currentMission}
        />
      ) : orbitMode ? (
        <OrbitView
          altitude={altitude}
          speed={speed}
        />
      ) : null}

      {!orbitMode && <div className="controls-box">
         <button
           onClick={handleReset}
           className="control-btn reset-btn"
           type="button"
         >
           Reset
         </button>
         <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '12px', letterSpacing: '0.5px', lineHeight: '1.6' }}>
           SPACE = SOLVE MATH<br/>
           W/S = PITCH<br/>
           A/D = ROLL<br/>
           DRAG = LOOK<br/>
           <span style={{ marginTop: '8px', display: 'block', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '8px' }}>
           F = 2X SPEED<br/>
           B = BOOST (15 fuel)<br/>
           SHIFT+W = WARP (25 fuel)
           </span>
         </div>
       </div>}

      {!orbitMode && <div className="wind-indicator">
        <div>WIND</div>
        <div className="wind-arrow">
          {windDisplay.x > 0.5 ? '→' : windDisplay.x < -0.5 ? '←' : '↕'}
        </div>
        <div style={{ fontSize: '8px', marginTop: '4px', opacity: 0.8 }}>
          {Math.abs(windDisplay.x).toFixed(2)}
        </div>
      </div>}

      {!orbitMode && <div className="tilt-indicator">
        PITCH: {tiltDisplay.x.toFixed(2)} | ROLL: {tiltDisplay.z.toFixed(2)}
      </div>}

      {!orbitMode && <div className="config-box">
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
      </div>}

      {!orbitMode && <div className="hud-minimal">
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          letterSpacing: '1px',
          color: '#ffffff',
          fontFamily: "'Courier New', monospace",
          textAlign: 'center',
          borderBottom: '1px solid #ffffff',
          paddingBottom: '8px',
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '8px 16px 8px 16px'
        }}>
          {currentMission} MISSION<br/>
          <span style={{ fontSize: '10px', opacity: 0.8 }}>PROGRESS: {Math.min(100, missionProgress).toFixed(0)}%</span>
        </div>
        

        {malfunctionAlert && (
          <div style={{
            position: 'absolute',
            top: '140px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '11px',
            letterSpacing: '1px',
            color: '#ff0000',
            fontFamily: "'Courier New', monospace",
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '8px 16px',
            border: '1px solid #ff0000',
            animation: 'pulse 0.2s ease-in-out'
          }}>
            {malfunctionAlert}
          </div>
        )}
        
        {currentMissionConfig.enableStaging && (
           <div style={{
             position: 'absolute',
             top: '170px',
             left: '50%',
             transform: 'translateX(-50%)',
             fontSize: '9px',
             letterSpacing: '0.5px',
             color: stageSeparated ? '#000000' : '#000000',
             fontFamily: "'Courier New', monospace",
             background: 'rgba(255, 255, 255, 0.85)',
             padding: '4px 10px',
             opacity: stageSeparated ? 1 : 0.6
           }}>
             STAGE: {stageSeparated ? 'SEPARATED' : 'ATTACHED'}
           </div>
         )}
        
        {currentMissionConfig.enablePrecisionOrbit && orbitalInsertStatus && (
          <div style={{
            position: 'absolute',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            letterSpacing: '0.5px',
            color: '#000000',
            fontFamily: "'Courier New', monospace",
            background: 'rgba(255, 255, 255, 0.85)',
            padding: '6px 12px',
            border: '1px solid #000000'
          }}>
            {orbitalInsertStatus}
          </div>
        )}
        
        {boostActive && (
          <div style={{
            position: 'absolute',
            bottom: '140px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '12px',
            letterSpacing: '1px',
            color: '#ffff00',
            fontFamily: "'Courier New', monospace",
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '8px 16px',
            border: '2px solid #ffff00',
            animation: 'pulse 0.3s ease-in-out'
          }}>
            ⚡ BOOST! ({boostFuel.toFixed(1)})
          </div>
        )}
        
        {fastForwardActive && (
          <div style={{
            position: 'absolute',
            bottom: '180px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '11px',
            letterSpacing: '1px',
            color: '#ff6600',
            fontFamily: "'Courier New', monospace",
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '6px 14px',
            border: '1px solid #ff6600'
          }}>
            ⏩ 2X SPEED
          </div>
        )}
        
        {mathQuestion && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            pointerEvents: 'auto'
          }}>
            <div style={{
              fontSize: '28px',
              letterSpacing: '2px',
              color: '#ffffff',
              fontFamily: "'Courier New', monospace",
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              SOLVE
            </div>
            <div style={{
              fontSize: '72px',
              letterSpacing: '2px',
              color: questionTimeLeft <= 3 ? '#ff0000' : '#ffffff',
              fontFamily: "'Courier New', monospace",
              marginBottom: '40px',
              textAlign: 'center',
              fontWeight: 'bold',
              textShadow: questionTimeLeft <= 3 ? '0 0 20px #ff0000' : 'none'
            }}>
              {Math.ceil(questionTimeLeft)}
            </div>
            <div style={{
              fontSize: '56px',
              letterSpacing: '2px',
              color: '#ffffff',
              fontFamily: "'Courier New', monospace",
              marginBottom: '80px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {mathQuestion.q}
            </div>
            <div style={{
              display: 'flex',
              gap: '30px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {mathQuestion.answers.map((ans, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (ans === mathQuestion.correct) {
                      questionTimeRef.current = 0;
                      fuelRef.current = Math.min(currentMissionConfig.fuel, fuelRef.current + 30);
                      setFuelPercent(fuelRef.current);
                      setMathQuestion(null);
                      setQuestionTimeLeft(0);
                      setThrustActive(true);
                      thrustActiveRef.current = true;
                      nextQuestionTimeRef.current = Math.random() * 5 + 5;
                    } else {
                       questionTimeRef.current = 0;
                       fuelRef.current = Math.max(0, fuelRef.current - 100);
                       setFuelPercent(fuelRef.current);
                       setMathQuestion(null);
                       setQuestionTimeLeft(0);
                       setThrustActive(false);
                       thrustActiveRef.current = false;
                       velocityRef.current = Math.max(0, velocityRef.current * 0.2);
                       nextQuestionTimeRef.current = Math.random() * 5 + 5;
                     }
                  }}
                  style={{
                    padding: '24px 48px',
                    fontSize: '36px',
                    fontFamily: "'Courier New', monospace",
                    background: '#ffffff',
                    color: '#000000',
                    border: '2px solid #000000',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    letterSpacing: '2px',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = '#000000';
                    (e.target as HTMLElement).style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = '#ffffff';
                    (e.target as HTMLElement).style.color = '#000000';
                  }}
                >
                  {ans}
                </button>
              ))}
            </div>
          </div>
          )}
          
          {blastMessage && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '64px',
            fontWeight: 'bold',
            color: '#ff0000',
            fontFamily: "'Courier New', monospace",
            textAlign: 'center',
            zIndex: 500,
            textShadow: '0 0 20px #ff0000'
          }}>
            {blastMessage}
          </div>
          )}
          
          <div className="hud-corner-top-left">
           <div style={{ color: '#000000' }}>V {(speed / 1000).toFixed(2)}</div><br/>
           <div style={{ color: '#000000' }}>KM/S</div>
         </div>
         <div className={`hud-corner-top-right ${fuelPercent > 30 ? 'fuel-good' : 'fuel-low'}`}>
           <div style={{ color: '#000000' }}>F {fuelPercent.toFixed(0)}</div><br/>
           <div style={{ color: '#000000' }}>%</div>
         </div>
         <div className="hud-corner-bottom-left">
           <div style={{ color: '#000000' }}>A {(altitude * SCALE_FACTOR).toFixed(0)}</div><br/>
           <div style={{ color: '#000000' }}>KM</div>
         </div>
        <div className="hud-altitude-meter">
          <span>ALT</span>
          <div className="altitude-bar">
            <div 
              className="altitude-fill"
              style={{height: `${Math.min(100, (altitude * SCALE_FACTOR) / 1000 * 100)}%`}}
            />
          </div>
        </div>
        <div style={{
           position: 'absolute',
           top: '50%',
           left: '50%',
           transform: 'translateX(-50%)',
           fontSize: '12px',
           letterSpacing: '1px',
           color: '#000000',
           fontFamily: "'Courier New', monospace",
           pointerEvents: 'none',
           background: 'rgba(255, 255, 255, 0.85)',
           padding: '12px 24px',
           border: '1px solid #000000'
         }}>
           {altitude * SCALE_FACTOR < 100 && 'ATMOSPHERE'}
           {altitude * SCALE_FACTOR >= 100 && altitude * SCALE_FACTOR < 500 && 'LEAVING ATMOSPHERE'}
           {altitude * SCALE_FACTOR >= 500 && altitude * SCALE_FACTOR < 1000 && 'NEAR ORBIT'}
           {altitude * SCALE_FACTOR >= 1000 && 'ORBITAL INSERTION'}
         </div>
      </div>}

      {fadeOut && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#000000',
          animation: 'fadeInToBlack 1.2s ease-in forwards',
          zIndex: 40,
          pointerEvents: 'none'
        }} />
      )}

      <style jsx>{`
        @keyframes fadeInToBlack {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
