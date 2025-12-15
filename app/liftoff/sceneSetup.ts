import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SCENE, CAMERA, CONTROLS, LIGHTING, GROUND_LEVEL, GROUND_COLOR, GROUND_Y } from "./constants";

export function setupScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 50, 200);
  return scene;
}




export function setupCamera(width: number, height: number, povOffset: number) {
  const camera = new THREE.PerspectiveCamera(CAMERA.FOV, width / height, CAMERA.NEAR, CAMERA.FAR);
  camera.position.set(0, GROUND_LEVEL + povOffset, CAMERA.DISTANCE_Z);
  return camera;
}

export function setupRenderer(container: HTMLDivElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
    alpha: false
  });

  if ((navigator as any).gpu) {
    initWebGPUAsync(renderer).catch(() => {
      console.warn("WebGPU not available, using WebGL");
    });
  }

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  return renderer;
}

async function initWebGPUAsync(renderer: THREE.WebGLRenderer) {
  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    if (!adapter) {
      console.warn("No WebGPU adapter available");
      return;
    }

    const device = await adapter.requestDevice();
    (renderer as any).webgpuDevice = device;
    (renderer as any).webgpuAdapter = adapter;
    console.log("WebGPU initialized");
  } catch (e) {
    console.warn("WebGPU init failed:", e);
  }
}

export function setupControls(camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = CONTROLS.DAMPING_FACTOR;
  controls.screenSpacePanning = true;
  controls.rotateSpeed = CONTROLS.ROTATE_SPEED;
  controls.zoomSpeed = CONTROLS.ZOOM_SPEED;
  controls.panSpeed = CONTROLS.PAN_SPEED;
  return controls;
}

export function setupLighting(scene: THREE.Scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const baseLight = new THREE.PointLight(0xffa04d, 100, 50);
  baseLight.position.set(0, 5, 0);
  scene.add(baseLight);
  return baseLight;
}

export function setupGround(scene: THREE.Scene) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -8;
  ground.receiveShadow = true;
  scene.add(ground);
  return ground;
}

export function loadRocket(scene: THREE.Scene, groundLevel: number): Promise<THREE.Group> {
  return new Promise((resolve) => {
    const createFallback = () => {
      const rocketGroup = new THREE.Group();
      rocketGroup.position.y = groundLevel;
      rocketGroup.position.x = 0;
      rocketGroup.position.z = 0;

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 3, 16),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6, roughness: 0.4 })
      );
      body.position.y = 1.5;
      body.castShadow = true;
      rocketGroup.add(body);

      const noseCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0xff3333, metalness: 0.8, roughness: 0.2 })
      );
      noseCone.position.y = 3.2;
      noseCone.castShadow = true;
      rocketGroup.add(noseCone);

      const fin1 = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.6 })
      );
      fin1.position.set(0.45, 0.8, 0);
      fin1.rotation.z = Math.PI / 4;
      fin1.castShadow = true;
      rocketGroup.add(fin1);

      const fin2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.6 })
      );
      fin2.position.set(-0.45, 0.8, 0);
      fin2.rotation.z = Math.PI / 4;
      fin2.castShadow = true;
      rocketGroup.add(fin2);

      const fin3 = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.6 })
      );
      fin3.position.set(0, 0.8, 0.45);
      fin3.rotation.x = Math.PI / 4;
      fin3.castShadow = true;
      rocketGroup.add(fin3);

      scene.add(rocketGroup);
      return rocketGroup;
    };

    const loader = new GLTFLoader();
    loader.load("/model/rocket.glb", (gltf) => {
      const rocket = gltf.scene;
      rocket.position.y = groundLevel;
      rocket.position.x = 0;
      rocket.position.z = 0;
      scene.add(rocket);
      resolve(rocket);
    },
      (progress) => {
        console.log("Loading rocket:", (progress.loaded / progress.total * 100).toFixed(0) + "%");
      },
      (error) => {
        console.error("Failed to load rocket model, using fallback:", error);
        resolve(createFallback());
      });
  });
}
