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
import { EffectsManager } from './systems/EffectsManager.ts';
import { Player } from './entities/player/Player.ts';
import { EnemyProjectileSystem } from './systems/EnemyProjectileSystem.ts';
import { HUDManager } from './ui/hud/HUDManager.ts';
import { ScoreManager } from './systems/ScoreManager.ts';
import { ScreenShake } from './systems/ScreenShake.ts';
import { DamageEffectsManager } from './systems/DamageEffectsManager.ts';
import { ScorePopup } from './ui/hud/ScorePopup.ts';
import { eventBus } from './core/GameEvents.ts';
import { GameOverManager } from './systems/GameOverManager.ts';
import { LevelManager } from './systems/LevelManager.ts';
import { LogicBombSystem } from './systems/LogicBombSystem.ts';
import { EMPBurstSystem } from './systems/EMPBurstSystem.ts';
import { CommOverlay } from './ui/screens/CommOverlay.ts';
import { DialogueManager } from './narrative/DialogueManager.ts';
import type { DialogueScript } from './narrative/DialogueTypes.ts';
import { Logger } from './core/Logger.ts';

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

// --- Player Setup (Story 2-5) ---
const player = new Player();

// --- Entity Management Setup (Story 2-2) ---
const gameObjectManager = new GameObjectManager();

// --- Enemy Projectile System Setup (Story 2-5) ---
const enemyProjectileSystem = new EnemyProjectileSystem(
  scene,
  vectorMaterials,
  player.collider,
);

const enemySpawner = new EnemySpawner(
  scene,
  gameObjectManager,
  vectorMaterials,
  (origin, target, speed, damage) => enemyProjectileSystem.fireAt(origin, target, speed, damage),
  () => camera.position,
  railMovement,
);

// --- Collision System Setup (Story 2-3) ---
const collisionSystem = new CollisionSystem(
  gameObjectManager,
  dataLanceSystem.getActiveBolts(),
  player.collider,
);

// --- Logic Bomb System Setup (Story 3-5) ---
const logicBombSystem = new LogicBombSystem(
  scene,
  camera,
  inputManager,
  vectorMaterials,
  cockpitRenderer,
  gameObjectManager,
);

// --- EMP Burst System Setup (Story 3-6) ---
const empBurstSystem = new EMPBurstSystem(
  scene,
  camera,
  inputManager,
  vectorMaterials,
  cockpitRenderer,
  gameObjectManager,
);

// --- Effects Manager Setup (Story 2-4) ---
const effectsManager = new EffectsManager(scene, vectorMaterials);

// --- Score Manager Setup (Story 2-6) ---
// ScoreManager and HUDManager are event-driven (no per-frame update calls).
// They exist in module scope for lifecycle management and GC prevention.
const scoreManager = new ScoreManager();

// --- Score Popups Setup (Story 2-8) ---
const scorePopup = new ScorePopup(scene, vectorMaterials);

// --- HUD Setup (Story 2-6) ---
// ShieldBar initializes with 100% fill (default). Player already emitted shieldChanged
// in its constructor, but ShieldBar is created after Player, so it relies on the default.
// This is correct since shields start full.
const hudManager = new HUDManager(camera, vectorMaterials);

// --- Game Over Manager Setup (Story 2-10) ---
const gameOverManager = new GameOverManager(scoreManager, hudManager);

// --- Comm Overlay + Dialogue Manager Setup (Story 4-1) ---
const commOverlay = new CommOverlay();
const dialogueManager = new DialogueManager(commOverlay);

// Load dialogue scripts at init time (not during gameplay frames)
fetch('assets/dialogue/handler.json')
  .then((res) => res.json())
  .then((script: DialogueScript) => {
    dialogueManager.loadScript(script);
    Logger.info('Narrative', 'Handler dialogue loaded');
  })
  .catch((err) => {
    Logger.warn('Narrative', 'Failed to load handler dialogue', { error: String(err) });
  });

fetch('assets/dialogue/bosses.json')
  .then((res) => res.json())
  .then((script: DialogueScript) => {
    dialogueManager.loadScript(script);
    Logger.info('Narrative', 'Boss dialogue loaded');
  })
  .catch((err) => {
    Logger.warn('Narrative', 'Failed to load boss dialogue', { error: String(err) });
  });

fetch('assets/dialogue/tutorial.json')
  .then((res) => res.json())
  .then((script: DialogueScript) => {
    dialogueManager.loadScript(script);
    Logger.info('Narrative', 'Tutorial dialogue loaded');
  })
  .catch((err) => {
    Logger.warn('Narrative', 'Failed to load tutorial dialogue', { error: String(err) });
  });

// --- Screen Shake + Damage Flash Setup (Story 2-7) ---
const screenShake = new ScreenShake();
const damageEffectsManager = new DamageEffectsManager(screenShake, renderPipeline);
void damageEffectsManager; // event-driven lifecycle, no per-frame calls

