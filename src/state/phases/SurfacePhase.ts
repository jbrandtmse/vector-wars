/**
 * SurfacePhase — Phase 2: Surface Attack.
 *
 * Player flies low over the AI fortress surface on a non-looping rail path,
 * destroying firewall nodes and ICE towers. Phase completes when all firewall
 * nodes are destroyed OR the rail path ends.
 *
 * Architecture: Manages its own geometry, target pools, and rail path
 * independently from the dogfight phase. Systems (collision, effects, etc.)
 * are called in the same order as the main game loop.
 *
 * Created by: Story 3-3
 */

import * as THREE from 'three';
import { FirewallNode } from '../../entities/enemies/FirewallNode.ts';
import { ICETower } from '../../entities/enemies/ICETower.ts';
import { ObjectPool } from '../../core/ObjectPool.ts';
import { RailMovement } from '../../systems/RailMovement.ts';
import { eventBus } from '../../core/GameEvents.ts';
import { Logger } from '../../core/Logger.ts';
import {
  BLOOM_LAYER,
  FIREWALL_NODE_POOL_SIZE,
  ICE_TOWER_POOL_SIZE,
  SURFACE_RAIL_PATH_POINTS,
  SURFACE_TARGETS,
} from '../../config/constants.ts';
import type { SurfaceTarget } from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
import type { Enemy } from '../../entities/enemies/Enemy.ts';
import type { GameObjectManager } from '../../entities/GameObjectManager.ts';

/** Completion threshold for rail progress — near the end of the path */
const RAIL_COMPLETION_THRESHOLD = 0.98;

export class SurfacePhase {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private vectorMaterials: VectorMaterials;

  // Fortress geometry
  private fortressSurface: THREE.LineSegments | null = null;
  private fortressSurfaceGeometry: THREE.EdgesGeometry | null = null;
  private fortressSurfaceMaterial: THREE.LineBasicMaterial | null = null;
  private staticStructures: THREE.LineSegments[] = [];
  private structureGeometries: THREE.EdgesGeometry[] = [];
  private structureMaterial: THREE.LineBasicMaterial | null = null;

  // Target pools
  private firewallNodePool: ObjectPool<FirewallNode> | null = null;
  private iceTowerPool: ObjectPool<ICETower> | null = null;
  private activeFirewallNodes: FirewallNode[] = [];
  private activeICETowers: ICETower[] = [];

  // Rail movement
  private railMovement: RailMovement | null = null;

  // Structure collision
  private structureBounds: THREE.Box3[] = [];
  private playerCollider: THREE.Sphere | null = null;
  private hitCooldownTimer = 0;

  // Game object tracking
  private gameObjectManager: GameObjectManager | null = null;

  // Phase state
  private firewallNodesRemaining = 0;
  private completed = false;

  // Event listener reference for cleanup
  private onEnemyDestroyed: ((data: { enemy: Enemy; position: { x: number; y: number; z: number } }) => void) | null = null;

