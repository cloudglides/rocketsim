import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SCENE, CAMERA, CONTROLS, LIGHTING, GROUND_LEVEL, GROUND_COLOR, GROUND_Y } from "./constants";

export function setupScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SCENE.SKY_COLOR);
  scene.fog = new THREE.Fog(SCENE.SKY_COLOR, SCENE.FOG_NEAR, SCENE.FOG_FAR);
  return scene;
}

export function setupCamera(width: number, height: number, povOffset: number) {
  const camera = new THREE.PerspectiveCamera(CAMERA.FOV, width / height, CAMERA.NEAR, CAMERA.FAR);
  camera.position.set(0, GROUND_LEVEL + povOffset, 12);
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
  scene.add(new THREE.AmbientLight(0xffffff, LIGHTING.AMBIENT_INTENSITY));
  const dirLight = new THREE.DirectionalLight(0xffffff, LIGHTING.DIRECTIONAL_INTENSITY);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  const baseLight = new THREE.PointLight(LIGHTING.BASE_LIGHT_COLOR, 0, LIGHTING.BASE_LIGHT_DISTANCE);
  scene.add(baseLight);
  return baseLight;
}

export function setupGround(scene: THREE.Scene) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(SCENE.GROUND_WIDTH, SCENE.GROUND_HEIGHT),
    new THREE.MeshStandardMaterial({ color: GROUND_COLOR, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GROUND_Y;
  scene.add(ground);
  return ground;
}

export function loadRocket(scene: THREE.Scene, groundLevel: number): Promise<THREE.Group> {
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.load("/model/rocket.glb", (gltf) => {
      const rocket = gltf.scene;
      rocket.scale.set(1, 1, 1);
      rocket.position.y = groundLevel;
      rocket.position.x = 0;
      rocket.position.z = 0;
      scene.add(rocket);
      resolve(rocket);
    });
  });
}