// --- Level Complete handler (placeholder until Epic 6 proper game flow) ---
eventBus.on('levelComplete', () => {
  setTimeout(() => {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', zIndex: '10',
      fontFamily: "'Courier New', monospace", opacity: '0', transition: 'opacity 0.5s',
    });
    overlay.innerHTML = `
      <div style="font-size:clamp(3rem,8vw,6rem);color:#00ff41;text-shadow:0 0 20px #00ff41,0 0 40px #00ff41;letter-spacing:0.15em;margin-bottom:1rem">LEVEL COMPLETE</div>
      <div style="font-size:clamp(1rem,2.5vw,1.5rem);color:#00ff41;text-shadow:0 0 10px #00ff41;margin-bottom:2rem;opacity:0.8">FIREWALL BREACHED</div>
      <div style="font-size:clamp(1.2rem,3vw,2rem);color:#00ff41;text-shadow:0 0 10px #00ff41;margin-bottom:3rem">SCORE: ${scoreManager.getScore()}</div>
      <div style="font-size:clamp(0.8rem,2vw,1.2rem);color:#00ff41;text-shadow:0 0 10px #00ff41;opacity:0.7">PRESS SPACE TO RESTART</div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    setTimeout(() => {
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') { e.preventDefault(); window.location.reload(); }
      });
    }, 1000);
  }, 2000);
});

// --- Level Manager Setup (Story 3-10) ---
const levelManager = new LevelManager(
  scene,
  camera,
  vectorMaterials,
  gameObjectManager,
  player,
  renderPipeline,
  railMovement,
  enemySpawner,
  collisionSystem,
  effectsManager,
  enemyProjectileSystem,
  dataLanceSystem,
  gameOverManager,
  inputManager,
);
levelManager.enter();

// --- Pool Diagnostics Setup (Story 2-9, debug-only) ---
let poolDiagnosticsUpdate: ((dt: number) => void) | null = null;

if (import.meta.env.DEV) {
  import('./debug/PoolDiagnostics.ts').then(({ PoolDiagnostics }) => {
    const poolDiagnostics = new PoolDiagnostics();
    poolDiagnostics.registerSource('dataLance', dataLanceSystem);
    poolDiagnostics.registerSource('enemyProjectile', enemyProjectileSystem);
    poolDiagnostics.registerSource('effects', effectsManager);
    poolDiagnostics.registerGenericPool('sentinels', enemySpawner.getSentinelPool());
    poolDiagnostics.registerGenericPool('watchdogs', enemySpawner.getWatchdogPool());
    poolDiagnostics.registerGenericPool('gatekeepers', enemySpawner.getGatekeeperPool());
    poolDiagnostics.setRenderer(renderer);
    poolDiagnosticsUpdate = (dt: number) => poolDiagnostics.update(dt);

    // Expose debug API on window
    (window as unknown as { debug: { pools: () => Record<string, unknown> } }).debug = {
      pools: () => poolDiagnostics.getStats(),
    };
  });
}

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
  viewportOffset = updateViewportOffset(viewportOffset, inputManager, dt);

  // Rail movement: camera follows spline path with viewport offset applied in local frame
  // Only update during dogfight phase -- other phases manage their own camera/rail.
  if (levelManager.isUsingMainRail()) {
    railMovement.update(dt, viewportOffset);
  }

  // Banking effect — roll camera based on PLAYER INPUT only (not auto-recenter drift)
  const activeLeft = inputManager.isActive('moveLeft');
  const activeRight = inputManager.isActive('moveRight');
  const targetBank = activeRight ? -BANK_MAX_ANGLE : activeLeft ? BANK_MAX_ANGLE : 0;
  currentBankAngle += (targetBank - currentBankAngle) * Math.min(1, BANK_LERP_SPEED * dt);
  bankQuaternion.setFromAxisAngle(bankAxis, currentBankAngle);
  camera.quaternion.multiply(bankQuaternion);

  // Sync player collider to camera position (Story 2-5)
  player.syncToCamera(camera);

  // === GAMEPLAY SYSTEMS (frozen on game over) ===
  if (!gameOverManager.isGameOver) {
    levelManager.update(dt, viewportOffset);

    // Shared weapon/collision systems run in ALL phases (not just dogfight)
    dataLanceSystem.update(dt);
    logicBombSystem.update(dt);
    empBurstSystem.update(dt);
    collisionSystem.update(dt);
    enemyProjectileSystem.update(dt);
    effectsManager.update(dt);
    gameObjectManager.update(dt);

    // Dialogue system: update after level manager, before render (Story 4-1)
    dialogueManager.update(dt);
  }

  // === VISUAL SYSTEMS (always run) ===
  cockpitRenderer.update(dt);

  // Score popups: update floating/fading before shake and render (Story 2-8)
  scorePopup.update(dt, camera);

  // Screen shake: apply camera offset AFTER all movement, BEFORE render (Story 2-7)
  screenShake.update(dt, camera);

  // Damage flash decay: update uniform before render pass (Story 2-7)
  renderPipeline.updateDamageFlash(dt);

  // Pool diagnostics: log stats once per second in debug mode (Story 2-9)
  if (poolDiagnosticsUpdate) poolDiagnosticsUpdate(dt);

  renderPipeline.render();
});
