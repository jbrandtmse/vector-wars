import * as THREE from 'three';
import { calculateDeltaTime } from './core/DeltaTime.ts';
import { InputManager } from './core/InputManager.ts';
import { updateViewportOffset } from './core/ViewportMovement.ts';
import { BANK_MAX_ANGLE, BANK_LERP_SPEED } from './config/constants.ts';
import { vectorMaterials } from './rendering/VectorMaterials.ts';
import { RenderPipeline } from './rendering/RenderPipeline.ts';
import { CockpitRenderer } from './rendering/CockpitRenderer.ts';
import { SceneEnvironment } from './rendering/SceneEnvironment.ts';
import { DataLanceSystem } from './systems/DataLanceSystem.ts';
import { RailMovement } from './systems/RailMovement.ts';
import { GameObjectManager } from './entities/GameObjectManager.ts';
import { EnemySpawner } from './systems/EnemySpawner.ts';
import { CollisionSystem } from './systems/CollisionSystem.ts';

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
// Camera position is now controlled by RailMovement -- no static position

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

// --- Rail Movement Setup ---
const railMovement = new RailMovement(camera);

// --- Data Lance System Setup ---
const dataLanceSystem = new DataLanceSystem(scene, camera, inputManager, vectorMaterials, cockpitRenderer);

// --- Entity Management Setup (Story 2-2) ---
const gameObjectManager = new GameObjectManager();
const enemySpawner = new EnemySpawner(scene, gameObjectManager, vectorMaterials);

// --- Collision System Setup (Story 2-3) ---
const collisionSystem = new CollisionSystem(
  gameObjectManager,
  dataLanceSystem.getActiveBolts(),
);

// Pre-allocated quaternion for banking effect (avoid per-frame allocation)
const bankQuaternion = new THREE.Quaternion();
const bankAxis = new THREE.Vector3(0, 0, 1);

// --- Animation Loop with Delta Time ---
let lastTime = 0;
let viewportOffset = { x: 0, y: 0 };
let currentBankAngle = 0;
renderer.setAnimationLoop((time: number) => {
  const dt = calculateDeltaTime(time, lastTime);
  lastTime = time;

  // Update viewport offset based on arrow key input
  const prevX = viewportOffset.x;
  viewportOffset = updateViewportOffset(viewportOffset, inputManager, dt);

  // Rail movement: camera follows spline path with viewport offset applied in local frame
  railMovement.update(dt, viewportOffset);

  // Banking effect — roll camera based on horizontal movement direction
  // Applied ON TOP of rail orientation via quaternion composition
  const horizontalDelta = viewportOffset.x - prevX;
  const targetBank = horizontalDelta !== 0 ? -Math.sign(horizontalDelta) * BANK_MAX_ANGLE : 0;
  currentBankAngle += (targetBank - currentBankAngle) * Math.min(1, BANK_LERP_SPEED * dt);
  bankQuaternion.setFromAxisAngle(bankAxis, currentBankAngle);
  camera.quaternion.multiply(bankQuaternion);

  // Enemy spawning based on rail progress (Story 2-2)
  enemySpawner.update(railMovement.getRailProgress());
  // Update all game objects (enemies patrol, etc.)
  gameObjectManager.update(dt);

  // Update game systems
  dataLanceSystem.update(dt);

  // Collision detection (after bolt movement and enemy updates)
  collisionSystem.update();

  cockpitRenderer.update(dt);

  renderPipeline.render();
});
