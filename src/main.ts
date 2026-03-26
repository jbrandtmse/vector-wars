import * as THREE from 'three';
import { calculateDeltaTime } from './core/DeltaTime.ts';
import { InputManager } from './core/InputManager.ts';
import { updateViewportOffset } from './core/ViewportMovement.ts';
import { VIEWPORT_BASE_POSITION, BANK_MAX_ANGLE, BANK_LERP_SPEED } from './config/constants.ts';
import { vectorMaterials } from './rendering/VectorMaterials.ts';
import { RenderPipeline } from './rendering/RenderPipeline.ts';
import { CockpitRenderer } from './rendering/CockpitRenderer.ts';
import { SceneEnvironment } from './rendering/SceneEnvironment.ts';
import { DataLanceSystem } from './systems/DataLanceSystem.ts';

// --- Renderer Setup ---
const container = document.getElementById('app');
if (!container) throw new Error('Could not find #app container');

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

// --- Camera Setup ---
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);
camera.position.set(0, 0, 3);
camera.lookAt(0, 0, 0);

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// --- Environment Setup (grid + starfield) ---
new SceneEnvironment(scene, vectorMaterials);

// Set initial resolution for LineMaterial
vectorMaterials.updateResolution(window.innerWidth, window.innerHeight);

// --- Cockpit Setup ---
// CRITICAL: camera must be added to scene for camera-parented geometry to render
scene.add(camera);
const cockpitRenderer = new CockpitRenderer(camera, vectorMaterials);

// --- Render Pipeline Setup ---
const renderPipeline = new RenderPipeline(renderer, scene, camera);

// --- Window Resize Handler ---
function onWindowResize(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderPipeline.resize(width, height);
  vectorMaterials.updateResolution(width, height);
}
window.addEventListener('resize', onWindowResize);

// --- Input Manager Setup ---
const inputManager = new InputManager();

// --- Data Lance System Setup ---
const dataLanceSystem = new DataLanceSystem(scene, camera, inputManager, vectorMaterials, cockpitRenderer);

// --- Animation Loop with Delta Time ---
let lastTime = 0;
let viewportOffset = { x: 0, y: 0 };
renderer.setAnimationLoop((time: number) => {
  const dt = calculateDeltaTime(time, lastTime);
  lastTime = time;

  // Update viewport offset based on arrow key input
  const prevX = viewportOffset.x;
  viewportOffset = updateViewportOffset(viewportOffset, inputManager, dt);
  camera.position.x = VIEWPORT_BASE_POSITION.x + viewportOffset.x;
  camera.position.y = VIEWPORT_BASE_POSITION.y + viewportOffset.y;

  // Banking effect — roll camera based on horizontal movement direction
  const horizontalDelta = viewportOffset.x - prevX;
  const targetBank = horizontalDelta !== 0 ? -Math.sign(horizontalDelta) * BANK_MAX_ANGLE : 0;
  camera.rotation.z += (targetBank - camera.rotation.z) * Math.min(1, BANK_LERP_SPEED * dt);

  // Update game systems
  dataLanceSystem.update(dt);
  cockpitRenderer.update(dt);

  renderPipeline.render();
});
