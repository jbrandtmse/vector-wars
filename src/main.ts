import * as THREE from 'three';
import { calculateDeltaTime } from './core/DeltaTime.ts';

// --- Renderer Setup ---
const container = document.getElementById('app');
if (!container) throw new Error('Could not find #app container');

const renderer = new THREE.WebGLRenderer({ antialias: true });
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

// --- Test Wireframe Cube ---
const geometry = new THREE.BoxGeometry(1, 1, 1);
const edges = new THREE.EdgesGeometry(geometry);
const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const wireframe = new THREE.LineSegments(edges, material);
scene.add(wireframe);

// --- Window Resize Handler ---
function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// --- Animation Loop with Delta Time ---
let lastTime = 0;
renderer.setAnimationLoop((time: number) => {
  const dt = calculateDeltaTime(time, lastTime);
  lastTime = time;

  // Slowly rotate cube to confirm animation works
  wireframe.rotation.x += 0.5 * dt;
  wireframe.rotation.y += 0.7 * dt;

  renderer.render(scene, camera);
});