  // Level-specific config (defaults to Level 1 constants)
  private surfaceTargets: SurfaceTarget[];
  private railPathPoints: readonly [number, number, number][];

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    vectorMaterials: VectorMaterials,
    playerCollider?: THREE.Sphere,
    gameObjectManager?: GameObjectManager,
    surfaceTargets?: SurfaceTarget[],
    railPathPoints?: readonly [number, number, number][],
  ) {
    this.scene = scene;
    this.camera = camera;
    this.vectorMaterials = vectorMaterials;
    this.playerCollider = playerCollider ?? null;
    this.gameObjectManager = gameObjectManager ?? null;
    this.surfaceTargets = surfaceTargets ?? SURFACE_TARGETS;
    this.railPathPoints = railPathPoints ?? SURFACE_RAIL_PATH_POINTS;
  }

  enter(): void {
    Logger.info('SurfacePhase', 'Entering surface attack phase');

    this.completed = false;

    // Create fortress surface geometry
    this.createFortressSurface();

    // Create static fortress structures
    this.createStaticStructures();

    // Create and warm target pools
    this.createTargetPools();

    // Place targets at predefined positions
    this.placeTargets();

    // Create rail movement for surface path (non-looping)
    this.railMovement = new RailMovement(
      this.camera,
      this.railPathPoints,
      false, // open (non-looping) path
    );

    // Subscribe to enemyDestroyed events for completion tracking
    this.onEnemyDestroyed = (data) => {
      if (data.enemy instanceof FirewallNode) {
        this.firewallNodesRemaining--;
        Logger.debug('SurfacePhase', 'Firewall node destroyed', {
          remaining: this.firewallNodesRemaining,
        });
      }
    };
    eventBus.on('enemyDestroyed', this.onEnemyDestroyed);

    Logger.info('SurfacePhase', 'Surface phase entered', {
      firewallNodes: this.activeFirewallNodes.length,
      iceTowers: this.activeICETowers.length,
      firewallNodesRemaining: this.firewallNodesRemaining,
    });
  }

  update(dt: number, viewportOffset?: { x: number; y: number }): void {
    if (this.completed) return;

    // Update rail movement (surface path) with viewport offset for arrow key control
    if (this.railMovement) {
      this.railMovement.update(dt, viewportOffset ?? { x: 0, y: 0 });
    }

    // Update active targets
    for (const node of this.activeFirewallNodes) {
      if (node.isActive) {
        node.update(dt);
      }
    }
    for (const tower of this.activeICETowers) {
      if (tower.isActive) {
        tower.update(dt);
      }
    }

    // Environmental collision: structures damage the player
    if (this.hitCooldownTimer > 0) {
      this.hitCooldownTimer -= dt;
    } else if (this.playerCollider) {
      for (const bounds of this.structureBounds) {
        if (bounds.intersectsSphere(this.playerCollider)) {
          eventBus.emit('playerHit', { damage: 10, source: 'structure' });
          this.hitCooldownTimer = 0.5; // prevent multi-hit stacking
          break;
        }
      }
    }

    // Check phase completion conditions
    this.checkCompletion();
  }

  exit(): void {
    Logger.info('SurfacePhase', 'Exiting surface attack phase');

    // Unsubscribe from events
    if (this.onEnemyDestroyed) {
      eventBus.off('enemyDestroyed', this.onEnemyDestroyed);
      this.onEnemyDestroyed = null;
    }

    // Remove and dispose fortress surface
    if (this.fortressSurface) {
      this.scene.remove(this.fortressSurface);
      this.fortressSurface = null;
    }
    if (this.fortressSurfaceGeometry) {
      this.fortressSurfaceGeometry.dispose();
      this.fortressSurfaceGeometry = null;
    }
    if (this.fortressSurfaceMaterial) {
      this.fortressSurfaceMaterial.dispose();
      this.fortressSurfaceMaterial = null;
    }

    // Remove and dispose static structures
    for (const structure of this.staticStructures) {
      this.scene.remove(structure);
    }
    for (const geo of this.structureGeometries) {
      geo.dispose();
    }
    this.staticStructures = [];
    this.structureGeometries = [];
    this.structureBounds = [];
    if (this.structureMaterial) {
      this.structureMaterial.dispose();
      this.structureMaterial = null;
    }

    // Release active targets back to pools and remove from scene
    for (const node of this.activeFirewallNodes) {
      this.scene.remove(node.getObject3D());
      if (this.firewallNodePool) {
        this.firewallNodePool.release(node);
      }
    }
    this.activeFirewallNodes = [];

    for (const tower of this.activeICETowers) {
      this.scene.remove(tower.getObject3D());
      if (this.iceTowerPool) {
        this.iceTowerPool.release(tower);
      }
    }
    this.activeICETowers = [];

    // Null out references
    this.firewallNodePool = null;
    this.iceTowerPool = null;
    this.railMovement = null;

    Logger.info('SurfacePhase', 'Surface phase exited, resources disposed');
  }

  /** Returns whether the phase has completed */
  isComplete(): boolean {
    return this.completed;
  }

  /**
   * Called externally (or from event listener) when a firewall node is destroyed.
   * This is a convenience method for testing; in production, the eventBus listener handles this.
   */
  notifyFirewallNodeDestroyed(): void {
    this.firewallNodesRemaining--;
  }

  private createFortressSurface(): void {
    // PlaneGeometry(300, 400, 30, 40) — large fortress surface
    const basePlane = new THREE.PlaneGeometry(300, 400, 30, 40);
    this.fortressSurfaceGeometry = new THREE.EdgesGeometry(basePlane);
    basePlane.dispose();

    this.fortressSurfaceMaterial = this.vectorMaterials.create('fortressSurface', -0.1);

    this.fortressSurface = new THREE.LineSegments(
      this.fortressSurfaceGeometry,
      this.fortressSurfaceMaterial,
    );
    this.fortressSurface.layers.enable(BLOOM_LAYER);

    // Rotate to face up (default plane is vertical, XY plane)
    this.fortressSurface.rotation.x = -Math.PI / 2;
    // Position at y=0 (fortress surface)
    this.fortressSurface.position.set(150, 0, 130);

    this.scene.add(this.fortressSurface);
  }

  private createStaticStructures(): void {
    this.structureMaterial = this.vectorMaterials.create('fortressStructure');

    // Structure definitions: position, geometry type, dimensions
    const structureDefs = [
      // Tall wall near first cluster
      { pos: [40, 5, 30], type: 'box' as const, size: [4, 10, 20] },
      // Ridge near mid-section
      { pos: [100, 4, 75], type: 'box' as const, size: [30, 8, 3] },
      // Tower in ICE battery area
      { pos: [160, 7, 135], type: 'cylinder' as const, size: [2, 1.5, 14, 8] },
      // Wall near second cluster
      { pos: [180, 5, 160], type: 'box' as const, size: [5, 10, 25] },
      // Ridge near final area
      { pos: [235, 3.5, 230], type: 'box' as const, size: [20, 7, 3] },
      // Tower near exit
      { pos: [280, 6, 290], type: 'cylinder' as const, size: [1.5, 1, 12, 6] },
    ];

    for (const def of structureDefs) {
      let baseGeometry: THREE.BoxGeometry | THREE.CylinderGeometry;
      if (def.type === 'box') {
        baseGeometry = new THREE.BoxGeometry(def.size[0], def.size[1], def.size[2]);
      } else {
        baseGeometry = new THREE.CylinderGeometry(
          def.size[0], def.size[1], def.size[2], def.size[3],
        );
      }

      const edgesGeometry = new THREE.EdgesGeometry(baseGeometry);
      baseGeometry.dispose();
      this.structureGeometries.push(edgesGeometry);

      const structure = new THREE.LineSegments(edgesGeometry, this.structureMaterial);
      structure.layers.enable(BLOOM_LAYER);
      structure.position.set(def.pos[0], def.pos[1], def.pos[2]);

      this.scene.add(structure);
      this.staticStructures.push(structure);

      // Create collision bound for environmental damage
      if (def.type === 'box') {
        const halfX = def.size[0] / 2;
        const halfY = def.size[1] / 2;
        const halfZ = def.size[2] / 2;
        this.structureBounds.push(new THREE.Box3(
          new THREE.Vector3(def.pos[0] - halfX, def.pos[1] - halfY, def.pos[2] - halfZ),
          new THREE.Vector3(def.pos[0] + halfX, def.pos[1] + halfY, def.pos[2] + halfZ),
        ));
      } else {
        // Cylinder approximated as box
        const r = Math.max(def.size[0], def.size[1]);
        const halfH = def.size[2] / 2;
        this.structureBounds.push(new THREE.Box3(
          new THREE.Vector3(def.pos[0] - r, def.pos[1] - halfH, def.pos[2] - r),
          new THREE.Vector3(def.pos[0] + r, def.pos[1] + halfH, def.pos[2] + r),
        ));
      }
    }
  }

  private createTargetPools(): void {
    FirewallNode.resetSharedResources();
    ICETower.resetSharedResources();

    this.firewallNodePool = new ObjectPool<FirewallNode>(
      () => new FirewallNode(this.vectorMaterials),
      FIREWALL_NODE_POOL_SIZE,
    );

    this.iceTowerPool = new ObjectPool<ICETower>(
      () => new ICETower(this.vectorMaterials),
      ICE_TOWER_POOL_SIZE,
    );
  }

  private placeTargets(): void {
    this.firewallNodesRemaining = 0;

    for (const targetDef of this.surfaceTargets) {
      if (targetDef.type === 'firewallNode') {
        const node = this.firewallNodePool!.acquire();
        if (node) {
          const pos = new THREE.Vector3(
            targetDef.position[0],
            targetDef.position[1],
            targetDef.position[2],
          );
          node.setSpawnPosition(pos);
          node.setActive(true);
          node.getObject3D().visible = true;
          this.scene.add(node.getObject3D());
          if (this.gameObjectManager) this.gameObjectManager.add(node);
          this.activeFirewallNodes.push(node);
          this.firewallNodesRemaining++;
        }
      } else if (targetDef.type === 'iceTower') {
        const tower = this.iceTowerPool!.acquire();
        if (tower) {
          const pos = new THREE.Vector3(
            targetDef.position[0],
            targetDef.position[1],
            targetDef.position[2],
          );
          tower.setSpawnPosition(pos);
          tower.setActive(true);
          tower.getObject3D().visible = true;
          this.scene.add(tower.getObject3D());
          if (this.gameObjectManager) this.gameObjectManager.add(tower);
          this.activeICETowers.push(tower);
        }
      }
    }

    Logger.info('SurfacePhase', 'Targets placed', {
      firewallNodes: this.activeFirewallNodes.length,
      iceTowers: this.activeICETowers.length,
    });
  }

  private checkCompletion(): void {
    // Condition 1: All firewall nodes destroyed
    if (this.firewallNodesRemaining <= 0) {
      this.completed = true;
      Logger.info('SurfacePhase', 'Phase complete: all firewall nodes destroyed');
      return;
    }

    // Condition 2: Rail path reached the end
    if (this.railMovement && this.railMovement.getRailProgress() >= RAIL_COMPLETION_THRESHOLD) {
      this.completed = true;
      Logger.info('SurfacePhase', 'Phase complete: rail path end reached', {
        nodesRemaining: this.firewallNodesRemaining,
      });
      return;
    }
  }
}
