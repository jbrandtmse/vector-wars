import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { calculateDeltaTime } from './core/DeltaTime.ts';
import { BLOOM_LAYER } from './config/constants.ts';
import { vectorMaterials } from './rendering/VectorMaterials.ts';
import { RenderPipeline } from './rendering/RenderPipeline.ts';

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

// --- Test Wireframe Shape 1: Thin LineSegments (icosahedron) ---
const icoGeometry = new THREE.IcosahedronGeometry(0.8, 0);
const icoEdges = new THREE.EdgesGeometry(icoGeometry);
const thinMaterial = vectorMaterials.create('test-thin');
const thinWireframe = new THREE.LineSegments(icoEdges, thinMaterial);
thinWireframe.layers.enable(BLOOM_LAYER);
thinWireframe.position.set(-1.2, 0, 0);
scene.add(thinWireframe);

// --- Test Wireframe Shape 2: Fat Line2 (torus knot outline) ---
const torusKnotGeometry = new THREE.TorusKnotGeometry(0.5, 0.15, 64, 8);
const torusKnotEdges = new THREE.EdgesGeometry(torusKnotGeometry);
const edgePositions = torusKnotEdges.attributes.position;
const fatLineGeometry = new LineGeometry();
const positions: number[] = [];
for (let i = 0; i < edgePositions.count; i++) {
  positions.push(
    edgePositions.getX(i),
    edgePositions.getY(i),
    edgePositions.getZ(i),
  );
}
fatLineGeometry.setPositions(positions);

const fatMaterial = vectorMaterials.createFat('test-fat', 3);
const fatWireframe = new Line2(fatLineGeometry, fatMaterial);
fatWireframe.computeLineDistances();
fatWireframe.layers.enable(BLOOM_LAYER);
fatWireframe.position.set(1.2, 0, 0);
scene.add(fatWireframe);

// Set initial resolution for LineMaterial
vectorMaterials.updateResolution(window.innerWidth, window.innerHeight);

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

// --- Animation Loop with Delta Time ---
let lastTime = 0;
renderer.setAnimationLoop((time: number) => {
  const dt = calculateDeltaTime(time, lastTime);
  lastTime = time;

  // Slowly rotate test shapes to confirm animation works
  thinWireframe.rotation.x += 0.3 * dt;
  thinWireframe.rotation.y += 0.5 * dt;

  fatWireframe.rotation.x -= 0.2 * dt;
  fatWireframe.rotation.y += 0.4 * dt;

  renderPipeline.render();
});
