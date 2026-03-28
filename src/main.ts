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
import type { BriefingData } from './ui/screens/BriefingScreen.ts';
import { Logger } from './core/Logger.ts';
import { getPaletteHexColor, getPaletteCSSGlow, getPaletteCSSMultiGlow } from './rendering/PaletteColors.ts';
import { audioManager } from './audio/AudioManager.ts';
import { SFXGenerator } from './audio/SFXGenerator.ts';
import { VoiceLineGenerator } from './audio/VoiceLineGenerator.ts';
import { AmbientHumGenerator } from './audio/AmbientHumGenerator.ts';
import { OutroMusicGenerator } from './audio/OutroMusicGenerator.ts';
import { EndingScreen } from './ui/screens/EndingScreen.ts';
import { HighScoreManager } from './systems/HighScoreManager.ts';
import { HighScoreScreen } from './ui/screens/HighScoreScreen.ts';
import { CyberspaceFragmentation } from './entities/effects/CyberspaceFragmentation.ts';
import { FRAG_PHASE1_DURATION } from './config/constants.ts';
import { MenuScreen } from './ui/screens/MenuScreen.ts';
import { checkWebGL2Support, showUnsupportedMessage, createContextLossOverlay } from './core/BrowserCompatibility.ts';

// --- Renderer Setup ---
const container = document.getElementById('app');
if (!container) throw new Error('Could not find #app container');

// --- WebGL 2.0 Pre-flight Check (Story 6-3) ---
if (!checkWebGL2Support()) {
  showUnsupportedMessage(container);
  throw new Error('WebGL 2.0 not supported');
}

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

// --- Audio Manager Setup (Story 4-5, 4-6) ---
audioManager.init(camera);
audioManager.loadManifest('audio/manifest.json').catch((err) => {
  Logger.warn('Audio', 'Failed to load audio manifest', { error: String(err) });
});

// --- SFX Generator Setup (Story 4-6) ---
const sfxGenerator = new SFXGenerator();
audioManager.registerGenerator(sfxGenerator);
sfxGenerator.generateAll().catch((err) => {
  Logger.warn('Audio', 'Failed to pre-generate SFX', { error: String(err) });
});

// --- Voice Line Generator Setup (Story 4-9) ---
const voiceGenerator = new VoiceLineGenerator();
audioManager.registerVoiceGenerator(voiceGenerator);
voiceGenerator.generateAll().catch((err) => {
  Logger.warn('Audio', 'Failed to pre-generate voice lines', { error: String(err) });
});

// --- Ambient Hum Generator Setup (Story 4-7) ---
const ambientCtx = audioManager.getAudioContext();
const ambientOutput = audioManager.getAmbientOutputNode();
if (ambientCtx && ambientOutput) {
  const ambientHumGenerator = new AmbientHumGenerator(ambientCtx, ambientOutput);
  audioManager.registerAmbientGenerator(ambientHumGenerator);
}

// --- Outro Music Generator Setup (Story 5-10) ---
const outroMusicGenerator = new OutroMusicGenerator();
audioManager.registerMusicGenerator(outroMusicGenerator);

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// --- Environment Setup (grid + starfield) ---
const sceneEnvironment = new SceneEnvironment(scene, vectorMaterials);

// Set initial resolution for LineMaterial
vectorMaterials.updateResolution(window.innerWidth, window.innerHeight);

// --- Cockpit Setup ---
// CRITICAL: camera must be added to scene for camera-parented geometry to render
scene.add(camera);
const cockpitRenderer = new CockpitRenderer(camera, vectorMaterials);

// --- Render Pipeline Setup ---
const renderPipeline = new RenderPipeline(renderer, scene, camera);

// --- Debounced Window Resize Handler (Story 6-3) ---
let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
function onWindowResize(): void {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderPipeline.resize(width, height);
    vectorMaterials.updateResolution(width, height);
  }, 150);
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

// --- High Score Manager Setup (Story 5-11) ---
const highScoreManager = new HighScoreManager();

// --- Cyberspace Fragmentation (Story 5-12) ---
// Created on-demand during level 3 ending sequence; null until then.
let activeFragmentation: CyberspaceFragmentation | null = null;

