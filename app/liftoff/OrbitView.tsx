import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface OrbitViewProps {
  altitude: number;
  speed: number;
}

interface InfoPanel {
  type: 'rocket' | 'planet' | null;
  data: any;
}

export function OrbitView({ altitude, speed }: OrbitViewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rocketRef = useRef<THREE.Mesh | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const rocketAngleRef = useRef(0);
  const clockRef = useRef<THREE.Clock | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const [timeScale, setTimeScale] = useState(1);
  const [infoPanel, setInfoPanel] = useState<InfoPanel>({ type: null, data: null });
  const animIdRef = useRef<number | null>(null);
  const angularVelRef = useRef(0);
  const [showSolar, setShowSolar] = useState(false);
  const orbitRadiusRef = useRef(0);
  const planetsRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    
    if (showSolar) {
      camera.position.set(0, 200, 150);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(0, 0, 300);
      camera.lookAt(0, 0, 0);
    }
    
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    if (showSolar) {
      setupSolarSystem(scene, planetsRef);
    } else {
      setupEarthOrbit(scene);
    }

    function setupSolarSystem(scene: THREE.Scene, planetsRef: React.MutableRefObject<any[]>) {
      const sunGeo = new THREE.CircleGeometry(20, 32);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xFDB813 });
      const sun = new THREE.Mesh(sunGeo, sunMat);
      sun.position.z = 0;
      scene.add(sun);

      const planets = [
        { name: 'Mercury', dist: 60, size: 4, color: 0x8C7853, speed: 0.04 },
        { name: 'Venus', dist: 100, size: 7, color: 0xFFC649, speed: 0.015 },
        { name: 'Earth', dist: 150, size: 7, color: 0x4DA6FF, speed: 0.01 },
        { name: 'Mars', dist: 200, size: 5, color: 0xE27B58, speed: 0.008 },
      ];

      planets.forEach(pData => {
        const orbitGeo = new THREE.BufferGeometry();
        const orbitPts: THREE.Vector3[] = [];
        for (let i = 0; i <= 128; i++) {
          const angle = (i / 128) * Math.PI * 2;
          orbitPts.push(new THREE.Vector3(pData.dist * Math.cos(angle), pData.dist * Math.sin(angle), 0));
        }
        orbitGeo.setFromPoints(orbitPts);
        const orbitMat = new THREE.LineBasicMaterial({ color: 0x333333 });
        const orbitLine = new THREE.Line(orbitGeo, orbitMat);
        scene.add(orbitLine);

        const pGeo = new THREE.CircleGeometry(pData.size, 32);
        const pMat = new THREE.MeshBasicMaterial({ color: pData.color });
        const planet = new THREE.Mesh(pGeo, pMat);
        planet.userData = { angle: 0, speed: pData.speed, dist: pData.dist, name: pData.name };
        scene.add(planet);

        planetsRef.current.push(planet);
      });
    }

    function setupEarthOrbit(scene: THREE.Scene) {
      const earthGeometry = new THREE.CircleGeometry(60, 64);
      const earthMaterial = new THREE.MeshBasicMaterial({ color: 0x4DA6FF });
      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      earth.position.z = 0;
      scene.add(earth);
      earthRef.current = earth;

      const orbitRadius = 180;
      orbitRadiusRef.current = orbitRadius;

      const orbitGeometry = new THREE.BufferGeometry();
      const orbitPoints: THREE.Vector3[] = [];
      for (let i = 0; i <= 256; i++) {
        const angle = (i / 256) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(
          orbitRadius * Math.cos(angle),
          orbitRadius * Math.sin(angle),
          0
        ));
      }
      orbitGeometry.setFromPoints(orbitPoints);
      const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbitLine);

      const rocketGeometry = new THREE.BufferGeometry();
      const rocketVertices = new Float32Array([0, 12, 0, -7, -10, 0, 7, -10, 0]);
      rocketGeometry.setAttribute('position', new THREE.BufferAttribute(rocketVertices, 3));
      rocketGeometry.setIndex([0, 1, 2]);
      const rocketMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
      scene.add(rocket);
      rocketRef.current = rocket;

      const G = 6.674e-11;
      const earthMass = 5.972e24;
      const earthRadius = 6.371e6;
      const altitudeMeters = altitude * 1000;
      const orbitalRadiusM = earthRadius + altitudeMeters;
      
      const orbitalVelocity = Math.sqrt((G * earthMass) / orbitalRadiusM);
      const orbitalPeriod = (2 * Math.PI * orbitalRadiusM) / orbitalVelocity;
      const angularVelocity = (2 * Math.PI) / orbitalPeriod;
      
      angularVelRef.current = angularVelocity;
      rocketAngleRef.current = 0;
    }

    clockRef.current = new THREE.Clock();

    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      
      if (!clockRef.current) return;
      const deltaTime = clockRef.current.getDelta();

      if (showSolar) {
        planetsRef.current.forEach(planet => {
          planet.userData.angle += planet.userData.speed * deltaTime * timeScale;
          planet.position.x = planet.userData.dist * Math.cos(planet.userData.angle);
          planet.position.y = planet.userData.dist * Math.sin(planet.userData.angle);
        });
      } else {
        rocketAngleRef.current += angularVelRef.current * deltaTime * timeScale;
        if (rocketAngleRef.current > Math.PI * 2) {
          rocketAngleRef.current -= Math.PI * 2;
        }

        const orbitRadius = orbitRadiusRef.current;
        const rocketX = orbitRadius * Math.cos(rocketAngleRef.current);
        const rocketY = orbitRadius * Math.sin(rocketAngleRef.current);

        if (rocketRef.current) {
          rocketRef.current.position.set(rocketX, rocketY, 0);
          rocketRef.current.rotation.z = rocketAngleRef.current + Math.PI / 2;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    const handleClick = (event: MouseEvent) => {
      if (!cameraRef.current || !sceneRef.current || showSolar) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      const objectsToCheck = [earthRef.current, rocketRef.current].filter(obj => obj !== null) as THREE.Mesh[];
      const intersects = raycasterRef.current.intersectObjects(objectsToCheck);

      if (intersects.length > 0) {
        const clicked = intersects[0].object;

        if (clicked === earthRef.current) {
          setInfoPanel({
            type: 'planet',
            data: {
              name: 'Earth',
              radius: '6,371 km',
              mass: '5.972 × 10²⁴ kg',
            }
          });
        } else if (clicked === rocketRef.current) {
          const linearVelocityMs = angularVelRef.current * orbitRadiusRef.current;
          const linearVelocityKms = linearVelocityMs / 1000;
          const orbitalPeriodMin = (2 * Math.PI) / angularVelRef.current / 60;
          
          setInfoPanel({
            type: 'rocket',
            data: {
              altitude: (altitude * 1).toFixed(0) + ' km',
              angularVelocity: (angularVelRef.current * 1e7).toFixed(4) + ' rad/s',
              linearVelocity: linearVelocityKms.toFixed(2) + ' km/s',
              orbitalPeriod: orbitalPeriodMin.toFixed(1) + ' min',
            }
          });
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (cameraRef.current) {
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [altitude, timeScale, showSolar]);

  return (
    <div className="fixed inset-0 bg-black">
      <div ref={mountRef} className="absolute inset-0" />

      {infoPanel.type && !showSolar && (
        <div className="absolute top-8 left-8 bg-black border border-white text-white p-4 font-mono text-sm max-w-sm z-50">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">
              {infoPanel.type === 'rocket' ? 'ROCKET' : 'EARTH'}
            </h2>
            <button
              onClick={() => setInfoPanel({ type: null, data: null })}
              className="text-white hover:text-gray-400"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(infoPanel.data).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="opacity-70">{key}:</span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-50">
        <button
          onClick={() => setShowSolar(!showSolar)}
          className="px-4 py-2 border-2 border-white text-white font-mono text-sm font-bold hover:bg-white hover:text-black transition-all"
        >
          {showSolar ? 'BACK' : 'WARP'}
        </button>
        <div className="flex gap-2">
          {[1, 2, 10, 100].map(scale => (
            <button
              key={scale}
              onClick={() => setTimeScale(scale)}
              className={`px-4 py-2 border font-mono text-sm font-bold transition-all ${
                timeScale === scale 
                  ? 'border-white bg-white text-black' 
                  : 'border-white/50 text-white/50 hover:border-white hover:text-white'
              }`}
            >
              {scale}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
