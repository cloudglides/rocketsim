import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface OrbitScreenProps {
  altitude: number;
  speed: number;
  onContinue: () => void;
}

export function OrbitScreen({ altitude, speed, onContinue }: OrbitScreenProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rocketRef = useRef<THREE.Mesh | null>(null);
  const orbitAngleRef = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;


    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;


    const camera = new THREE.OrthographicCamera(
      -150, 150, 150, -150, 0.1, 1000
    );
    camera.position.z = 200;
    cameraRef.current = camera;


    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;


    const starCount = 500;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 600;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 600;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 600;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);


    const earthGeometry = new THREE.CircleGeometry(50, 64);
    const earthMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.z = -10;
    scene.add(earth);


    const earthGridCanvas = document.createElement('canvas');
    earthGridCanvas.width = 256;
    earthGridCanvas.height = 256;
    const ctx = earthGridCanvas.getContext('2d')!;
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(128, 128, (i + 1) * 50, 0, Math.PI * 2);
      ctx.stroke();
    }


    const glowGeometry = new THREE.BufferGeometry();
    const glowPositions = new Float32Array(65 * 3);
    for (let i = 0; i < 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      glowPositions[i * 3] = Math.cos(angle) * 52;
      glowPositions[i * 3 + 1] = Math.sin(angle) * 52;
      glowPositions[i * 3 + 2] = -9;
    }
    glowPositions[64 * 3] = glowPositions[0];
    glowPositions[64 * 3 + 1] = glowPositions[1];
    glowPositions[64 * 3 + 2] = glowPositions[2];
    glowGeometry.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));
    const glowMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const glowLine = new THREE.Line(glowGeometry, glowMaterial);
    scene.add(glowLine);


    const orbitGeometry = new THREE.BufferGeometry();
    const orbitRadius = 80;
    const orbitPositions = new Float32Array(65 * 3);
    for (let i = 0; i < 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      orbitPositions[i * 3] = Math.cos(angle) * orbitRadius;
      orbitPositions[i * 3 + 1] = Math.sin(angle) * orbitRadius;
      orbitPositions[i * 3 + 2] = -8;
    }
    orbitPositions[64 * 3] = orbitPositions[0];
    orbitPositions[64 * 3 + 1] = orbitPositions[1];
    orbitPositions[64 * 3 + 2] = orbitPositions[2];
    orbitGeometry.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbitLine);


    const rocketGeometry = new THREE.BufferGeometry();
    const rocketVertices = new Float32Array([
      0, 3, 0,
      -1.5, -2, 0,
      1.5, -2, 0,
    ]);
    rocketGeometry.setAttribute('position', new THREE.BufferAttribute(rocketVertices, 3));
    rocketGeometry.setIndex([0, 1, 2]);
    const rocketMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
    rocketRef.current = rocket;
    scene.add(rocket);


    const rocketOutlineGeometry = new THREE.BufferGeometry();
    rocketOutlineGeometry.setAttribute('position', new THREE.BufferAttribute(rocketVertices, 3));
    rocketOutlineGeometry.setIndex([0, 1, 1, 2, 2, 0]);
    const rocketOutlineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const rocketOutline = new THREE.LineSegments(rocketOutlineGeometry, rocketOutlineMaterial);
    rocketOutline.position.z = -5;
    rocket.add(rocketOutline);


    const dotGeometry = new THREE.CircleGeometry(1, 16);
    const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.z = -6;
    rocket.add(dot);


    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (rocketRef.current) {
        orbitAngleRef.current += (delta * 0.3);
        const orbitRadius = 80;
        rocketRef.current.position.x = Math.cos(orbitAngleRef.current) * orbitRadius;
        rocketRef.current.position.y = Math.sin(orbitAngleRef.current) * orbitRadius;
        rocketRef.current.position.z = -9;


        rocketRef.current.rotation.z = orbitAngleRef.current + Math.PI / 2;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();


    const handleResize = () => {
      if (canvasRef.current && rendererRef.current) {
        const width = canvasRef.current.clientWidth;
        const height = canvasRef.current.clientHeight;
        rendererRef.current.setSize(width, height);
        const aspect = width / height;
        (cameraRef.current as THREE.OrthographicCamera).left = -150 * aspect;
        (cameraRef.current as THREE.OrthographicCamera).right = 150 * aspect;
        (cameraRef.current as THREE.OrthographicCamera).updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (canvasRef.current?.contains(renderer.domElement)) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div ref={canvasRef} className="flex-1 relative">
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white mb-3 font-mono" style={{ letterSpacing: '2px' }}>
                ◆ ORBIT ACHIEVED ◆
              </h1>
              <p className="text-white text-sm font-mono tracking-widest">MISSION STATUS: SUCCESS</p>
            </div>

            <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
              <div className="border-2 border-white p-4 bg-black/60 backdrop-blur">
                <p className="text-white text-xs font-mono tracking-wider mb-1">ALTITUDE</p>
                <p className="text-white text-2xl font-mono font-bold">{altitude.toFixed(0)}</p>
                <p className="text-white text-xs font-mono">km</p>
              </div>
              <div className="border-2 border-white p-4 bg-black/60 backdrop-blur">
                <p className="text-white text-xs font-mono tracking-wider mb-1">VELOCITY</p>
                <p className="text-white text-2xl font-mono font-bold">{(speed / 1000).toFixed(2)}</p>
                <p className="text-white text-xs font-mono">km/s</p>
              </div>
              <div className="border-2 border-white p-4 bg-black/60 backdrop-blur">
                <p className="text-white text-xs font-mono tracking-wider mb-1">STATUS</p>
                <p className="text-white text-2xl font-mono font-bold">STABLE</p>
              </div>
              <div className="border-2 border-white p-4 bg-black/60 backdrop-blur">
                <p className="text-white text-xs font-mono tracking-wider mb-1">PERIOD</p>
                <p className="text-white text-2xl font-mono font-bold">~90</p>
                <p className="text-white text-xs font-mono">min</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 flex flex-col items-center">
            <p className="text-white text-center text-sm max-w-md font-mono tracking-tight">
              Welcome to orbital insertion. Your rocket is now in stable orbit around Earth.
            </p>
            <button
              onClick={onContinue}
              className="pointer-events-auto px-8 py-3 border-2 border-white bg-black text-white font-mono font-bold hover:bg-white hover:text-black transition-all tracking-widest text-sm"
            >
              CONTINUE MISSION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