// --- Game State Reset (Story 6-2) ---
// Resets all gameplay state for a fresh run when returning to the main menu.
function resetGameState(): void {
  Logger.info('Main', 'Resetting game state for new playthrough');

  // Reset score to zero
  scoreManager.reset();

  // Reset player shields to full and clear dead flag
  player.reset();

  // Clear game over state
  gameOverManager.reset();

  // Restore HUD visibility (hidden by GameOverManager on death)
  hudManager.showHUD();

  // Exit any active level/phase (cleans up event listeners, phase state)
  levelManager.exit();

  // Reset dialogue manager (clear queue and one-shot flags)
  dialogueManager.reset();

  // Reset palette to green (default starting palette)
  vectorMaterials.setPalette('green');

  // Restore scene environment visibility (hidden by cyberspace fragmentation ending)
  sceneEnvironment.show();

  // Dispose active fragmentation effect if present
  if (activeFragmentation) {
    activeFragmentation.dispose();
    activeFragmentation = null;
  }

  // Reset camera-related state
  viewportOffset = { x: 0, y: 0 };
  currentBankAngle = 0;
}

// --- Return to Menu helper (Story 6-2) ---
function returnToMenu(): void {
  resetGameState();
  menuScreen.show();
}

// Wire GameOverScreen to show HighScoreScreen then return to menu (Story 6-2)
gameOverManager.setOnRestart((finalScore: number) => {
  if (highScoreManager.isHighScore(finalScore)) {
    const highScoreScreen = new HighScoreScreen();
    highScoreScreen.onReturn = () => {
      returnToMenu();
    };
    highScoreScreen.show(finalScore, highScoreManager);
  } else {
    returnToMenu();
  }
});

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

// --- Level Complete handler (Story 5-1, updated Story 5-3: multi-level transitions) ---
eventBus.on('levelComplete', ({ level }) => {
  setTimeout(() => {
    const hex = getPaletteHexColor();
    const glow = getPaletteCSSGlow();
    const multiGlow = getPaletteCSSMultiGlow([20, 40]);

    if (level < 3) {
      // Level 1 or 2 complete: show brief message then start next level
      const nextLevel = level + 1;
      const subtitleText = level === 1 ? 'FIREWALL BREACHED' : 'DEEP CORE ACCESS GRANTED';
      const overlay = document.createElement('div');
      Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', zIndex: '10',
        fontFamily: "'Courier New', monospace", opacity: '0', transition: 'opacity 0.5s',
      });
      overlay.innerHTML = `
        <div style="font-size:clamp(3rem,8vw,6rem);color:${hex};text-shadow:${multiGlow};letter-spacing:0.15em;margin-bottom:1rem">LEVEL COMPLETE</div>
        <div style="font-size:clamp(1rem,2.5vw,1.5rem);color:${hex};text-shadow:${glow};margin-bottom:2rem;opacity:0.8">${subtitleText}</div>
        <div style="font-size:clamp(1.2rem,3vw,2rem);color:${hex};text-shadow:${glow};margin-bottom:3rem">SCORE: ${scoreManager.getScore()}</div>
        <div style="font-size:clamp(0.8rem,2vw,1.2rem);color:${hex};text-shadow:${glow};opacity:0.7">PRESS SPACE TO CONTINUE</div>
      `;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => { overlay.style.opacity = '1'; });
      setTimeout(() => {
        const handler = (e: KeyboardEvent) => {
          if (e.code === 'Space') {
            e.preventDefault();
            window.removeEventListener('keydown', handler);
            overlay.style.opacity = '0';
            setTimeout(() => {
              overlay.remove();
              levelManager.exit();
              levelManager.startLevel(nextLevel);
            }, 500);
          }
        };
        window.addEventListener('keydown', handler);
      }, 1000);
    } else {
      // Level 3 complete: full ending sequence (Story 5-10, updated Story 5-11, 5-12)
      const endingScreen = new EndingScreen();
      const fragmentation = new CyberspaceFragmentation(scene, vectorMaterials);
      activeFragmentation = fragmentation;

      endingScreen.onFragmentationStart = () => {
        fragmentation.start();
        // Hide the scene environment when Phase 2 begins (grid+starfield disappear)
        setTimeout(() => {
          sceneEnvironment.hide();
        }, FRAG_PHASE1_DURATION * 1000);
      };

      endingScreen.onCreditsComplete = (finalScore: number) => {
        const highScoreScreen = new HighScoreScreen();
        highScoreScreen.onReturn = () => {
          returnToMenu();
        };
        highScoreScreen.show(finalScore, highScoreManager);
      };
      endingScreen.show(scoreManager.getScore());
    }
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
  sceneEnvironment,
);
// Load briefing data at init time (not during gameplay frames)
fetch('assets/briefings/level-1.json')
  .then((res) => res.json())
  .then((data: BriefingData) => {
    levelManager.setBriefingData(data, 1);
    Logger.info('Narrative', 'Level 1 briefing data loaded');
  })
  .catch((err) => {
    Logger.warn('Narrative', 'Failed to load Level 1 briefing data', { error: String(err) });
  });

