import * as THREE from "three";

export function setupPointerControls(
  onPointerDown: (e: PointerEvent) => void,
  onPointerMove: (e: PointerEvent) => void,
  onPointerUp: (e: PointerEvent) => void,
  onDoubleClick: () => void,
  renderer: THREE.WebGLRenderer
): (() => void) {
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("dblclick", onDoubleClick);

  return () => {
    renderer.domElement.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    renderer.domElement.removeEventListener("dblclick", onDoubleClick);
  };
}

export function setupResizeListener(
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer
): (() => void) {
  const onResize = () => {
    (camera as THREE.PerspectiveCamera).aspect = window.innerWidth / window.innerHeight;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
  };
}

export interface POVControlState {
  isDragging: boolean;
  lastPointerY: number;
}

export function handlePOVDrag(
  state: POVControlState,
  event: PointerEvent,
  followRocket: boolean,
  currentPovOffset: number,
  onPovOffsetChange: (offset: number) => void
): number {
  if (!state.isDragging || !followRocket) return currentPovOffset;

  const dy = event.clientY - state.lastPointerY;
  const newOffset = currentPovOffset - dy * 0.05;
  onPovOffsetChange(Math.round(newOffset * 10) / 10);
  return newOffset;
}