fetch('assets/briefings/level-2.json')
  .then((res) => res.json())
  .then((data: BriefingData) => {
    levelManager.setBriefingData(data, 2);
    Logger.info('Narrative', 'Level 2 briefing data loaded');
  })
  .catch((err) => {
    Logger.warn('Narrative', 'Failed to load Level 2 briefing data', { error: String(err) });
  });

fetch('assets/briefings/level-3.json')
  .then((res) => res.json())
  .then((data: BriefingData) => {
    levelManager.setBriefingData(data, 3);
    Logger.info('Narrative', 'Level 3 briefing data loaded');
  })
  .catch((err) => {
    Logger.warn('Narrative', 'Failed to load Level 3 briefing data', { error: String(err) });
  });

// --- Main Menu Setup (Story 6-1) ---
// Game no longer starts immediately -- the menu screen is shown first.
// levelManager.enter() is called from the menu's START GAME callback.
const menuScreen = new MenuScreen();
menuScreen.onStartGame = () => {
  // Resume AudioContext on user gesture (browser autoplay policy)
  audioManager.resume();
  levelManager.enter();
};
menuScreen.onHighScores = (returnToMenu: () => void) => {
  const highScoreScreen = new HighScoreScreen();
  highScoreScreen.onReturn = () => {
    returnToMenu();
  };
  highScoreScreen.show(0, highScoreManager);
};
menuScreen.show();

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
    (window as unknown as { debug: {
      pools: () => Record<string, unknown>;
      reloadAudio: () => Promise<void>;
      audioStatus: () => Promise<void>;
    } }).debug = {
      pools: () => poolDiagnostics.getStats(),
      reloadAudio: () => audioManager.reloadManifest(),
      audioStatus: async () => {
        const { AudioAssetValidator } = await import('./audio/AudioAssetValidator.ts');
        const manifest = await fetch('audio/manifest.json').then(r => r.json());
        const report = await AudioAssetValidator.validateManifest(manifest);
        Logger.info('Audio', 'Audio asset status', {
          present: report.present,
          missing: report.missing,
          total: report.total,
        });
      },
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
function gameLoop(time: number): void {
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

  // Cyberspace fragmentation: update ending effect shards (Story 5-12)
  if (activeFragmentation?.isActive) {
    activeFragmentation.update(dt);
  }

  // Pool diagnostics: log stats once per second in debug mode (Story 2-9)
  if (poolDiagnosticsUpdate) poolDiagnosticsUpdate(dt);

  renderPipeline.render();
}

// --- Visibility Change Handler (Story 6-3) ---
// Pauses the game loop when the browser tab is hidden to prevent GPU waste
// and large delta-time jumps on tab return.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    renderer.setAnimationLoop(null);
    Logger.info('Browser', 'Tab hidden — animation loop paused');
  } else {
    renderer.setAnimationLoop(gameLoop);
    Logger.info('Browser', 'Tab visible — animation loop resumed');
  }
});

// --- WebGL Context Loss/Restore Handlers (Story 6-3) ---
const contextLossOverlay = createContextLossOverlay();
document.body.appendChild(contextLossOverlay);

renderer.domElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  Logger.warn('Browser', 'WebGL context lost, attempting recovery');
  contextLossOverlay.style.display = 'flex';
});

renderer.domElement.addEventListener('webglcontextrestored', () => {
  Logger.info('Browser', 'WebGL context restored');
  contextLossOverlay.style.display = 'none';
});

renderer.setAnimationLoop(gameLoop);
